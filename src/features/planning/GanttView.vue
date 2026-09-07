<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useDocumentsStore } from '../../shared/documents';
import { useEstimateStore } from '../estimate/estimate';
import { useUiStore } from '../../app/ui';
import { useSettingsStore } from '../settings/settings';
import { useLibraryStore } from '../library/library';
import DisclosureIcon from '../../shared/components/DisclosureIcon.vue';
import { useModelsStore } from '../models/models';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../app/i18n/useI18n';
import type { LineItem, PlanningRange } from '../../models/estimate';
import {
  addDays,
  addMonths,
  aggregateMacroRange,
  formatDate,
  listDays,
  monthEnd,
  monthStart,
  parseDate,
} from '../../domain/gantt';
import { exportGanttXlsx } from '../../platform/files/io';
import { toErrorMessage } from '../../shared/errors';
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
const library = useLibraryStore();
const modelsStore = useModelsStore();
const { defaultModel, models } = storeToRefs(modelsStore);
const { t, locale } = useI18n();
const scale = ref<Scale>('day');
const showWeekends = ref(true);
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
const activityWidth = ref(500);
const activityCollapsed = ref(false);
const activityColumnWidth = computed(() => activityCollapsed.value ? 42 : activityWidth.value);

const filteredModels = computed(() => {
  const query = modelSearch.value.trim().toLowerCase();
  return models.value.filter((model) => model.name.toLowerCase().includes(query));
});

function closeNewMenu() {
  newMenuOpen.value = false;
  modelSearch.value = '';
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!(event.target as HTMLElement | null)?.closest('.new-estimate-menu')) closeNewMenu();
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

/** Persist the Gantt estimate and synchronize its saved state. */
async function saveEstimate() {
  try {
    const { path, data } = await library.saveEstimate(estimate.estimate);
    documentSync.applySaved(path, data);
    ui.notify(t('working.saved', { path }));
  } catch (error) {
    ui.notify(toErrorMessage(error), true);
  }
}

/** Handle Gantt shortcuts for history, saving, and new tabs. */
function onGanttKeydown(event: KeyboardEvent) {
  if ((!event.ctrlKey && !event.metaKey) || event.altKey) return;
  const key = event.key.toLowerCase();
  const historyAction = key === 'z' && !event.shiftKey
    ? 'undo'
    : (key === 'y' && event.ctrlKey && !event.shiftKey) || (key === 'z' && event.metaKey && event.shiftKey)
      ? 'redo'
      : null;
  if (historyAction) {
    event.preventDefault();
    documentSync.restoreHistory(historyAction);
    return;
  }
  if (event.shiftKey) return;
  if (key !== 's' && key !== 't') return;
  event.preventDefault();
  if (key === 's') {
    void saveEstimate();
    return;
  }
  const model = defaultModel.value ?? models.value[0] ?? null;
  if (!model) {
    ui.notify(t('working.noModelAvail'), true);
    return;
  }
  modelsStore.selectedId = model.id;
  docs.createFromModel(model);
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown);
  window.addEventListener('keydown', onGanttKeydown);
});
onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown);
  window.removeEventListener('keydown', onGanttKeydown);
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

function setStart(item: LineItem, value: string) {
  if (!value) return setRange(item, null);
  const current = rangeFor(item);
  setRange(item, { startDate: value, endDate: current?.endDate && current.endDate >= value ? current.endDate : value });
}

