<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useEstimateStore } from '../stores/estimate';
import { useUiStore } from '../stores/ui';
import { useLibraryStore } from '../stores/library';
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
import {
  useManagerResizableColumns,
  useClientOutputResizableColumns,
  type ManagerColumnKey,
  type ClientOutputColumnKey,
} from '../lib/useResizableColumns';
import { useRowDragReorder } from '../lib/useRowDragReorder';
import {
  filterLinesForClientOutput,
  sumClientOutputPresented,
  type ClientPresentedLine,
} from '../lib/clientPresentation';
import { useI18n } from '../i18n/useI18n';
import { toErrorMessage } from '../lib/errors';

const NOTES_PREVIEW_MAX = 72;

const estimate = useEstimateStore();
const ui = useUiStore();
const settings = useSettingsStore();
const library = useLibraryStore();
const modelsStore = useModelsStore();
const { models: modelList } = storeToRefs(modelsStore);
const { t } = useI18n();
const cols = useManagerResizableColumns();
const clientCols = useClientOutputResizableColumns();

const rowDrag = useRowDragReorder({
  getItems: () => estimate.estimate.items,
  onReorder: (dragId, targetId) => estimate.reorderItem(dragId, targetId),
});

const emit = defineEmits<{ back: [] }>();

const notesEditId = ref<string | null>(null);
const managerExportMenuOpen = ref(false);
const clientExportMenuOpen = ref(false);
const showChangeConfirmOpen = ref(false);
const pendingShowChange = ref<{ id: string; visible: boolean } | null>(null);
const resetConfirmOpen = ref(false);
const clientPreviewCollapsed = ref<Set<string>>(new Set());

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

function linePresentedDeltaHours(line: ClientPresentedLine, allLines?: ClientPresentedLine[]): number | null {
  if (line.isMacro && line.hasChildren) {
    // Sum children's individual deltas to avoid rounding mismatch with macro rollup
    if (!allLines) return null;
    const children = allLines.filter((l) => l.item.parentId === line.item.id && l.contributesToTotals);
    const sum = children.reduce((s, c) => s + (c.hoursPresented - c.hoursWithContingency), 0);
    return sum;
  }
  if (!line.contributesToTotals) return null;
  return line.hoursPresented - line.hoursWithContingency;
}

function formatDeltaCell(hours: number | null): string {
  if (hours == null) return '—';
  const v = effortInputValue(hours);
  if (v === 0) return '0';
  return v > 0 ? `+${v}` : String(v);
}

function isEditableInManager(line: { isMacro: boolean; hasChildren: boolean; item: { clientVisible: boolean } }): boolean {
  if (!line.item.clientVisible) return false;
  // Macro con subtask: non editabile (si editano i subtask)
  if (line.isMacro && line.hasChildren) return false;
  return true;
}

function onPresentedEffort(id: string, raw: string) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return;
  const hours = inputUnitToHours(n, effortUnit.value, hoursPerDay.value);
  const item = estimate.estimate.items.find((i) => i.id === id);
  if (item?.parentId) {
    estimate.setSubtaskPresentedEffort(id, hours);
  } else {
    estimate.setClientPresentedEffort(id, hours);
  }
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
  if (!estimate.hasClientOverrides) return;
  resetConfirmOpen.value = true;
}

function confirmReset() {
  estimate.resetClientOverrides();
  resetConfirmOpen.value = false;
  ui.notify(t('client.resetOk'));
}

function cancelReset() {
  resetConfirmOpen.value = false;
}

async function onSave() {
  try {
    const { path, data } = await library.saveEstimate(estimate.estimate);
    estimate.estimate.meta.updatedAt = data.meta.updatedAt;
    estimate.markSaved(path);
    ui.notify(t('working.saved', { path }));
  } catch (e) {
    ui.notify(toErrorMessage(e), true);
  }
}

function onRedistribute(id: string) {
  const ok = estimate.redistributeClientLine(id);
  if (ok) ui.notify(t('client.redistributeOk'));
  else ui.notify(t('client.redistributeFail'), true);
}

