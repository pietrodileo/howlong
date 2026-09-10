<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useDocumentsStore } from '../../shared/documents';
import { useEstimateStore } from '../estimate/estimate';
import { useUiStore } from '../../app/ui';
import { useSettingsStore } from '../settings/settings';
import DisclosureIcon from '../../shared/components/DisclosureIcon.vue';
import { useModelsStore } from '../models/models';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../app/i18n/useI18n';
import type { ActivityStatus, LineItem, PlanningRange } from '../../models/estimate';
import {
  ACTIVITY_STATUSES,
  ACTIVITY_STATUS_COLORS,
  addDays,
  addMonths,
  aggregateMacroRange,
  aggregateMacroStatus,
  formatDate,
  listDays,
  monthEnd,
  monthStart,
  parseDate,
} from '../../domain/gantt';
import { exportGanttXlsx } from '../../platform/files/io';
import ConfirmModal from '../../shared/components/ConfirmModal.vue';
import { useDocumentSync } from '../../shared/composables/useDocumentSync';
import IconBtn from '../../shared/components/IconBtn.vue';

type Scale = 'day' | 'month';
type DragMode = 'move' | 'start' | 'end';

const docs = useDocumentsStore();
const estimate = useEstimateStore();
const documentSync = useDocumentSync('gantt');
const { mutate } = documentSync;
const ui = useUiStore();
const settings = useSettingsStore();
const modelsStore = useModelsStore();
const { defaultModel, models } = storeToRefs(modelsStore);
const { t, locale } = useI18n();
const scale = ref<Scale>('day');
const showWeekends = computed({
  get: () => settings.settings.ganttShowWeekends,
  set: (value: boolean) => { settings.settings.ganttShowWeekends = value; },
});
const collapsed = ref<Set<string>>(new Set());
const today = formatDate(new Date());
const selectedDate = ref(today);
const fromDate = ref(monthStart(today));
const toDate = ref(monthEnd(addMonths(today, 2)));
const exporting = ref(false);
const ganttShell = ref<HTMLElement | null>(null);
const ganttShellWidth = ref(0);
const pendingDelete = ref<LineItem | null>(null);
const newMenuOpen = ref(false);
const modelSearch = ref('');
const activityWidth = ref(340);
const activityCollapsed = ref(false);
const activityColumnWidth = computed(() => activityCollapsed.value ? 88 : activityWidth.value);
const statusMenuId = ref<string | null>(null);
const notesEditId = ref<string | null>(null);
const notesDraft = ref('');
const actionsMenuId = ref<string | null>(null);
const draggingItemId = ref<string | null>(null);
const selectedItemId = ref<string | null>(null);
let suppressBarClick = false;
const dateEditorId = ref<string | null>(null);
const startDateDraft = ref('');
const endDateDraft = ref('');
const overlayAnchor = ref<HTMLElement | null>(null);
const overlayItemId = ref<string | null>(null);
const overlayPosition = ref({ top: 0, left: 0, placement: 'bottom' as 'top' | 'bottom' });

const filteredModels = computed(() => {
  const query = modelSearch.value.trim().toLowerCase();
  return models.value.filter((model) => model.name.toLowerCase().includes(query));
});

function closeNewMenu() {
  newMenuOpen.value = false;
  modelSearch.value = '';
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as HTMLElement | null;
  if (!target?.closest('.new-estimate-menu')) closeNewMenu();
  if (!target?.closest('[data-gantt-overlay-trigger], [data-gantt-overlay]')) closeGanttOverlay();
}

/** Positions a floating Gantt editor outside the scrolling chart container. */
function updateOverlayPosition() {
  const anchor = overlayAnchor.value;
  if (!anchor) return;
  const rect = anchor.getBoundingClientRect();
  const overlay = document.querySelector<HTMLElement>('.gantt-overlay');
  const width = overlay?.getBoundingClientRect().width || 280;
  const height = overlay?.getBoundingClientRect().height || 240;
  const placement = rect.bottom + height > window.innerHeight && rect.top > height ? 'top' : 'bottom';
  overlayPosition.value = {
    top: Math.max(8, Math.min(window.innerHeight - height - 8, placement === 'bottom' ? rect.bottom + 6 : rect.top - height - 6)),
    left: Math.max(8, Math.min(window.innerWidth - width - 8, rect.left)),
    placement,
  };
}

/** Opens one Gantt overlay and remembers its trigger for positioning and focus restoration. */
function openGanttOverlay(event: MouseEvent | KeyboardEvent, item: LineItem, type: 'status' | 'notes' | 'dates' | 'actions') {
  const nextId = overlayItemId.value === item.id && ((type === 'status' && statusMenuId.value) || (type === 'notes' && notesEditId.value) || (type === 'dates' && dateEditorId.value) || (type === 'actions' && actionsMenuId.value)) ? null : item.id;
  const anchor = (event.currentTarget as HTMLElement).closest('[data-gantt-overlay]')
    ? overlayAnchor.value
    : event.currentTarget as HTMLElement;
  closeGanttOverlay(false);
  if (!nextId) return;
  overlayAnchor.value = anchor;
  overlayItemId.value = item.id;
  if (type === 'status') statusMenuId.value = item.id;
  if (type === 'notes') { notesDraft.value = item.notes; notesEditId.value = item.id; }
  if (type === 'dates') {
    startDateDraft.value = rangeFor(item)?.startDate ?? selectedDate.value;
    endDateDraft.value = rangeFor(item)?.endDate ?? selectedDate.value;
    dateEditorId.value = item.id;
  }
  if (type === 'actions') actionsMenuId.value = item.id;
  nextTick(() => requestAnimationFrame(updateOverlayPosition));
}

/** Closes every Gantt overlay and restores focus to its trigger when requested. */
function closeGanttOverlay(restoreFocus = true) {
  const anchor = overlayAnchor.value;
  statusMenuId.value = null;
  notesEditId.value = null;
  dateEditorId.value = null;
  actionsMenuId.value = null;
  overlayItemId.value = null;
  overlayAnchor.value = null;
  if (restoreFocus) nextTick(() => anchor?.focus());
}

function onWindowKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeGanttOverlay();
}

/** Applies the date draft in one history entry, including an unchanged default range. */
function onSaveDates(item: LineItem) {
  if (hasChildren(item) || !startDateDraft.value || !endDateDraft.value || endDateDraft.value < startDateDraft.value) return;
  setRange(item, { startDate: startDateDraft.value, endDate: endDateDraft.value });
  closeGanttOverlay();
}

function adjustActivityWidth(delta: number) {
  activityWidth.value = Math.min(700, Math.max(340, activityWidth.value + delta));
}

function startColumnResize(event: PointerEvent) {
  event.preventDefault();
  const startX = event.clientX;
  const startWidth = activityWidth.value;
  const onMove = (moveEvent: PointerEvent) => {
    activityWidth.value = Math.min(700, Math.max(340, startWidth + moveEvent.clientX - startX));
  };
  const onUp = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp, { once: true });
}

function toggleActivityWidth() {
  activityWidth.value = activityWidth.value > 400 ? 340 : 500;
}

