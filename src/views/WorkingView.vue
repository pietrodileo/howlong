<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import ContingencyControls from '../components/ContingencyControls.vue';
import ContingencyCompare from '../components/ContingencyCompare.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import FormulaEditor, {
  type FormulaEditableItem,
} from '../components/FormulaEditor.vue';
import NotesEditor from '../components/NotesEditor.vue';
import TagPicker from '../components/TagPicker.vue';
import IconBtn from '../components/IconBtn.vue';
import MetaIconPicker from '../components/MetaIconPicker.vue';
import ClientView from './ClientView.vue';
import type { FormulaAggregate, ModelIcon } from '../models/model';
import { useEstimateStore } from '../stores/estimate';
import { useModelsStore } from '../stores/models';
import { useSettingsStore } from '../stores/settings';
import { useUiStore } from '../stores/ui';
import {
  formatHours,
  formatDays,
  formatEffort,
  hoursToInputUnit,
  inputUnitToHours,
  type EffortUnit,
} from '../lib/rounding';
import { exportEstimate, openEstimateFile } from '../lib/io';
import { readTextFile, isTauri } from '../lib/tauri';
import { importEstimateText } from '../lib/import';
import { isDialogCancelled, isDialogDesktopOnly } from '../lib/dialogResult';
import { toErrorMessage } from '../lib/errors';
import { resolveAppliesContingency } from '../lib/applyContingency';
import { useLibraryStore } from '../stores/library';
import {
  useResizableColumns,
  TOGGLEABLE_COLUMNS,
  type ColumnKey,
} from '../lib/useResizableColumns';
import { useRowDragReorder } from '../lib/useRowDragReorder';
import type { EstimateExportFormat } from '../lib/export';
import type { ComputedLineHours } from '../lib/contingency';
import { formulaLabel, isFormulaItem } from '../lib/formulas';
import { newId } from '../lib/ids';
import type { LineItem } from '../models/estimate';
import { useI18n } from '../i18n/useI18n';

const estimate = useEstimateStore();
const modelsStore = useModelsStore();
const { models: modelList, defaultModel } = storeToRefs(modelsStore);
const settings = useSettingsStore();
const library = useLibraryStore();
const ui = useUiStore();
const cols = useResizableColumns();
const { t } = useI18n();

const rowDrag = useRowDragReorder({
  getItems: () => estimate.estimate.items,
  onReorder: (dragId, targetId) => estimate.reorderItem(dragId, targetId),
});

const tableColumnKeys = computed(() =>
  cols.orderedKeys.value.filter((key) => {
    if (!cols.isVisible(key)) return false;
    if ((key === 'ctg' || key === 'withCtg') && !estimate.showInlineCtg) return false;
    return true;
  }),
);
const columnsMenuOpen = ref(false);
const ctgCompareOpen = ref(false);
const exportMenuOpen = ref(false);
const newMenuOpen = ref(false);
/** Id di una voce già in lista in modifica. */
const formulaEditId = ref<string | null>(null);
/** Voce in editor note (modal). */
const notesEditId = ref<string | null>(null);
/** Bozza nuova voce: non è in lista finché non si conferma con Applica. */
const formulaDraft = ref<FormulaEditableItem | null>(null);
/** Anteprima vista cliente della stima corrente. */
const clientPreview = ref(false);
/** Dialog di conferma generico (scarta stima / elimina voce). */
type PendingConfirm = {
  title: string;
  message: string;
  confirmLabel: string;
  action: () => void | Promise<void>;
};

const pendingConfirm = ref<PendingConfirm | null>(null);
const confirmOpen = computed(() => pendingConfirm.value != null);

function askConfirm(opts: PendingConfirm) {
  pendingConfirm.value = opts;
}

function cancelConfirm() {
  pendingConfirm.value = null;
}

async function runConfirm() {
  const pending = pendingConfirm.value;
  pendingConfirm.value = null;
  if (pending) await pending.action();
}

function requestIfClean(action: () => void | Promise<void>) {
  if (!estimate.dirty) {
    void action();
    return;
  }
  askConfirm({
    title: t('working.unsavedTitle'),
    message: t('working.unsavedBody'),
    confirmLabel: t('working.unsavedDiscard'),
    action,
  });
}

function onDeleteItem(id: string) {
  const item = estimate.estimate.items.find((i) => i.id === id);
  if (!item) return;
  const isMacro = item.parentId == null;
  askConfirm({
    title: t('working.deleteTitle'),
    message: isMacro
      ? t('working.deleteBodyMacro', { name: item.name })
      : t('working.deleteBody', { name: item.name }),
    confirmLabel: t('working.deleteConfirm'),
    action: () => estimate.removeItem(id),
  });
}

const defaultModelLabel = computed(
  () => defaultModel.value?.name ?? t('working.pickModel'),
);

const effortUnit = computed(
  () => estimate.estimate.meta.unit as EffortUnit,
);

const hoursPerDay = computed(() => {
  const n = estimate.estimate.meta.hoursPerDay;
  return Number.isFinite(n) && n > 0 ? n : 8;
});

function clampHoursPerDay(raw: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 8;
  return Math.min(24, Math.max(1, n));
}

const effortUnitLabel = computed(() =>
  effortUnit.value === 'days' ? t('common.days') : t('common.hours'),
);
const effortUnitShort = computed(() =>
  effortUnit.value === 'days' ? 'D' : 'h',
);