const visibleClientLines = computed(() =>
  filterLinesForClientOutput(estimate.clientLines, estimate.estimate, {
    hideCollapsedSubs: true,
    isMacroCollapsed: (id) => clientPreviewCollapsed.value.has(id),
  }),
);

const clientOutputTotalPresented = computed(() =>
  sumClientOutputPresented(visibleClientLines.value),
);

const clientOutputColumnKeys = computed(() =>
  clientCols.orderedKeys.value.filter((key) => {
    if (key === 'tags' && estimate.estimate.clientView.hideClientTags) return false;
    if (key === 'notes' && estimate.estimate.clientView.hideClientNotes) return false;
    return clientCols.isVisible(key);
  }),
);

const clientOutputFootLabelColspan = computed(() => {
  const keys = clientOutputColumnKeys.value;
  const hoursIdx = keys.indexOf('hours');
  if (hoursIdx < 0) return Math.max(1, keys.length - 1);
  return hoursIdx;
});

const visibleManagerLines = computed(() =>
  estimate.clientLines.filter((line) => {
    if (line.isMacro) return true;
    const parentId = line.item.parentId;
    if (!parentId) return true;
    return !estimate.isCollapsed(parentId);
  }),
);

const tableColumnKeys = computed(() =>
  cols.orderedKeys.value.filter((key) => {
    if (key === 'tags' && estimate.estimate.clientView.hideManagerTags) return false;
    if (key === 'notes' && estimate.estimate.clientView.hideManagerNotes) return false;
    return cols.isVisible(key);
  }),
);

const allMacrosExpanded = computed(() => {
  const macros = estimate.clientLines.filter((l) => l.isMacro && l.hasChildren);
  if (macros.length === 0) return true;
  return macros.every((m) => !estimate.isCollapsed(m.item.id));
});

function toggleAllMacros() {
  const macros = estimate.clientLines.filter((l) => l.isMacro && l.hasChildren);
  const expand = !allMacrosExpanded.value;
  for (const m of macros) {
    const collapsed = estimate.isCollapsed(m.item.id);
    if (expand && collapsed) estimate.toggleMacro(m.item.id);
    if (!expand && !collapsed) estimate.toggleMacro(m.item.id);
  }
}

const allClientPreviewMacrosExpanded = computed(() => {
  const macros = estimate.clientLines.filter(
    (l) => l.isMacro && l.hasChildren && l.item.clientVisible,
  );
  if (macros.length === 0) return true;
  return macros.every((m) => !clientPreviewCollapsed.value.has(m.item.id));
});

function toggleAllClientPreviewMacros() {
  const macros = estimate.clientLines.filter(
    (l) => l.isMacro && l.hasChildren && l.item.clientVisible,
  );
  const expand = !allClientPreviewMacrosExpanded.value;
  const next = new Set(clientPreviewCollapsed.value);
  for (const m of macros) {
    if (expand) next.delete(m.item.id);
    else next.add(m.item.id);
  }
  clientPreviewCollapsed.value = next;
}

function onHeaderDblClick(key: ManagerColumnKey) {
  cols.toggleCollapse(key);
}

function onClientOutputHeaderDblClick(key: ClientOutputColumnKey) {
  clientCols.toggleCollapse(key);
}

function clientOutputColumnLabel(key: ClientOutputColumnKey): string {
  switch (key) {
    case 'name':
      return t('client.activity');
    case 'tags':
      return t('columns.tags');
    case 'notes':
      return t('common.notes');
    case 'hours':
      return t('client.presentedHours');
    case 'days':
      return t('client.presentedDays');
    default:
      return '';
  }
}

function clientOutputColumnAbbr(key: ClientOutputColumnKey): string {
  switch (key) {
    case 'name':
      return 'N';
    case 'tags':
      return 'T';
    case 'notes':
      return '…';
    case 'hours':
      return 'h';
    case 'days':
      return 'D';
    default:
      return '';
  }
}

function clientOutputHeaderTitle(key: ClientOutputColumnKey): string {
  if (key === 'hours' || key === 'days') return clientOutputColumnLabel(key);
  return `${clientOutputColumnLabel(key)} · ${t('common.expandCol')}`;
}

