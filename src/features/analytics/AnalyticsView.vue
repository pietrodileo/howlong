<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useDocumentsStore } from '../../shared/documents';
import { useUiStore } from '../../app/ui';
import { useI18n } from '../../app/i18n/useI18n';
import { useModelsStore } from '../models/models';
import { computeTotals } from '../../domain/contingency';
import { formatEffort, type EffortUnit } from '../../domain/rounding';
import {
  buildGraphEntries,
  buildOwnerEntries,
  buildPercentageShares,
  graphValue,
  type GraphEntry,
  type GraphMode,
  type MetricEntry,
  type OwnerGraphEntry,
} from './graphData';
import { openEstimateFile } from '../../platform/files/io';
import { isDialogCancelled, isDialogDesktopOnly } from '../../platform/files/dialogResult';
import { tagBorderColor } from '../../shared/tagColors';

const DONUT_RADIUS = 70;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

const documentsStore = useDocumentsStore();
const ui = useUiStore();
const modelsStore = useModelsStore();
const { defaultModel, models } = storeToRefs(modelsStore);
const { t } = useI18n();
const unit = ref<EffortUnit>('hours');
const mode = ref<GraphMode>('combined');
const selectedMacroId = ref<string | null>(null);
const selectedOwnerId = ref<string | null>(null);
const hoveredEntryId = ref<string | null>(null);
const expandedMacroIds = ref<Set<string>>(new Set());
const newMenuOpen = ref(false);
const modelSearch = ref('');

const estimate = computed(() => documentsStore.activeSession?.estimate ?? null);
const totals = computed(() => estimate.value ? computeTotals(estimate.value) : null);
const overviewMacros = computed(() => estimate.value ? buildGraphEntries(estimate.value).filter((entry) => entry.canDrillDown) : []);
const entries = computed(() => estimate.value
  ? buildGraphEntries(estimate.value, selectedMacroId.value, expandedMacroIds.value)
  : []);
const ownerEntries = computed(() => estimate.value ? buildOwnerEntries(estimate.value, selectedMacroId.value) : []);
const donutEntries = computed(() => entries.value.filter((entry) => graphValue(entry, mode.value) > 0));
const donutTotal = computed(() => donutEntries.value.reduce((sum, entry) => sum + graphValue(entry, mode.value), 0));
const donutMetrics = computed(() => donutEntries.value.reduce<MetricEntry>((sum, entry) => ({
  base: sum.base + entry.base,
  contingency: sum.contingency + entry.contingency,
  combined: sum.combined + entry.combined,
}), { base: 0, contingency: 0, combined: 0 }));
const hoveredEntry = computed(() => donutEntries.value.find((entry) => entry.id === hoveredEntryId.value) ?? null);
const selectedOwnerEntry = computed(() => ownerEntries.value.find((entry) => entry.id === selectedOwnerId.value) ?? null);
const ownerPercentages = computed(() => buildPercentageShares(ownerEntries.value, mode.value));
const ownerTaskPercentages = computed(() => selectedOwnerEntry.value
  ? buildPercentageShares(selectedOwnerEntry.value.tasks, mode.value)
  : []);
const hasAnalyticsData = computed(() => entries.value.length > 0 || ownerEntries.value.length > 0);
const selectedMacroName = computed(() => {
  if (!estimate.value || !selectedMacroId.value) return '';
  return estimate.value.items.find((item) => item.id === selectedMacroId.value)?.name ?? '';
});
const hoursPerDay = computed(() => estimate.value?.meta.hoursPerDay ?? 8);
const maxCombined = computed(() => Math.max(0, ...entries.value.map((entry) => entry.combined)));
const filteredModels = computed(() => {
  const query = modelSearch.value.trim().toLowerCase();
  return models.value.filter((model) => model.name.toLowerCase().includes(query));
});

/** Close the model picker and clear its search. */
function closeNewMenu(): void {
  newMenuOpen.value = false;
  modelSearch.value = '';
}

/** Close the model picker when the user clicks outside it. */
function onDocumentPointerDown(event: PointerEvent): void {
  if (!(event.target as HTMLElement | null)?.closest('.new-estimate-menu')) closeNewMenu();
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown));
onUnmounted(() => document.removeEventListener('pointerdown', onDocumentPointerDown));

watch(() => documentsStore.activeId, () => {
  selectedMacroId.value = null;
  selectedOwnerId.value = null;
  expandedMacroIds.value = new Set();
});
watch(selectedMacroId, () => {
  selectedOwnerId.value = null;
});
watch(entries, (next) => {
  if (selectedMacroId.value && next.length === 0) selectedMacroId.value = null;
});
watch(ownerEntries, (next) => {
  if (selectedOwnerId.value && !next.some((entry) => entry.id === selectedOwnerId.value)) selectedOwnerId.value = null;
});

