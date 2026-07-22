<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useEstimateStore } from '../stores/estimate';
import { useUiStore } from '../stores/ui';
import ConfirmModal from '../components/ConfirmModal.vue';
import NotesEditor from '../components/NotesEditor.vue';
import TagPicker from '../components/TagPicker.vue';
import { useModelsStore } from '../stores/models';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '../stores/settings';
import {
  formatHours,
  formatDays,
  hoursToInputUnit,
  inputUnitToHours,
  type EffortUnit,
} from '../lib/rounding';
import { exportEstimate } from '../lib/io';
import type { EstimateExportFormat } from '../lib/export';
import type { RoundingMode } from '../models/settings';
import { useI18n } from '../i18n/useI18n';
import { toErrorMessage } from '../lib/errors';

const NOTES_PREVIEW_MAX = 72;

const estimate = useEstimateStore();
const ui = useUiStore();
const settings = useSettingsStore();
const modelsStore = useModelsStore();
const { models: modelList } = storeToRefs(modelsStore);
const { t } = useI18n();

const emit = defineEmits<{ back: [] }>();

const notesEditId = ref<string | null>(null);
const managerExportMenuOpen = ref(false);
const clientExportMenuOpen = ref(false);
const showChangeConfirmOpen = ref(false);
const pendingShowChange = ref<{ id: string; visible: boolean } | null>(null);

function needsConfirmForShowChange(): boolean {
  return estimate.hasClientOverrides;
}

function onShowVisibleChange(id: string, visible: boolean, event: Event) {
  if (!needsConfirmForShowChange()) {
    estimate.setClientVisible(id, visible);
    return;
  }
  const input = event.target as HTMLInputElement;
  input.checked = !visible;
  pendingShowChange.value = { id, visible };
  showChangeConfirmOpen.value = true;
}

function confirmShowChange() {
  const pending = pendingShowChange.value;
  if (!pending) {
    showChangeConfirmOpen.value = false;
    return;
  }
  estimate.updateClientView({ lineOverrides: {} });
  estimate.setClientVisible(pending.id, pending.visible);
  pendingShowChange.value = null;
  showChangeConfirmOpen.value = false;
}

function cancelShowChange() {
  pendingShowChange.value = null;
  showChangeConfirmOpen.value = false;
}

function closeExportMenus(except?: 'manager' | 'client') {
  if (except !== 'manager') managerExportMenuOpen.value = false;
  if (except !== 'client') clientExportMenuOpen.value = false;
}

function toggleManagerExportMenu() {
  const next = !managerExportMenuOpen.value;
  closeExportMenus('manager');
  managerExportMenuOpen.value = next;
}

function toggleClientExportMenu() {
  const next = !clientExportMenuOpen.value;
  closeExportMenus('client');
  clientExportMenuOpen.value = next;
}

function onDocPointerDown(e: PointerEvent) {
  const target = e.target as HTMLElement | null;
  if (!target?.closest?.('.export-menu')) closeExportMenus();
}

onMounted(() => document.addEventListener('pointerdown', onDocPointerDown));
onUnmounted(() => document.removeEventListener('pointerdown', onDocPointerDown));

const effortUnit = computed(
  () => estimate.estimate.meta.unit as EffortUnit,
);

const hoursPerDay = computed(() => {
  const n = estimate.estimate.meta.hoursPerDay;
  return Number.isFinite(n) && n > 0 ? n : 8;
});

const effortUnitShort = computed(() =>
  effortUnit.value === 'days' ? 'D' : 'h',
);

const tagOptions = computed(() => {
  const fromEstimate = estimate.estimate.tagOptions ?? [];
  const modelId = estimate.estimate.modelId;
  const fromModel =
    modelList.value.find((m) => m.id === modelId)?.tagOptions ?? [];
  const fromItems = estimate.estimate.items.flatMap((i) => i.tags ?? []);
  return [...new Set([...fromModel, ...fromEstimate, ...fromItems])].filter(Boolean);
});

function onItemTagsChange(id: string, tags: string[]) {
  estimate.updateItem(id, { tags });
}

function onCreateTagOption(label: string) {
  estimate.ensureTagOption(label);
}

