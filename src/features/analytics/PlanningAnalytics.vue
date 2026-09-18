<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from '../../app/i18n/useI18n';
import { ACTIVITY_STATUS_COLORS } from '../../domain/gantt';
import { formatEffort, type EffortUnit } from '../../domain/rounding';
import type { ActivityStatus, Estimate } from '../../models/estimate';
import SubtaskIcon from './SubtaskIcon.vue';
import { buildPercentageShares, type GraphMode } from './graphData';
import {
  buildPlanningCoverage,
  buildPlanningEntries,
  buildStatusCategoryGroups,
  buildTimelineBuckets,
  type PlanningEntry,
  type PlanningWeightMode,
  type PlanningWindow,
  type StatusCategoryGroup,
  type TimelineBucket,
} from './planningData';

const props = defineProps<{
  estimate: Estimate;
  mode: GraphMode;
  unit: EffortUnit;
  onSaveNote: (id: string, notes: string) => void;
}>();

const { t, locale } = useI18n();
const weightMode = ref<PlanningWeightMode>('effort');
const timelineWindow = ref<PlanningWindow>('all');
const selectedEntries = ref<PlanningEntry[]>([]);
const selectedTitle = ref('');
const planningNoteId = ref<string | null>(null);
const planningNoteDraft = ref('');

const entries = computed(() => buildPlanningEntries(props.estimate));
const coverage = computed(() => buildPlanningCoverage(entries.value, props.mode));
const categoryGroups = computed(() =>
  buildStatusCategoryGroups(entries.value, props.mode, weightMode.value),
);
const timelineBuckets = computed(() => buildTimelineBuckets(entries.value, timelineWindow.value));
const timelineStatuses = computed(() => {
  const used = new Set(timelineBuckets.value.flatMap((bucket) => bucket.statuses.map((entry) => entry.status)));
  return Object.keys(ACTIVITY_STATUS_COLORS).filter((status) => used.has(status as ActivityStatus)) as ActivityStatus[];
});
const maxTimelineTotal = computed(() => Math.max(0, ...timelineBuckets.value.map((bucket) => bucket.total)));
const selectedPercentages = computed(() => buildPercentageShares(selectedEntries.value, props.mode));

watch(() => props.estimate.meta.id, clearSelection);
watch([() => props.mode, weightMode, timelineWindow], clearSelection);

/** Format canonical effort in the Analytics global unit. */
function formatValue(hours: number): string {
  const suffix = props.unit === 'days' ? 'D' : 'h';
  return `${formatEffort(hours, props.unit, props.estimate.meta.hoursPerDay)} ${suffix}`;
}

/** Format a base or contingency component without adding the unit suffix twice. */
function formatBreakdownValue(hours: number): string {
  return formatEffort(hours, props.unit, props.estimate.meta.hoursPerDay);
}

/** Format a planning share consistently across the coverage cards. */
function formatPercentage(value: number): string {
  return `${Math.round(value * 10) / 10}%`;
}

/** Resolve one activity status label from the shared Gantt vocabulary. */
function statusLabel(status: ActivityStatus): string {
  return t(`gantt.status_${status.replace(/-/g, '_')}`);
}