/** Format canonical hours in the dashboard's selected global unit. */
function formatValue(hours: number): string {
  const suffix = unit.value === 'days' ? 'D' : 'h';
  return `${formatEffort(hours, unit.value, hoursPerDay.value)} ${suffix}`;
}

/** Format one base or contingency value with the selected chart unit. */
function formatBreakdownValue(hours: number): string {
  return formatValue(hours);
}

/** Format one metric entry with its visible base and contingency breakdown. */
function formatMetricValue(entry: MetricEntry): string {
  if (mode.value !== 'combined') return formatValue(graphValue(entry, mode.value));
  return `${formatValue(entry.combined)} · ${formatBreakdownValue(entry.base)} | ${formatBreakdownValue(entry.contingency)}`;
}

/** Format one metric entry's share of a chart total. */
function formatPercentage(entry: MetricEntry, total: number): string {
  if (!total) return '0%';
  return `${Math.round((graphValue(entry, mode.value) / total) * 1000) / 10}%`;
}

/** Format one owner entry's label for the current locale. */
function ownerLabel(entry: OwnerGraphEntry): string {
  return entry.owner ?? t('analytics.unassigned');
}

/** Return the deterministic color used for one owner in Analytics. */
function ownerColor(entry: OwnerGraphEntry): string {
  return entry.owner ? tagBorderColor(entry.owner) : 'var(--muted)';
}

/** Build stroke offsets for one native SVG donut segment. */
function donutStyle(entryIndex: number): Record<string, string> {
  const before = donutEntries.value
    .slice(0, entryIndex)
    .reduce((sum, entry) => sum + graphValue(entry, mode.value), 0);
  const value = graphValue(donutEntries.value[entryIndex], mode.value);
  const fraction = donutTotal.value > 0 ? value / donutTotal.value : 0;
  const offset = donutTotal.value > 0 ? before / donutTotal.value : 0;
  return {
    stroke: donutEntries.value[entryIndex].color,
    strokeDasharray: `${fraction * DONUT_CIRCUMFERENCE} ${DONUT_CIRCUMFERENCE}`,
    strokeDashoffset: `${-offset * DONUT_CIRCUMFERENCE}`,
  };
}

/** Build one base or contingency arc for the combined donut. */
function donutPath(entryIndex: number, part: 'base' | 'contingency'): string {
  const entry = donutEntries.value[entryIndex];
  if (!entry || donutTotal.value <= 0 || entry.combined <= 0) return '';

  const before = donutEntries.value
    .slice(0, entryIndex)
    .reduce((sum, currentEntry) => sum + currentEntry.combined, 0);
  const segmentStart = (before / donutTotal.value) * Math.PI * 2;
  const segmentLength = (entry.combined / donutTotal.value) * Math.PI * 2;
  const baseLength = (entry.base / entry.combined) * segmentLength;
  const start = part === 'base' ? segmentStart : segmentStart + baseLength;
  const length = part === 'base' ? baseLength : segmentLength - baseLength;
  if (length <= 0) return '';

  const end = start + length;
  const point = (angle: number): string => `${90 + DONUT_RADIUS * Math.cos(angle)} ${90 + DONUT_RADIUS * Math.sin(angle)}`;
  if (length >= Math.PI * 2 - 0.0001) {
    return `M ${point(start)} A ${DONUT_RADIUS} ${DONUT_RADIUS} 0 1 1 ${point(start + Math.PI)} A ${DONUT_RADIUS} ${DONUT_RADIUS} 0 1 1 ${point(start)}`;
  }

  return `M ${point(start)} A ${DONUT_RADIUS} ${DONUT_RADIUS} 0 ${length > Math.PI ? 1 : 0} 1 ${point(end)}`;
}

/** Drill both graphs into a macro when it has visible, non-zero subtasks. */
function onSelectEntry(entry: GraphEntry): void {
  if (entry.canDrillDown) selectedMacroId.value = entry.id;
}

/** Describe the available row action or its subtask ownership on hover. */
function entryHint(entry: GraphEntry): string {
  if (entry.canDrillDown) return t('analytics.clickForSubtasks');
  if (entry.type === 'subtask') return t('analytics.subtaskOf', { name: entry.parentName ?? '' });
  return '';
}

/** Toggle one macro's subtasks in the mixed overview without affecting drill-down state. */
function onToggleMacroExpansion(macroId: string): void {
  const next = new Set(expandedMacroIds.value);
  if (next.has(macroId)) next.delete(macroId);
  else next.add(macroId);
  expandedMacroIds.value = next;
}

/** Create an estimate from the chosen or default model and open its editor. */
function onCreateEstimate(model = defaultModel.value ?? models.value[0] ?? null): void {
  const sessionId = model ? documentsStore.createFromModel(model) : documentsStore.createEmpty();
  documentsStore.activate(sessionId);
  closeNewMenu();
  ui.navigate('working');
}