const notesEditItem = computed(() => {
  if (!notesEditId.value) return null;
  return estimate.estimate.items.find((i) => i.id === notesEditId.value) ?? null;
});

function onUnitChange(raw: string) {
  const unit = raw as EffortUnit;
  if (unit !== 'hours' && unit !== 'days') return;
  estimate.updateMeta({ unit });
}

function effortInputValue(hours: number): number {
  const v = hoursToInputUnit(hours, effortUnit.value, hoursPerDay.value);
  return Math.round(v * 1000) / 1000;
}

function linePresentedDeltaHours(line: { hoursPresented: number; hoursWithContingency: number; contributesToTotals: boolean }): number | null {
  if (!line.contributesToTotals) return null;
  return line.hoursPresented - line.hoursWithContingency;
}

function formatDeltaCell(hours: number | null): string {
  if (hours == null) return '—';
  const v = effortInputValue(hours);
  if (v === 0) return '0';
  return v > 0 ? `+${v}` : String(v);
}

function onPresentedEffort(id: string, raw: string) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return;
  const hours = inputUnitToHours(n, effortUnit.value, hoursPerDay.value);
  estimate.setClientPresentedEffort(id, hours);
}

function previewNotes(notes: string): string {
  const flat = notes.replace(/\s+/g, ' ').trim();
  if (!flat) return '';
  if (flat.length <= NOTES_PREVIEW_MAX) return flat;
  return `${flat.slice(0, NOTES_PREVIEW_MAX).trimEnd()}…`;
}

function openNotesEditor(id: string) {
  notesEditId.value = id;
}

function closeNotesEditor() {
  notesEditId.value = null;
}

function onSaveNotes(notes: string) {
  if (!notesEditId.value) return;
  estimate.updateItem(notesEditId.value, { notes });
  closeNotesEditor();
}

function onReset() {
  estimate.resetClientOverrides();
  ui.notify(t('client.resetOk'));
}

function onRedistribute(id: string) {
  const ok = estimate.redistributeClientLine(id);
  if (ok) ui.notify(t('client.redistributeOk'));
  else ui.notify(t('client.redistributeFail'), true);
}

const visibleClientLines = computed(() =>
  estimate.clientLines.filter((line) => line.item.clientVisible && line.contributesToTotals),
);

async function onExport(format: EstimateExportFormat, view: 'manager' | 'client' = 'manager') {
  try {
    const path = await exportEstimate(estimate.estimate, format, view, settings.settings);
    if (path) {
      ui.notify(t('client.exported', { format: format.toUpperCase(), path }));
    }
  } catch (e) {
    ui.notify(toErrorMessage(e), true);
  }
}

async function onExportFromMenu(
  format: EstimateExportFormat,
  view: 'manager' | 'client',
) {
  closeExportMenus();
  await onExport(format, view);
}
</script>