const categoryOptions = computed(() => {
  const fromSettings = settings.settings.defaultCategories;
  const fromItems = estimate.estimate.items.map((i) => i.category);
  const modelId = estimate.estimate.modelId;
  const fromModel =
    modelList.value.find((m) => m.id === modelId)?.categories ?? [];
  return [...new Set([...fromModel, ...fromSettings, ...fromItems])].filter(Boolean);
});

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

function columnLabel(key: ColumnKey): string {
  if (key === 'base') return effortUnitLabel.value;
  return t(`columns.${key}`);
}

function columnAbbr(key: ColumnKey): string {
  switch (key) {
    case 'name':
      return 'N';
    case 'category':
      return 'C';
    case 'base':
      return effortUnitShort.value;
    case 'applyCtg':
      return '±';
    case 'ctg':
      return '+';
    case 'withCtg':
      return 'Σ';
    case 'override':
      return '%';
    case 'tags':
      return 'T';
    case 'notes':
      return '…';
    case 'actions':
      return '';
    default:
      return '';
  }
}

function headerTitle(key: ColumnKey): string {
  if (key === 'applyCtg') return t('models.ctgColTitle');
  return t('common.expandCol');
}

function formulaErrorTitle(err?: string): string {
  if (!err) return '';
  return err === 'cycle' ? t('working.cycleError') : err;
}

function separateRowLabel(category: string | null): string {
  return category
    ? t('working.ctgByCat', { category })
    : t('working.ctgRow');
}

function displayEffort(hours: number): string {
  return formatEffort(hours, effortUnit.value, hoursPerDay.value);
}

function onEffortInput(id: string, raw: string) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    estimate.updateItem(id, { hours: 0 });
    return;
  }
  estimate.updateItem(id, {
    hours: inputUnitToHours(n, effortUnit.value, hoursPerDay.value),
  });
}

function effortInputValue(hours: number): number {
  const v = hoursToInputUnit(hours, effortUnit.value, hoursPerDay.value);
  return Math.round(v * 1000) / 1000;
}

function onUnitChange(raw: string) {
  const unit = raw as EffortUnit;
  if (unit !== 'hours' && unit !== 'days') return;
  estimate.updateMeta({ unit });
}

const pickerColumns = computed(() =>
  TOGGLEABLE_COLUMNS.filter((key) => {
    if (key === 'ctg' || key === 'withCtg') return estimate.showInlineCtg;
    return true;
  }),
);

function closeFloatingMenus(except?: 'new' | 'export' | 'columns') {
  if (except !== 'new') newMenuOpen.value = false;
  if (except !== 'export') exportMenuOpen.value = false;
  if (except !== 'columns') columnsMenuOpen.value = false;
}

function onDocPointerDown(e: PointerEvent) {
  const t = e.target as HTMLElement | null;
  if (!t?.closest?.('.new-menu')) newMenuOpen.value = false;
  if (!t?.closest?.('.export-menu')) exportMenuOpen.value = false;
  if (!t?.closest?.('.col-picker')) columnsMenuOpen.value = false;
}

onMounted(() => document.addEventListener('pointerdown', onDocPointerDown));
onUnmounted(() => document.removeEventListener('pointerdown', onDocPointerDown));

const allMacrosExpanded = computed(() => {
  const macros = estimate.totals.lines.filter((l) => l.isMacro && l.hasChildren);
  if (macros.length === 0) return true;
  return macros.every((m) => !estimate.isCollapsed(m.item.id));
});

function toggleAllMacros() {
  const macros = estimate.totals.lines.filter((l) => l.isMacro && l.hasChildren);
  const expand = !allMacrosExpanded.value;
  for (const m of macros) {
    const collapsed = estimate.isCollapsed(m.item.id);
    if (expand && collapsed) estimate.toggleMacro(m.item.id);
    if (!expand && !collapsed) estimate.toggleMacro(m.item.id);
  }
}

function onNewFromDefault() {
  const m = defaultModel.value ?? modelList.value[0] ?? null;
  if (!m) {
    ui.notify(t('working.noModelAvail'), true);
    return;
  }
  onNewFromModelId(m.id);
}

function toggleNewMenu() {
  const next = !newMenuOpen.value;
  closeFloatingMenus('new');
  newMenuOpen.value = next;
}

function toggleExportMenu() {
  const next = !exportMenuOpen.value;
  closeFloatingMenus('export');
  exportMenuOpen.value = next;
}

function onNewFromModelId(id: string) {
  requestIfClean(() => doNewFromModelId(id));
}

function doNewFromModelId(id: string) {
  const m = modelList.value.find((x) => x.id === id);
  if (!m) {
    ui.notify(t('working.modelNotFound'), true);
    return;
  }
  modelsStore.selectedId = id;
  estimate.newFromModel(m);
  clientPreview.value = false;
  newMenuOpen.value = false;
  ui.notify(t('working.newEstimateFrom', { name: m.name }));
}

async function onOpen() {
  requestIfClean(() => doOpen());
}

async function doOpen() {
  const result = await openEstimateFile();
  if (!result.ok) {
    if (!isDialogCancelled(result)) {
      ui.notify(
        isDialogDesktopOnly(result) ? t('library.desktopOnly') : result.error,
        true,
      );
    }
    return;
  }
  estimate.setEstimate(result.data, result.path);
  clientPreview.value = false;
  ui.notify(t('working.opened'));
}