function toggleActivityPanel() {
  activityCollapsed.value = !activityCollapsed.value;
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown);
  window.addEventListener('resize', updateOverlayPosition);
  window.addEventListener('scroll', updateOverlayPosition, true);
  window.addEventListener('keydown', onWindowKeydown);
});

const activeOverlayHours = computed(() => estimate.totals.lines.find((line) => line.item.id === overlayItemId.value));

/** Formats estimator hours independently of the estimate's display unit. */
function formatHours(value: number | undefined) {
  return `${new Intl.NumberFormat(locale.value, { maximumFractionDigits: 2 }).format(value ?? 0)} h`;
}

/** Opens bar actions on clicks without opening them after a drag. */
function onBarClick(event: MouseEvent, item: LineItem) {
  if (suppressBarClick) { suppressBarClick = false; return; }
  selectedItemId.value = item.id;
  openGanttOverlay(event, item, 'actions');
}

const activeOverlayItem = computed(() => plannableItems.value.find((item) => item.id === overlayItemId.value) ?? null);
onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown);
  window.removeEventListener('resize', updateOverlayPosition);
  window.removeEventListener('scroll', updateOverlayPosition, true);
  window.removeEventListener('keydown', onWindowKeydown);
});

watch(
  () => docs.activeSession?.sessionId,
  () => {
    collapsed.value = new Set();
  },
  { immediate: true },
);

watch(ganttShell, (shell, _, onCleanup) => {
  if (!shell) return;
  const updateWidth = () => { ganttShellWidth.value = shell.clientWidth; };
  const observer = new ResizeObserver(updateWidth);
  updateWidth();
  observer.observe(shell);
  onCleanup(() => observer.disconnect());
}, { flush: 'post' });

watch(fromDate, (value) => {
  if (value > toDate.value) toDate.value = value;
});
watch(toDate, (value) => {
  if (value < fromDate.value) fromDate.value = value;
});

function updateRangeDate(bound: 'from' | 'to', event: Event) {
  const input = event.currentTarget as HTMLInputElement;
  const current = bound === 'from' ? fromDate : toDate;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.value)) {
    input.value = current.value;
    return;
  }
  current.value = input.value;
}

const rangeStart = fromDate;
const rangeEnd = toDate;
const weekendColumns = computed(() => timelineDays.value.flatMap((day, index) => weekendDays.value.includes(parseDate(day).getUTCDay()) ? [index] : []));
const weekendDays = computed(() => [
  ...(settings.settings.ganttWeekendSunday ? [0] : []),
  ...(settings.settings.ganttWeekendSaturday ? [6] : []),
]);
const timelineDays = computed(() =>
  listDays(rangeStart.value, rangeEnd.value, scale.value === 'month' || showWeekends.value, weekendDays.value),
);
const cellWidth = computed(() => {
  if (scale.value === 'day') return 38;
  const availableWidth = ganttShellWidth.value - activityColumnWidth.value;
  return Math.max(5, availableWidth / Math.max(1, timelineDays.value.length));
});
const timelineWidth = computed(() => timelineDays.value.length * cellWidth.value);
const todayIndex = computed(() => timelineDays.value.indexOf(today));
const selectedDateIndex = computed(() => timelineDays.value.indexOf(selectedDate.value));

const monthGroups = computed(() => {
  const groups: { key: string; label: string; count: number }[] = [];
  for (const day of timelineDays.value) {
    const key = day.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.count += 1;
    else groups.push({
      key,
      count: 1,
      label: new Intl.DateTimeFormat(locale.value, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseDate(day)),
    });
  }
  return groups;
});

const plannableItems = computed(() =>
  estimate.estimate.items.filter((item) => item.kind !== 'formula' && item.kind !== 'summary'),
);

const visibleItems = computed(() => plannableItems.value
  .filter((item) => item.parentId == null)
  .flatMap((macro) => collapsed.value.has(macro.id) ? [macro] : [macro, ...childrenOf(macro.id)]));

function childrenOf(id: string) {
  return plannableItems.value.filter((item) => item.parentId === id);
}

function hasChildren(item: LineItem) {
  return item.parentId == null && childrenOf(item.id).length > 0;
}

/** Returns the persisted leaf status or the calculated macro roll-up. */
function statusFor(item: LineItem): ActivityStatus {
  return hasChildren(item) ? aggregateMacroStatus(estimate.estimate, item) : item.status;
}

/** Translates a stable activity status identifier. */
function statusLabel(status: ActivityStatus): string {
  return t(`gantt.status_${status.replace(/-/g, '_')}`);
}

/** Updates an editable activity status as one document-history mutation. */
function setStatus(item: LineItem, status: ActivityStatus) {
  if (hasChildren(item)) return;
  mutate(() => estimate.updateItem(item.id, { status }));
  closeGanttOverlay();
}

/** Saves the shared note as one undoable document mutation. */
function saveNotes(item: LineItem) {
  mutate(() => estimate.updateItem(item.id, { notes: notesDraft.value }));
  closeGanttOverlay();
}

function rangeFor(item: LineItem): PlanningRange | null {
  return item.parentId == null
    ? aggregateMacroRange(estimate.estimate, item)
    : estimate.estimate.planning.items[item.id] ?? null;
}

function setRange(item: LineItem, range: PlanningRange | null) {
  if (hasChildren(item)) return;
  mutate(() => estimate.setPlanningRange(item.id, range));
}

function updateEstimateTitle(title: string) {
  mutate(() => estimate.updateMeta({ title }));
}

function updateItemName(item: LineItem, name: string) {
  mutate(() => estimate.updateItem(item.id, { name }));
}

const ganttColors = ['#2b3d55', '#5b4b73', '#35605a', '#8a5a44', '#546a3a', '#7a4a5a'];

function itemColor(item: LineItem) {
  if (item.color) return item.color;
  const macroId = item.parentId ?? item.id;
  const index = plannableItems.value.filter((row) => row.parentId == null).findIndex((row) => row.id === macroId);
  return ganttColors[Math.max(0, index) % ganttColors.length];
}

function itemTextColor(item: LineItem) {
  const hex = itemColor(item).slice(1);
  const lightness = Number.parseInt(hex.slice(0, 2), 16) * .299
    + Number.parseInt(hex.slice(2, 4), 16) * .587
    + Number.parseInt(hex.slice(4, 6), 16) * .114;
  return lightness > 155 ? '#202938' : '#ffffff';
}

function setItemColor(item: LineItem, color: string) {
  mutate(() => estimate.updateItem(item.id, { color }));
}