/** Format an ISO date in the active locale. */
function formatDate(value: string): string {
  return new Intl.DateTimeFormat(locale.value, { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(`${value}T00:00:00`));
}

/** Format a compact timeline bucket label. */
function bucketLabel(bucket: TimelineBucket): string {
  const start = new Date(`${bucket.startDate}T00:00:00`);
  const end = new Date(`${bucket.endDate}T00:00:00`);
  const isMonth = start.getDate() === 1 && end.getDate() > 20;
  return new Intl.DateTimeFormat(locale.value, isMonth
    ? { month: 'short', year: '2-digit' }
    : { day: '2-digit', month: 'short' }).format(start);
}

/** Return one status segment width within its category. */
function statusWidth(group: StatusCategoryGroup, value: number): string {
  return `${group.total > 0 ? (value / group.total) * 100 : 0}%`;
}

/** Return a coordinated display percentage for one category status. */
function statusPercentage(group: StatusCategoryGroup, statusIndex: number): number {
  const metrics = group.statuses.map((status) => ({
    base: status.value,
    contingency: status.value,
    combined: status.value,
  }));
  return buildPercentageShares(metrics, 'combined')[statusIndex] ?? 0;
}

/** Return one status segment height within a timeline bucket. */
function timelineHeight(count: number): string {
  return `${maxTimelineTotal.value > 0 ? (count / maxTimelineTotal.value) * 100 : 0}%`;
}

/** Open a detail list for entries matching a category and status. */
function onSelectCategoryStatus(category: string, status: ActivityStatus): void {
  selectedEntries.value = entries.value.filter((entry) =>
    entry.category === category && entry.status === status && entry.status !== 'cancelled',
  );
  selectedTitle.value = `${category} · ${statusLabel(status)}`;
}

/** Open cancelled entries for one category outside the operational percentages. */
function onSelectCancelled(category: string): void {
  selectedEntries.value = entries.value.filter((entry) =>
    entry.category === category && entry.status === 'cancelled',
  );
  selectedTitle.value = `${category} · ${statusLabel('cancelled')}`;
}

/** Open planned or unplanned entries from the coverage summary. */
function onSelectCoverage(isPlanned: boolean): void {
  selectedEntries.value = entries.value.filter((entry) =>
    entry.status !== 'cancelled' && Boolean(entry.range) === isPlanned,
  );
  selectedTitle.value = isPlanned ? t('analytics.plannedWork') : t('analytics.unplannedWork');
}

/** Open active operational line items without any owner assignment. */
function onSelectUnassigned(): void {
  selectedEntries.value = entries.value.filter((entry) =>
    entry.status !== 'cancelled' && entry.owners.length === 0,
  );
  selectedTitle.value = t('analytics.unassignedWork');
}

/** Open every activity whose planning range crosses the selected timeline bucket. */
function onSelectTimelineBucket(bucket: TimelineBucket): void {
  const ids = new Set(bucket.entryIds);
  selectedEntries.value = entries.value.filter((entry) => ids.has(entry.id));
  selectedTitle.value = `${formatDate(bucket.startDate)} – ${formatDate(bucket.endDate)}`;
}

/** Open one planning row note in the shared Analytics editor. */
function openPlanningNote(entry: PlanningEntry): void {
  planningNoteId.value = entry.id;
  planningNoteDraft.value = entry.notes;
}

/** Save one planning row note through the parent session mutation. */
function savePlanningNote(entry: PlanningEntry): void {
  props.onSaveNote(entry.id, planningNoteDraft.value);
  entry.notes = planningNoteDraft.value;
  planningNoteId.value = null;
  planningNoteDraft.value = '';
}


/** Clear the active planning drill-down. */
function clearSelection(): void {
  selectedEntries.value = [];
  selectedTitle.value = '';
  planningNoteId.value = null;
  planningNoteDraft.value = '';
}
</script>

<template>
  <section class="planning-analytics">
    <div class="planning-section-heading">
      <div>
        <p class="eyebrow">{{ t('analytics.planning') }}</p>
        <h2>{{ t('analytics.planningAnalytics') }}</h2>
        <p>{{ t('analytics.planningDescription') }}</p>
      </div>
    </div>

    <div class="coverage-grid">
      <button type="button" class="coverage-card coverage-summary-card" @click="onSelectCoverage(true)">
        <span>{{ t('analytics.planningCoverage') }}</span>
        <strong>{{ Math.round(coverage.percentage * 10) / 10 }}%</strong>
        <div class="coverage-track" :aria-label="t('analytics.planningCoverage')">
          <span class="coverage-planned" :style="{ width: coverage.percentage + '%' }" />
        </div>
        <small>{{ t('analytics.plannedWork') }} {{ formatPercentage(coverage.percentage) }}</small>
        <small>{{ formatValue(coverage.planned) }} / {{ formatValue(coverage.total) }}</small>
      </button>
      <button type="button" class="coverage-card" @click="onSelectCoverage(false)">
        <span>{{ t('analytics.unplannedWork') }}</span>
        <strong>{{ formatValue(coverage.unplanned) }}</strong>
        <small>{{ formatPercentage(coverage.unplannedPercentage) }} · {{ t('analytics.activeOperationalEffort') }}</small>
      </button>
      <button type="button" class="coverage-card" @click="onSelectUnassigned">
        <span>{{ t('analytics.unassignedWork') }}</span>
        <strong>{{ formatValue(coverage.unassigned) }}</strong>
        <small>{{ formatPercentage(coverage.unassignedPercentage) }} · {{ t('analytics.activeOperationalEffort') }}</small>
      </button>
    </div>

    <div class="planning-chart-grid">
      <article class="planning-card status-card">
        <div class="planning-card-heading">
          <div>
            <p class="eyebrow">{{ t('analytics.statuses') }}</p>
            <h3>{{ t('analytics.statusByCategory') }}</h3>
          </div>
          <div class="segmented" :aria-label="t('analytics.statusWeight')" v-tip="t('analytics.statusWeightHint')">
            <button type="button" :class="{ active: weightMode === 'effort' }" @click="weightMode = 'effort'">{{ t('analytics.effort') }}</button>
            <button type="button" :class="{ active: weightMode === 'count' }" @click="weightMode = 'count'">{{ t('analytics.activityCount') }}</button>
          </div>
        </div>

        <div v-if="categoryGroups.length" class="status-groups">
          <div v-for="group in categoryGroups" :key="group.category" class="status-group">
            <div class="status-group-label">
              <strong>{{ group.category }}</strong>
              <button v-if="group.cancelledCount" type="button" @click="onSelectCancelled(group.category)">
                {{ t('analytics.cancelledActivities', { count: String(group.cancelledCount) }) }}
              </button>
            </div>
            <div class="status-track">
              <button
                v-for="(status, statusIndex) in group.statuses"
                :key="status.status"
                type="button"
                class="status-segment"
                :style="{ width: statusWidth(group, status.value), background: ACTIVITY_STATUS_COLORS[status.status] }"
                :title="`${statusLabel(status.status)} · ${statusPercentage(group, statusIndex)}%`"
                @click="onSelectCategoryStatus(group.category, status.status)"
              />
            </div>
            <div class="status-labels">
              <button
                v-for="(status, statusIndex) in group.statuses"
                :key="status.status"
                type="button"
                @click="onSelectCategoryStatus(group.category, status.status)"
              >
                <i :style="{ background: ACTIVITY_STATUS_COLORS[status.status] }" />
                <span>{{ statusLabel(status.status) }}</span>
                <small>{{ statusPercentage(group, statusIndex) }}%</small>
              </button>
            </div>
          </div>
        </div>
        <p v-else class="planning-empty">{{ t('analytics.noPlanningStatusData') }}</p>
      </article>

      <article class="planning-card timeline-card">
        <div class="planning-card-heading">
          <div>
            <p class="eyebrow">{{ t('analytics.timeline') }}</p>
            <h3>{{ t('analytics.activitiesOverTime') }}</h3>
          </div>
          <select v-model="timelineWindow" class="planning-select" :aria-label="t('analytics.timelineWindow')">
            <option value="all">{{ t('analytics.allPlanning') }}</option>
            <option value="3">{{ t('analytics.nextMonths', { count: '3' }) }}</option>
            <option value="6">{{ t('analytics.nextMonths', { count: '6' }) }}</option>
            <option value="12">{{ t('analytics.nextMonths', { count: '12' }) }}</option>
          </select>
        </div>

        <div v-if="timelineBuckets.length" class="timeline-scroll">
          <div class="timeline-bars">
            <button
              v-for="bucket in timelineBuckets"
              :key="bucket.id"
              type="button"
              class="timeline-column"
              :title="`${formatDate(bucket.startDate)} – ${formatDate(bucket.endDate)} · ${bucket.total}`"
              @click="onSelectTimelineBucket(bucket)"
            >
              <span class="timeline-value">{{ bucket.total }}</span>
              <span class="timeline-stack">
                <i
                  v-for="status in bucket.statuses"
                  :key="status.status"
                  :style="{ height: timelineHeight(status.count), background: ACTIVITY_STATUS_COLORS[status.status] }"
                />
              </span>
              <small>{{ bucketLabel(bucket) }}</small>
            </button>
          </div>
        </div>
        <p v-else class="planning-empty">{{ t('analytics.noTimelineData') }}</p>
        <div v-if="timelineStatuses.length" class="planning-legend">
          <span v-for="status in timelineStatuses" :key="status">
            <i :style="{ background: ACTIVITY_STATUS_COLORS[status] }" />
            {{ statusLabel(status) }}
          </span>
        </div>
        <small class="planning-note">{{ t('analytics.timelinePlannedOnly') }}</small>
      </article>
    </div>

    <article v-if="selectedEntries.length" class="planning-card planning-detail">
      <div class="planning-detail-heading">
        <div>
          <p class="eyebrow">{{ t('analytics.planningDetail') }}</p>
          <h3>{{ selectedTitle }}</h3>
        </div>
        <button type="button" class="planning-close" :aria-label="t('common.close')" @click="clearSelection">×</button>
      </div>
      <div class="planning-table">
        <div class="planning-table-heading">
          <span>{{ t('common.name') }}</span>
          <span>{{ t('analytics.category') }}</span>
          <span>{{ t('analytics.statuses') }}</span>
          <span>{{ t('analytics.planningRange') }}</span>
          <span>{{ t('analytics.owners') }}</span>
          <span>{{ t('common.notes') }}</span>
          <span>{{ t(`analytics.${mode}`) }}</span>
          <span>{{ t('analytics.effort') }}</span>
        </div>
        <div v-for="(entry, entryIndex) in selectedEntries" :key="entry.id" class="planning-table-row">
          <span class="planning-name">
            <span class="planning-type">
              <SubtaskIcon v-if="entry.type === 'subtask'" />
              <span v-else class="planning-macro-icon" aria-hidden="true" />
            </span>
            <span>
              <strong>{{ entry.name }}</strong>
              <small v-if="entry.parentName">{{ t('analytics.subtaskOf', { name: entry.parentName }) }}</small>
            </span>
          </span>
          <span>{{ entry.category }}</span>
          <span class="status-cell"><i :style="{ background: ACTIVITY_STATUS_COLORS[entry.status] }" />{{ statusLabel(entry.status) }}</span>
          <span>{{ entry.range ? `${formatDate(entry.range.startDate)} – ${formatDate(entry.range.endDate)}` : '—' }}</span>
          <span>{{ entry.owners.length ? entry.owners.join(', ') : t('analytics.unassigned') }}</span>
          <span class="planning-notes-cell">
            <button
              type="button"
              class="planning-note-button"
              :class="{ filled: entry.notes.trim() }"
              :aria-label="t('analytics.openNotes', { name: entry.name })"
              :aria-expanded="planningNoteId === entry.id"
              v-tip="t('analytics.openNotes', { name: entry.name })"
              @click.stop="openPlanningNote(entry)"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path d="M3 2.5h10v8l-3 3H3z" /><path d="M10 13.5v-3h3M5 5.5h6M5 8h4" />
              </svg>
            </button>
          </span>
          <strong>
            <span>{{ formatValue(entry[mode]) }}</span>
            <span v-if="mode === 'combined'" class="planning-metric-breakdown">· {{ formatBreakdownValue(entry.base) }} | {{ formatBreakdownValue(entry.contingency) }}</span>
          </strong>
          <small class="planning-effort-share">{{ selectedPercentages[entryIndex] }}%</small>
          <div v-if="planningNoteId === entry.id" class="planning-note-popover">
            <strong>{{ t('common.notes') }}</strong>
            <textarea v-model="planningNoteDraft" rows="3" :aria-label="t('common.notes')" :placeholder="t('working.notesPh')" />
            <div class="planning-note-actions">
              <button type="button" class="ghost" @click="planningNoteId = null">{{ t('common.cancel') }}</button>
              <button type="button" class="primary" @click="savePlanningNote(entry)">{{ t('common.save') }}</button>
            </div>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.planning-analytics { display: grid; gap: .75rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--line); }