async function doReload() {
  const path = estimate.filePath.value;
  if (!path) {
    ui.notify(t('common.noFileOpen'), true);
    return;
  }
  if (!isTauri()) {
    ui.notify(t('library.desktopOnly'), true);
    return;
  }
  try {
    const text = await readTextFile(path);
    const result = await importEstimateText(text, 'json');
    if (!result.ok) {
      ui.notify(result.error, true);
      return;
    }
    estimate.setEstimate(result.data, path);
    clientPreview.value = false;
    ui.notify(t('working.reloaded'));
  } catch (e) {
    ui.notify(toErrorMessage(e), true);
  }
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

async function onExport(format: EstimateExportFormat) {
  try {
    const path = await exportEstimate(estimate.estimate, format, 'estimate', settings.settings);
    if (path) ui.notify(t('working.exported', { format: format.toUpperCase(), path }));
  } catch (e) {
    ui.notify(toErrorMessage(e), true);
  }
}

function onOverride(id: string, raw: string) {
  if (raw.trim() === '') {
    estimate.updateItem(id, { contingencyPercentOverride: null });
    return;
  }
  const n = Number(raw);
  if (Number.isFinite(n)) {
    estimate.updateItem(id, { contingencyPercentOverride: Math.min(100, Math.max(0, n)) });
  }
}

function hoursEditable(line: ComputedLineHours) {
  return !line.hasChildren && !line.isFormula && line.item.kind !== 'formula';
}

/** CTG custom % editabile se la voce contribuisce e ha CTG attiva (anche derivate). */
function overrideEditable(line: ComputedLineHours) {
  if (line.hasChildren || line.item.kind === 'summary') return false;
  return itemAppliesContingency(line.item);
}

function itemAppliesContingency(item: LineItem): boolean {
  return resolveAppliesContingency(item);
}

function setApplyContingency(id: string, value: boolean) {
  const item = estimate.estimate.items.find((i) => i.id === id);
  if (!item || item.kind === 'summary') return;

  if (item.kind === 'formula' && item.formula) {
    estimate.updateItem(id, {
      applyContingency: value,
      formula: { ...item.formula, applyGlobalContingency: value },
    });
  } else {
    estimate.updateItem(id, { applyContingency: value });
  }

  // Come in Modelli: flag per voce; su macro propaga ai sotto-task
  if (item.parentId == null && item.kind !== 'formula') {
    for (const child of estimate.estimate.items) {
      if (child.parentId !== id) continue;
      estimate.updateItem(child.id, { applyContingency: value });
    }
  }
}

function formulaHint(item: LineItem): string {
  if (!item.formula) return '';
  const names = item.formula.sourceIds
    .map((id) => estimate.estimate.items.find((i) => i.id === id)?.name ?? id)
    .join(', ');
  const base = formulaLabel(item.formula);
  return names ? `${base} ← ${names}` : base;
}

const editingFormulaItem = computed(() => {
  if (formulaDraft.value) return formulaDraft.value;
  if (formulaEditId.value) {
    return estimate.estimate.items.find((i) => i.id === formulaEditId.value) ?? null;
  }
  return null;
});

function closeFormulaEditor() {
  formulaDraft.value = null;
  formulaEditId.value = null;
}

const notesEditItem = computed(() => {
  if (!notesEditId.value) return null;
  return estimate.estimate.items.find((i) => i.id === notesEditId.value) ?? null;
});

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

function onAddFormula() {
  const sourceIds = estimate.estimate.items
    .filter((i) => i.parentId == null && i.kind !== 'formula' && i.kind !== 'summary')
    .map((i) => i.id);
  formulaEditId.value = null;
  formulaDraft.value = {
    id: newId('formula'),
    name: 'Overhead',
    kind: 'formula',
    parentId: null,
    applyContingency: false,
    formula: {
      percent: 30,
      sourceIds,
      includeFormulaSources: false,
      aggregate: 'sum',
      applyGlobalContingency: false,
    },
  };
}

function onSaveFormula(patch: {
  name: string;
  percent: number;
  sourceIds: string[];
  includeFormulaSources: boolean;
  aggregate: FormulaAggregate;
}) {
  if (formulaDraft.value) {
    estimate.addFormula({
      id: formulaDraft.value.id,
      name: patch.name,
      percent: patch.percent,
      sourceIds: patch.sourceIds,
      includeFormulaSources: patch.includeFormulaSources,
      aggregate: patch.aggregate,
      applyGlobalContingency: formulaDraft.value.applyContingency ?? false,
    });
    closeFormulaEditor();
    return;
  }
  if (!formulaEditId.value) return;
  estimate.updateItem(formulaEditId.value, { name: patch.name });
  estimate.updateFormula(formulaEditId.value, {
    percent: patch.percent,
    sourceIds: patch.sourceIds,
    includeFormulaSources: patch.includeFormulaSources,
    aggregate: patch.aggregate,
  });
  closeFormulaEditor();
}

function openFormulaEditor(id: string) {
  formulaDraft.value = null;
  formulaEditId.value = id;
}

function onHeaderDblClick(key: ColumnKey) {
  cols.toggleCollapse(key);
}
</script>

<template>
  <ClientView v-if="clientPreview" @back="clientPreview = false" />
  <div v-else class="working">
    <header class="hero">
      <div class="title-head">
        <div class="title-main">
          <div class="title-row">
            <MetaIconPicker
              :icon="estimate.estimate.meta.icon"
              :name="estimate.estimate.meta.title"
              :size="20"
              @update:icon="estimate.updateMeta({ icon: $event as ModelIcon })"
            />
            <input
              class="title-input"
              :value="estimate.estimate.meta.title"
              :placeholder="t('working.titlePh')"
              @input="estimate.updateMeta({ title: ($event.target as HTMLInputElement).value })"
            />
          </div>
          <input
            class="client-label-input"
            :value="estimate.estimate.meta.clientLabel"
            :placeholder="t('working.clientPh')"
            @input="estimate.updateMeta({ clientLabel: ($event.target as HTMLInputElement).value })"
          />
        </div>

        <div class="title-promo">
          <div class="export-menu">
            <button
              type="button"
              class="ghost"
              :aria-expanded="exportMenuOpen"
              @click.stop="toggleExportMenu"
            >
              {{ t('common.export') }} ▾
            </button>
            <div v-if="exportMenuOpen" class="menu" role="menu" @pointerdown.stop>
              <button
                type="button"
                role="menuitem"
                :title="t('export.aiHint')"
                @click="onExport('yaml'); exportMenuOpen = false"
              >
                {{ t('export.ai') }}
              </button>
              <button
                type="button"
                role="menuitem"
                :title="t('export.excelHint')"
                @click="onExport('xlsx'); exportMenuOpen = false"
              >
                {{ t('export.excel') }}
              </button>
              <button
                type="button"
                role="menuitem"
                :title="t('export.backupHint')"
                @click="onExport('json'); exportMenuOpen = false"
              >
                {{ t('export.backup') }}
              </button>
            </div>
          </div>
          <button
            type="button"
            class="ghost presentation-view-btn"
            :title="t('working.clientViewTitle')"
            @click="clientPreview = true"
          >
            {{ t('working.presentationView') }}
          </button>
        </div>
      </div>

      <div class="chrome">
        <div class="chrome-row">
          <div class="new-menu">
            <div class="split">
              <button
                type="button"
                class="ghost new-main"
                :title="t('working.newFrom', { name: defaultModelLabel })"
                @click="onNewFromDefault"
              >
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                  <path
                    d="M8 2.5v11M2.5 8h11"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                  />
                </svg>
                <span class="new-label">{{ defaultModelLabel }}</span>
              </button>
              <button
                type="button"
                class="ghost new-caret"
                :aria-expanded="newMenuOpen"
                :aria-label="t('working.pickModel')"
                :title="t('working.pickModel')"
                @click.stop="toggleNewMenu"
              >
                ▾
              </button>
            </div>
            <div v-if="newMenuOpen" class="menu new-panel" role="menu" @pointerdown.stop>
              <p class="menu-title">{{ t('working.newFromModel') }}</p>
              <button
                v-for="m in modelList"
                :key="m.id"
                type="button"
                class="model-pick"
                role="menuitem"
                @click="onNewFromModelId(m.id)"
              >
                <span class="model-name">{{ m.name }}</span>
                <span v-if="modelsStore.isDefault(m.id)" class="badge">{{ t('common.default') }}</span>
              </button>
              <p v-if="modelList.length === 0" class="empty">{{ t('working.noModels') }}</p>
            </div>
          </div>
          <button type="button" class="ghost" @click="onOpen">{{ t('common.open') }}</button>
          <button type="button" class="primary" @click="onSave">{{ t('common.save') }}</button>
          <span v-if="estimate.dirty" class="dirty">{{ t('common.unsavedF') }}</span>
        </div>
      </div>
    </header>

    <div class="summary-row" aria-live="polite">
      <div class="stat">
        <span>{{ t('working.base') }}</span>
        <strong>
          <span>{{ formatHours(estimate.totals.totalBase) }} h</span>
          <span class="stat-days">{{ formatDays(estimate.totals.totalBase, hoursPerDay) }} D</span>
        </strong>
      </div>
      <div class="stat" :title="t('working.ctgSumTitle')">
        <span>{{ t('common.ctg') }}</span>
        <strong>
          <span>{{ formatHours(estimate.totals.totalContingency) }} h</span>
          <span class="stat-days">{{ formatDays(estimate.totals.totalContingency, hoursPerDay) }} D</span>
        </strong>
      </div>
      <div class="stat accent">
        <span>{{ t('working.total') }}</span>
        <strong>
          <span>{{ formatHours(estimate.totals.totalWithContingency) }} h</span>
          <span class="stat-days">{{ formatDays(estimate.totals.totalWithContingency, hoursPerDay) }} D</span>
        </strong>
      </div>

      <div class="summary-actions">
        <div class="estimate-settings">
          <label class="unit-field">
            {{ t('working.unit') }}
            <select
              class="meta-select"
              :value="estimate.estimate.meta.unit"
              @change="onUnitChange(($event.target as HTMLSelectElement).value)"
            >
              <option value="hours">{{ t('common.hours') }}</option>
              <option value="days">{{ t('common.days') }}</option>
            </select>
          </label>

          <label
            class="unit-field"
            :title="t('working.hoursPerDayTitle')"
          >
            {{ t('working.oneDayEq') }}
            <input
              class="meta-select hours-day"
              type="number"
              min="1"
              max="24"
              step="0.5"
              :value="hoursPerDay"
              @input="estimate.updateMeta({ hoursPerDay: clampHoursPerDay(($event.target as HTMLInputElement).value) })"
            />
            <span class="unit-suffix">{{ t('common.ore') }}</span>
          </label>

          <ContingencyControls />
        </div>

        <span class="settings-sep" aria-hidden="true" />

        <button
          type="button"
          class="ghost"
          :aria-expanded="ctgCompareOpen"
          @click="ctgCompareOpen = !ctgCompareOpen"
        >
          {{ t('ctg.compare') }}
        </button>
        <div class="col-picker">
          <button
            type="button"
            class="ghost"
            :aria-expanded="columnsMenuOpen"
            @click.stop="columnsMenuOpen = !columnsMenuOpen"
          >
            {{ t('common.columns') }}
          </button>
          <div v-if="columnsMenuOpen" class="col-menu" role="menu" @pointerdown.stop>
            <p class="col-menu-title">{{ t('common.columnsVisible') }}</p>
            <label class="col-opt locked">
              <input type="checkbox" checked disabled />
              {{ t('columns.name') }}
            </label>
            <label v-for="key in pickerColumns" :key="key" class="col-opt">
              <input
                type="checkbox"
                :checked="cols.isVisible(key)"
                @change="cols.toggleVisible(key)"
              />
              {{ columnLabel(key) }}
            </label>
          </div>
        </div>
      </div>
    </div>

    <ContingencyCompare v-model:open="ctgCompareOpen" />

    <div class="table-shell">
      <table class="data-table sheet">
        <thead>
          <tr>
            <th
              v-for="key in tableColumnKeys"
              :key="key"
              class="resizable"
              :class="{ collapsed: cols.collapsed[key] }"
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
          <template v-for="line in estimate.visibleLines" :key="line.item.id">
            <tr
              :class="[
                {
                  macro: line.isMacro && !line.isFormula,
                  task: !line.isMacro,
                  summary: line.item.kind === 'summary',
                  formula: line.isFormula || isFormulaItem(line.item),
                },
                rowDrag.rowClass(line.item.id),
              ]"
              @dragover="rowDrag.onDragOver(line.item.id, $event)"
              @dragleave="rowDrag.onDragLeave(line.item.id)"
              @drop="rowDrag.onDrop(line.item.id, $event)"
            >
              <template v-for="key in tableColumnKeys" :key="key">
                <td
                  v-if="key === 'name'"
                  :style="cols.styleFor('name')"
                  :class="{ collapsed: cols.collapsed.name }"
                >
                  <div
                    v-if="!cols.collapsed.name"
                    class="name-cell"
                    :style="{ paddingLeft: line.depth ? '1.35rem' : '0' }"
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
                    <span
                      v-else-if="line.isFormula || isFormulaItem(line.item)"
                      class="formula-mark"
                      aria-hidden="true"
                      :title="t('working.formulaMark')"
                    >=</span>
                    <span v-else-if="!line.isMacro" class="task-mark" aria-hidden="true">·</span>
                    <span v-else class="collapse-spacer" aria-hidden="true" />
                    <textarea
                      class="name-input"
                      rows="1"
                      :value="line.item.name"
                      :class="{ 'macro-name': line.isMacro || line.isFormula }"
                      @input="estimate.updateItem(line.item.id, { name: ($event.target as HTMLTextAreaElement).value })"
                    />
                    <button
                      v-if="line.isFormula || isFormulaItem(line.item)"
                      type="button"
                      class="ghost formula-edit"
                      :title="formulaHint(line.item)"
                      @click="openFormulaEditor(line.item.id)"
                    >
                      {{ line.item.formula ? formulaLabel(line.item.formula) : 'Σ' }}
                    </button>
                    <span
                      v-if="line.formulaError"
                      class="formula-err"
                      :title="formulaErrorTitle(line.formulaError)"
                    >!</span>
                  </div>
                </td>
                <td
                  v-else-if="key === 'category'"
                  :style="cols.styleFor('category')"
                  :class="{ collapsed: cols.collapsed.category }"
                >
                  <template v-if="!cols.collapsed.category">
                    <select
                      v-if="line.isMacro || line.isFormula || isFormulaItem(line.item)"
                      :value="line.item.category"
                      @change="estimate.updateItem(line.item.id, { category: ($event.target as HTMLSelectElement).value })"
                    >
                      <option
                        v-for="c in categoryOptions"
                        :key="c"
                        :value="c"
                      >
                        {{ c }}
                      </option>
                    </select>
                    <span v-else class="muted cat">{{ line.item.category }}</span>
                  </template>
                </td>
                <td
                  v-else-if="key === 'base'"
                  class="num-cell"
                  :style="cols.styleFor('base')"
                  :class="{ collapsed: cols.collapsed.base }"
                >
                  <template v-if="!cols.collapsed.base">
                    <input
                      v-if="hoursEditable(line)"
                      class="num"
                      type="number"
                      min="0"
                      step="any"
                      :value="effortInputValue(line.item.hours)"
                      @input="onEffortInput(line.item.id, ($event.target as HTMLInputElement).value)"
                    />
                    <span
                      v-else
                      class="readonly emph"
                      :title="line.isFormula ? formulaHint(line.item) : undefined"
                    >{{ displayEffort(line.hoursBase) }}</span>
                  </template>
                </td>
                <td
                  v-else-if="key === 'applyCtg'"
                  class="center"
                  :style="cols.styleFor('applyCtg')"
                  :class="{ collapsed: cols.collapsed.applyCtg }"
                >
                  <input
                    v-if="!cols.collapsed.applyCtg && line.item.kind !== 'summary'"
                    type="checkbox"
                    :checked="itemAppliesContingency(line.item)"
                    :title="itemAppliesContingency(line.item) ? t('models.ctgOn') : t('models.ctgOff')"
                    :aria-label="`Contingency su ${line.item.name}`"
                    @change="setApplyContingency(line.item.id, ($event.target as HTMLInputElement).checked)"
                  />
                </td>
                <td
                  v-else-if="key === 'ctg'"
                  class="readonly num-cell"
                  :style="cols.styleFor('ctg')"
                  :class="{ collapsed: cols.collapsed.ctg }"
                >
                  <template v-if="!cols.collapsed.ctg">{{ displayEffort(line.hoursContingency) }}</template>
                </td>
                <td
                  v-else-if="key === 'withCtg'"
                  class="readonly emph num-cell"
                  :style="cols.styleFor('withCtg')"
                  :class="{ collapsed: cols.collapsed.withCtg }"
                >
                  <template v-if="!cols.collapsed.withCtg">{{ displayEffort(line.hoursWithContingency) }}</template>
                </td>
                <td
                  v-else-if="key === 'override'"
                  class="num-cell"
                  :style="cols.styleFor('override')"
                  :class="{ collapsed: cols.collapsed.override }"
                >
                  <template v-if="!cols.collapsed.override">
                    <input
                      v-if="overrideEditable(line)"
                      class="num"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      :placeholder="String(line.contingencyPercentApplied)"
                      :value="line.item.contingencyPercentOverride ?? ''"
                      @input="onOverride(line.item.id, ($event.target as HTMLInputElement).value)"
                    />
                    <span v-else class="readonly muted">—</span>
                  </template>
                </td>
                <td
                  v-else-if="key === 'tags'"
                  :style="cols.styleFor('tags')"
                  :class="{ collapsed: cols.collapsed.tags }"
                >
                  <TagPicker
                    v-if="!cols.collapsed.tags"
                    :model-value="line.item.tags ?? []"
                    :options="tagOptions"
                    :aria-label="`${t('columns.tags')}: ${line.item.name}`"
                    @update:model-value="onItemTagsChange(line.item.id, $event)"
                    @create-option="onCreateTagOption"
                  />
                </td>
                <td
                  v-else-if="key === 'notes'"
                  :style="cols.styleFor('notes')"
                  :class="{ collapsed: cols.collapsed.notes }"
                >
                  <div v-if="!cols.collapsed.notes" class="notes-cell">
                    <textarea
                      class="notes-input"
                      rows="2"
                      :value="line.item.notes"
                      :placeholder="t('working.notesPh')"
                      :title="t('working.notesExpand')"
                      @input="estimate.updateItem(line.item.id, { notes: ($event.target as HTMLTextAreaElement).value })"
                      @dblclick="openNotesEditor(line.item.id)"
                    />
                  </div>
                </td>
                <td
                  v-else-if="key === 'actions'"
                  class="row-actions"
                  :style="cols.styleFor('actions')"
                  :class="{ collapsed: cols.collapsed.actions }"
                >
                  <template v-if="!cols.collapsed.actions">
                    <button
                      v-if="line.isMacro && !line.isFormula && line.item.kind !== 'formula'"
                      type="button"
                      class="ghost"
                      @click="estimate.addSubtask(line.item.id)"
                    >
                      {{ t('working.addTask') }}
                    </button>
                    <IconBtn
                      v-if="line.isFormula || isFormulaItem(line.item)"
                      kind="edit"
                      :label="t('working.editFormula')"
                      @click="openFormulaEditor(line.item.id)"
                    />
                    <IconBtn
                      kind="duplicate"
                      :label="t('working.duplicateItem')"
                      @click="estimate.duplicateItem(line.item.id, settings.settings.locale === 'en' ? 'en' : 'it')"
                    />
                    <IconBtn
                      kind="delete"
                      :label="t('working.deleteItem')"
                      @click="onDeleteItem(line.item.id)"
                    />
                  </template>
                </td>
              </template>
            </tr>
          </template>

          <tr
            v-for="(row, i) in estimate.separateRows"
            :key="'sep-' + i"
            class="sep-ctg"
          >
            <template v-for="key in tableColumnKeys" :key="key">
              <td
                v-if="key === 'name'"
                :style="cols.styleFor('name')"
                :class="{ collapsed: cols.collapsed.name }"
              >
                <div v-if="!cols.collapsed.name" class="name-cell sep-label">
                  <span class="sep-mark" aria-hidden="true">+</span>
                  <span>{{ separateRowLabel(row.category) }}</span>
                </div>
              </td>
              <td
                v-else-if="key === 'base'"
                class="readonly num-cell"
                :style="cols.styleFor('base')"
                :class="{ collapsed: cols.collapsed.base }"
              >
                <template v-if="!cols.collapsed.base">
                  <span v-if="!estimate.showInlineCtg" class="emph">{{ displayEffort(row.hours) }}</span>
                  <span v-else>—</span>
                </template>
              </td>
              <td
                v-else-if="key === 'ctg'"
                class="readonly emph num-cell"
                :style="cols.styleFor('ctg')"
                :class="{ collapsed: cols.collapsed.ctg }"
              >
                <template v-if="!cols.collapsed.ctg">{{ displayEffort(row.hours) }}</template>
              </td>
              <td
                v-else-if="key === 'withCtg'"
                class="readonly num-cell"
                :style="cols.styleFor('withCtg')"
                :class="{ collapsed: cols.collapsed.withCtg }"
              >
                <template v-if="!cols.collapsed.withCtg">—</template>
              </td>
              <td
                v-else
                :style="cols.styleFor(key)"
                :class="{ collapsed: cols.collapsed[key] }"
              />
            </template>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="add-row">
      <button type="button" class="ghost add" @click="estimate.addMacro">{{ t('working.addMacro') }}</button>
      <button
        type="button"
        class="ghost add"
        :title="t('working.addFormulaTitle')"
        @click="onAddFormula"
      >
        {{ t('working.addFormula') }}
      </button>
    </div>

    <FormulaEditor
      v-if="editingFormulaItem"
      :item="editingFormulaItem"
      :candidates="estimate.estimate.items"
      @close="closeFormulaEditor"
      @save="onSaveFormula"
    />

    <NotesEditor
      :open="notesEditItem != null"
      :item-name="notesEditItem?.name ?? ''"
      :notes="notesEditItem?.notes ?? ''"
      @close="closeNotesEditor"
      @save="onSaveNotes"
    />

    <ConfirmModal
      :open="confirmOpen"
      :title="pendingConfirm?.title ?? ''"
      :message="pendingConfirm?.message ?? ''"
      :confirm-label="pendingConfirm?.confirmLabel"
      danger
      @cancel="cancelConfirm"
      @confirm="runConfirm"
    />
  </div>
