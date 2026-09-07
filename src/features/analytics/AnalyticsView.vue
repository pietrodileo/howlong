<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDocumentsStore } from '../../shared/documents';
import { useUiStore } from '../../app/ui';
import { useI18n } from '../../app/i18n/useI18n';
import { computeTotals } from '../../domain/contingency';
import { formatEffort, type EffortUnit } from '../../domain/rounding';
import { buildGraphEntries, graphValue, type GraphEntry, type GraphMode } from './graphData';

const DONUT_RADIUS = 70;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

const documentsStore = useDocumentsStore();
const ui = useUiStore();
const { t } = useI18n();
const unit = ref<EffortUnit>('hours');
const mode = ref<GraphMode>('combined');
const selectedMacroId = ref<string | null>(null);
const hoveredEntryId = ref<string | null>(null);
const expandedMacroIds = ref<Set<string>>(new Set());

const estimate = computed(() => documentsStore.activeSession?.estimate ?? null);
const totals = computed(() => estimate.value ? computeTotals(estimate.value) : null);
const overviewMacros = computed(() => estimate.value ? buildGraphEntries(estimate.value).filter((entry) => entry.canDrillDown) : []);
const entries = computed(() => estimate.value
  ? buildGraphEntries(estimate.value, selectedMacroId.value, expandedMacroIds.value)
  : []);
const donutEntries = computed(() => entries.value.filter((entry) => graphValue(entry, mode.value) > 0));
const donutTotal = computed(() => donutEntries.value.reduce((sum, entry) => sum + graphValue(entry, mode.value), 0));
const hoveredEntry = computed(() => donutEntries.value.find((entry) => entry.id === hoveredEntryId.value) ?? null);
const selectedMacroName = computed(() => {
  if (!estimate.value || !selectedMacroId.value) return '';
  return estimate.value.items.find((item) => item.id === selectedMacroId.value)?.name ?? '';
});
const hoursPerDay = computed(() => estimate.value?.meta.hoursPerDay ?? 8);
const maxCombined = computed(() => Math.max(0, ...entries.value.map((entry) => entry.combined)));

watch(() => documentsStore.activeId, () => {
  selectedMacroId.value = null;
  expandedMacroIds.value = new Set();
});
watch(entries, (next) => {
  if (selectedMacroId.value && next.length === 0) selectedMacroId.value = null;
});

/** Format canonical hours in the dashboard's selected global unit. */
function formatValue(hours: number): string {
  const suffix = unit.value === 'days' ? 'D' : 'h';
  return `${formatEffort(hours, unit.value, hoursPerDay.value)} ${suffix}`;
}