.planning-section-heading h2, .planning-section-heading p { margin: 0; }
.planning-section-heading h2 { margin-top: .2rem; font-family: var(--font-ui); font-size: 1.15rem; }
.planning-section-heading > div > p:last-child { margin-top: .35rem; color: var(--muted); font-size: .8rem; }
.eyebrow { color: var(--muted); font-size: .7rem; font-weight: 650; letter-spacing: .06em; text-transform: uppercase; }
.coverage-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; }
.coverage-card, .planning-card { border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow-soft); }
.coverage-card { display: grid; gap: .35rem; min-width: 0; padding: 1rem; color: var(--ink); text-align: left; }
button.coverage-card { cursor: pointer; }
button.coverage-card:hover, button.coverage-card:focus-visible { border-color: var(--accent); background: var(--accent-subtle); }
.coverage-card > span { color: var(--muted); font-size: .7rem; font-weight: 650; letter-spacing: .06em; text-transform: uppercase; }
.coverage-card strong { font-size: 1.25rem; }
.coverage-card small { color: var(--muted); font-size: .72rem; }
.coverage-summary-card { grid-column: span 2; align-content: center; }
.coverage-track { height: .85rem; overflow: hidden; border-radius: 999px; background: color-mix(in srgb, var(--line-strong) 35%, var(--surface)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--line-strong) 45%, transparent); }
.coverage-planned { display: block; height: 100%; background: var(--accent); }
.planning-chart-grid { display: grid; grid-template-columns: minmax(360px, 1fr) minmax(360px, 1fr); gap: .75rem; }
.planning-card { min-width: 0; padding: 1.1rem; }
.planning-card-heading, .planning-detail-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: .75rem; }
.planning-card-heading h3, .planning-card-heading p, .planning-detail-heading h3, .planning-detail-heading p { margin: 0; }
.planning-card-heading h3, .planning-detail-heading h3 { margin-top: .2rem; font-family: var(--font-ui); font-size: 1rem; }
.segmented { display: inline-flex; flex-shrink: 0; padding: 2px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); }
.segmented button { border: 0; background: transparent; padding: .42rem .7rem; color: var(--muted); white-space: nowrap; }
.segmented button.active { background: var(--accent-subtle); color: var(--accent); font-weight: 700; }
.status-groups { display: grid; gap: 1.1rem; margin-top: 1rem; max-height: 30rem; padding-right: .25rem; overflow: auto; }
.status-group { display: grid; gap: .45rem; }
.status-group-label { display: flex; align-items: baseline; justify-content: space-between; gap: .5rem; font-size: .78rem; }
.status-group-label button { padding: 0; border: 0; background: transparent; color: var(--muted); font-size: .68rem; }
.status-track { display: flex; height: 1rem; overflow: hidden; border-radius: 999px; background: color-mix(in srgb, var(--line-strong) 35%, var(--surface)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--line-strong) 45%, transparent); }
.status-segment { min-width: 2px; height: 100%; padding: 0; border: 0; }
.status-segment:hover, .status-segment:focus-visible { filter: brightness(1.12); outline: 2px solid var(--ink); outline-offset: -2px; }
.status-labels { display: flex; flex-wrap: wrap; gap: .25rem .65rem; }
.status-labels button { display: flex; align-items: center; gap: .3rem; padding: 0; border: 0; background: transparent; color: var(--muted); font-size: .68rem; }
.status-labels i, .planning-legend i, .status-cell i { width: .55rem; height: .55rem; flex-shrink: 0; border-radius: 50%; }
.status-labels small { font-size: inherit; }
.planning-select { min-height: 2.25rem; padding: .35rem 1.8rem .35rem .65rem; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); color: var(--ink); font: inherit; font-size: .75rem; }
.timeline-card { display: grid; grid-template-rows: auto minmax(15rem, 1fr) auto auto; min-height: 0; }
.timeline-scroll { min-height: 0; margin-top: 1rem; overflow: auto hidden; }
.timeline-bars { display: flex; align-items: end; gap: .35rem; min-width: max-content; height: 100%; min-height: 15rem; padding: 1.5rem .25rem 1.8rem; border-bottom: 1px solid var(--line); }
.timeline-column { position: relative; display: grid; grid-template-rows: 1fr auto; align-items: end; width: 2.6rem; height: 100%; padding: 0; border: 0; background: transparent; color: var(--ink); }
.timeline-column:hover .timeline-stack, .timeline-column:focus-visible .timeline-stack { outline: 2px solid var(--accent); outline-offset: 2px; }
.timeline-value { position: absolute; top: -1.15rem; left: 50%; color: var(--muted); font-size: .65rem; transform: translateX(-50%); }
.timeline-stack { display: flex; flex-direction: column-reverse; align-self: end; width: 1.5rem; height: calc(100% - 1.2rem); margin: 0 auto; overflow: hidden; border-radius: .25rem .25rem 0 0; background: color-mix(in srgb, var(--line-strong) 35%, var(--surface)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--line-strong) 45%, transparent); }
.timeline-stack i { display: block; width: 100%; min-height: 1px; }
.timeline-column small { position: absolute; bottom: -1.35rem; left: 50%; width: 4.5rem; color: var(--muted); font-size: .62rem; transform: translateX(-50%); }
.planning-legend { display: flex; flex-wrap: wrap; gap: .35rem .8rem; margin-top: .8rem; color: var(--muted); font-size: .68rem; }
.planning-legend span, .status-cell { display: inline-flex; align-items: center; gap: .3rem; }
.planning-note { display: block; margin-top: .6rem; color: var(--muted); font-size: .68rem; }
.planning-empty { margin: 2.5rem 0; color: var(--muted); text-align: center; }
.planning-detail { display: grid; gap: .75rem; }
.planning-close { display: grid; width: 1.8rem; height: 1.8rem; place-items: center; padding: 0; border: 0; border-radius: 50%; background: transparent; color: var(--muted); font-size: 1.25rem; }
.planning-close:hover, .planning-close:focus-visible { background: var(--page-soft); color: var(--ink); }
.planning-table { overflow: auto; border: 1px solid var(--line); border-radius: var(--radius-sm); }
.planning-table-heading, .planning-table-row { display: grid; grid-template-columns: minmax(13rem, 1.4fr) minmax(7rem, .7fr) minmax(7rem, .7fr) minmax(12rem, 1fr) minmax(8rem, .8fr) 3rem minmax(9rem, .8fr) 4rem; align-items: start; gap: .75rem; min-width: 69rem; padding: .65rem .8rem; }
.planning-table-heading { background: var(--page-soft); color: var(--muted); font-family: var(--font-ui); font-size: .72rem; font-weight: 650; letter-spacing: .05em; line-height: 1.3; text-transform: uppercase; }
.planning-table-row { font-family: var(--font-ui); font-size: .84rem; line-height: 1.35; }
.planning-table-row + .planning-table-row { border-top: 1px solid var(--line); }
.planning-table-row:hover { background: var(--page-soft); }
.planning-table-heading > span:not(:first-child), .planning-table-row > :not(:first-child) { justify-self: end; min-width: 0; text-align: right; white-space: normal; overflow-wrap: anywhere; }
.planning-notes-cell { display: flex; justify-content: flex-end; }
.planning-note-button { display: inline-grid; width: 1.85rem; height: 1.85rem; place-items: center; padding: 0; border: 1px solid transparent; border-radius: var(--radius-sm); background: transparent; color: var(--muted); font: inherit; cursor: pointer; }
.planning-note-button:hover, .planning-note-button:focus-visible { border-color: var(--line); background: var(--page-soft); color: var(--ink); }
.planning-note-button.filled { color: var(--accent); background: var(--accent-subtle); }
.planning-note-popover { grid-column: 1 / -1; justify-self: stretch !important; min-width: 0; padding: .7rem; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); text-align: left !important; }
.planning-note-popover strong { display: block; margin-bottom: .35rem; font-size: .78rem; }
.planning-note-popover textarea { display: block; box-sizing: border-box; width: 100%; min-height: 5rem; padding: .5rem .6rem; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); color: var(--ink); font: inherit; line-height: 1.45; resize: vertical; }
.planning-note-popover textarea:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
.planning-note-actions { display: flex; justify-content: flex-end; gap: .4rem; margin-top: .5rem; }
.planning-note-actions button { padding: .35rem .65rem; font: inherit; font-size: .75rem; }
.planning-effort-share { justify-self: end; color: var(--muted); font-size: .74rem; }
.planning-metric-breakdown { margin-left: .25rem; color: var(--muted); font-size: .74rem; font-weight: 500; }
.planning-name { display: grid; grid-template-columns: 1rem minmax(0, 1fr); align-items: center; gap: .55rem; min-width: 0; }
.planning-name > span:last-child { display: grid; min-width: 0; gap: .15rem; }
.planning-name strong, .planning-name small { overflow-wrap: anywhere; white-space: normal; }
.planning-name small { color: var(--muted); font-size: .74rem; font-weight: 500; }
.planning-type { display: flex; align-items: center; min-height: 1rem; }
.planning-macro-icon { position: relative; display: inline-block; width: .8rem; height: .8rem; color: var(--muted); }
.planning-macro-icon::before { content: ''; position: absolute; inset: 1px 2px 2px 1px; border: 1.5px solid currentColor; border-radius: 2px; box-shadow: 2px -2px 0 -1px var(--surface), 2px -2px 0 0 currentColor; }

@media (max-width: 900px) {
  .coverage-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .coverage-summary-card { grid-column: span 2; }
  .planning-chart-grid { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .coverage-grid { grid-template-columns: 1fr; }
  .coverage-summary-card { grid-column: auto; }
  .planning-card-heading { display: grid; }
  .segmented, .planning-select { width: 100%; }
  .segmented button { flex: 1; }
}
</style>