</template>

<style scoped>
.working {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-width: 0;
  max-width: 100%;
}

.working .table-shell {
  max-height: min(70vh, 640px);
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.55rem;
  overflow: visible;
}

.title-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.65rem 1.25rem;
}

.title-main {
  flex: 1;
  min-width: min(100%, 260px);
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.title-promo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
  flex-shrink: 0;
  padding-top: 0.2rem;
}

.client-label-input {
  width: 100%;
  max-width: 28rem;
  margin-left: calc(2.4rem + 0.65rem);
  box-sizing: border-box;
  border: none;
  border-bottom: 1px solid transparent;
  background: transparent;
  padding: 0.12rem 0;
  font-size: 0.9rem;
  color: var(--muted);
}

.client-label-input:hover,
.client-label-input:focus {
  border-bottom-color: var(--line-strong);
  color: var(--ink);
  outline: none;
}

.client-label-input::placeholder {
  color: var(--muted-soft);
}

.presentation-view-btn {
  font-weight: 600;
  color: var(--ink-soft);
}

.presentation-view-btn:hover {
  color: var(--ink);
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.title-row :deep(.icon-trigger) {
  width: 2.4rem;
  height: 2.4rem;
}

.title-input {
  flex: 1;
  width: 100%;
  min-width: 0;
  border: none;
  background: transparent;
  padding: 0;
  font-family: var(--font-brand);
  font-size: clamp(1.45rem, 2.2vw, 1.95rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--ink);
  line-height: 1.2;
}

.title-input:focus {
  outline: none;
}

.title-input::placeholder {
  color: var(--muted);
  font-weight: 500;
}

.chrome {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.55rem;
  overflow: visible;
}

.chrome-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: 0.5rem;
  row-gap: 0.35rem;
  overflow: visible;
  min-height: 2.25rem;
  padding-left: 0;
}