<template>
  <div class="client">
    <header class="top">
      <button type="button" class="ghost back" @click="emit('back')">
        ← {{ t('client.backToEstimate') }}
      </button>
      <div class="toolbar">
        <button
          type="button"
          class="ghost"
          :disabled="!estimate.hasClientOverrides"
          :title="t('client.resetHint')"
          @click="onReset"
        >
          {{ t('client.reset') }}
        </button>
      </div>
    </header>

    <div class="preview-head">
      <h1 class="estimate-title">{{ estimate.clientTitle }}</h1>
      <p v-if="estimate.estimate.meta.clientLabel" class="muted">
        {{ estimate.estimate.meta.clientLabel }}
      </p>
    </div>

    <div class="fields">
      <label class="field title">
        {{ t('client.titleLabel') }}
        <input
          :value="estimate.estimate.clientView.titleOverride"
          :placeholder="t('client.titlePh')"
          @input="estimate.updateClientView({ titleOverride: ($event.target as HTMLInputElement).value })"
        />
      </label>
      <label class="field">
        {{ t('client.rounding') }}
        <select
          :value="estimate.estimate.clientView.roundingMode"
          @change="estimate.updateClientView({ roundingMode: ($event.target as HTMLSelectElement).value as RoundingMode })"
        >
          <option value="none">{{ t('client.roundNone') }}</option>
          <option value="ceil_0_5">{{ t('client.roundCeil05') }}</option>
          <option value="ceil_1">{{ t('client.roundCeil1') }}</option>
          <option value="round_1">{{ t('client.roundRound1') }}</option>
        </select>
      </label>
      <label class="field unit-field">
        {{ t('working.unit') }}
        <select
          :value="estimate.estimate.meta.unit"
          @change="onUnitChange(($event.target as HTMLSelectElement).value)"
        >
          <option value="hours">{{ t('common.hours') }}</option>
          <option value="days">{{ t('common.days') }}</option>
        </select>
      </label>
    </div>

    <p class="hint">{{ t('client.editHint') }}</p>

    <section class="manager-block">
      <h2 class="section-title">{{ t('client.managerSectionTitle') }}</h2>
      <div class="summary-row" aria-live="polite">
        <div class="summary-stats">
          <div class="stat">
            <span>{{ t('working.base') }}</span>
            <strong>
              <span>{{ formatHours(estimate.clientTotals.totalBase) }} h</span>
              <span class="stat-days">{{ formatDays(estimate.clientTotals.totalBase, hoursPerDay) }} D</span>
            </strong>
          </div>
          <div class="stat">
            <span>{{ t('common.ctg') }}</span>
            <strong>
              <span>{{ formatHours(estimate.clientTotals.totalContingency) }} h</span>
              <span class="stat-days">{{ formatDays(estimate.clientTotals.totalContingency, hoursPerDay) }} D</span>
            </strong>
          </div>
          <div class="stat accent">
            <span>{{ t('client.statPresentedTotal') }}</span>
            <strong>
              <span>{{ formatHours(estimate.clientTotals.totalPresented) }} h</span>
              <span class="stat-days">{{ formatDays(estimate.clientTotals.totalPresented, hoursPerDay) }} D</span>
            </strong>
          </div>
        </div>
        <div class="summary-actions">
          <div class="visibility-toggles" role="group" :aria-label="t('client.managerViewLegend')">
            <label class="check compact">
              <input
                type="checkbox"
                :checked="estimate.estimate.clientView.hideManagerNotes"
                @change="estimate.updateClientView({ hideManagerNotes: ($event.target as HTMLInputElement).checked })"
              />
              {{ t('client.hideNotesManager') }}
            </label>
            <label class="check compact">
              <input
                type="checkbox"
                :checked="estimate.estimate.clientView.hideManagerTags"
                @change="estimate.updateClientView({ hideManagerTags: ($event.target as HTMLInputElement).checked })"
              />
              {{ t('client.hideTagsManager') }}
            </label>
          </div>
          <div class="export-menu">
            <button
              type="button"
              class="ghost"
              :aria-expanded="managerExportMenuOpen"
              @click.stop="toggleManagerExportMenu"
            >
              {{ t('common.export') }} ▾
            </button>
            <div v-if="managerExportMenuOpen" class="menu" role="menu" @pointerdown.stop>
              <button
                type="button"
                role="menuitem"
                :title="t('export.aiHint')"
                @click="onExportFromMenu('yaml', 'manager')"
              >
                {{ t('export.ai') }}
              </button>
              <button
                type="button"
                role="menuitem"
                :title="t('export.excelHint')"
                @click="onExportFromMenu('xlsx', 'manager')"
              >
                {{ t('export.excel') }}
              </button>
            </div>
          </div>
        </div>
      </div>

    <div class="table-shell">
      <table class="data-table">
        <thead>
          <tr>
            <th class="show-th" :title="t('client.showHint')">{{ t('client.showCol') }}</th>
            <th>{{ t('client.activity') }}</th>
            <th>{{ t('common.category') }}</th>
            <th v-if="!estimate.estimate.clientView.hideManagerTags">{{ t('columns.tags') }}</th>
            <th>{{ t('common.base') }} ({{ effortUnitShort }})</th>
            <th>{{ t('common.ctg') }} ({{ effortUnitShort }})</th>
            <th>{{ t('common.withCtg') }} ({{ effortUnitShort }})</th>
            <th>{{ t('client.presented') }} ({{ effortUnitShort }})</th>
            <th class="delta-col-head">{{ t('client.statDelta') }} ({{ effortUnitShort }})</th>
            <th v-if="!estimate.estimate.clientView.hideManagerNotes">{{ t('common.notes') }}</th>
            <th class="actions-th" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="line in estimate.clientLines"
            :key="line.item.id"
            :class="{
              macro: line.isMacro,
              overridden: line.overridden,
              hidden: !line.item.clientVisible,
            }"
          >
            <td class="pad center show-cell">
              <input
                type="checkbox"
                :checked="line.item.clientVisible"
                :title="t('client.showHint')"
                :aria-label="`${t('client.showCol')}: ${line.item.name}`"
                @change="onShowVisibleChange(line.item.id, ($event.target as HTMLInputElement).checked, $event)"
              />
            </td>
            <td class="pad" :style="{ paddingLeft: line.depth ? '1.75rem' : '0.65rem' }">
              {{ line.item.name }}
              <span v-if="line.overridden" class="edited-mark" :title="t('client.editedMark')">●</span>
              <span
                v-if="!line.item.clientVisible"
                class="hidden-tag"
                :title="t('client.hiddenRow')"
              >{{ t('client.hiddenRow') }}</span>
            </td>
            <td class="pad muted">{{ line.item.category }}</td>
            <td v-if="!estimate.estimate.clientView.hideManagerTags" class="pad">
              <TagPicker
                :model-value="line.item.tags ?? []"
                :options="tagOptions"
                :disabled="!line.item.clientVisible"
                :aria-label="`${line.item.name} ${t('columns.tags')}`"
                @update:model-value="onItemTagsChange(line.item.id, $event)"
                @create-option="onCreateTagOption"
              />
            </td>
            <td class="pad num-cell">
              {{ effortInputValue(line.hoursBase) }}
            </td>
            <td class="pad num-cell">
              {{ effortInputValue(line.hoursContingency) }}
            </td>
            <td class="pad num-cell emph">
              {{ effortInputValue(line.hoursWithContingency) }}
            </td>
            <td class="pad num-cell emph">
              <input
                class="num"
                type="number"
                min="0"
                step="any"
                :disabled="!line.item.clientVisible"
                :value="effortInputValue(line.hoursPresented)"
                :aria-label="`${line.item.name} ${t('client.presented')}`"
                @change="onPresentedEffort(line.item.id, ($event.target as HTMLInputElement).value)"
              />
            </td>
            <td
              class="pad num-cell delta-cell"
              :class="{
                positive: (linePresentedDeltaHours(line) ?? 0) > 0,
                negative: (linePresentedDeltaHours(line) ?? 0) < 0,
              }"
              :title="t('client.compareHint')"
            >
              {{ formatDeltaCell(linePresentedDeltaHours(line)) }}
            </td>
            <td
              v-if="!estimate.estimate.clientView.hideManagerNotes"
              class="pad notes-cell"
            >
              <button
                type="button"
                class="notes-preview"
                :class="{ empty: !line.item.notes.trim() }"
                :title="t('client.notesOpen')"
                @click="openNotesEditor(line.item.id)"
              >
                {{ previewNotes(line.item.notes) || t('client.notesEmpty') }}
              </button>
            </td>
            <td class="pad row-actions">
              <button
                v-if="line.item.clientVisible"
                type="button"
                class="ghost redistribute"
                :title="t('client.redistributeHint')"
                @click="onRedistribute(line.item.id)"
              >
                {{ t('client.redistribute') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    </section>

    <section class="client-output">
      <header class="client-output-head">
        <h2 class="section-title">{{ t('working.clientView') }}</h2>
        <div class="client-output-actions">
          <div class="visibility-toggles" role="group" :aria-label="t('client.clientOutputLegend')">
            <label class="check compact">
              <input
                type="checkbox"
                :checked="estimate.estimate.clientView.hideClientNotes"
                @change="estimate.updateClientView({ hideClientNotes: ($event.target as HTMLInputElement).checked })"
              />
              {{ t('client.hideNotesClient') }}
            </label>
            <label class="check compact">
              <input
                type="checkbox"
                :checked="estimate.estimate.clientView.hideClientTags"
                @change="estimate.updateClientView({ hideClientTags: ($event.target as HTMLInputElement).checked })"
              />
              {{ t('client.hideTagsClient') }}
            </label>
          </div>
          <div class="export-menu">
            <button
              type="button"
              class="ghost"
              :aria-expanded="clientExportMenuOpen"
              @click.stop="toggleClientExportMenu"
            >
              {{ t('common.export') }} ▾
            </button>
            <div v-if="clientExportMenuOpen" class="menu" role="menu" @pointerdown.stop>
              <button
                type="button"
                role="menuitem"
                :title="t('export.aiHint')"
                @click="onExportFromMenu('yaml', 'client')"
              >
                {{ t('export.ai') }}
              </button>
              <button
                type="button"
                role="menuitem"
                :title="t('export.excelHint')"
                @click="onExportFromMenu('xlsx', 'client')"
              >
                {{ t('export.excel') }}
              </button>
            </div>
          </div>
        </div>
      </header>
      <div class="table-shell">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('client.activity') }}</th>
              <th v-if="!estimate.estimate.clientView.hideClientTags">{{ t('columns.tags') }}</th>
              <th v-if="!estimate.estimate.clientView.hideClientNotes">{{ t('common.notes') }}</th>
              <th>{{ t('client.timeColumn') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="line in visibleClientLines" :key="line.item.id">
              <td class="pad" :style="{ paddingLeft: line.depth ? '1.75rem' : '0.65rem' }">{{ line.item.name }}</td>
              <td v-if="!estimate.estimate.clientView.hideClientTags" class="pad">
                <TagPicker
                  readonly
                  :model-value="line.item.tags ?? []"
                  :options="tagOptions"
                />
              </td>
              <td v-if="!estimate.estimate.clientView.hideClientNotes" class="pad muted">{{ line.item.notes }}</td>
              <td class="pad num-cell emph">{{ formatHours(line.hoursPresented) }} h · {{ formatDays(line.hoursPresented, hoursPerDay) }} D</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th :colspan="1 + Number(!estimate.estimate.clientView.hideClientTags) + Number(!estimate.estimate.clientView.hideClientNotes)">
                {{ t('working.total') }}
              </th>
              <th class="pad num-cell emph">
                {{ formatHours(estimate.clientTotals.totalPresented) }} h · {{ formatDays(estimate.clientTotals.totalPresented, hoursPerDay) }} D
              </th>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>

    <NotesEditor
      :open="notesEditItem != null"
      :item-name="notesEditItem?.name ?? ''"
      :notes="notesEditItem?.notes ?? ''"
      @close="closeNotesEditor"
      @save="onSaveNotes"
    />

    <ConfirmModal
      :open="showChangeConfirmOpen"
      :title="t('client.showChangeConfirmTitle')"
      :message="t('client.showChangeConfirmBody')"
      :confirm-label="t('client.showChangeConfirmAction')"
      danger
      @cancel="cancelShowChange"
      @confirm="confirmShowChange"
    />
  </div>
</template>

<style scoped>
.client {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 1100px;
}

.top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.back {
  font-weight: 500;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.fields {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem 1.25rem;
  align-items: end;
}

.fields-grid {
  flex: 1 1 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
}

.preview-head {
  margin: 0;
}

.estimate-title {
  margin: 0;
  font-family: var(--font-display, inherit);
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.02em;
}

.preview-head .muted {
  margin: 0.25rem 0 0;
  color: var(--muted);
  font-size: 0.95rem;
}

.section-title {
  margin: 0 0 0.35rem;
  font-family: var(--font-ui);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}

.manager-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-group {
  margin: 0;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--page-soft);
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
}

.field-group legend {
  padding: 0 0.25rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--ink-soft);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted);
}