function setEnd(item: LineItem, value: string) {
  if (!value) return setRange(item, null);
  const current = rangeFor(item);
  setRange(item, { startDate: current?.startDate && current.startDate <= value ? current.startDate : value, endDate: value });
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

function startDrag(event: PointerEvent, item: LineItem, mode: DragMode) {
  const range = rangeFor(item);
  if (!range || hasChildren(item)) return;
  event.preventDefault();
  const target = event.currentTarget as HTMLElement;
  target.setPointerCapture(event.pointerId);
  const originX = event.clientX;
  const initial = { ...range };
  let lastDelta = 0;

  function onMove(moveEvent: PointerEvent) {
    const delta = Math.round((moveEvent.clientX - originX) / cellWidth.value);
    if (delta === lastDelta) return;
    lastDelta = delta;
    if (mode === 'move') {
      setRange(item, { startDate: addDays(initial.startDate, delta), endDate: addDays(initial.endDate, delta) });
    } else if (mode === 'start') {
      const startDate = addDays(initial.startDate, delta);
      setRange(item, { startDate: startDate <= initial.endDate ? startDate : initial.endDate, endDate: initial.endDate });
    } else {
      const endDate = addDays(initial.endDate, delta);
      setRange(item, { startDate: initial.startDate, endDate: endDate >= initial.startDate ? endDate : initial.startDate });
    }
  }

  function onUp() {
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
              :class="{ today: day === today, selected: day === selectedDate }"
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
            <label
              v-if="activityCollapsed"
              class="collapsed-row-marker"
              :style="{ background: itemColor(item) }"
              v-tip="t('gantt.color')"
            >
              <input
                type="color"
                :value="itemColor(item)"
                :aria-label="t('gantt.color')"
                @input="setItemColor(item, ($event.target as HTMLInputElement).value)"
              />
            </label>
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
              <span v-if="item.parentId" class="macro-name">{{ plannableItems.find((row) => row.id === item.parentId)?.name }}</span>
              <span v-if="!item.parentId && collapsed.has(item.id)" class="compact-color" :style="{ background: itemColor(item) }" aria-hidden="true" />
            </div>
            <div class="date-fields">
              <div class="dates">
                <template v-if="rangeFor(item)">
                  <input type="date" :aria-label="t('gantt.startDate')" :value="rangeFor(item)?.startDate" :disabled="hasChildren(item)" @change="setStart(item, ($event.target as HTMLInputElement).value)" />
                  <span class="date-separator">–</span>
                  <input type="date" :aria-label="t('gantt.endDate')" :value="rangeFor(item)?.endDate" :disabled="hasChildren(item)" @change="setEnd(item, ($event.target as HTMLInputElement).value)" />
                  <IconBtn v-if="!hasChildren(item)" kind="clear" :label="t('gantt.clearDates')" @click="setRange(item, null)" />
                </template>
                <button v-else type="button" class="schedule" :disabled="hasChildren(item)" :title="hasChildren(item) ? t('gantt.macroDatesHint') : undefined" @click="setRange(item, { startDate: selectedDate, endDate: selectedDate })">{{ t('gantt.unscheduled') }}</button>
              </div>
              <div class="row-actions">
                <label class="color-picker" v-tip="t('gantt.color')">
                  <input type="color" :value="itemColor(item)" :aria-label="t('gantt.color')" @input="setItemColor(item, ($event.target as HTMLInputElement).value)" />
                </label>
                <IconBtn v-if="!item.parentId" kind="add" :label="t('gantt.addSubtask')" @click="addSubtask(item.id)" />
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
            <div v-if="todayIndex >= 0" class="today-line" :style="{ left: `${todayIndex * cellWidth}px` }" />
            <div v-if="selectedDateIndex >= 0" class="selected-day" :style="{ left: `${selectedDateIndex * cellWidth}px`, width: `${cellWidth}px` }" />
            <div
              v-if="rangeFor(item)"
              class="gantt-bar"
              :class="{ aggregate: hasChildren(item), sub: item.parentId }"
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
            <span>{{ model.name }}</span>
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
.gantt-grid.activity-collapsed .activity-row > :not(.collapsed-row-marker) { display: none; }
.gantt-grid.activity-collapsed .activity-row { display: grid; place-items: center; padding: 0; }
.collapsed-row-marker { position: relative; width: .65rem; height: .65rem; border-radius: 50%; cursor: pointer; box-shadow: 0 0 0 2px var(--surface), 0 0 0 3px var(--line-strong); }
.collapsed-row-marker:hover { box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--accent); }
.collapsed-row-marker:focus-within { outline: 2px solid var(--accent); outline-offset: 4px; }
.collapsed-row-marker input { position: absolute; inset: -8px; width: calc(100% + 16px); height: calc(100% + 16px); padding: 0; opacity: 0; cursor: pointer; }
.column-resizer { position: absolute; inset-block: 0; right: -5px; width: 10px; cursor: col-resize; touch-action: none; }
.column-resizer::after { content: ''; position: absolute; inset-block: 9px; left: 4px; width: 2px; border-radius: 2px; background: var(--line-strong); opacity: 0; transition: opacity .15s; }
.column-resizer:hover::after, .column-resizer:focus::after { opacity: 1; background: var(--accent); }
.estimate-title-input, .activity-name { min-width: 0; min-height: 2.2rem; padding: .45rem .4rem; border: 1px solid transparent; border-radius: var(--radius-sm); background: transparent; color: var(--ink); font: inherit; }
.estimate-title-input { width: 100%; font-weight: 650; }
.estimate-title-input:hover, .activity-name:hover { border-color: transparent; background: var(--page-soft); }
.estimate-title-input:focus, .activity-name:focus { border-color: var(--line-strong); background: var(--surface); outline: none; box-shadow: 0 0 0 3px var(--accent-glow); }
.timeline-head { display: flex; }
.day-head, .month-head { flex: 0 0 auto; display: grid; place-items: center; padding: 0; border: 0; border-right: 1px solid var(--line); border-radius: 0; background: transparent; color: var(--muted); font-size: .68rem; font-weight: 400; text-transform: capitalize; overflow: hidden; white-space: nowrap; }
.day-head:hover { background: var(--accent-subtle); color: var(--ink); }
.day-head.today { color: var(--accent); background: var(--accent-subtle); font-weight: 700; }
.day-head.selected { color: var(--on-accent); background: var(--accent); font-weight: 700; }
.activity-row { position: sticky; left: 0; z-index: 3; height: 92px; padding: .55rem .7rem; background: var(--surface); border-right: 1px solid var(--line-strong); border-bottom: 1px solid var(--line); }
.activity-row.compact { height: 46px; padding-block: .45rem; }
.activity-row.compact .date-fields { display: none; }
.activity-row.alternate { background: color-mix(in srgb, var(--page-soft) 72%, var(--surface)); }
.activity-row.sub { padding-left: 1.6rem; }
.activity-title { display: flex; align-items: center; min-width: 0; gap: .25rem; }
.activity-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
.activity-row.sub .activity-name { font-weight: 500; }
.macro-name { margin-left: auto; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); font-size: .7rem; }
.compact-color { width: .7rem; height: .7rem; flex: 0 0 .7rem; margin-right: .35rem; border-radius: 50%; box-shadow: 0 0 0 1px var(--line-strong); }
.chevron, .chevron-spacer { width: 1.5rem; flex: 0 0 1.5rem; }
.chevron { display: grid; place-items: center; height: 1.5rem; padding: 0; border: 1px solid transparent; border-radius: var(--radius-sm); background: transparent; color: var(--muted); }
.chevron:hover { border-color: var(--line); background: var(--page-soft); color: var(--ink); }
.date-fields { display: flex; align-items: center; justify-content: space-between; gap: .6rem; margin-top: .3rem; padding-left: 1.75rem; }
.dates, .row-actions { display: flex; align-items: center; gap: .3rem; min-width: 0; }
.row-actions { flex: 0 0 auto; }
.date-fields input[type='date'] { width: 7.75rem; height: 1.75rem; padding: .2rem .35rem; font-size: .72rem; }
.date-fields input:disabled { opacity: .75; }
.gantt-grid.narrow .date-fields { gap: .25rem; }
.gantt-grid.narrow .dates { gap: .18rem; }
.gantt-grid.narrow .row-actions { gap: .1rem; }
.gantt-grid.narrow .date-fields input[type='date'] { width: 5.75rem; padding-inline: .25rem; }
.gantt-grid.narrow .macro-name { display: none; }
.date-separator { color: var(--muted); }
.color-picker { display: grid; place-items: center; width: 1.8rem; height: 1.8rem; border-radius: var(--radius-sm); }
.color-picker:hover { background: var(--page-soft); }
.color-picker input { width: 1rem; height: 1rem; padding: 0; border: 0; border-radius: 50%; background: transparent; cursor: pointer; }
.color-picker input::-webkit-color-swatch-wrapper { padding: 0; }
.color-picker input::-webkit-color-swatch { border: 1px solid var(--line-strong); border-radius: 50%; }
.schedule { border: 0; background: transparent; color: var(--accent); padding: .2rem; font-size: .72rem; }
.schedule:disabled { color: var(--muted); cursor: not-allowed; opacity: .55; }
.timeline-row { position: relative; height: 92px; border-bottom: 1px solid var(--line); background-color: color-mix(in srgb, var(--page-soft) 84%, var(--surface)); background-image: linear-gradient(to right, color-mix(in srgb, var(--line) 72%, transparent) 1px, transparent 1px); background-position-x: -1px; }
.timeline-row.compact { height: 46px; }
.timeline-row.planned:not(.compact) .gantt-bar { top: 32px; }
.timeline-row.compact .gantt-bar { top: 9px; }
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
.model-menu button { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: .5rem .65rem; border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--ink); text-align: left; }
.model-menu button:hover { background: var(--accent-subtle); }
.model-menu p { margin: .4rem; color: var(--muted); }
.badge { padding: .12rem .4rem; border-radius: 999px; background: var(--accent); color: var(--on-accent); font-size: .65rem; text-transform: uppercase; }
@media (max-width: 900px) {
  .gantt-head { justify-content: flex-start; }
  .gantt-grid { grid-template-columns: 360px var(--timeline-w); }
}
</style>