.chrome-row .dirty {
  margin-left: auto;
}

.estimate-settings {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem 0.75rem;
}

.estimate-settings :deep(.ctg) {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  height: 2.1rem;
}

.estimate-settings :deep(.pct-field) {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  height: 100%;
}

.estimate-settings :deep(.pct-input-wrap) {
  height: 2.1rem;
  box-sizing: border-box;
  padding: 0 0.45rem 0 0.3rem;
}

.settings-sep {
  width: 1px;
  align-self: stretch;
  min-height: 1.25rem;
  background: var(--line);
  flex-shrink: 0;
}

.chrome-row.meta-row {
  column-gap: 0.75rem;
}

.chrome-sep {
  width: 1px;
  height: 1.1rem;
  background: var(--line);
  flex-shrink: 0;
}

.unit-field {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--muted);
  white-space: nowrap;
  flex: 0 0 auto;
  height: 2.1rem;
}

.unit-field .meta-select {
  height: 2.1rem;
  box-sizing: border-box;
  padding: 0 0.35rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink);
  font-size: 0.9rem;
  font-weight: 550;
}

.unit-field .meta-select:hover,
.unit-field .meta-select:focus {
  border-color: color-mix(in srgb, var(--accent) 40%, var(--line));
  border-bottom-color: color-mix(in srgb, var(--accent) 40%, var(--line));
  box-shadow: 0 0 0 3px var(--accent-glow);
  outline: none;
}