.field.title {
  flex: 1 1 240px;
}

.field input,
.field select {
  min-width: 160px;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 0.45rem 0.55rem;
  background: var(--surface);
}

.check {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.9rem;
  color: var(--ink-soft);
  padding-bottom: 0.35rem;
}

.check.compact {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--muted);
  padding-bottom: 0;
  white-space: nowrap;
}

.visibility-toggles {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem 1rem;
}

.summary-actions,
.client-output-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem 1.25rem;
  margin-left: auto;
}

.export-menu {
  position: relative;
  overflow: visible;
}

.menu {
  position: absolute;
  right: 0;
  top: calc(100% + 0.35rem);
  min-width: 180px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 0.4rem;
  z-index: 80;
  box-shadow: var(--shadow-menu);
  display: grid;
  gap: 0.1rem;
}

.menu button {
  justify-content: flex-start;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  padding: 0.45rem 0.55rem;
  border-radius: calc(var(--radius) - 2px);
  font-size: 0.9rem;
}

.menu button:hover {
  background: var(--page-soft);
}

.hint {
  margin: -0.35rem 0 0;
  font-size: 0.82rem;
  color: var(--muted);
  line-height: 1.4;
}

.summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.summary-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
  align-items: baseline;
  min-width: 0;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.stat span {
  font-size: 0.68rem;
  color: var(--muted-soft);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.stat strong {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  font-size: 1.15rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  color: var(--ink-soft);
  white-space: nowrap;
}

.stat-days {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--muted);
  letter-spacing: 0;
}