function columnLabel(key: ManagerColumnKey): string {
  switch (key) {
    case 'show':
      return t('client.showCol');
    case 'name':
      return t('client.activity');
    case 'category':
      return t('common.category');
    case 'tags':
      return t('columns.tags');
    case 'base':
      return `${t('common.base')} (${effortUnitShort.value})`;
    case 'ctg':
      return `${t('common.ctg')} (${effortUnitShort.value})`;
    case 'withCtg':
      return `${t('common.withCtg')} (${effortUnitShort.value})`;
    case 'presented':
      return `${t('client.presented')} (${effortUnitShort.value})`;
    case 'delta':
      return `${t('client.statDelta')} (${effortUnitShort.value})`;
    case 'notes':
      return t('common.notes');
    case 'actions':
      return '';
    default:
      return '';
  }
}

function columnAbbr(key: ManagerColumnKey): string {
  switch (key) {
    case 'show':
      return 'S';
    case 'name':
      return 'N';
    case 'category':
      return 'C';
    case 'tags':
      return 'T';
    case 'base':
      return effortUnitShort.value;
    case 'ctg':
      return '+';
    case 'withCtg':
      return 'Σ';
    case 'presented':
      return 'P';
    case 'delta':
      return 'Δ';
    case 'notes':
      return '…';
    case 'actions':
      return '';
    default:
      return '';
  }
}