function toggleMacro(id: string) {
  const next = new Set(collapsed.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  collapsed.value = next;
}

function setAllCollapsed(value: boolean) {
  collapsed.value = value
    ? new Set(plannableItems.value.filter((item) => item.parentId == null).map((item) => item.id))
    : new Set();
}

function addMacro() {
  mutate(() => estimate.addMacro());
}

function createEstimate(model = defaultModel.value ?? models.value[0] ?? null) {
  const sessionId = model ? docs.createFromModel(model) : docs.createEmpty();
  docs.activate(sessionId);
  closeNewMenu();
}

function createEstimateFromModel(id: string) {
  const model = models.value.find((candidate) => candidate.id === id);
  if (model) createEstimate(model);
}

function addSubtask(macroId: string) {
  mutate(() => estimate.addSubtask(macroId));
  const next = new Set(collapsed.value);
  next.delete(macroId);
  collapsed.value = next;
}

async function goToday() {
  selectedDate.value = today;
  fromDate.value = monthStart(today);
  toDate.value = monthEnd(addMonths(today, 2));
  await nextTick();
  const shell = ganttShell.value;
  if (shell) shell.scrollLeft = Math.max(0, todayIndex.value * cellWidth.value);
}

function confirmDelete() {
  const item = pendingDelete.value;
  pendingDelete.value = null;
  if (item) mutate(() => estimate.removeItem(item.id));
}

function scheduleFromCell(event: MouseEvent, item: LineItem) {
  if (rangeFor(item) || hasChildren(item)) return;
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const index = Math.floor((event.clientX - rect.left) / cellWidth.value);
  const date = timelineDays.value[index];
  if (!date) return;
  selectedDate.value = date;
  setRange(item, { startDate: date, endDate: date });
}

async function exportXlsx() {
  if (exporting.value) return;
  exporting.value = true;
  try {
    const path = await exportGanttXlsx(estimate.estimate, {
      from: rangeStart.value,
      to: rangeEnd.value,
      scale: scale.value,
      includeWeekends: showWeekends.value,
      weekendDays: weekendDays.value,
    }, settings.settings);
    if (path) ui.notify(t('gantt.exported', { path }), false, path);
  } catch (error) {
    ui.notify(error instanceof Error ? error.message : String(error), true);
  } finally {
    exporting.value = false;
  }
}

function dayLabel(day: string) {
  return new Intl.DateTimeFormat(locale.value, { day: '2-digit', weekday: 'short', timeZone: 'UTC' }).format(parseDate(day));
}

function barStyle(range: PlanningRange) {
  const visible = timelineDays.value;
  const first = visible.findIndex((day) => day >= range.startDate);
  let last = -1;
  for (let index = visible.length - 1; index >= 0; index -= 1) {
    if (visible[index] <= range.endDate) { last = index; break; }
  }
  if (first < 0 || last < first) return { display: 'none' };
  return {
    left: `${first * cellWidth.value + 3}px`,
    width: `${Math.max(8, (last - first + 1) * cellWidth.value - 6)}px`,
  };
}

/** Translates scheduled children together when dragging an aggregate macro. */
function startDrag(event: PointerEvent, item: LineItem, mode: DragMode) {
  suppressBarClick = false;
  selectedItemId.value = item.id;
  const range = rangeFor(item);
  if (!range || (hasChildren(item) && mode !== 'move')) return;
  const groupRanges = hasChildren(item)
    ? childrenOf(item.id).flatMap(child => {
      const childRange = rangeFor(child);
      return childRange ? [{ id: child.id, ...childRange }] : [];
    })
    : [];
  draggingItemId.value = item.id;
  event.preventDefault();
  const target = event.currentTarget as HTMLElement;
  target.setPointerCapture(event.pointerId);
  const originX = event.clientX;
  const initial = { ...range };
  let lastDelta = 0;

  /** Applies the displacement from the original ranges without accumulating drift. */
  function onMove(moveEvent: PointerEvent) {
    if (Math.abs(moveEvent.clientX - originX) > 3) suppressBarClick = true;
    const delta = Math.round((moveEvent.clientX - originX) / cellWidth.value);
    if (delta === lastDelta) return;
    lastDelta = delta;
    if (mode === 'move' && groupRanges.length) {
      mutate(() => {
        for (const childRange of groupRanges) {
          estimate.setPlanningRange(childRange.id, {
            startDate: addDays(childRange.startDate, delta),
            endDate: addDays(childRange.endDate, delta),
          });
        }
      });
    } else if (mode === 'move') {
      setRange(item, { startDate: addDays(initial.startDate, delta), endDate: addDays(initial.endDate, delta) });
    } else if (mode === 'start') {
      const startDate = addDays(initial.startDate, delta);
      setRange(item, { startDate: startDate <= initial.endDate ? startDate : initial.endDate, endDate: initial.endDate });
    } else {
      const endDate = addDays(initial.endDate, delta);
      setRange(item, { startDate: initial.startDate, endDate: endDate >= initial.startDate ? endDate : initial.startDate });
    }
  }

  /** Ends dragging while keeping the moved bar selected. */
  function onUp() {
    draggingItemId.value = null;
    target.removeEventListener('pointermove', onMove);
    target.removeEventListener('pointerup', onUp);
    target.removeEventListener('pointercancel', onUp);
  }
  target.addEventListener('pointermove', onMove);
  target.addEventListener('pointerup', onUp);
  target.addEventListener('pointercancel', onUp);
}
</script>

<template>
  <section v-if="docs.activeSession" class="gantt-view">
    <header class="gantt-head">
      <div class="gantt-controls">
        <label class="field range-field">
          <span>{{ t('gantt.fromMonth') }}</span>
          <input :value="fromDate" type="date" @change="updateRangeDate('from', $event)" />
        </label>
        <label class="field range-field">
          <span>{{ t('gantt.toMonth') }}</span>
          <input :value="toDate" type="date" @change="updateRangeDate('to', $event)" />
        </label>
        <button type="button" class="ghost" @click="goToday">{{ t('gantt.today') }}</button>
        <label v-if="scale === 'day'" class="weekend-toggle"><input v-model="showWeekends" type="checkbox" /> {{ t('gantt.showWeekends') }}</label>
      </div>
    </header>

    <div class="gantt-actions">
      <span class="gantt-help">{{ t('gantt.instructions') }}</span>
      <div class="segmented" role="group">
        <button type="button" :class="{ active: scale === 'day' }" @click="scale = 'day'">{{ t('gantt.dayScale') }}</button>
        <button type="button" :class="{ active: scale === 'month' }" @click="scale = 'month'">{{ t('gantt.monthScale') }}</button>
      </div>
      <button type="button" class="ghost" @click="setAllCollapsed(false)">{{ t('gantt.expandAll') }}</button>
      <button type="button" class="ghost" @click="setAllCollapsed(true)">{{ t('gantt.collapseAll') }}</button>
      <button type="button" class="ghost" @click="addMacro">{{ t('gantt.addMacro') }}</button>
      <button type="button" class="primary" :disabled="exporting" @click="exportXlsx">{{ t('gantt.exportXlsx') }}</button>
    </div>

    <div ref="ganttShell" class="gantt-shell">
      <div
        class="gantt-grid"
        :class="{ narrow: !activityCollapsed && activityWidth < 420, 'activity-collapsed': activityCollapsed }"
        :style="{ '--timeline-w': `${timelineWidth}px`, '--activity-w': `${activityColumnWidth}px` }"
      >
        <div class="activity-head">
          <input
            class="estimate-title-input"
            :value="estimate.estimate.meta.title"
            :aria-label="t('gantt.estimateTitle')"
            @input="updateEstimateTitle(($event.target as HTMLInputElement).value)"
          />
          <button
            type="button"
            class="activity-toggle"
            :aria-expanded="!activityCollapsed"
            :aria-label="activityCollapsed ? t('common.expand') : t('common.collapse')"
            v-tip="activityCollapsed ? t('common.expand') : t('common.collapse')"
            @click="toggleActivityPanel"
          >{{ activityCollapsed ? '›' : '‹' }}</button>
          <span
            v-if="!activityCollapsed"
            class="column-resizer"
            role="separator"
            tabindex="0"
            aria-orientation="vertical"
            :aria-label="t('gantt.resizeActivityColumn')"
            :aria-valuemin="340"
            :aria-valuemax="700"
            :aria-valuenow="activityWidth"
            v-tip="t('gantt.resizeActivityColumn')"
            @pointerdown="startColumnResize"
            @dblclick="toggleActivityWidth"
            @keydown.left.prevent="adjustActivityWidth(-20)"
            @keydown.right.prevent="adjustActivityWidth(20)"
          />
        </div>
        <div class="timeline-head" :style="{ width: `${timelineWidth}px` }">
          <template v-if="scale === 'day'">
            <button
              v-for="day in timelineDays"
              :key="day"
              type="button"
              class="day-head"
              :class="{ weekend: weekendDays.includes(parseDate(day).getUTCDay()), today: day === today, selected: day === selectedDate }"
              :style="{ width: `${cellWidth}px` }"
              :aria-pressed="day === selectedDate"
              @click="selectedDate = day"
            >{{ dayLabel(day) }}</button>
          </template>
          <template v-else>
            <div
              v-for="month in monthGroups"
              :key="month.key"
              class="month-head"
              :style="{ width: `${month.count * cellWidth}px` }"
            >{{ month.label }}</div>
          </template>
        </div>

        <template v-for="(item, rowIndex) in visibleItems" :key="item.id">
          <div class="activity-row" :class="{ sub: item.parentId, macro: !item.parentId, compact: !item.parentId && collapsed.has(item.id), planned: !!rangeFor(item), alternate: rowIndex % 2 === 1 }">
            <div v-if="activityCollapsed" class="collapsed-controls cell-rail">
              <button type="button" class="status-pill" data-gantt-overlay-trigger :style="{ '--category-color': itemColor(item), '--status-color': ACTIVITY_STATUS_COLORS[statusFor(item)] }" :aria-label="t('gantt.changeStatus', { status: statusLabel(statusFor(item)) })" :aria-expanded="statusMenuId === item.id" v-tip="statusLabel(statusFor(item))" @click="openGanttOverlay($event, item, 'status')"><svg class="collapsed-status-icon" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.5" /><circle cx="10" cy="10" r="3" fill="currentColor" /></svg></button>
              <IconBtn v-if="!item.parentId" kind="add" class="rail-add" :label="t('gantt.addSubtask')" @click="addSubtask(item.id)" />
              <button v-else type="button" class="note-button" data-gantt-overlay-trigger :class="{ filled: item.notes.trim() }" :aria-label="t('gantt.editNote')" v-tip="t('gantt.editNote')" @click="openGanttOverlay($event, item, 'notes')"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 2.5h10v8l-3 3H3z"/><path d="M10 13.5v-3h3M5 5.5h6M5 8h4"/></svg></button>
              <button type="button" class="rail-button" data-gantt-overlay-trigger :aria-label="t('common.actions')" v-tip="t('common.actions')" @click="openGanttOverlay($event, item, 'actions')"><svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><circle cx="8" cy="3" r="1"/><circle cx="8" cy="8" r="1"/><circle cx="8" cy="13" r="1"/></svg></button>
            </div>
            <div class="activity-title">
              <button
                v-if="!item.parentId"
                type="button"
                class="chevron"
                :class="{ collapsed: collapsed.has(item.id) }"
                :aria-label="collapsed.has(item.id) ? t('common.expand') : t('common.collapse')"
                v-tip="collapsed.has(item.id) ? t('common.expand') : t('common.collapse')"
                @click="toggleMacro(item.id)"
              >
                <DisclosureIcon :expanded="!collapsed.has(item.id)" />
              </button>
              <span v-else class="chevron-spacer" />
              <input
                class="activity-name"
                :value="item.name"
                :aria-label="t('columns.name')"
                @input="updateItemName(item, ($event.target as HTMLInputElement).value)"
              />

            </div>
            <div class="activity-details">
              <span v-if="item.parentId" class="macro-name">{{ plannableItems.find((row) => row.id === item.parentId)?.name }}</span>
              <div class="row-actions cell-rail">

                <button type="button" class="status-pill" data-gantt-overlay-trigger :style="{ '--status-color': ACTIVITY_STATUS_COLORS[statusFor(item)] }" :aria-label="t('gantt.changeStatus', { status: statusLabel(statusFor(item)) })" :aria-expanded="statusMenuId === item.id" v-tip="statusLabel(statusFor(item))" @click="openGanttOverlay($event, item, 'status')">{{ statusLabel(statusFor(item)) }}</button>
                <IconBtn v-if="!item.parentId" kind="add" class="rail-add" :label="t('gantt.addSubtask')" @click="addSubtask(item.id)" />
                <button v-else type="button" class="note-button" data-gantt-overlay-trigger :class="{ filled: item.notes.trim() }" :aria-label="t('gantt.editNote')" v-tip="t('gantt.editNote')" @click="openGanttOverlay($event, item, 'notes')"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 2.5h10v8l-3 3H3z"/><path d="M10 13.5v-3h3M5 5.5h6M5 8h4"/></svg></button>
                <button type="button" class="rail-button" data-gantt-overlay-trigger :aria-label="t('common.actions')" v-tip="t('common.actions')" @click="openGanttOverlay($event, item, 'actions')"><svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><circle cx="8" cy="3" r="1"/><circle cx="8" cy="8" r="1"/><circle cx="8" cy="13" r="1"/></svg></button>
                <IconBtn kind="delete" :label="t('working.deleteItem')" @click="pendingDelete = item" />
              </div>
            </div>
          </div>

          <div
            class="timeline-row"
            :class="{ compact: !item.parentId && collapsed.has(item.id), planned: !!rangeFor(item), alternate: rowIndex % 2 === 1, schedulable: !rangeFor(item) && !hasChildren(item) }"
            :style="{ width: `${timelineWidth}px`, backgroundSize: `${cellWidth}px 100%` }"
            :title="!rangeFor(item) && !hasChildren(item) ? t('gantt.doubleClickHint') : undefined"
            @dblclick="scheduleFromCell($event, item)"
          >
            <template v-if="scale === 'day'">
              <div v-for="column in weekendColumns" :key="column" class="weekend-column" :style="{ left: column * cellWidth + 'px', width: cellWidth + 'px' }" />
            </template>
            <div v-if="todayIndex >= 0" class="today-line" :style="{ left: `${todayIndex * cellWidth}px` }" />
            <div v-if="selectedDateIndex >= 0" class="selected-day" :style="{ left: `${selectedDateIndex * cellWidth}px`, width: `${cellWidth}px` }" />
            <div
              v-if="rangeFor(item)"
              class="gantt-bar"
              :class="{ aggregate: hasChildren(item), sub: item.parentId, dragging: draggingItemId === item.id || (!!draggingItemId && item.parentId === draggingItemId), selected: selectedItemId === item.id }" role="button" tabindex="0" data-gantt-overlay-trigger :aria-label="item.name" @click.stop="onBarClick($event, item)" @keydown.enter.prevent="openGanttOverlay($event, item, 'actions')" @keydown.space.prevent="openGanttOverlay($event, item, 'actions')"
              :style="{ ...barStyle(rangeFor(item)!), '--bar-color': itemColor(item), '--bar-text': itemTextColor(item) }"
              @pointerdown="startDrag($event, item, 'move')"
            >
              <span v-if="!hasChildren(item)" class="handle start" @pointerdown.stop="startDrag($event, item, 'start')" />
              <span class="bar-label">{{ item.name }}</span>
              <span v-if="!hasChildren(item)" class="handle end" @pointerdown.stop="startDrag($event, item, 'end')" />
            </div>
          </div>
        </template>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="activeOverlayItem && (statusMenuId || notesEditId || dateEditorId || actionsMenuId)" class="gantt-overlay" data-gantt-overlay :class="[overlayPosition.placement, { 'status-overlay': statusMenuId, 'actions-overlay': actionsMenuId, 'dates-overlay': dateEditorId, 'notes-overlay': notesEditId }]" :style="{ top: `${overlayPosition.top}px`, left: `${overlayPosition.left}px` }">
        <div v-if="statusMenuId" class="status-menu" role="menu">
          <p v-if="hasChildren(activeOverlayItem)" class="status-aggregate">{{ t('gantt.calculatedStatus') }}</p>
          <button v-for="status in ACTIVITY_STATUSES.filter(value => !settings.settings.ganttDisabledStatuses.some(disabled => disabled === value))" :key="status" type="button" role="menuitemradio" :aria-checked="statusFor(activeOverlayItem) === status" :disabled="hasChildren(activeOverlayItem)" @click="setStatus(activeOverlayItem, status)"><span :style="{ background: ACTIVITY_STATUS_COLORS[status] }" />{{ statusLabel(status) }}</button>
        </div>
        <div v-else-if="notesEditId" class="note-popover">
          <strong>{{ activeOverlayItem.name }}</strong>
          <textarea :aria-label="t('working.notesPh')" v-model="notesDraft" rows="5" :placeholder="t('working.notesPh')" autofocus @keydown.ctrl.enter.prevent="saveNotes(activeOverlayItem)" @keydown.meta.enter.prevent="saveNotes(activeOverlayItem)" />
          <div><button type="button" class="ghost" @click="closeGanttOverlay()">{{ t('common.cancel') }}</button><button type="button" class="primary" @click="saveNotes(activeOverlayItem)">{{ t('common.save') }}</button></div>
        </div>
        <div v-else-if="dateEditorId" class="date-editor">
          <template v-if="hasChildren(activeOverlayItem)">
            <label>{{ t('gantt.startDate') }}<input type="date" :value="rangeFor(activeOverlayItem)?.startDate ?? ''" readonly /></label>
            <label>{{ t('gantt.endDate') }}<input type="date" :value="rangeFor(activeOverlayItem)?.endDate ?? ''" readonly /></label>
            <p class="macro-dates-hint">{{ t(rangeFor(activeOverlayItem) ? 'gantt.macroDatesHint' : 'gantt.unscheduled') }}</p>
          </template>
          <template v-else>
            <label>{{ t('gantt.startDate') }}<input type="date" v-model="startDateDraft" :max="endDateDraft || undefined" /></label>
            <label>{{ t('gantt.endDate') }}<input type="date" v-model="endDateDraft" :min="startDateDraft || undefined" /></label>
            <div class="date-editor-actions"><button type="button" class="ghost" @click="closeGanttOverlay()">{{ t('common.cancel') }}</button><button type="button" class="primary" :disabled="!startDateDraft || !endDateDraft || endDateDraft < startDateDraft" @click="onSaveDates(activeOverlayItem)">{{ t('common.save') }}</button></div>
            <button v-if="rangeFor(activeOverlayItem)" type="button" class="ghost" @click="setRange(activeOverlayItem, null); closeGanttOverlay()">{{ t('gantt.clearDates') }}</button>
          </template>
        </div>
        <div v-else class="actions-menu" role="menu">
          <header class="actions-summary">
            <strong>{{ activeOverlayItem.name }}</strong>
            <small v-if="activeOverlayItem.parentId">{{ plannableItems.find((item) => item.id === activeOverlayItem?.parentId)?.name }}</small>
            <dl>
              <div><dt>{{ t('common.base') }}</dt><dd>{{ formatHours(activeOverlayHours?.hoursBase) }}</dd></div>
              <div><dt>{{ t('common.ctg') }}</dt><dd>{{ formatHours(activeOverlayHours?.hoursContingency) }}</dd></div>
              <div><dt>{{ t('common.withCtg') }}</dt><dd>{{ formatHours(activeOverlayHours?.hoursWithContingency) }}</dd></div>
            </dl>
          </header>
          <label class="color-picker" :style="{ '--status-color': ACTIVITY_STATUS_COLORS[statusFor(activeOverlayItem)] }"><span>{{ t('gantt.color') }}</span><input type="color" :value="itemColor(activeOverlayItem)" :aria-label="t('gantt.color')" @input="setItemColor(activeOverlayItem, ($event.target as HTMLInputElement).value)" /></label>
          <button type="button" @click="openGanttOverlay($event, activeOverlayItem, 'dates')">{{ t(rangeFor(activeOverlayItem) ? 'gantt.editDates' : 'gantt.scheduleActivity') }}</button>
          <button type="button" @click="openGanttOverlay($event, activeOverlayItem, 'notes')">{{ t('gantt.editNote') }}</button>
          <button type="button" class="delete-action" @click="pendingDelete = activeOverlayItem; closeGanttOverlay()">{{ t('working.deleteItem') }}</button>
        </div>
      </div>
    </Teleport>

    <ConfirmModal
      :open="pendingDelete != null"
      :title="t('working.deleteTitle')"
      :message="pendingDelete?.parentId == null
        ? t('working.deleteBodyMacro', { name: pendingDelete?.name ?? '' })
        : t('working.deleteBody', { name: pendingDelete?.name ?? '' })"
      :confirm-label="t('working.deleteConfirm')"
      danger
      @cancel="pendingDelete = null"
      @confirm="confirmDelete"
    />
  </section>

  <section v-else class="gantt-empty">
    <p>{{ t('gantt.noEstimate') }}</p>
    <div class="empty-actions">
      <div class="new-estimate-menu">
        <div class="new-estimate-split">
          <button type="button" class="primary new-estimate-main" @click="createEstimate()">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M8 2.5v11M2.5 8h11" />
            </svg>
            {{ t('welcome.newEstimate') }}
          </button>
          <button type="button" class="primary new-estimate-caret" :aria-expanded="newMenuOpen" :aria-label="t('working.pickModel')" @click.stop="newMenuOpen = !newMenuOpen">▾</button>
        </div>
        <div v-if="newMenuOpen" class="model-menu" role="menu" @pointerdown.stop>
          <input v-model="modelSearch" type="search" :placeholder="t('working.searchModel')" />
          <button v-for="model in filteredModels" :key="model.id" type="button" role="menuitem" @click="createEstimateFromModel(model.id)">
            <span class="model-name">{{ model.name }}</span>
            <span v-if="modelsStore.isDefault(model.id)" class="badge">{{ t('common.default') }}</span>
          </button>
          <p v-if="filteredModels.length === 0">{{ t('working.noModels') }}</p>
        </div>
      </div>
      <button type="button" class="ghost" @click="ui.navigate('library')">{{ t('gantt.openLibrary') }}</button>
    </div>
  </section>
</template>

<style scoped>
.gantt-view { min-height: 100%; padding-bottom: 2rem; }
.gantt-head { display: flex; justify-content: flex-end; margin-bottom: .8rem; }
.gantt-empty p { margin: 0 0 1rem; color: var(--muted); font-size: 1rem; }
.gantt-controls, .gantt-actions { display: flex; align-items: center; gap: .55rem; flex-wrap: wrap; }
.gantt-controls .range-field { align-items: flex-start; gap: .25rem; color: var(--muted); font-size: .68rem; font-weight: 600; line-height: 1; text-transform: uppercase; letter-spacing: .06em; }
.gantt-controls .range-field input[type='date'] { width: 9.4rem; height: 2.35rem; padding: .45rem .65rem; color: var(--ink); font-size: .8rem; letter-spacing: 0; text-transform: none; }
.gantt-controls .weekend-toggle { display: flex; align-items: center; gap: .4rem; color: var(--muted); font-size: .76rem; }
.weekend-toggle { text-transform: none !important; letter-spacing: 0 !important; }
.segmented { display: inline-flex; padding: 2px; border: 1px solid var(--line); border-radius: var(--radius-sm); }
.segmented button { border: 0; background: transparent; padding: .42rem .68rem; color: var(--muted); }
.segmented button.active { background: var(--accent-subtle); color: var(--accent); }
.gantt-actions { justify-content: flex-end; margin-bottom: .55rem; }
.gantt-help { margin-right: auto; color: var(--muted); font-size: .76rem; }
.gantt-shell { overflow: auto; border: 1px solid var(--line-strong); border-radius: var(--radius); background: var(--page-soft); max-height: calc(100vh - 245px); box-shadow: var(--shadow-soft); }
.gantt-grid { display: grid; grid-template-columns: var(--activity-w) var(--timeline-w); width: max-content; min-width: 100%; }
.activity-head, .timeline-head { position: sticky; top: 0; z-index: 4; height: 48px; background: var(--table-head); border-bottom: 1px solid var(--line-strong); }
.activity-head { left: 0; z-index: 6; padding: .55rem .7rem; font-weight: 650; border-right: 1px solid var(--line); }
.activity-toggle { position: absolute; top: 50%; right: .45rem; z-index: 2; display: grid; place-items: center; width: 1.75rem; height: 1.75rem; padding: 0; transform: translateY(-50%); border-color: transparent; background: color-mix(in srgb, var(--surface) 85%, transparent); color: var(--muted); }
.activity-toggle:hover { border-color: var(--line); background: var(--surface); color: var(--ink); }
.activity-head .estimate-title-input { padding-right: 2.5rem; }
.gantt-grid.activity-collapsed .activity-head { padding: 0; }
.gantt-grid.activity-collapsed .activity-toggle { right: 50%; transform: translate(50%, -50%); }
.gantt-grid.activity-collapsed .estimate-title-input,
.gantt-grid.activity-collapsed .activity-row > :not(.collapsed-controls) { display: none; }
.gantt-grid.activity-collapsed .activity-row { display: grid; place-items: center; padding: 0; }
.collapsed-controls { display: flex; align-items: center; gap: .2rem; }
.gantt-grid.activity-collapsed .collapsed-controls { flex-direction: row; justify-content: center; gap: .15rem; }
.gantt-grid.activity-collapsed .collapsed-controls .rail-button,
.gantt-grid.activity-collapsed .collapsed-controls .note-button { width: 1.15rem; min-height: 1.15rem; height: 1.15rem; }
.column-resizer { position: absolute; inset-block: 0; right: -5px; width: 10px; cursor: col-resize; touch-action: none; }
.column-resizer::after { content: ''; position: absolute; inset-block: 9px; left: 4px; width: 2px; border-radius: 2px; background: var(--line-strong); opacity: 0; transition: opacity .15s; }
.column-resizer:hover::after, .column-resizer:focus::after { opacity: 1; background: var(--accent); }
.estimate-title-input, .activity-name { min-width: 0; min-height: 2.2rem; padding: .45rem .4rem; border: 1px solid transparent; border-radius: var(--radius-sm); background: transparent; color: var(--ink); font: inherit; }
.estimate-title-input { width: 100%; font-size: .88rem; font-weight: 650; }
.estimate-title-input:hover, .activity-name:hover { border-color: transparent; background: var(--page-soft); }
.estimate-title-input:focus, .activity-name:focus { border-color: var(--line-strong); background: var(--surface); outline: none; box-shadow: 0 0 0 3px var(--accent-glow); }
.timeline-head { display: flex; }
.day-head, .month-head { flex: 0 0 auto; display: grid; place-items: center; padding: 0; border: 0; border-right: 1px solid var(--line); border-radius: 0; background: transparent; color: var(--muted); font-size: .64rem; font-weight: 400; text-transform: capitalize; overflow: hidden; white-space: nowrap; }
.day-head:hover { background: var(--accent-subtle); color: var(--ink); }
.day-head.today { color: var(--accent); background: var(--accent-subtle); font-weight: 700; }
.day-head.selected { color: var(--on-accent); background: var(--accent); font-weight: 700; }
.activity-row { display: flex; flex-direction: column; justify-content: center; position: sticky; left: 0; z-index: 3; height: 64px; padding: .55rem .45rem; background: var(--surface); border-right: 1px solid var(--line-strong); border-bottom: 1px solid var(--line); }
.activity-row.compact { height: 46px; padding-block: .45rem; }
.activity-row.compact .date-fields { position: absolute; top: 50%; right: .7rem; transform: translateY(-50%); margin: 0; padding: 0; }
.activity-row.compact .activity-title { padding-right: 4.2rem; }
.activity-row.compact .dates, .activity-row.compact .color-picker, .activity-row.compact .note-button, .activity-row.compact .row-actions > .icon-btn:not(.rail-add) { display: none; }
.activity-row.compact .row-actions.cell-rail { position: static; flex-direction: row; transform: none; }
.activity-row.compact .status-pill { width: 1.85rem; padding: 0; font-size: 0; }
.activity-row.compact .status-pill > span { width: .7rem; height: .7rem; }
.activity-row.compact .status-pill small { display: none; }
.activity-row.alternate { background: color-mix(in srgb, var(--page-soft) 72%, var(--surface)); }
.activity-row.sub { padding-left: 1.15rem; }
.activity-title { display: flex; align-items: center; min-width: 0; gap: .25rem; }
.activity-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .88rem; font-weight: 600; }
.activity-row.sub .activity-name { font-weight: 500; }
.macro-name { flex: 0 1 auto; margin-left: auto; max-width: 30%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); font-size: .65rem; }
.chevron, .chevron-spacer { width: 1.25rem; flex: 0 0 1.25rem; }
.chevron { display: grid; place-items: center; height: 1.5rem; padding: 0; border: 1px solid transparent; border-radius: var(--radius-sm); background: transparent; color: var(--muted); }
.chevron:hover { border-color: var(--line); background: var(--page-soft); color: var(--ink); }
.date-fields { display: flex; align-items: center; justify-content: space-between; gap: .6rem; margin-top: .3rem; padding-left: 1.9rem; }
.dates, .row-actions { display: flex; align-items: center; gap: .3rem; min-width: 0; }
.row-actions { flex: 0 0 auto; }
.activity-row .cell-rail { flex-direction: column; gap: .2rem; }
.activity-row .row-actions.cell-rail { position: absolute; top: 50%; right: .55rem; transform: translateY(-50%); }
.activity-row:not(.compact) .date-fields { padding-right: 1.85rem; }
.activity-row:not(.compact) .activity-title { padding-right: 1.85rem; }
.activity-row .cell-rail .status-pill,
.activity-row .cell-rail .note-button,
.activity-row .cell-rail .rail-button,
.activity-row .cell-rail .rail-add { width: 1.15rem; min-width: 1.15rem; min-height: 1.15rem; height: 1.15rem; padding: 0; }
.activity-row .cell-rail .status-pill { font-size: 0; }
.activity-row .cell-rail .status-pill > span { width: .55rem; height: .55rem; }
.activity-row .cell-rail .status-pill small { position: absolute; right: -.15rem; bottom: -.2rem; font-size: .5rem; }
.activity-row .cell-rail .note-button svg { width: 12px; height: 12px; }
.status-pill, .note-button { display: inline-flex; align-items: center; justify-content: center; gap: .35rem; min-height: 1.85rem; padding: .25rem .45rem; border: 1px solid transparent; border-radius: var(--radius-sm); background: transparent; color: var(--muted); font-size: .72rem; cursor: pointer; }
.status-pill:hover, .note-button:hover { border-color: var(--line); background: var(--page-soft); color: var(--ink); }
.status-pill > span { width: .55rem; height: .55rem; border-radius: 50%; background: var(--status-color); }
.status-pill small { font-size: .75rem; }
.note-button { width: 1.85rem; padding: 0; }
.note-button.filled { color: var(--accent); background: var(--accent-subtle); }
.rail-button { display: inline-grid; place-items: center; width: 1.85rem; height: 1.85rem; padding: 0; border: 1px solid transparent; border-radius: var(--radius-sm); background: transparent; color: var(--muted); cursor: pointer; }
.rail-button:hover:not(:disabled) { border-color: var(--line); background: var(--page-soft); color: var(--ink); }
.rail-button:disabled { color: var(--muted); cursor: default; opacity: .65; }
.row-actions .color-picker, .row-actions > .icon-btn:not(.rail-add) { display: none; }
.gantt-overlay { position: fixed; z-index: 100; width: min(280px, calc(100vw - 16px)); max-height: calc(100vh - 16px); overflow: auto; padding: .45rem; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); box-shadow: var(--shadow-menu); }
.status-menu, .note-popover, .date-editor, .actions-menu { color: var(--ink); }
.gantt-overlay.status-overlay, .gantt-overlay.actions-overlay { width: max-content; max-width: calc(100vw - 16px); }
.status-menu { width: max-content; max-width: 100%; }
.status-menu button { display: flex; align-items: center; gap: .45rem; width: 100%; padding: .35rem .45rem; border: 0; background: transparent; color: var(--ink); text-align: left; font-size: .75rem; }
.status-menu button:hover:not(:disabled) { background: var(--page-soft); }
.status-menu button[aria-checked='true'] { background: var(--accent); color: var(--on-accent); font-weight: 700; }
.status-menu button:disabled { opacity: .6; }
.status-menu button[aria-checked='true']:hover { background: var(--accent); }
.status-menu button[aria-checked='true']:disabled { opacity: 1; }
.status-menu button span { flex: 0 0 .6rem; width: .6rem; height: .6rem; border-radius: 50%; }
.status-aggregate { width: 0; min-width: 100%; white-space: normal; margin: .1rem .35rem .35rem; color: var(--muted); font-size: .68rem; }
.note-popover { width: 100%; min-width: 0; }
.note-popover strong { display: block; margin: .2rem .25rem .4rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .78rem; }
.note-popover textarea { width: 100%; resize: vertical; }
.note-popover > div { display: flex; justify-content: flex-end; gap: .35rem; margin-top: .35rem; }
.gantt-overlay.dates-overlay { width: min(10.5rem, calc(100vw - 16px)); }
.date-editor { display: grid; gap: .45rem; }
.date-editor label { display: grid; gap: .2rem; color: var(--muted); font-size: .72rem; }
.date-editor input { width: 100%; min-width: 0; font-size: .72rem; padding: .25rem .35rem; }
.date-editor button { padding: .3rem .45rem; font-size: .72rem; }
.date-editor-actions { display: flex; justify-content: flex-end; gap: .35rem; }
.macro-dates-hint { margin: 0; color: var(--muted); font-size: .72rem; }
.actions-menu { display: grid; gap: .2rem; }
.actions-menu .color-picker { display: flex; width: auto; height: auto; justify-content: flex-start; gap: .55rem; padding: .35rem .45rem; }
.actions-menu .color-picker span { color: var(--ink); font-size: .75rem; }
.actions-menu .color-picker span, .actions-menu button { font-family: inherit; font-size: .75rem; font-weight: 400; font-style: normal; line-height: 1.5; letter-spacing: normal; text-transform: none; }
.actions-menu button { padding: .35rem .45rem; border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--ink); text-align: left; font-size: .75rem; }
.actions-menu button:hover { background: var(--page-soft); }
.actions-menu .delete-action:hover { color: var(--danger); background: var(--danger-soft); }
.date-fields input[type='date'] { width: 7.75rem; height: 1.75rem; padding: .2rem .35rem; font-size: .68rem; }
.date-fields input:disabled { opacity: .75; }
.gantt-grid.narrow .date-fields { gap: .25rem; }
.gantt-grid.narrow .inline-dates { display: none; }
.gantt-grid.narrow .dates { gap: .18rem; }
.gantt-grid.narrow .row-actions { gap: .1rem; }
.gantt-grid.narrow .status-pill { width: 1.85rem; padding: 0; font-size: 0; }
.gantt-grid.narrow .status-pill small { display: none; }
.gantt-grid.narrow .date-fields input[type='date'] { width: 5.75rem; padding-inline: .25rem; }
.gantt-grid.narrow .macro-name { max-width: 25%; }
.date-separator { color: var(--muted); }
.color-picker { display: grid; place-items: center; width: 1.8rem; height: 1.8rem; border-radius: var(--radius-sm); }
.color-picker:hover { background: var(--page-soft); }
.color-picker input { width: 1rem; height: 1rem; padding: 0; border: 0; border-radius: 50%; background: transparent; cursor: pointer; }
.color-picker input::-webkit-color-swatch-wrapper { padding: 0; }
.color-picker input::-webkit-color-swatch { border: 2px solid var(--surface); border-radius: 50%; box-shadow: 0 0 0 2px var(--status-color); }
.schedule { border: 0; background: transparent; color: var(--accent); padding: .2rem; font-size: .68rem; }
.schedule:disabled { color: var(--muted); cursor: not-allowed; opacity: .55; }
.timeline-row { position: relative; height: 64px; border-bottom: 1px solid var(--line); background-color: color-mix(in srgb, var(--page-soft) 84%, var(--surface)); background-image: linear-gradient(to right, color-mix(in srgb, var(--line) 72%, transparent) 1px, transparent 1px); background-position-x: -1px; }
.timeline-row.compact { height: 46px; }
.timeline-row.planned:not(.compact) .gantt-bar { top: 18px; }
.timeline-row.compact .gantt-bar { top: 9px; }
.gantt-grid.activity-collapsed .activity-row,
.gantt-grid.activity-collapsed .timeline-row { height: 46px; }
.gantt-grid.activity-collapsed .timeline-row .gantt-bar { top: 9px; }
.timeline-row.alternate { background-color: var(--surface); }
.timeline-row.schedulable { cursor: cell; }
.today-line { position: absolute; inset-block: 0; width: 2px; background: var(--accent); opacity: .45; pointer-events: none; }
.selected-day { position: absolute; inset-block: 0; background: color-mix(in srgb, var(--accent) 10%, transparent); pointer-events: none; }
.gantt-bar { position: absolute; top: 24px; height: 28px; display: flex; align-items: center; border-radius: 6px; color: var(--bar-text); background: var(--bar-color); cursor: grab; touch-action: none; user-select: none; overflow: hidden; box-shadow: 0 2px 7px color-mix(in srgb, var(--bar-color) 28%, transparent); }
.gantt-bar:active { cursor: grabbing; }
.gantt-bar.sub { opacity: .82; }
.gantt-bar.aggregate { cursor: default; }
.bar-label { padding: 0 .55rem; font-size: .7rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; pointer-events: none; }
.handle { position: absolute; top: 0; bottom: 0; width: 8px; cursor: ew-resize; }
.handle.start { left: 0; }
.handle.end { right: 0; }
.gantt-empty { display: grid; place-content: center; justify-items: center; min-height: 100%; padding: 2rem; text-align: center; }
.empty-actions { display: flex; justify-content: center; gap: .55rem; }
.new-estimate-menu { position: relative; }
.new-estimate-split { display: flex; }
.new-estimate-main { display: flex; align-items: center; gap: .4rem; border-radius: var(--radius-sm) 0 0 var(--radius-sm); border-right: 1px solid color-mix(in srgb, var(--on-accent) 35%, transparent); }
.new-estimate-caret { min-width: 2.1rem; padding-inline: .45rem; border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
.model-menu { position: absolute; top: calc(100% + .4rem); left: 0; z-index: 40; width: 280px; padding: .5rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow-menu); }
.model-menu input { width: 100%; margin-bottom: .4rem; }
.model-menu button { display: flex; align-items: center; justify-content: space-between; gap: .5rem; width: 100%; min-width: 0; padding: .5rem .65rem; border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--ink); text-align: left; }
.model-menu button:hover { background: var(--accent-subtle); }
.model-menu p { margin: .4rem; color: var(--muted); }
.model-menu .model-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.badge { flex-shrink: 0; padding: .12rem .4rem; border-radius: 999px; background: var(--accent); color: var(--on-accent); font-size: .65rem; text-transform: uppercase; }
@media (max-width: 900px) {
  .gantt-head { justify-content: flex-start; }
  .gantt-grid { grid-template-columns: 360px var(--timeline-w); }
  .gantt-grid.activity-collapsed { grid-template-columns: var(--activity-w) var(--timeline-w); }
}
.activity-details { display: flex; align-items: center; gap: .5rem; padding-left: 1.9rem; min-width: 0; }
.activity-details .macro-name { margin: 0 auto 0 0; max-width: 45%; font-size: .65rem; }
.activity-row .activity-details .row-actions.cell-rail { position: static; flex-direction: row; transform: none; margin-left: auto; gap: .35rem; }
.activity-row:not(.compact) .activity-title, .activity-row.compact .activity-title { padding-right: 0; }
.activity-row.compact, .timeline-row.compact { height: 64px; }
.timeline-row.compact .gantt-bar { top: 18px; }
.activity-row .cell-rail .status-pill, .gantt-grid.narrow .status-pill { width: auto; min-width: 0; height: auto; min-height: 1.2rem; padding: .12rem .4rem; font-size: .64rem; line-height: 1.2; white-space: nowrap; border-radius: 999px; border: 1px solid var(--status-color); color: var(--status-color); background: color-mix(in srgb, var(--status-color) 8%, var(--surface)); }
.activity-row.compact .note-button { display: inline-flex; }
.actions-summary { max-width: 18rem; padding: .35rem .45rem .5rem; border-bottom: 1px solid var(--line); }
.actions-summary strong, .actions-summary small { display: block; overflow-wrap: anywhere; }
.actions-summary strong { font-size: .78rem; }
.actions-summary small { margin-top: .15rem; font-size: .65rem; color: var(--muted); }
.actions-summary dl { display: flex; gap: .8rem; margin: .5rem 0 0; font-size: .65rem; }
.actions-summary dt { color: var(--muted); }
.actions-summary dd { margin: .15rem 0 0; font-weight: 600; }
.gantt-bar.selected { outline: 2px solid var(--accent); outline-offset: 2px; }
.gantt-bar.dragging { outline: 2px solid var(--accent); outline-offset: 3px; filter: brightness(1.12); box-shadow: 0 4px 12px var(--accent); z-index: 5; }