/** Create an estimate from one model selected in the picker. */
function onCreateEstimateFromModel(modelId: string): void {
  const model = models.value.find((candidate) => candidate.id === modelId);
  if (model) onCreateEstimate(model);
}

/** Open an estimate file and switch to its editor. */
async function onOpenEstimate(): Promise<void> {
  const result = await openEstimateFile();
  if (!result.ok) {
    if (!isDialogCancelled(result)) {
      ui.notify(isDialogDesktopOnly(result) ? t('library.desktopOnly') : result.error, true);
    }
    return;
  }
  const sessionId = await documentsStore.openFromFile(result.data, result.path);
  documentsStore.activate(sessionId);
  ui.navigate('working');
}
</script>

<template>
  <section v-if="estimate" class="analytics-view">
    <div class="analytics-controls">
      <div class="segmented" :aria-label="t('analytics.unit')">
        <button type="button" :class="{ active: unit === 'hours' }" @click="unit = 'hours'">{{ t('common.hours') }}</button>
        <button type="button" :class="{ active: unit === 'days' }" @click="unit = 'days'">{{ t('common.days') }}</button>
      </div>
      <select v-model="mode" class="metric-select" :aria-label="t('analytics.metric')">
        <option value="base">{{ t('common.base') }}</option>
        <option value="contingency">{{ t('analytics.contingencyOnly') }}</option>
        <option value="combined">{{ t('analytics.combined') }}</option>
      </select>
    </div>

    <div class="summary-grid">
      <article class="summary-card"><span>{{ t('common.base') }}</span><strong>{{ formatValue(totals?.totalBase ?? 0) }}</strong></article>
      <article class="summary-card"><span>{{ t('analytics.contingencyOnly') }}</span><strong>{{ formatValue(totals?.totalContingency ?? 0) }}</strong></article>
      <article class="summary-card"><span>{{ t('analytics.combined') }}</span><strong>{{ formatValue(totals?.totalWithContingency ?? 0) }}</strong></article>
      <article class="summary-card"><span>{{ t('analytics.contingencyRate') }}</span><strong>{{ totals?.totalBase ? formatEffort((totals.totalContingency / totals.totalBase) * 100, 'hours') : '0' }}%</strong></article>
    </div>

    <div v-if="hasAnalyticsData" class="chart-grid">
      <template v-if="entries.length">
      <article class="chart-card donut-card">
        <div class="chart-heading">
          <div>
            <p class="eyebrow">{{ selectedMacroId ? t('analytics.subtasks') : t('analytics.macros') }}</p>
            <h3>{{ selectedMacroName || t('analytics.effortDistribution') }}</h3>
          </div>
          <div class="chart-actions" :class="{ 'has-back': selectedMacroId }">
            <button v-if="selectedMacroId" type="button" class="ghost back" @click="selectedMacroId = null">← {{ t('analytics.allMacros') }}</button>
            <details v-else class="task-menu">
              <summary>
                {{ expandedMacroIds.size
                  ? t('analytics.tasksSelected', { count: String(expandedMacroIds.size) })
                  : t('analytics.showTasks') }}
              </summary>
              <div class="task-menu-popover">
                <label v-for="macro in overviewMacros" :key="macro.id">
                  <input
                    type="checkbox"
                    :checked="expandedMacroIds.has(macro.id)"
                    @change="onToggleMacroExpansion(macro.id)"
                  />
                  <span>{{ macro.name }}</span>
                </label>
                <button
                  type="button"
                  class="task-clear"
                  :disabled="expandedMacroIds.size === 0"
                  @click="expandedMacroIds = new Set()"
                >{{ t('analytics.clearTasks') }}</button>
              </div>
            </details>
          </div>
        </div>

        <div v-if="donutEntries.length" class="donut-layout">
          <div class="donut-wrap">
            <svg class="donut" viewBox="0 0 180 180" role="img" :aria-label="t('analytics.donutAria')">
              <defs>
                <pattern id="donut-contingency-pattern" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect x="3" width="2" height="8" fill="rgb(255 255 255 / .35)" />
                </pattern>
              </defs>
              <circle class="donut-track" cx="90" cy="90" :r="DONUT_RADIUS" />
              <template v-if="mode === 'combined'">
                <g
                  v-for="(entry, index) in donutEntries"
                  :key="entry.id"
                  class="donut-entry"
                  :class="{ clickable: entry.canDrillDown }"
                  :tabindex="entry.canDrillDown ? 0 : undefined"
                  :role="entry.canDrillDown ? 'button' : undefined"
                  :aria-label="`${entry.name}: ${formatMetricValue(entry)}, ${formatPercentage(entry, donutTotal)}`"
                  @click="onSelectEntry(entry)"
                  @keydown.enter.prevent="onSelectEntry(entry)"
                  @keydown.space.prevent="onSelectEntry(entry)"
                  @mouseenter="hoveredEntryId = entry.id"
                  @mouseleave="hoveredEntryId = null"
                  @focus="hoveredEntryId = entry.id"
                  @blur="hoveredEntryId = null"
                >
                  <path v-if="entry.base > 0" class="donut-segment" :d="donutPath(index, 'base')" :style="{ stroke: entry.color }" />
                  <template v-if="entry.contingency > 0">
                    <path class="donut-segment donut-contingency" :d="donutPath(index, 'contingency')" :style="{ stroke: entry.color }" />
                    <path class="donut-segment donut-contingency-stripes" :d="donutPath(index, 'contingency')" stroke="url(#donut-contingency-pattern)" />
                  </template>
                  <title>{{ entry.name }}: {{ formatMetricValue(entry) }} · {{ formatPercentage(entry, donutTotal) }}</title>
                </g>
              </template>
              <template v-else>
                <circle
                  v-for="(entry, index) in donutEntries"
                  :key="entry.id"
                  class="donut-segment"
                  :class="{ clickable: entry.canDrillDown }"
                  cx="90"
                  cy="90"
                  :r="DONUT_RADIUS"
                  :style="donutStyle(index)"
                  :tabindex="entry.canDrillDown ? 0 : undefined"
                  :role="entry.canDrillDown ? 'button' : undefined"
                  :aria-label="`${entry.name}: ${formatMetricValue(entry)}, ${formatPercentage(entry, donutTotal)}`"
                  @click="onSelectEntry(entry)"
                  @keydown.enter.prevent="onSelectEntry(entry)"
                  @keydown.space.prevent="onSelectEntry(entry)"
                  @mouseenter="hoveredEntryId = entry.id"
                  @mouseleave="hoveredEntryId = null"
                  @focus="hoveredEntryId = entry.id"
                  @blur="hoveredEntryId = null"
                ><title>{{ entry.name }}: {{ formatMetricValue(entry) }} · {{ formatPercentage(entry, donutTotal) }}</title></circle>
              </template>
            </svg>
            <div class="donut-total">
              <strong>{{ hoveredEntry ? formatPercentage(hoveredEntry, donutTotal) : formatValue(graphValue(donutMetrics, mode)) }}</strong>
              <span>{{ hoveredEntry?.name || t(`analytics.${mode}`) }}</span>
            </div>
          </div>
          <div class="legend" :aria-label="t('analytics.legend')">
            <button v-for="entry in donutEntries" :key="entry.id" type="button" :class="{ inert: !entry.canDrillDown }" :aria-disabled="!entry.canDrillDown" v-tip="entryHint(entry)" @click="onSelectEntry(entry)">
              <span class="swatch" :style="{ background: entry.color }" />
              <span class="legend-name">
                <span v-if="entry.type === 'subtask'" class="subtask-badge">{{ t('analytics.subtasks') }}</span>
                <span v-else-if="entry.canDrillDown" class="type-icon" :class="entry.type" aria-hidden="true"></span>
                <span class="legend-label">{{ entry.name }}</span>
              </span>
              <strong class="metric-value">
                <span>{{ formatValue(graphValue(entry, mode)) }}</span>
                <span v-if="mode === 'combined'" class="metric-breakdown">· {{ formatBreakdownValue(entry.base) }} | {{ formatBreakdownValue(entry.contingency) }}</span>
                <small>{{ formatPercentage(entry, donutTotal) }}</small>
              </strong>
            </button>
          </div>
        </div>
        <p v-else class="empty-chart">{{ t('analytics.noMetricData') }}</p>
      </article>

      <article class="chart-card bars-card">
        <div class="chart-heading">
          <div>
            <p class="eyebrow">{{ t('analytics.baseVsContingency') }}</p>
            <h3>{{ selectedMacroName || t('analytics.macros') }}</h3>
          </div>
        </div>
        <div class="bar-list">
          <button v-for="entry in entries" :key="entry.id" type="button" class="bar-row" :class="{ inert: !entry.canDrillDown }" :aria-disabled="!entry.canDrillDown" v-tip="entryHint(entry)" @click="onSelectEntry(entry)">
            <span class="bar-label"><span class="bar-name">
              <span v-if="entry.type === 'subtask'" class="subtask-badge">{{ t('analytics.subtasks') }}</span>
              <span v-else-if="entry.canDrillDown" class="type-icon" :class="entry.type" aria-hidden="true"></span>
              <span class="bar-name-text">{{ entry.name }}</span>
            </span><strong class="metric-value">
              <span>{{ formatValue(graphValue(entry, mode)) }}</span>
              <span v-if="mode === 'combined'" class="metric-breakdown">· {{ formatBreakdownValue(entry.base) }} | {{ formatBreakdownValue(entry.contingency) }}</span>
            </strong></span>
            <span class="bar-track">
              <span class="bar-base" :style="{ width: `${maxCombined ? (entry.base / maxCombined) * 100 : 0}%`, background: entry.color }" />
              <span class="bar-contingency" :style="{ width: `${maxCombined ? (entry.contingency / maxCombined) * 100 : 0}%`, background: entry.color }" />
            </span>
          </button>
        </div>
        <div class="bar-key"><span><i class="base-key" />{{ t('common.base') }}</span><span><i class="ctg-key" />{{ t('analytics.contingencyOnly') }}</span></div>
      </article>
      </template>

      <article v-if="ownerEntries.length" class="chart-card owner-card">
        <div class="chart-heading">
          <div>
            <p class="eyebrow">{{ selectedOwnerEntry ? t('analytics.ownerTasks', { name: ownerLabel(selectedOwnerEntry) }) : t('analytics.owners') }}</p>
            <h3>{{ selectedOwnerEntry ? ownerLabel(selectedOwnerEntry) : t('analytics.ownerDistribution') }}</h3>
          </div>
          <button v-if="selectedOwnerEntry" type="button" class="ghost back" @click="selectedOwnerId = null">← {{ t('analytics.allOwners') }}</button>
        </div>

        <div v-if="selectedOwnerEntry" class="owner-detail">
          <div class="owner-detail-summary">
            <span class="owner-swatch" :style="{ background: ownerColor(selectedOwnerEntry) }" aria-hidden="true" />
            <div class="owner-detail-name">
              <span class="eyebrow">{{ t(`analytics.${mode}`) }}</span>
            </div>
            <strong class="owner-detail-total metric-value">
              <span>{{ formatValue(graphValue(selectedOwnerEntry, mode)) }}</span>
              <span v-if="mode === 'combined'" class="metric-breakdown">· {{ formatBreakdownValue(selectedOwnerEntry.base) }} | {{ formatBreakdownValue(selectedOwnerEntry.contingency) }}</span>
            </strong>
          </div>
          <div class="owner-task-list">
            <div class="owner-task-heading"><span>{{ t('common.name') }}</span><span>{{ t(`analytics.${mode}`) }}</span></div>
            <div v-for="(task, taskIndex) in selectedOwnerEntry.tasks" :key="task.id" class="owner-task-row">
              <span class="owner-task-main">
                <span class="owner-task-type">
                  <span v-if="task.type === 'subtask'" class="subtask-badge">{{ t('analytics.subtasks') }}</span>
                  <span v-else class="type-icon" :class="task.type" aria-hidden="true" />
                </span>
                <span class="owner-task-label">
                  <span class="owner-task-name">{{ task.name }}</span>
                  <small v-if="task.parentName" class="owner-task-context">{{ t('analytics.subtaskOf', { name: task.parentName }) }}</small>
                </span>
              </span>
              <strong class="metric-value">
                <span>{{ formatValue(graphValue(task, mode)) }}</span>
                <span v-if="mode === 'combined'" class="metric-breakdown">· {{ formatBreakdownValue(task.base) }} | {{ formatBreakdownValue(task.contingency) }}</span>
                <small>{{ ownerTaskPercentages[taskIndex] }}%</small>
              </strong>
            </div>
          </div>
        </div>

        <div v-else class="owner-list" :aria-label="t('analytics.owners')">
          <button
            v-for="(entry, ownerIndex) in ownerEntries"
            :key="entry.id"
            type="button"
            class="owner-row"
            @click="selectedOwnerId = entry.id"
          >
            <span class="owner-swatch" :style="{ background: ownerColor(entry) }" aria-hidden="true" />
            <span class="owner-name">{{ ownerLabel(entry) }}</span>
            <strong class="metric-value">
              <span>{{ formatValue(graphValue(entry, mode)) }}</span>
              <span v-if="mode === 'combined'" class="metric-breakdown">· {{ formatBreakdownValue(entry.base) }} | {{ formatBreakdownValue(entry.contingency) }}</span>
              <small>{{ ownerPercentages[ownerIndex] }}%</small>
            </strong>
          </button>
        </div>
      </article>
    </div>
    <p v-else class="empty-chart standalone">{{ t('analytics.noData') }}</p>
  </section>

  <section v-else class="analytics-empty">
    <p>{{ t('analytics.noEstimate') }}</p>
    <div class="empty-actions">
      <div class="new-estimate-menu">
        <div class="new-estimate-split">
          <button type="button" class="action-btn primary new-estimate-main" @click="onCreateEstimate()">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M8 2.5v11M2.5 8h11" />
            </svg>
            {{ t('welcome.newEstimate') }}
          </button>
          <button type="button" class="action-btn primary new-estimate-caret" :aria-expanded="newMenuOpen" :aria-label="t('working.pickModel')" @click.stop="newMenuOpen = !newMenuOpen">▾</button>
        </div>
        <div v-if="newMenuOpen" class="model-menu" role="menu" @pointerdown.stop>
          <input v-model="modelSearch" type="search" :placeholder="t('working.searchModel')" />
          <button v-for="model in filteredModels" :key="model.id" type="button" role="menuitem" @click="onCreateEstimateFromModel(model.id)">
            <span class="model-name">{{ model.name }}</span>
            <span v-if="modelsStore.isDefault(model.id)" class="badge">{{ t('common.default') }}</span>
          </button>
          <p v-if="filteredModels.length === 0">{{ t('working.noModels') }}</p>
        </div>
      </div>
      <button type="button" class="action-btn" @click="onOpenEstimate">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3.5 8.5V18a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V9.5a1.5 1.5 0 0 0-1.5-1.5H12l-1.6-1.8A1.5 1.5 0 0 0 9.3 5.5H5.5A2 2 0 0 0 3.5 7.5v1Z" />
        </svg>
        <span>{{ t('welcome.openEstimate') }}</span>
      </button>
      <button type="button" class="action-btn" @click="ui.navigate('library')">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 6.5h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6.5Z" />
          <path d="M6 6.5V4.5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M12 4.5v2" />
        </svg>
        <span>{{ t('welcome.openLibrary') }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.analytics-view { min-height: 100%; padding-bottom: 2rem; }
.analytics-controls { display: flex; justify-content: flex-end; gap: .65rem; margin-bottom: 1rem; flex-wrap: wrap; }
.segmented { display: inline-flex; padding: 2px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); }
.segmented button { border: 0; background: transparent; padding: .42rem .7rem; color: var(--muted); }
.segmented button.active { background: var(--accent-subtle); color: var(--accent); font-weight: 700; }
.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; margin-bottom: .75rem; }
.summary-card, .chart-card { border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow-soft); }
.summary-card { display: grid; gap: .35rem; padding: 1rem; }
.summary-card span, .eyebrow { color: var(--muted); font-size: .7rem; font-weight: 650; letter-spacing: .06em; text-transform: uppercase; }
.summary-card strong { color: var(--ink); font-size: 1.25rem; }
.chart-grid { display: grid; grid-template-columns: minmax(320px, .85fr) minmax(360px, 1.15fr); gap: .75rem; }
.chart-card { min-width: 0; padding: 1.1rem; }
.owner-card { grid-column: 1 / -1; }
.donut-card { container-type: inline-size; }
.chart-heading { min-height: 2.7rem; display: flex; justify-content: space-between; align-items: flex-start; gap: .75rem; }
.chart-heading h3, .eyebrow { margin: 0; }
.chart-heading h3 { margin-top: .2rem; font-family: var(--font-ui); font-size: 1rem; }
.chart-actions { display: flex; align-items: center; gap: .5rem; }
.back { padding: .35rem .55rem; font-size: .9rem; }
.metric-select { min-height: 2.25rem; max-width: 12rem; padding: .35rem 1.8rem .35rem .65rem; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); box-shadow: var(--shadow-soft); color: var(--ink); font-family: inherit; font-size: .8rem; font-weight: 600; cursor: pointer; }
.metric-select:hover { border-color: var(--line-strong); }
.metric-select:focus-visible { border-color: var(--accent); outline: 2px solid var(--accent); outline-offset: 1px; }
.chart-actions.has-back { justify-content: flex-end; }
.chart-actions.has-back .back { justify-self: end; }
.task-menu { position: relative; }
.task-menu summary { min-width: 8.5rem; min-height: 2rem; display: flex; align-items: center; justify-content: space-between; gap: .5rem; padding: .35rem .55rem; border: 1px solid var(--line); border-radius: var(--radius-sm); color: var(--ink); font-size: .75rem; cursor: pointer; list-style: none; }
.task-menu summary::-webkit-details-marker { display: none; }
.task-menu summary::after { content: '▾'; color: var(--muted); }
.task-menu[open] summary { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-glow); }
.task-menu-popover { position: absolute; top: calc(100% + .35rem); left: 0; z-index: 10; width: min(17rem, calc(100vw - 3rem)); padding: .4rem; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); box-shadow: var(--shadow-menu); }
.task-menu-popover label { display: flex; align-items: center; gap: .5rem; padding: .45rem; color: var(--ink); font-size: .76rem; cursor: pointer; }
.task-menu-popover label:hover { background: var(--page-soft); }
.task-menu-popover label span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.task-clear { width: 100%; margin-top: .25rem; padding: .4rem; border: 0; border-top: 1px solid var(--line); border-radius: 0; background: transparent; color: var(--accent); font-size: .72rem; text-align: left; }
.task-clear:disabled { color: var(--muted); cursor: default; }
.donut-layout { display: grid; grid-template-columns: minmax(190px, .9fr) minmax(160px, 1.1fr); align-items: center; gap: .7rem; margin-top: .75rem; }
.donut-wrap { position: relative; width: min(100%, 250px); aspect-ratio: 1; margin: auto; }
.donut { width: 100%; height: 100%; transform: rotate(-90deg); overflow: visible; }
.donut-track, .donut-segment { fill: none; stroke-width: 28; }
.donut-track { stroke: var(--page-soft); }
.donut-segment { transition: opacity .15s, stroke-width .15s; }
.donut-segment.clickable { cursor: pointer; }
.donut-segment:hover, .donut-segment:focus { opacity: .82; stroke-width: 33; outline: none; }
.donut-entry.clickable { cursor: pointer; }
.donut-entry:focus { outline: none; }
.donut-entry:hover .donut-segment, .donut-entry:focus .donut-segment { opacity: .82; stroke-width: 33; }
.donut-contingency { opacity: .42; }
.donut-contingency-stripes { opacity: .42; }
.donut-total { position: absolute; inset: 28%; display: grid; place-content: center; text-align: center; pointer-events: none; }
.donut-total strong { color: var(--ink); font-size: 1.05rem; }
.donut-total span { color: var(--muted); font-size: .7rem; }
.legend { display: grid; gap: .25rem; max-height: 270px; overflow: auto; }
.legend button, .bar-row { min-width: 0; border: 0; background: transparent; color: var(--ink); }
.legend button { display: grid; grid-template-columns: .7rem minmax(0, 1fr) auto; align-items: center; gap: .5rem; padding: .45rem; text-align: left; }
.legend button:not(:disabled):hover, .legend button:not(:disabled):focus { background: var(--page-soft); }
.legend button.inert, .bar-row.inert { cursor: default; opacity: 1; }
.swatch { width: .65rem; height: .65rem; border-radius: 50%; }
.legend-name { display: flex; align-items: center; min-width: 0; gap: .35rem; }
.legend-label, .bar-name-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.type-icon { position: relative; display: inline-block; width: .8rem; height: .8rem; margin-right: .35rem; color: var(--muted); vertical-align: -.1rem; }
.type-icon.macro::before { content: ''; position: absolute; inset: 1px 2px 2px 1px; border: 1.5px solid currentColor; border-radius: 2px; box-shadow: 2px -2px 0 -1px var(--surface), 2px -2px 0 0 currentColor; }
.type-icon.formula { color: var(--muted); }
.type-icon.formula::before { content: 'Σ'; position: absolute; inset: -.12rem 0 0; font-size: .75rem; font-weight: 700; line-height: 1; }
.subtask-badge { flex: 0 0 auto; max-width: 7rem; overflow: hidden; padding: .14rem .35rem; border: 1px solid color-mix(in srgb, var(--accent) 42%, var(--line)); border-radius: 999px; background: var(--accent-subtle); color: var(--accent); font-size: .58rem; font-weight: 700; letter-spacing: .04em; line-height: 1.1; text-overflow: ellipsis; text-transform: uppercase; white-space: nowrap; }
.metric-value { display: inline-flex; align-items: baseline; gap: .22rem; min-width: 0; white-space: nowrap; }
.metric-breakdown { color: var(--muted); font-size: .68rem; font-weight: 500; }
.legend strong { font-size: .75rem; }
.legend small { margin-left: .25rem; color: var(--muted); font-size: .68rem; font-weight: 500; }
.bar-list { display: grid; gap: .8rem; margin-top: 1rem; }
.bar-row { display: grid; gap: .35rem; width: 100%; padding: .25rem; text-align: left; }
.bar-row:not(:disabled):hover, .bar-row:not(:disabled):focus { background: var(--page-soft); }
.bar-label { display: flex; justify-content: space-between; gap: .75rem; font-size: .78rem; }
.bar-label > span { min-width: 0; }
.bar-name { display: flex; align-items: center; min-width: 0; gap: .35rem; overflow: hidden; }
.bar-track { display: flex; width: 100%; height: .8rem; border-radius: 999px; overflow: hidden; background: var(--page-soft); }
.bar-base, .bar-contingency { height: 100%; min-width: 0; }
.bar-contingency { opacity: .42; background-image: repeating-linear-gradient(135deg, transparent 0 3px, rgb(255 255 255 / .35) 3px 5px) !important; }
.bar-key { display: flex; gap: 1rem; margin-top: 1rem; color: var(--muted); font-size: .72rem; }
.bar-key span { display: flex; align-items: center; gap: .35rem; }
.bar-key i { width: .75rem; height: .75rem; border-radius: 2px; background: var(--accent); }
.bar-key .ctg-key { opacity: .42; background-image: repeating-linear-gradient(135deg, transparent 0 3px, rgb(255 255 255 / .35) 3px 5px); }
.owner-list, .owner-detail { display: grid; gap: .75rem; margin-top: .75rem; }
.owner-row, .owner-task-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: .75rem; min-width: 0; padding: .65rem .55rem; color: var(--ink); text-align: left; }
.owner-row { grid-template-columns: .7rem minmax(0, 1fr) auto; width: 100%; border: 0; background: transparent; cursor: pointer; }
.owner-row:hover, .owner-row:focus { background: var(--page-soft); }
.owner-swatch { width: .65rem; height: .65rem; border-radius: 50%; }
.owner-name, .owner-task-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.owner-detail-summary { display: flex; align-items: center; gap: .6rem; padding: .75rem .8rem; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--page-soft); }
.owner-detail-name { display: grid; min-width: 0; gap: .15rem; }
.owner-detail-name strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.owner-detail-total { margin-left: auto; white-space: nowrap; }
.owner-task-list { overflow: hidden; border: 1px solid var(--line); border-radius: var(--radius-sm); }
.owner-task-heading { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .75rem; padding: .45rem .8rem; color: var(--muted); background: var(--page-soft); font-size: .68rem; font-weight: 650; letter-spacing: .05em; text-transform: uppercase; }
.owner-task-row { padding: .7rem .8rem; }
.owner-task-row + .owner-task-row { border-top: 1px solid var(--line); }
.owner-task-row:hover { background: var(--page-soft); }
.owner-task-main { display: grid; grid-template-columns: 5.15rem minmax(0, 1fr); align-items: start; min-width: 0; gap: .55rem; }
.owner-task-type { min-height: 1rem; display: flex; align-items: center; }
.owner-task-type .type-icon { margin: 0; }
.owner-task-label { display: grid; gap: .15rem; }
.owner-task-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.owner-task-context { color: var(--muted); font-size: .68rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.owner-row strong, .owner-task-row strong { font-size: .75rem; }
.owner-row small, .owner-task-row small { margin-left: .25rem; color: var(--muted); font-size: .68rem; font-weight: 500; }
.empty-chart { margin: 2rem 0; color: var(--muted); text-align: center; }
.empty-chart.standalone { padding: 4rem 1rem; border: 1px dashed var(--line-strong); border-radius: var(--radius); }
.analytics-empty { min-height: 100%; display: grid; align-content: start; justify-items: center; padding-top: clamp(7rem, 24vh, 12rem); text-align: center; }
.analytics-empty p { margin: 0 0 1.25rem; color: var(--ink); font-family: var(--font-brand); font-size: clamp(1.35rem, 2vw, 1.75rem); font-weight: 600; letter-spacing: -0.03em; line-height: 1.25; }
.empty-actions { display: flex; align-items: stretch; justify-content: center; flex-wrap: wrap; gap: .75rem; }
.action-btn { display: flex; align-items: center; gap: .5rem; padding: .75rem 1.25rem; font-size: .95rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); color: var(--ink); cursor: pointer; transition: all .15s ease; }
.action-btn:hover { border-color: var(--accent); background: var(--accent-subtle); }
.action-btn.primary { border-color: var(--accent); background: var(--accent); color: var(--on-accent); }
.action-btn.primary:hover { border-color: var(--accent-hover); background: var(--accent-hover); }
.action-btn svg { flex-shrink: 0; }
.new-estimate-menu { position: relative; }
.new-estimate-split { display: flex; }
.new-estimate-main { display: flex; align-items: center; gap: .5rem; border-radius: var(--radius-sm) 0 0 var(--radius-sm); border-right: 1px solid color-mix(in srgb, var(--on-accent) 35%, transparent); }
.new-estimate-caret { min-width: auto; padding: .75rem 1.25rem; border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
.model-menu { position: absolute; top: calc(100% + .4rem); left: 0; z-index: 40; width: 280px; padding: .5rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow-menu); }
.model-menu input { width: 100%; margin-bottom: .4rem; }
.model-menu button { display: flex; align-items: center; justify-content: space-between; gap: .5rem; width: 100%; min-width: 0; padding: .5rem .65rem; border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--ink); text-align: left; }
.model-menu button:hover { background: var(--accent-subtle); }
.model-menu p { margin: .4rem; color: var(--muted); }
.model-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.badge { flex-shrink: 0; padding: .12rem .4rem; border-radius: 999px; background: var(--accent); color: var(--on-accent); font-size: .65rem; text-transform: uppercase; }
@container (max-width: 540px) {
  .chart-heading { display: grid; grid-template-columns: minmax(0, 1fr); }
  .chart-actions { width: 100%; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .chart-actions.has-back { grid-template-columns: 1fr; }
  .task-menu summary, .metric-select { width: 100%; max-width: none; }
  .donut-layout { grid-template-columns: 1fr; }
  .donut-wrap { width: min(100%, 220px); }
  .legend { width: 100%; }
}
@media (max-width: 900px) {
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .chart-grid { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .summary-grid { grid-template-columns: 1fr; }
  .donut-layout { grid-template-columns: 1fr; }
  .chart-heading { display: grid; grid-template-columns: minmax(0, 1fr); }
  .chart-actions { width: 100%; display: grid; grid-template-columns: 1fr; }
  .task-menu summary, .metric-select { width: 100%; max-width: none; }
  .task-menu-popover { width: 100%; }
}
</style>