function headerTitle(key: ManagerColumnKey): string {
  if (key === 'show') return t('client.showHint');
  if (key === 'delta') return t('client.compareHint');
  return t('common.expandCol');
}

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
        <button type="button" class="primary" @click="onSave">{{ t('common.save') }}</button>
        <span v-if="estimate.dirty" class="dirty">{{ t('common.unsavedF') }}</span>
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
      <table class="data-table sheet">
        <thead>
          <tr>
            <th
              v-for="key in tableColumnKeys"
              :key="key"
              class="resizable"
              :class="{
                collapsed: cols.collapsed[key],
                'show-th': key === 'show',
                'delta-col-head': key === 'delta',
                'actions-th': key === 'actions',
              }"
              :style="cols.styleFor(key)"
              :title="headerTitle(key)"
              draggable="true"
              @dblclick="onHeaderDblClick(key)"
              @dragstart="cols.onColDragStart(key, $event)"
              @dragover="cols.onColDragOver(key, $event)"
              @drop="cols.onColDrop(key, $event)"
              @dragend="cols.onColDragEnd"
            >
              <div class="th-inner th-drag">
                <button
                  v-if="key === 'name'"
                  type="button"
                  class="collapse all"
                  :aria-label="allMacrosExpanded ? t('working.collapseAll') : t('working.expandAll')"
                  @click.stop="toggleAllMacros"
                >
                  {{ allMacrosExpanded ? '▾' : '▸' }}
                </button>
                <span v-if="!cols.collapsed[key] && key !== 'actions'">{{ columnLabel(key) }}</span>
                <span v-else-if="cols.collapsed[key]" class="abbr">{{ columnAbbr(key) }}</span>
              </div>
              <span
                class="col-resizer"
                draggable="false"
                @mousedown="cols.startResize(key, $event)"
                @dragstart.stop.prevent
              />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="line in visibleManagerLines"
            :key="line.item.id"
            :class="[
              {
                macro: line.isMacro,
                overridden: line.overridden,
                hidden: !line.item.clientVisible,
              },
              rowDrag.rowClass(line.item.id),
            ]"
            @dragover="rowDrag.onDragOver(line.item.id, $event)"
            @dragleave="rowDrag.onDragLeave(line.item.id)"
            @drop="rowDrag.onDrop(line.item.id, $event)"
          >
            <template v-for="key in tableColumnKeys" :key="key">
              <td
                v-if="key === 'show'"
                class="pad center show-cell"
                :style="cols.styleFor('show')"
                :class="{ collapsed: cols.collapsed.show }"
              >
                <input
                  v-if="!cols.collapsed.show"
                  type="checkbox"
                  :checked="line.item.clientVisible"
                  :title="t('client.showHint')"
                  :aria-label="`${t('client.showCol')}: ${line.item.name}`"
                  @change="onShowVisibleChange(line.item.id, ($event.target as HTMLInputElement).checked, $event)"
                />
              </td>
              <td
                v-else-if="key === 'name'"
                class="pad name-wrap"
                :style="cols.styleFor('name')"
                :class="{ collapsed: cols.collapsed.name }"
              >
                <div
                  v-if="!cols.collapsed.name"
                  class="name-cell"
                  :style="{ paddingLeft: line.depth ? '1.1rem' : '0' }"
                >
                  <span
                    class="drag-handle"
                    draggable="true"
                    :title="t('common.dragRow')"
                    :aria-label="t('common.dragRow')"
                    @dragstart="rowDrag.onDragStart(line.item.id, $event)"
                    @dragend="rowDrag.onDragEnd"
                  >⋮⋮</span>
                  <button
                    v-if="line.isMacro && line.hasChildren"
                    type="button"
                    class="collapse"
                    :aria-expanded="!estimate.isCollapsed(line.item.id)"
                    :aria-label="estimate.isCollapsed(line.item.id) ? t('common.expand') : t('common.collapse')"
                    @click="estimate.toggleMacro(line.item.id)"
                  >
                    {{ estimate.isCollapsed(line.item.id) ? '▸' : '▾' }}
                  </button>
                  <span v-else class="collapse-spacer" aria-hidden="true" />
                  <span class="activity-name">{{ line.item.name }}</span>
                  <span v-if="line.overridden" class="edited-mark" :title="t('client.editedMark')">●</span>
                  <span
                    v-if="!line.item.clientVisible"
                    class="hidden-tag"
                    :title="t('client.hiddenRow')"
                  >{{ t('client.hiddenRow') }}</span>
                </div>
              </td>
              <td
                v-else-if="key === 'category'"
                class="pad muted"
                :style="cols.styleFor('category')"
                :class="{ collapsed: cols.collapsed.category }"
              >
                <template v-if="!cols.collapsed.category">{{ line.item.category }}</template>
              </td>
              <td
                v-else-if="key === 'tags'"
                class="pad"
                :style="cols.styleFor('tags')"
                :class="{ collapsed: cols.collapsed.tags }"
              >
                <TagPicker
                  v-if="!cols.collapsed.tags"
                  :model-value="line.item.tags ?? []"
                  :options="tagOptions"
                  :disabled="!line.item.clientVisible"
                  :aria-label="`${line.item.name} ${t('columns.tags')}`"
                  @update:model-value="onItemTagsChange(line.item.id, $event)"
                  @create-option="onCreateTagOption"
                />
              </td>
              <td
                v-else-if="key === 'base'"
                class="pad num-cell"
                :style="cols.styleFor('base')"
                :class="{ collapsed: cols.collapsed.base }"
              >
                <template v-if="!cols.collapsed.base">{{ effortInputValue(line.hoursBase) }}</template>
              </td>
              <td
                v-else-if="key === 'ctg'"
                class="pad num-cell"
                :style="cols.styleFor('ctg')"
                :class="{ collapsed: cols.collapsed.ctg }"
              >
                <template v-if="!cols.collapsed.ctg">{{ effortInputValue(line.hoursContingency) }}</template>
              </td>
              <td
                v-else-if="key === 'withCtg'"
                class="pad num-cell emph"
                :style="cols.styleFor('withCtg')"
                :class="{ collapsed: cols.collapsed.withCtg }"
              >
                <template v-if="!cols.collapsed.withCtg">{{ effortInputValue(line.hoursWithContingency) }}</template>
              </td>
              <td
                v-else-if="key === 'presented'"
                class="pad num-cell emph"
                :style="cols.styleFor('presented')"
                :class="{
                  collapsed: cols.collapsed.presented,
                  readonly: line.isMacro && line.hasChildren,
                }"
              >
                <input
                  v-if="!cols.collapsed.presented"
                  class="num"
                  type="number"
                  min="0"
                  step="any"
                  :disabled="!isEditableInManager(line)"
                  :value="effortInputValue(line.hoursPresented)"
                  :aria-label="`${line.item.name} ${t('client.presented')}`"
                  @change="onPresentedEffort(line.item.id, ($event.target as HTMLInputElement).value)"
                />
              </td>
              <td
                v-else-if="key === 'delta'"
                class="pad num-cell delta-cell"
                :style="cols.styleFor('delta')"
                :class="{
                  collapsed: cols.collapsed.delta,
                  positive: (linePresentedDeltaHours(line, clientLines) ?? 0) > 0,
                  negative: (linePresentedDeltaHours(line, clientLines) ?? 0) < 0,
                }"
                :title="t('client.compareHint')"
              >
                <template v-if="!cols.collapsed.delta">{{ formatDeltaCell(linePresentedDeltaHours(line, clientLines)) }}</template>
              </td>
              <td
                v-else-if="key === 'notes'"
                class="pad notes-cell"
                :style="cols.styleFor('notes')"
                :class="{ collapsed: cols.collapsed.notes }"
              >
                <button
                  v-if="!cols.collapsed.notes"
                  type="button"
                  class="notes-preview"
                  :class="{ empty: !line.item.notes.trim() }"
                  :title="t('client.notesOpen')"
                  @click="openNotesEditor(line.item.id)"
                >
                  {{ previewNotes(line.item.notes) || t('client.notesEmpty') }}
                </button>
              </td>
              <td
                v-else-if="key === 'actions'"
                class="pad row-actions"
                :style="cols.styleFor('actions')"
                :class="{ collapsed: cols.collapsed.actions }"
              >
                <button
                  v-if="!cols.collapsed.actions && line.item.clientVisible"
                  type="button"
                  class="ghost redistribute"
                  :title="t('client.redistributeHint')"
                  @click="onRedistribute(line.item.id)"
                >
                  {{ t('client.redistribute') }}
                </button>
              </td>
            </template>
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
        <table class="data-table sheet">
          <thead>
            <tr>
              <th
                v-for="key in clientOutputColumnKeys"
                :key="key"
                class="resizable"
                :class="{ collapsed: clientCols.collapsed[key] }"
                :style="clientCols.styleFor(key)"
                :title="clientOutputHeaderTitle(key)"
                draggable="true"
                @dblclick="onClientOutputHeaderDblClick(key)"
                @dragstart="clientCols.onColDragStart(key, $event)"
                @dragover="clientCols.onColDragOver(key, $event)"
                @drop="clientCols.onColDrop(key, $event)"
                @dragend="clientCols.onColDragEnd"
              >
                <div class="th-inner th-drag">
                  <button
                    v-if="key === 'name'"
                    type="button"
                    class="collapse all"
                    :aria-label="allClientPreviewMacrosExpanded ? t('working.collapseAll') : t('working.expandAll')"
                    @click.stop="toggleAllClientPreviewMacros"
                  >
                    {{ allClientPreviewMacrosExpanded ? '▾' : '▸' }}
                  </button>
                  <span v-if="!clientCols.collapsed[key]">{{ clientOutputColumnLabel(key) }}</span>
                  <span v-else class="abbr">{{ clientOutputColumnAbbr(key) }}</span>
                </div>
                <span
                  class="col-resizer"
                  draggable="false"
                  @mousedown="clientCols.startResize(key, $event)"
                  @dragstart.stop.prevent
                />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="line in visibleClientLines"
              :key="line.item.id"
              :class="rowDrag.rowClass(line.item.id)"
              @dragover="rowDrag.onDragOver(line.item.id, $event)"
              @dragleave="rowDrag.onDragLeave(line.item.id)"
              @drop="rowDrag.onDrop(line.item.id, $event)"
            >
              <template v-for="key in clientOutputColumnKeys" :key="key">
                <td
                  v-if="key === 'name'"
                  class="pad name-wrap"
                  :style="clientCols.styleFor('name')"
                  :class="{ collapsed: clientCols.collapsed.name }"
                >
                  <div
                    v-if="!clientCols.collapsed.name"
                    class="name-cell"
                    :style="{ paddingLeft: line.depth ? '1.75rem' : '0' }"
                  >
                    <span
                      class="drag-handle"
                      draggable="true"
                      :title="t('common.dragRow')"
                      :aria-label="t('common.dragRow')"
                      @dragstart="rowDrag.onDragStart(line.item.id, $event)"
                      @dragend="rowDrag.onDragEnd"
                    >⋮⋮</span>
                    <span class="activity-name">{{ line.item.name }}</span>
                  </div>
                </td>
                <td
                  v-else-if="key === 'tags'"
                  class="pad"
                  :style="clientCols.styleFor('tags')"
                  :class="{ collapsed: clientCols.collapsed.tags }"
                >
                  <TagPicker
                    v-if="!clientCols.collapsed.tags"
                    readonly
                    :model-value="line.item.tags ?? []"
                    :options="tagOptions"
                  />
                </td>
                <td
                  v-else-if="key === 'notes'"
                  class="pad muted notes-wrap"
                  :style="clientCols.styleFor('notes')"
                  :class="{ collapsed: clientCols.collapsed.notes }"
                >
                  <template v-if="!clientCols.collapsed.notes">{{ line.item.notes }}</template>
                </td>
                <td
                  v-else-if="key === 'hours'"
                  class="pad num-cell emph"
                  :style="clientCols.styleFor('hours')"
                  :class="{ collapsed: clientCols.collapsed.hours }"
                >
                  <template v-if="!clientCols.collapsed.hours">
                    {{ formatHours(line.hoursPresented) }}
                  </template>
                </td>
                <td
                  v-else-if="key === 'days'"
                  class="pad num-cell emph"
                  :style="clientCols.styleFor('days')"
                  :class="{ collapsed: clientCols.collapsed.days }"
                >
                  <template v-if="!clientCols.collapsed.days">
                    {{ formatDays(line.hoursPresented, hoursPerDay) }}
                  </template>
                </td>
              </template>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th :colspan="clientOutputFootLabelColspan" class="pad">
                {{ t('working.total') }}
              </th>
              <th
                v-for="key in clientOutputColumnKeys.slice(clientOutputFootLabelColspan)"
                :key="'foot-' + key"
                class="pad num-cell emph"
                :class="{ collapsed: clientCols.collapsed[key] }"
                :style="clientCols.styleFor(key)"
              >
                <template v-if="key === 'hours' && !clientCols.collapsed.hours">
                  {{ formatHours(clientOutputTotalPresented) }}
                </template>
                <template v-else-if="key === 'days' && !clientCols.collapsed.days">
                  {{ formatDays(clientOutputTotalPresented, hoursPerDay) }}
                </template>
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

    <ConfirmModal
      :open="resetConfirmOpen"
      :title="t('client.resetConfirmTitle')"
      :message="t('client.resetConfirmBody')"
      :confirm-label="t('client.reset')"
      danger
      @cancel="cancelReset"
      @confirm="confirmReset"
    />
  </div>