.gantt-overlay.notes-overlay { width: min(320px, calc(100vw - 16px)); padding: .75rem; }
.note-popover strong { margin: 0 0 .6rem; white-space: normal; overflow-wrap: anywhere; font-size: .85rem; line-height: 1.4; font-weight: 600; }
.note-popover textarea { display: block; box-sizing: border-box; width: 100%; min-height: 8rem; padding: .55rem .65rem; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); color: var(--ink); font-family: inherit; font-size: .8rem; line-height: 1.5; }
.note-popover textarea:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
.note-popover textarea::placeholder { color: var(--muted); }
.note-popover > div { gap: .4rem; margin-top: .65rem; }
.note-popover button { padding: .35rem .65rem; font-family: inherit; font-size: .75rem; line-height: 1.4; }
.gantt-grid.activity-collapsed .collapsed-controls .status-pill { flex: 0 0 1.4rem; width: 1.4rem; height: 1.4rem; min-height: 1.4rem; padding: 0; border: 0; background: transparent; }
.collapsed-status-icon { display: block; flex: none; }

.activity-head { display: flex; align-items: center; gap: .65rem; }
.activity-head .estimate-title-input { flex: 1; width: 0; padding-right: .4rem; }
.activity-head .activity-toggle { position: static; flex: 0 0 1.75rem; transform: none; }
.gantt-grid.activity-collapsed .activity-head { justify-content: center; }
.gantt-grid.activity-collapsed .activity-toggle { transform: none; }
.day-head.weekend:not(.selected) { background: color-mix(in srgb, var(--accent) 14%, var(--surface)); }
.weekend-column { position: absolute; top: 0; bottom: 0; background: color-mix(in srgb, var(--accent) 9%, transparent); pointer-events: none; }
</style>