/** Format one donut entry's share of the active metric. */
function formatPercentage(entry: GraphEntry): string {
  if (!donutTotal.value) return '0%';
  return `${Math.round((graphValue(entry, mode.value) / donutTotal.value) * 1000) / 10}%`;
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

/** Create a blank estimate and move to its editor. */
function onCreateEstimate(): void {
  documentsStore.createEmpty();
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
    </div>

    <div class="summary-grid">
      <article class="summary-card"><span>{{ t('common.base') }}</span><strong>{{ formatValue(totals?.totalBase ?? 0) }}</strong></article>
      <article class="summary-card"><span>{{ t('analytics.contingencyOnly') }}</span><strong>{{ formatValue(totals?.totalContingency ?? 0) }}</strong></article>
      <article class="summary-card"><span>{{ t('analytics.combined') }}</span><strong>{{ formatValue(totals?.totalWithContingency ?? 0) }}</strong></article>
      <article class="summary-card"><span>{{ t('analytics.contingencyRate') }}</span><strong>{{ totals?.totalBase ? formatEffort((totals.totalContingency / totals.totalBase) * 100, 'hours') : '0' }}%</strong></article>
    </div>

    <div v-if="entries.length" class="chart-grid">
      <article class="chart-card donut-card">
        <div class="chart-heading">
          <div>
            <p class="eyebrow">{{ selectedMacroId ? t('analytics.subtasks') : t('analytics.macros') }}</p>
            <h3>{{ selectedMacroName || t('analytics.effortDistribution') }}</h3>
          </div>
          <div class="chart-actions">
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
            <select v-model="mode" class="metric-select" :aria-label="t('analytics.metric')">
              <option value="base">{{ t('common.base') }}</option>
              <option value="contingency">{{ t('analytics.contingencyOnly') }}</option>
              <option value="combined">{{ t('analytics.combined') }}</option>
            </select>
          </div>
        </div>

        <div v-if="donutEntries.length" class="donut-layout">
          <div class="donut-wrap">
            <svg class="donut" viewBox="0 0 180 180" role="img" :aria-label="t('analytics.donutAria')">
              <circle class="donut-track" cx="90" cy="90" :r="DONUT_RADIUS" />
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
                :aria-label="`${entry.name}: ${formatValue(graphValue(entry, mode))}, ${formatPercentage(entry)}`"
                @click="onSelectEntry(entry)"
                @keydown.enter.prevent="onSelectEntry(entry)"
                @keydown.space.prevent="onSelectEntry(entry)"
                @mouseenter="hoveredEntryId = entry.id"
                @mouseleave="hoveredEntryId = null"
                @focus="hoveredEntryId = entry.id"
                @blur="hoveredEntryId = null"
              ><title>{{ entry.name }}: {{ formatValue(graphValue(entry, mode)) }} · {{ formatPercentage(entry) }}</title></circle>
            </svg>
            <div class="donut-total">
              <strong>{{ hoveredEntry ? formatPercentage(hoveredEntry) : formatValue(donutTotal) }}</strong>
              <span>{{ hoveredEntry?.name || t(`analytics.${mode}`) }}</span>
            </div>
          </div>
          <div class="legend" :aria-label="t('analytics.legend')">
            <button v-for="entry in donutEntries" :key="entry.id" type="button" :class="{ inert: !entry.canDrillDown }" :aria-disabled="!entry.canDrillDown" v-tip="entryHint(entry)" @click="onSelectEntry(entry)">
              <span class="swatch" :style="{ background: entry.color }" />
              <span class="legend-name"><span v-if="entry.type === 'subtask' || entry.canDrillDown" class="type-icon" :class="entry.type" aria-hidden="true"></span>{{ entry.name }}</span>
              <strong>{{ formatValue(graphValue(entry, mode)) }} <small>{{ formatPercentage(entry) }}</small></strong>
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
            <span class="bar-label"><span><span v-if="entry.type === 'subtask' || entry.canDrillDown" class="type-icon" :class="entry.type" aria-hidden="true"></span>{{ entry.name }}</span><strong>{{ formatValue(entry.combined) }}</strong></span>
            <span class="bar-track">
              <span class="bar-base" :style="{ width: `${maxCombined ? (entry.base / maxCombined) * 100 : 0}%`, background: entry.color }" />
              <span class="bar-contingency" :style="{ width: `${maxCombined ? (entry.contingency / maxCombined) * 100 : 0}%`, background: entry.color }" />
            </span>
          </button>
        </div>
        <div class="bar-key"><span><i class="base-key" />{{ t('common.base') }}</span><span><i class="ctg-key" />{{ t('analytics.contingencyOnly') }}</span></div>
      </article>
    </div>
    <p v-else class="empty-chart standalone">{{ t('analytics.noData') }}</p>
  </section>

  <section v-else class="analytics-empty">
    <p>{{ t('analytics.noEstimate') }}</p>
    <div>
      <button type="button" class="primary" @click="onCreateEstimate">{{ t('welcome.newEstimate') }}</button>
      <button type="button" class="ghost" @click="ui.navigate('library')">{{ t('gantt.openLibrary') }}</button>
    </div>
  </section>
</template>

<style scoped>
.analytics-view { min-height: 100%; padding-bottom: 2rem; }
.analytics-controls { display: flex; justify-content: flex-end; gap: .65rem; margin-bottom: 1rem; flex-wrap: wrap; }
.segmented { display: inline-flex; padding: 2px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); }
.segmented button { border: 0; background: transparent; padding: .42rem .7rem; color: var(--muted); }
.segmented button.active { background: var(--accent-subtle); color: var(--accent); }
.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; margin-bottom: .75rem; }
.summary-card, .chart-card { border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow-soft); }
.summary-card { display: grid; gap: .35rem; padding: 1rem; }
.summary-card span, .eyebrow { color: var(--muted); font-size: .7rem; font-weight: 650; letter-spacing: .06em; text-transform: uppercase; }
.summary-card strong { color: var(--ink); font-size: 1.25rem; }
.chart-grid { display: grid; grid-template-columns: minmax(320px, .85fr) minmax(360px, 1.15fr); gap: .75rem; }
.chart-card { min-width: 0; padding: 1.1rem; }
.donut-card { container-type: inline-size; }
.chart-heading { min-height: 2.7rem; display: flex; justify-content: space-between; align-items: flex-start; gap: .75rem; }
.chart-heading h3, .eyebrow { margin: 0; }
.chart-heading h3 { margin-top: .2rem; font-family: var(--font-ui); font-size: 1rem; }
.chart-actions { display: flex; align-items: center; gap: .5rem; }
.back { padding: .35rem .55rem; font-size: .75rem; }
.metric-select { min-height: 2rem; max-width: 12rem; padding: .35rem 1.8rem .35rem .55rem; color: var(--ink); font-size: .75rem; }
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
.donut-total { position: absolute; inset: 28%; display: grid; place-content: center; text-align: center; pointer-events: none; }
.donut-total strong { color: var(--ink); font-size: 1.05rem; }
.donut-total span { color: var(--muted); font-size: .7rem; }
.legend { display: grid; gap: .25rem; max-height: 270px; overflow: auto; }
.legend button, .bar-row { min-width: 0; border: 0; background: transparent; color: var(--ink); }
.legend button { display: grid; grid-template-columns: .7rem minmax(0, 1fr) auto; align-items: center; gap: .5rem; padding: .45rem; text-align: left; }
.legend button:not(:disabled):hover, .legend button:not(:disabled):focus { background: var(--page-soft); }
.legend button.inert, .bar-row.inert { cursor: default; opacity: 1; }
.swatch { width: .65rem; height: .65rem; border-radius: 50%; }
.legend-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.type-icon { position: relative; display: inline-block; width: .8rem; height: .8rem; margin-right: .35rem; color: var(--muted); vertical-align: -.1rem; }
.type-icon.macro::before { content: ''; position: absolute; inset: 1px 2px 2px 1px; border: 1.5px solid currentColor; border-radius: 2px; box-shadow: 2px -2px 0 -1px var(--surface), 2px -2px 0 0 currentColor; }
.type-icon.subtask { color: var(--accent); }
.type-icon.subtask::before { content: '↳'; position: absolute; inset: -.3rem 0 0; font-size: 1rem; font-weight: 700; line-height: 1; }
.legend strong { font-size: .75rem; }
.legend small { margin-left: .25rem; color: var(--muted); font-size: .68rem; font-weight: 500; }
.bar-list { display: grid; gap: .8rem; margin-top: 1rem; }
.bar-row { display: grid; gap: .35rem; width: 100%; padding: .25rem; text-align: left; }
.bar-row:not(:disabled):hover, .bar-row:not(:disabled):focus { background: var(--page-soft); }
.bar-label { display: flex; justify-content: space-between; gap: .75rem; font-size: .78rem; }
.bar-label > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bar-track { display: flex; width: 100%; height: .8rem; border-radius: 999px; overflow: hidden; background: var(--page-soft); }
.bar-base, .bar-contingency { height: 100%; min-width: 0; }
.bar-contingency { opacity: .42; background-image: repeating-linear-gradient(135deg, transparent 0 3px, rgb(255 255 255 / .35) 3px 5px) !important; }
.bar-key { display: flex; gap: 1rem; margin-top: 1rem; color: var(--muted); font-size: .72rem; }
.bar-key span { display: flex; align-items: center; gap: .35rem; }
.bar-key i { width: .75rem; height: .75rem; border-radius: 2px; background: var(--accent); }
.bar-key .ctg-key { opacity: .42; background-image: repeating-linear-gradient(135deg, transparent 0 3px, rgb(255 255 255 / .35) 3px 5px); }
.empty-chart { margin: 2rem 0; color: var(--muted); text-align: center; }
.empty-chart.standalone { padding: 4rem 1rem; border: 1px dashed var(--line-strong); border-radius: var(--radius); }
.analytics-empty { min-height: 100%; display: grid; place-content: center; justify-items: center; text-align: center; }
.analytics-empty p { color: var(--muted); }
.analytics-empty div { display: flex; gap: .6rem; }
@container (max-width: 540px) {
  .chart-heading { display: grid; }
  .chart-actions { width: 100%; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
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
  .chart-heading { display: grid; }
  .chart-actions { width: 100%; display: grid; grid-template-columns: 1fr; }
  .task-menu summary, .metric-select { width: 100%; max-width: none; }
  .task-menu-popover { width: 100%; }
}
</style>