.stat.accent strong {
  color: var(--accent);
  font-size: 1.35rem;
}

.stat.accent .stat-days {
  font-size: 0.85rem;
  color: var(--accent);
  opacity: 0.75;
}

.delta-col-head {
  white-space: nowrap;
}

.delta-cell {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
}

.delta-cell.positive {
  color: var(--accent);
}

.delta-cell.negative {
  color: var(--danger);
}

.client-output {
  display: grid;
  gap: 0.7rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid var(--line-strong);
}

.client-output-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  align-items: center;
}

.client-output tfoot th { text-align: right; }

.table-shell {
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
}

.pad {
  padding: 0.55rem 0.65rem;
}

.show-th {
  width: 3.5rem;
  text-align: center;
}

.show-cell {
  text-align: center;
  width: 3.5rem;
}

.center {
  text-align: center;
}

.hidden-tag {
  display: inline-block;
  margin-left: 0.45rem;
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--muted);
  text-transform: none;
}

tr.hidden td {
  opacity: 0.55;
}

tr.hidden .num {
  background: var(--page-soft);
}

.num-cell {
  width: 6.5rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.num {
  width: 100%;
  min-width: 4.5rem;
  box-sizing: border-box;
  font: inherit;
  font-variant-numeric: tabular-nums;
  text-align: right;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 0.3rem 0.4rem;
  background: var(--surface);
  color: var(--ink);
}

.tag-input { width: 100%; min-width: 5rem; box-sizing: border-box; font: inherit; border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 0.3rem 0.4rem; background: var(--surface); color: var(--ink); }

.num:hover,
.num:focus {
  border-color: var(--line-strong);
  outline: none;
}

.num-cell.emph {
  font-weight: 600;
}

.edited-mark {
  margin-left: 0.35rem;
  color: var(--accent);
  font-size: 0.55rem;
  vertical-align: middle;
}

tr.overridden td {
  background: color-mix(in srgb, var(--accent-soft, #e8eef0) 55%, transparent);
}

.notes-cell {
  max-width: 11rem;
  width: 11rem;
}

.actions-th {
  width: 7.5rem;
}

.row-actions {
  white-space: nowrap;
  vertical-align: middle;
}

.redistribute {
  font-size: 0.78rem;
  padding: 0.25rem 0.45rem;
}

.notes-preview {
  display: block;
  width: 100%;
  margin: 0;
  padding: 0.2rem 0.15rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 0.86rem;
  font-weight: 400;
  text-align: left;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.notes-preview.empty {
  color: var(--muted-soft);
}

.notes-preview:hover {
  border-color: var(--line);
  background: var(--page-soft);
  color: var(--ink-soft);
}

.macro td {
  background: var(--page-soft);
  font-weight: 600;
}

.macro.overridden td {
  background: color-mix(in srgb, var(--accent-soft, #e8eef0) 70%, var(--page-soft));
}

.macro .notes-preview,
.macro .num {
  font-weight: 400;
}

.muted {
  color: var(--muted);
}
</style>