.unit-field .hours-day {
  width: 3.25rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.unit-suffix {
  font-size: 0.8rem;
  color: var(--muted);
}

.file-menu,
.export-menu,
.new-menu {
  position: relative;
  overflow: visible;
}

.split {
  display: inline-flex;
  align-items: stretch;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
}

.split:hover {
  background: var(--accent-glow);
}

.new-main,
.new-caret {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-color: transparent !important;
  background: transparent !important;
}

.new-main {
  max-width: 180px;
  padding-right: 0.35rem;
}

.new-caret {
  padding-left: 0.25rem;
  padding-right: 0.45rem;
  color: var(--muted);
}

.new-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.menu-title {
  margin: 0.2rem 0.5rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.model-pick {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  padding: 0.5rem 0.55rem;
  border-radius: calc(var(--radius) - 2px);
  font-size: 0.9rem;
}

.model-pick:hover {
  background: var(--page-soft);
}

.model-name {
  flex: 1;
  min-width: 0;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  flex-shrink: 0;
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-soft);
  padding: 0.12rem 0.4rem;
  border-radius: 999px;
}

.empty {
  margin: 0.35rem 0.55rem;
  font-size: 0.85rem;
  color: var(--muted);
}

.icon-btn {
  width: 2.1rem;
  height: 2.1rem;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.menu.new-panel {
  left: 0;
  right: auto;
  min-width: 240px;
  width: max-content;
  max-width: min(320px, calc(100vw - 2rem));
  padding: 0.45rem;
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

.menu hr {
  border: none;
  border-top: 1px solid var(--line);
  margin: 0.25rem 0;
}

.meta-input,
.meta-select {
  border: none;
  border-bottom: 1px solid transparent;
  background: transparent;
  padding: 0.15rem 0;
  color: var(--muted);
  font-size: 0.9rem;
}

.meta-input {
  min-width: 140px;
  max-width: 220px;
  height: 2.1rem;
  box-sizing: border-box;
  padding: 0 0.55rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink);
  font-weight: 500;
}

.meta-input::placeholder {
  color: var(--muted);
  font-weight: 400;
  opacity: 1;
}

.meta-input:hover {
  border-color: color-mix(in srgb, var(--accent) 35%, var(--line));
}

.meta-input:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--accent) 45%, var(--line));
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.meta-select:hover,
.meta-select:focus {
  border-bottom-color: var(--line-strong);
  color: var(--ink);
  outline: none;
}