</template>

<style scoped>
.client {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 100%;
  min-width: 0;
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
  align-items: center;
}

.dirty {
  margin-left: auto;
  color: var(--warn);
  font-size: 0.8rem;
  font-weight: 500;
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

.sheet {
  table-layout: fixed;
  width: max-content;
  min-width: 100%;
}

.resizable {
  position: relative;
  overflow: hidden;
  user-select: none;
}

.col-resizer {
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 2;
}

.col-resizer:hover,
.col-resizer:active {
  background: color-mix(in srgb, var(--accent) 22%, transparent);
}

.abbr {
  font-weight: 600;
  color: var(--ink);
}

td.collapsed,
th.collapsed {
  padding-left: 0.2rem !important;
  padding-right: 0.2rem !important;
  overflow: hidden;
}

.name-cell {
  display: flex;
  align-items: flex-start;
  gap: 0.25rem;
  min-width: 0;
}

.activity-name {
  flex: 1;
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.name-wrap,
.notes-wrap {
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.collapse {
  border: none;
  background: transparent;
  color: var(--muted);
  width: 1.4rem;
  padding: 0;
  font-size: 0.85rem;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
}

.collapse.all {
  width: 1.2rem;
}

.collapse:hover {
  color: var(--ink);
  background: transparent;
}

.collapse-spacer {
  display: inline-block;
  width: 1.4rem;
  flex-shrink: 0;
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

.num-cell.readonly {
  color: var(--muted);
}

.num-cell.readonly .num {
  background: var(--page-soft);
  cursor: default;
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
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
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