.dirty {
  margin-left: auto;
  color: var(--warn);
  font-size: 0.8rem;
  font-weight: 500;
}

.summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
  align-items: center;
  padding: 0.55rem 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
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

.col-picker {
  position: relative;
}

.summary-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem 0.55rem;
  margin-left: auto;
}

.col-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 0.35rem);
  min-width: 180px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 0.65rem 0.75rem;
  z-index: 20;
  box-shadow: var(--shadow-menu);
  display: grid;
  gap: 0.35rem;
}

.col-menu-title {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted);
}

.col-opt {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.9rem;
  color: var(--ink);
  cursor: pointer;
}

.col-opt.locked {
  color: var(--muted);
  cursor: default;
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

.th-inner {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
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

.name-cell .name-input {
  flex: 1;
  min-width: 0;
}

.name-cell .macro-name {
  font-weight: 600;
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

.task-mark {
  width: 1.4rem;
  text-align: center;
  color: var(--line-strong);
  flex-shrink: 0;
}

.formula-mark {
  width: 1.4rem;
  text-align: center;
  font-weight: 700;
  color: var(--accent);
  flex-shrink: 0;
}

.collapse-spacer {
  display: inline-block;
  width: 1.4rem;
  flex-shrink: 0;
}

.formula-edit {
  flex-shrink: 0;
  font-size: 0.72rem !important;
  font-weight: 600;
  padding: 0.15rem 0.4rem !important;
  color: var(--accent) !important;
}

.formula-err {
  color: var(--danger);
  font-weight: 700;
  cursor: help;
}

.macro-name {
  font-weight: 600;
}

.macro {
  background: var(--page-soft);
}

.formula td {
  background: color-mix(in srgb, var(--accent) 5%, var(--surface));
}

.task td {
  background: var(--surface);
}

.cat {
  padding: 0.45rem 0.4rem;
  display: inline-block;
  font-size: 0.9rem;
}

.center {
  text-align: center;
}

.row-actions {
  white-space: nowrap;
  overflow: visible;
}

.row-actions .ghost {
  margin-right: 0.15rem;
}

.row-actions :deep(.icon-btn) {
  margin-right: 0.1rem;
  vertical-align: middle;
}

.summary {
  opacity: 0.72;
}

.sep-ctg {
  background: var(--page-soft);
  font-weight: 500;
}

.sep-ctg .sep-label {
  padding-left: 0.55rem;
  color: var(--ink-soft);
}

.sep-mark {
  width: 1.1rem;
  flex-shrink: 0;
  text-align: center;
  color: var(--muted);
  font-weight: 600;
  font-size: 0.85rem;
}

.add-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.15rem;
}

.add {
  align-self: start;
}

.notes-cell {
  display: flex;
  align-items: stretch;
  min-width: 0;
}

.notes-input {
  flex: 1;
  min-width: 0;
  min-height: 2.6rem;
  max-height: 5.5rem;
  resize: vertical;
  border: 1px solid var(--line) !important;
  background: var(--page-soft) !important;
  color: var(--ink);
  line-height: 1.35;
  white-space: pre-wrap;
  field-sizing: content;
}

.notes-input::placeholder {
  color: var(--muted-soft);
  font-weight: 400;
}

.notes-input:hover {
  border-color: var(--line-strong) !important;
  background: var(--surface) !important;
}

.notes-input:focus {
  border-color: color-mix(in srgb, var(--accent) 45%, var(--line)) !important;
  background: var(--surface) !important;
}
</style>
