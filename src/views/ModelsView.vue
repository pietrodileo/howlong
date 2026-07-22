<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useModelsStore } from '../stores/models';
import { useUiStore } from '../stores/ui';
import { exportModel, openModelFiles } from '../lib/io';
import { isTauri } from '../lib/tauri';
import { newId } from '../lib/ids';
import {
  useModelResizableColumns,
  type ModelColumnKey,
} from '../lib/useResizableColumns';
import FormulaEditor, {
  type FormulaEditableItem,
} from '../components/FormulaEditor.vue';
import IconBtn from '../components/IconBtn.vue';
import ModelIcon from '../components/ModelIcon.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import TagPicker from '../components/TagPicker.vue';
import { formulaLabel } from '../lib/formulas';
import { useI18n } from '../i18n/useI18n';
import { isDialogCancelled, isDialogDesktopOnly } from '../lib/dialogResult';
import { toErrorMessage } from '../lib/errors';
import { resolveAppliesContingency } from '../lib/applyContingency';
import { MODEL_ICON_OPTIONS, type FormulaAggregate, type ModelIcon as ModelIconId, type MacroActivity } from '../models/model';

const models = useModelsStore();
const ui = useUiStore();
const { t } = useI18n();
const cols = useModelResizableColumns();
const newCategory = ref('');
const searchQuery = ref('');
/** Id di una voce già in lista in modifica. */
const formulaEditId = ref<string | null>(null);
/** Bozza nuova voce: non è in lista finché non si conferma con Applica. */
const formulaDraft = ref<FormulaEditableItem | null>(null);
const ctgHelpOpen = ref(false);
const iconMenuOpen = ref(false);
/** Macro con figli compresse (come in Stima). */
const collapsedMacros = ref<Set<string>>(new Set());
const pendingDelete = ref(false);

const LIST_KEY = 'howlong.modelsListCollapsed';
const LIST_WIDTH_KEY = 'howlong.modelsListWidth';
const LIST_COLLAPSED_W = 56;
const LIST_MIN_W = 140;
const LIST_MAX_W = 420;
const LIST_COLLAPSE_AT = 100;
const LIST_DEFAULT_W = 200;

function loadListWidth(): number {
  try {
    const n = Number(localStorage.getItem(LIST_WIDTH_KEY));
    if (Number.isFinite(n) && n >= LIST_MIN_W && n <= LIST_MAX_W) return n;
  } catch {
    /* ignore */
  }
  return LIST_DEFAULT_W;
}

const listCollapsed = ref(
  typeof localStorage !== 'undefined' && localStorage.getItem(LIST_KEY) === '1',
);
const listWidth = ref(loadListWidth());
const listResizing = ref(false);

const listStyle = computed(() => ({
  '--list-w': `${listCollapsed.value ? LIST_COLLAPSED_W : listWidth.value}px`,
}));

const current = computed(() => models.selected());

const tagOptionsForPicker = computed(() => {
  const m = current.value;
  if (!m) return [];
  const fromItems = m.macroActivities.flatMap((a) => a.tags ?? []);
  return [...new Set([...m.tagOptions, ...fromItems])].filter(Boolean);
});

const filteredModels = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return models.models;
  return models.models.filter(
    (m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q),
  );
});

function persistListLayout() {
  try {
    localStorage.setItem(LIST_KEY, listCollapsed.value ? '1' : '0');
    localStorage.setItem(LIST_WIDTH_KEY, String(listWidth.value));
  } catch {
    /* ignore */
  }
}

function toggleList() {
  listCollapsed.value = !listCollapsed.value;
  persistListLayout();
}

function startListResize(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  const startX = e.clientX;
  const startW = listCollapsed.value ? LIST_COLLAPSED_W : listWidth.value;
  listResizing.value = true;
  document.body.classList.add('col-resizing');

  function onMove(ev: MouseEvent) {
    const next = Math.min(
      LIST_MAX_W,
      Math.max(LIST_COLLAPSED_W, startW + (ev.clientX - startX)),
    );
    if (next < LIST_COLLAPSE_AT) {
      listCollapsed.value = true;
    } else {
      listCollapsed.value = false;
      listWidth.value = Math.max(LIST_MIN_W, next);
    }
  }

  function onUp() {
    listResizing.value = false;
    document.body.classList.remove('col-resizing');
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    persistListLayout();
  }

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

function setModelIcon(icon: ModelIconId) {
  models.updateSelected({ icon });
  iconMenuOpen.value = false;
}

function iconTitle(opt: ModelIconId): string {
  const key = `models.icon_${opt}`;
  const label = t(key);
  return label === key ? opt : label;
}

function onDocPointerDown(e: PointerEvent) {
  const el = e.target as HTMLElement | null;
  if (!el?.closest('.icon-picker')) iconMenuOpen.value = false;
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown);
});

onUnmounted(() => {
  document.body.classList.remove('col-resizing');
  document.removeEventListener('pointerdown', onDocPointerDown);
});

function onHeaderDblClick(key: ModelColumnKey) {
  cols.toggleCollapse(key);
}

async function save() {
  const ok = await models.saveSelected();
  if (ok === false) {
    ui.notify(models.lastError || t('models.invalid'), true);
    return;
  }
  ui.notify(t('models.saved'));
}

async function onExport() {
  const m = current.value;
  if (!m) return;
  try {
    const path = await exportModel(m);
    if (path) ui.notify(t('models.exported', { path }));
  } catch (e) {
    ui.notify(toErrorMessage(e), true);
  }
}

async function onImport() {
  if (!isTauri()) {
    ui.notify(t('models.desktopOnly'), true);
    return;
  }
  try {
    const picked = await openModelFiles();
    if (!picked.ok) {
      if (isDialogCancelled(picked)) return;
      ui.notify(
        isDialogDesktopOnly(picked) ? t('models.desktopOnly') : picked.error,
        true,
      );
      return;
    }
    let ok = 0;
    let fail = 0;
    for (const text of picked.texts) {
      if (await models.importFromText(text)) ok += 1;
      else fail += 1;
    }
    if (fail === 0) {
      ui.notify(t('models.importOk', { n: String(ok) }));
    } else if (ok > 0) {
      ui.notify(
        t('models.importPartial', { ok: String(ok), fail: String(fail) }),
        true,
      );
    } else {
      ui.notify(models.lastError || t('models.importBad'), true);
    }
  } catch (e) {
    ui.notify(toErrorMessage(e), true);
  }
}

async function setAsDefault() {
  const m = current.value;
  if (!m) return;
  await models.setDefaultModel(m.id);
  ui.notify(t('models.defaultSet', { name: m.name }));
}

async function onDeleteModel() {
  const m = current.value;
  if (!m) return;
  if (models.models.length <= 1) {
    ui.notify(t('models.needOneModel'), true);
    return;
  }
  pendingDelete.value = true;
}

async function confirmDeleteModel() {
  const m = current.value;
  pendingDelete.value = false;
  if (!m) return;
  const name = m.name;
  const ok = await models.removeSelected();
  if (!ok) {
    ui.notify(models.lastError || t('models.deleteFail'), true);
    return;
  }
  ui.notify(t('models.deleted', { name }));
}

function addMacro() {
  const m = current.value;
  if (!m) return;
  models.setMacroActivities([
    ...m.macroActivities,
    {
      id: newId('macro'),
      name: t('models.newMacroName'),
      category: m.categories[0] || 'Generale',
      tags: [],
      defaultHours: 0,
      kind: 'operational',
      parentId: null,
      applyContingency: true,
    },
  ]);
}

function addSubtask(macroId: string) {
  const m = current.value;
  if (!m) return;
  const macro = m.macroActivities.find(
    (a) => a.id === macroId && (a.parentId == null || a.parentId === '') && a.kind !== 'formula',
  );
  if (!macro) return;

  const alreadyHasChildren = m.macroActivities.some((a) => a.parentId === macroId);
  const next = m.macroActivities.map((a) =>
    a.id === macroId && !alreadyHasChildren ? { ...a, defaultHours: 0 } : a,
  );
  next.push({
    id: newId('task'),
    name: t('models.newSubName'),
    category: macro.category,
    tags: [],
    defaultHours: 0,
    kind: 'operational',
    parentId: macroId,
    applyContingency: resolveAppliesContingency(macro),
  });
  collapsedMacros.value.delete(macroId);
  collapsedMacros.value = new Set(collapsedMacros.value);
  models.setMacroActivities(next);
}

function addFormulaMacro() {
  const m = current.value;
  if (!m) return;
  const sourceIds = m.macroActivities
    .filter(
      (a) =>
        (a.parentId == null || a.parentId === '') &&
        a.kind !== 'formula' &&
        a.kind !== 'summary',
    )
    .map((a) => a.id);
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

function closeFormulaEditor() {
  formulaDraft.value = null;
  formulaEditId.value = null;
}

function openFormulaEditor(id: string) {
  formulaDraft.value = null;
  formulaEditId.value = id;
}

function updateMacro(id: string, patch: Partial<MacroActivity>) {
  const m = current.value;
  if (!m) return;
  const prev = m.macroActivities.find((a) => a.id === id);
  models.setMacroActivities(
    m.macroActivities.map((a) => {
      if (a.id === id) return { ...a, ...patch };
      // Categoria macro → propaga ai sotto-task
      if (
        prev &&
        isTopLevel(prev) &&
        patch.category &&
        a.parentId === id
      ) {
        return { ...a, category: patch.category };
      }
      return a;
    }),
  );
}

function removeMacro(id: string) {
  const m = current.value;
  if (!m) return;
  const removeIds = new Set([
    id,
    ...m.macroActivities.filter((a) => a.parentId === id).map((a) => a.id),
  ]);
  models.setMacroActivities(
    m.macroActivities
      .filter((a) => !removeIds.has(a.id))
      .map((a) =>
        a.formula?.sourceIds.some((s) => removeIds.has(s))
          ? {
              ...a,
              formula: {
                ...a.formula,
                sourceIds: a.formula.sourceIds.filter((s) => !removeIds.has(s)),
              },
            }
          : a,
      ),
  );
}

function isTopLevel(a: MacroActivity) {
  return a.parentId == null || a.parentId === '';
}

function hasChildren(id: string) {
  return (current.value?.macroActivities ?? []).some((a) => a.parentId === id);
}

function childrenHours(id: string) {
  return (current.value?.macroActivities ?? [])
    .filter((a) => a.parentId === id)
    .reduce((s, a) => s + (a.defaultHours || 0), 0);
}

function hoursEditable(a: MacroActivity) {
  return a.kind !== 'formula' && !hasChildren(a.id);
}

function toggleMacroCollapse(id: string) {
  if (collapsedMacros.value.has(id)) collapsedMacros.value.delete(id);
  else collapsedMacros.value.add(id);
  collapsedMacros.value = new Set(collapsedMacros.value);
}

function isCollapsed(id: string) {
  return collapsedMacros.value.has(id);
}

/** Macro in ordine file, ciascuna seguita dai suoi sotto-task. */
const orderedActivities = computed(() => {
  const list = current.value?.macroActivities ?? [];
  const tops = list.filter((a) => isTopLevel(a));
  const out: MacroActivity[] = [];
  const seen = new Set<string>();
  for (const top of tops) {
    out.push(top);
    seen.add(top.id);
    if (isCollapsed(top.id)) continue;
    for (const child of list) {
      if (child.parentId === top.id) {
        out.push(child);
        seen.add(child.id);
      }
    }
  }
  for (const a of list) {
    if (!seen.has(a.id)) out.push(a);
  }
  return out;
});

const formulaCandidates = computed(() =>
  (current.value?.macroActivities ?? []).map((a) => ({
    ...a,
    parentId: a.parentId ?? null,
  })),
);

function onAddCategory() {
  const name = newCategory.value.trim();
  if (!name) return;
  if (current.value?.categories.includes(name)) {
    ui.notify(t('models.catExists'), true);
    return;
  }
  models.addCategory(name);
  newCategory.value = '';
}

function onRemoveCategory(name: string) {
  if ((current.value?.categories.length ?? 0) <= 1) {
    ui.notify(t('models.needOneCat'), true);
    return;
  }
  models.removeCategory(name);
}

function onMacroTagsChange(id: string, tags: string[]) {
  updateMacro(id, { tags });
}

function onCreateTagOption(label: string) {
  models.ensureTagOption(label);
}

const editingFormulaMacro = computed(() => {
  if (formulaDraft.value) return formulaDraft.value;
  if (formulaEditId.value && current.value) {
    return (
      current.value.macroActivities.find((a) => a.id === formulaEditId.value) ?? null
    );
  }
  return null;
});

function onSaveModelFormula(patch: {
  name: string;
  percent: number;
  sourceIds: string[];
  includeFormulaSources: boolean;
  aggregate: FormulaAggregate;
}) {
  const m = current.value;
  if (!m) return;

  if (formulaDraft.value) {
    const applyCtg = formulaDraft.value.applyContingency ?? false;
    models.setMacroActivities([
      ...m.macroActivities,
      {
        id: formulaDraft.value.id,
        name: patch.name,
        category: m.categories[0] || 'Generale',
        tags: [],
        defaultHours: 0,
        kind: 'formula',
        parentId: null,
        applyContingency: applyCtg,
        formula: {
          percent: patch.percent,
          sourceIds: patch.sourceIds,
          includeFormulaSources: patch.includeFormulaSources,
          aggregate: patch.aggregate,
          applyGlobalContingency: applyCtg,
        },
      },
    ]);
    closeFormulaEditor();
    return;
  }

  if (!formulaEditId.value) return;
  const prev = m.macroActivities.find((a) => a.id === formulaEditId.value);
  const applyCtg = prev
    ? (prev.applyContingency ?? !!prev.formula?.applyGlobalContingency)
    : false;
  updateMacro(formulaEditId.value, {
    name: patch.name,
    kind: 'formula',
    defaultHours: 0,
    applyContingency: applyCtg,
    formula: {
      percent: patch.percent,
      sourceIds: patch.sourceIds,
      includeFormulaSources: patch.includeFormulaSources,
      aggregate: patch.aggregate,
      applyGlobalContingency: applyCtg,
    },
  });
  closeFormulaEditor();
}

function setMacroApplyContingency(id: string, value: boolean) {
  const m = current.value;
  if (!m) return;
  const a = m.macroActivities.find((x) => x.id === id);
  if (!a) return;

  models.setMacroActivities(
    m.macroActivities.map((row) => {
      const isTarget = row.id === id;
      const isChild = isTopLevel(a) && a.kind !== 'formula' && row.parentId === id;
      if (!isTarget && !isChild) return row;

      if (row.kind === 'formula' && row.formula) {
        return {
          ...row,
          applyContingency: value,
          formula: { ...row.formula, applyGlobalContingency: value },
        };
      }
      return { ...row, applyContingency: value };
    }),
  );
}
</script>

<template>
  <div
    class="models"
    :class="{ 'list-collapsed': listCollapsed, 'list-resizing': listResizing }"
    :style="listStyle"
  >
    <aside :aria-label="t('models.listAria')">
      <div class="aside-head">
        <button
          v-if="!listCollapsed"
          type="button"
          class="ghost"
          @click="models.createNew"
          :title="t('models.newModel')"
        >
          + {{ t('models.newShort') }}
        </button>
        <button
          v-else
          type="button"
          class="ghost icon-only"
          @click="models.createNew"
          :title="t('models.newModel')"
          :aria-label="t('models.newModel')"
        >
          +
        </button>
        <button
          v-if="!listCollapsed"
          type="button"
          class="ghost"
          :title="isTauri() ? t('models.importHint') : t('models.desktopOnly')"
          @click="onImport"
        >
          {{ t('models.import') }}
        </button>
        <button
          v-else
          type="button"
          class="ghost icon-only"
          :title="isTauri() ? t('models.importHint') : t('models.desktopOnly')"
          :aria-label="t('models.import')"
          @click="onImport"
        >
          ↓
        </button>
        <button
          type="button"
          class="ghost toggle"
          :title="listCollapsed ? t('models.expandList') : t('models.collapseList')"
          :aria-expanded="!listCollapsed"
          :aria-label="listCollapsed ? t('models.expandList') : t('models.collapseList')"
          @click="toggleList"
        >
          {{ listCollapsed ? '»' : '«' }}
        </button>
      </div>
      <div v-if="!listCollapsed" class="search-wrap">
        <input
          v-model="searchQuery"
          type="search"
          class="search"
          :placeholder="t('models.searchPh')"
          :aria-label="t('models.searchAria')"
        />
      </div>
      <ul>
        <li
          v-for="m in filteredModels"
          :key="m.id"
          :class="{ active: m.id === models.selectedId }"
          :title="m.name"
          @click="models.selectedId = m.id"
        >
          <span class="mark" aria-hidden="true">
            <ModelIcon :icon="m.icon" :name="m.name" />
          </span>
          <template v-if="!listCollapsed">
            <span class="name">{{ m.name }}</span>
            <span v-if="models.isDefault(m.id)" class="badge">{{ t('common.default') }}</span>
          </template>
        </li>
      </ul>
      <p v-if="!listCollapsed && filteredModels.length === 0" class="list-empty">
        {{ t('models.noResults') }}
      </p>
      <div
        class="list-resizer"
        role="separator"
        aria-orientation="vertical"
        :aria-label="t('models.resizeList')"
        :title="t('models.resizeList')"
        @mousedown="startListResize"
        @dblclick.stop="toggleList"
      />
    </aside>

    <section v-if="current" class="editor">
      <header class="hero">
        <div class="title-row">
          <div class="icon-picker">
            <button
              type="button"
              class="icon-trigger"
              :aria-label="t('models.iconLabel')"
              :aria-expanded="iconMenuOpen"
              :title="iconTitle((current.icon ?? 'letter') as ModelIconId)"
              @click.stop="iconMenuOpen = !iconMenuOpen"
            >
              <ModelIcon :icon="current.icon" :name="current.name" :size="18" />
            </button>
            <div
              v-if="iconMenuOpen"
              class="icon-menu"
              role="listbox"
              :aria-label="t('models.iconLabel')"
              @pointerdown.stop
            >
              <button
                v-for="opt in MODEL_ICON_OPTIONS"
                :key="opt"
                type="button"
                class="icon-opt"
                role="option"
                :aria-selected="(current.icon ?? 'letter') === opt"
                :class="{ active: (current.icon ?? 'letter') === opt }"
                :title="iconTitle(opt)"
                @click="setModelIcon(opt)"
              >
                <ModelIcon :icon="opt" :name="current.name" :size="15" />
              </button>
            </div>
          </div>
          <input
            class="title-input"
            :value="current.name"
            :placeholder="t('models.namePh')"
            @input="models.updateSelected({ name: ($event.target as HTMLInputElement).value })"
          />
        </div>

        <div class="chrome">
          <button type="button" class="primary" @click="save">{{ t('common.save') }}</button>
          <button
            type="button"
            class="danger"
            :title="t('models.deleteModel')"
            @click="onDeleteModel"
          >
            {{ t('common.delete') }}
          </button>
          <button
            v-if="!models.isDefault(current.id)"
            type="button"
            class="ghost"
            @click="setAsDefault"
          >
            {{ t('models.setDefault') }}
          </button>
          <span v-else class="default-hint">{{ t('models.defaultBadge') }}</span>

          <span class="chrome-sep" aria-hidden="true" />

          <button type="button" class="ghost" @click="onExport">
            {{ t('common.export') }}
          </button>

          <span class="chrome-sep" aria-hidden="true" />

          <label
            class="inline-field"
            :title="t('models.hoursPerDayTitle')"
          >
            {{ t('working.oneDayEq') }}
            <span class="pct-wrap">
              <input
                type="number"
                min="1"
                max="24"
                step="0.5"
                :value="current.hoursPerDay ?? 8"
                @input="models.updateSelected({ hoursPerDay: Math.min(24, Math.max(1, Number(($event.target as HTMLInputElement).value) || 8)) })"
              />
              <span>{{ t('common.ore') }}</span>
            </span>
          </label>

          <label class="inline-field id-field">
            ID
            <input
              class="id-input"
              :value="current.id"
              @input="models.updateSelected({ id: ($event.target as HTMLInputElement).value })"
            />
          </label>

          <span v-if="models.dirty" class="dirty">{{ t('common.unsaved') }}</span>
        </div>
      </header>

      <section class="cats" :aria-label="t('models.catsAria')">
        <div class="cats-head">
          <span class="cats-label">{{ t('models.catsLabel') }}</span>
          <form class="cat-add" @submit.prevent="onAddCategory">
            <input
              v-model="newCategory"
              type="text"
              :placeholder="t('models.newCatPh')"
              :aria-label="t('models.newCatPh')"
            />
            <button type="submit" class="ghost">{{ t('models.addCat') }}</button>
          </form>
        </div>
        <div class="chips">
          <span v-for="cat in current.categories" :key="cat" class="chip">
            {{ cat }}
            <button
              type="button"
              class="chip-x"
              :title="current.categories.length <= 1 ? t('models.needOneCat') : t('models.removeCat', { name: cat })"
              :disabled="current.categories.length <= 1"
              @click="onRemoveCategory(cat)"
            >
              ×
            </button>
          </span>
        </div>
      </section>

      <section class="ctg-block" :aria-label="t('models.ctgAria')">
        <div class="ctg-head">
          <div class="ctg-copy">
            <h3 class="ctg-title">{{ t('models.ctgTitle') }}</h3>
            <p class="ctg-lede">
              {{ t('models.ctgLede') }}
            </p>
          </div>
          <label
            class="inline-field ctg-percent"
            :title="t('models.ctgPercentTitle')"
          >
            {{ t('common.ctg') }}
            <span class="pct-wrap">
              <input
                type="number"
                min="0"
                max="100"
                :value="current.contingency.defaultPercent"
                @input="models.updateSelected({ contingency: { ...current.contingency, defaultPercent: Number(($event.target as HTMLInputElement).value) || 0 } })"
              />
              <span>%</span>
            </span>
          </label>
        </div>

        <div class="info-box">
          <button
            type="button"
            class="info-toggle"
            :aria-expanded="ctgHelpOpen"
            @click="ctgHelpOpen = !ctgHelpOpen"
          >
            <span>{{ ctgHelpOpen ? '▾' : '▸' }} {{ t('models.howCalc') }}</span>
            <span class="info-hint">{{ t('models.howHint') }}</span>
          </button>
          <div v-show="ctgHelpOpen" class="how">
            <p>{{ t('models.howP1') }}</p>
            <p class="formula">{{ t('models.howFormula') }}</p>
            <p>{{ t('models.howP2') }}</p>
          </div>
        </div>
      </section>

      <div class="table-shell">
        <table class="data-table sheet">
          <thead>
            <tr>
              <th
                class="resizable"
                :class="{ collapsed: cols.collapsed.name }"
                :style="cols.styleFor('name')"
                :title="t('common.expandCol')"
                @dblclick="onHeaderDblClick('name')"
              >
                <span v-if="!cols.collapsed.name">{{ t('columns.name') }}</span>
                <span v-else class="abbr">N</span>
                <span class="col-resizer" @mousedown="cols.startResize('name', $event)" />
              </th>
              <th
                class="resizable"
                :class="{ collapsed: cols.collapsed.category }"
                :style="cols.styleFor('category')"
                :title="t('common.expandCol')"
                @dblclick="onHeaderDblClick('category')"
              >
                <span v-if="!cols.collapsed.category">{{ t('columns.category') }}</span>
                <span v-else class="abbr">C</span>
                <span class="col-resizer" @mousedown="cols.startResize('category', $event)" />
              </th>
              <th
                class="resizable"
                :class="{ collapsed: cols.collapsed.hours }"
                :style="cols.styleFor('hours')"
                :title="t('common.expandCol')"
                @dblclick="onHeaderDblClick('hours')"
              >
                <span v-if="!cols.collapsed.hours">{{ t('columns.hours') }}</span>
                <span v-else class="abbr">h</span>
                <span class="col-resizer" @mousedown="cols.startResize('hours', $event)" />
              </th>
              <th
                class="resizable center-th"
                :class="{ collapsed: cols.collapsed.ctg }"
                :style="cols.styleFor('ctg')"
                :title="t('models.ctgColTitle')"
                @dblclick="onHeaderDblClick('ctg')"
              >
                <span v-if="!cols.collapsed.ctg">{{ t('columns.ctg') }}</span>
                <span v-else class="abbr">%</span>
                <span class="col-resizer" @mousedown="cols.startResize('ctg', $event)" />
              </th>
              <th
                v-if="cols.isVisible('tags')"
                class="resizable"
                :class="{ collapsed: cols.collapsed.tags }"
                :style="cols.styleFor('tags')"
                :title="t('common.expandCol')"
                @dblclick="onHeaderDblClick('tags')"
              >
                <span v-if="!cols.collapsed.tags">{{ t('columns.tags') }}</span>
                <span v-else class="abbr">T</span>
                <span class="col-resizer" @mousedown="cols.startResize('tags', $event)" />
              </th>
              <th
                class="resizable"
                :class="{ collapsed: cols.collapsed.actions }"
                :style="cols.styleFor('actions')"
                :title="t('common.expandCol')"
                @dblclick="onHeaderDblClick('actions')"
              >
                <span v-if="!cols.collapsed.actions" />
                <span class="col-resizer" @mousedown="cols.startResize('actions', $event)" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="a in orderedActivities"
              :key="a.id"
              :class="{
                formula: a.kind === 'formula',
                macro: isTopLevel(a),
                sub: !isTopLevel(a),
              }"
            >
              <td
                :style="cols.styleFor('name')"
                :class="{ collapsed: cols.collapsed.name }"
              >
                <div
                  v-if="!cols.collapsed.name"
                  class="name-cell"
                  :style="{ paddingLeft: isTopLevel(a) ? '0' : '1.35rem' }"
                >
                  <button
                    v-if="isTopLevel(a) && hasChildren(a.id)"
                    type="button"
                    class="collapse"
                    :aria-expanded="!isCollapsed(a.id)"
                    :aria-label="isCollapsed(a.id) ? t('common.expand') : t('common.collapse')"
                    @click="toggleMacroCollapse(a.id)"
                  >
                    {{ isCollapsed(a.id) ? '▸' : '▾' }}
                  </button>
                  <span
                    v-else-if="a.kind === 'formula'"
                    class="formula-mark"
                    aria-hidden="true"
                  >=</span>
                  <span v-else-if="!isTopLevel(a)" class="task-mark" aria-hidden="true">·</span>
                  <span v-else class="collapse-spacer" aria-hidden="true" />
                  <input
                    :value="a.name"
                    :class="{ 'macro-name': isTopLevel(a) }"
                    @input="updateMacro(a.id, { name: ($event.target as HTMLInputElement).value })"
                  />
                </div>
              </td>
              <td
                :style="cols.styleFor('category')"
                :class="{ collapsed: cols.collapsed.category }"
              >
                <template v-if="!cols.collapsed.category">
                  <select
                    v-if="isTopLevel(a)"
                    :value="a.category"
                    @change="updateMacro(a.id, { category: ($event.target as HTMLSelectElement).value })"
                  >
                    <option
                      v-for="c in current.categories"
                      :key="c"
                      :value="c"
                    >
                      {{ c }}
                    </option>
                  </select>
                  <span v-else class="muted cat">{{ a.category }}</span>
                </template>
              </td>
              <td
                :style="cols.styleFor('hours')"
                :class="{ collapsed: cols.collapsed.hours }"
              >
                <template v-if="!cols.collapsed.hours">
                  <input
                    v-if="hoursEditable(a)"
                    class="num"
                    type="number"
                    min="0"
                    :value="a.defaultHours"
                    @input="updateMacro(a.id, { defaultHours: Number(($event.target as HTMLInputElement).value) || 0 })"
                  />
                  <span
                    v-else-if="a.kind !== 'formula' && hasChildren(a.id)"
                    class="readonly muted"
                    :title="t('models.hoursFromSubs')"
                  >{{ childrenHours(a.id) }}</span>
                  <button
                    v-else-if="a.kind === 'formula'"
                    type="button"
                    class="ghost formula-btn"
                    :title="a.formula ? formulaLabel(a.formula) : t('models.editFormula')"
                    @click="openFormulaEditor(a.id)"
                  >
                    {{ a.formula ? formulaLabel(a.formula) : 'Σ × %' }}
                  </button>
                </template>
              </td>
              <td
                class="center"
                :style="cols.styleFor('ctg')"
                :class="{ collapsed: cols.collapsed.ctg }"
              >
                <input
                  v-if="!cols.collapsed.ctg"
                  type="checkbox"
                  :checked="resolveAppliesContingency(a)"
                  :title="resolveAppliesContingency(a) ? t('models.ctgOn') : t('models.ctgOff')"
                  :aria-label="`Contingency su ${a.name}`"
                  @change="setMacroApplyContingency(a.id, ($event.target as HTMLInputElement).checked)"
                />
              </td>
              <td
                v-if="cols.isVisible('tags')"
                :style="cols.styleFor('tags')"
                :class="{ collapsed: cols.collapsed.tags }"
              >
                <TagPicker
                  v-if="!cols.collapsed.tags"
                  :model-value="a.tags ?? []"
                  :options="tagOptionsForPicker"
                  :aria-label="`${t('columns.tags')}: ${a.name}`"
                  @update:model-value="onMacroTagsChange(a.id, $event)"
                  @create-option="onCreateTagOption"
                />
              </td>
              <td
                class="row-actions"
                :style="cols.styleFor('actions')"
                :class="{ collapsed: cols.collapsed.actions }"
              >
                <template v-if="!cols.collapsed.actions">
                  <button
                    v-if="isTopLevel(a) && a.kind !== 'formula'"
                    type="button"
                    class="ghost"
                    @click="addSubtask(a.id)"
                  >
                    {{ t('working.addTask') }}
                  </button>
                  <IconBtn
                    v-if="a.kind === 'formula'"
                    kind="edit"
                    :label="t('models.editFormula')"
                    @click="openFormulaEditor(a.id)"
                  />
                  <IconBtn
                    kind="delete"
                    :label="t('common.delete')"
                    @click="removeMacro(a.id)"
                  />
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="add-row">
        <button type="button" class="ghost" @click="addMacro">{{ t('models.addMacro') }}</button>
        <button
          type="button"
          class="ghost"
          :title="t('models.addFormulaTitle')"
          @click="addFormulaMacro"
        >
          {{ t('models.addFormula') }}
        </button>
      </div>
      <p v-if="models.lastError" class="err">{{ models.lastError }}</p>
    </section>

    <p v-else class="empty muted">{{ t('models.empty') }}</p>

    <FormulaEditor
      v-if="editingFormulaMacro && current"
      :item="editingFormulaMacro"
      :candidates="formulaCandidates"
      @close="closeFormulaEditor"
      @save="onSaveModelFormula"
    />

    <ConfirmModal
      :open="pendingDelete"
      :title="t('models.deleteModel')"
      :message="t('models.deleteConfirm', { name: current?.name ?? '' })"
      :confirm-label="t('common.delete')"
      danger
      @cancel="pendingDelete = false"
      @confirm="confirmDeleteModel"
    />
  </div>
</template>

<style scoped>
.models {
  display: grid;
  grid-template-columns: var(--list-w, 200px) minmax(0, 1fr);
  gap: 1.25rem;
  min-height: 420px;
  transition: grid-template-columns 0.18s ease;
}

.models.list-resizing {
  transition: none;
}

aside {
  position: relative;
  border-right: 1px solid var(--line);
  padding-right: 0.85rem;
  min-width: 0;
  overflow: hidden;
}

.list-collapsed aside {
  padding-right: 0.35rem;
}

.list-resizer {
  position: absolute;
  top: 0;
  right: -0.7rem;
  width: 10px;
  height: 100%;
  cursor: col-resize;
  z-index: 3;
  touch-action: none;
}

.list-resizer::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  border-radius: 1px;
  background: transparent;
  transition: background 0.12s ease;
}

.list-resizer:hover::after,
.list-resizing .list-resizer::after {
  background: color-mix(in srgb, var(--accent) 55%, var(--line));
}

.aside-head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.65rem;
}

.aside-head .toggle {
  margin-left: auto;
}

.list-collapsed .aside-head {
  flex-direction: column;
  align-items: stretch;
}

.list-collapsed .aside-head .toggle {
  margin-left: 0;
}

.search-wrap {
  margin-bottom: 0.55rem;
}

.search {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  padding: 0.4rem 0.55rem;
  font-size: 0.85rem;
  color: var(--ink);
}

.search:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--accent) 40%, var(--line));
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.search::placeholder {
  color: var(--muted-soft);
}

.list-empty {
  margin: 0.35rem 0.15rem 0;
  font-size: 0.8rem;
  color: var(--muted);
}

.toggle,
.icon-only {
  width: 1.9rem;
  height: 1.9rem;
  padding: 0 !important;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.list-collapsed .toggle,
.list-collapsed .icon-only {
  width: 100%;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.15rem;
}

li {
  padding: 0.45rem 0.45rem;
  cursor: pointer;
  color: var(--muted);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.92rem;
  min-width: 0;
}

.list-collapsed li {
  justify-content: center;
  padding: 0.45rem 0.2rem;
}

li:hover {
  color: var(--ink);
  background: var(--accent-glow);
}

li.active {
  color: var(--accent);
  font-weight: 600;
  background: var(--accent-soft);
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.mark {
  width: 1.55rem;
  height: 1.55rem;
  display: inline-grid;
  place-items: center;
  border-radius: 5px;
  font-size: 0.72rem;
  font-weight: 600;
  background: color-mix(in srgb, var(--page) 70%, var(--surface));
  color: inherit;
  flex-shrink: 0;
}

.mark :deep(.model-icon) {
  width: 100%;
  height: 100%;
}

li.active .mark {
  background: var(--accent);
  color: var(--on-accent);
}

.badge {
  margin-left: auto;
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-soft);
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  flex-shrink: 0;
}

.editor {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.editor .table-shell {
  flex: 1 1 auto;
  max-height: min(60vh, 520px);
}

.hero {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  overflow: visible;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.title-input {
  flex: 1;
  min-width: 0;
  width: auto;
  height: 2.15rem;
  box-sizing: border-box;
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  font-family: var(--font-brand);
  font-size: clamp(1.35rem, 2vw, 1.75rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--ink);
  line-height: 2.15rem;
}

.title-input:focus {
  outline: none;
}

.icon-picker {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 2.15rem;
}

.icon-trigger {
  width: 2.15rem;
  height: 2.15rem;
  padding: 0;
  margin: 0;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink-soft);
  cursor: pointer;
  line-height: 0;
}

.icon-trigger:hover {
  border-color: var(--line-strong);
  color: var(--ink);
}

.icon-trigger[aria-expanded='true'] {
  border-color: var(--accent);
  color: var(--accent);
}

.icon-menu {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: repeat(7, 1.9rem);
  gap: 0.3rem;
  padding: 0.45rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-menu);
}

.icon-opt {
  width: 1.9rem;
  height: 1.9rem;
  padding: 0;
  display: inline-grid;
  place-items: center;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.icon-opt:hover {
  color: var(--ink);
  background: var(--page-soft);
}

.icon-opt.active {
  color: var(--on-accent);
  background: var(--accent);
  border-color: var(--accent);
}

.cats {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.15rem 0 0.25rem;
}

.cats-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
}

.cats-label {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
}

.cat-add {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.cat-add input {
  width: 10rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  padding: 0.35rem 0.5rem;
  font-size: 0.88rem;
}

.cat-add input:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--accent) 40%, var(--line));
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.28rem 0.35rem 0.28rem 0.55rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  background: var(--surface);
  font-size: 0.85rem;
  color: var(--ink-soft);
}

.chip-x {
  border: none !important;
  background: transparent !important;
  color: var(--muted) !important;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0 !important;
  line-height: 1;
  font-size: 1rem;
}

.chip-x:hover:not(:disabled) {
  color: var(--danger) !important;
  background: var(--danger-soft) !important;
}

.chip-x:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.ctg-block {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
}

.ctg-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.55rem 1rem;
}

.ctg-copy {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  flex: 1 1 12rem;
}

.ctg-title {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
}

.ctg-lede {
  margin: 0;
  font-size: 0.88rem;
  color: var(--ink-soft);
  line-height: 1.4;
}

.ctg-percent {
  flex: 0 0 auto;
  margin: 0;
}

.info-box {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.info-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  margin: 0;
  padding: 0.5rem 0.7rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--page-soft);
  color: var(--ink-soft);
  font-size: 0.88rem;
  font-weight: 550;
  cursor: pointer;
  text-align: left;
}

.info-toggle:hover {
  border-color: var(--line-strong);
  color: var(--ink);
}

.info-hint {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--muted);
  white-space: nowrap;
}

.ctg-block .how {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.7rem 0.85rem;
  border-radius: var(--radius-sm);
  background: var(--page-soft);
  border: 1px solid var(--line);
}

.ctg-block .how p {
  margin: 0;
  font-size: 0.88rem;
  color: var(--ink-soft);
  line-height: 1.45;
}

.ctg-block .formula {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--ink);
  padding: 0.4rem 0.55rem;
  border-radius: var(--radius-sm);
  background: var(--surface);
  border: 1px dashed var(--line);
}

.ctg-block strong {
  color: var(--ink);
  font-weight: 650;
}

.center-th {
  text-align: center;
}

.center {
  text-align: center;
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

.row-actions {
  white-space: nowrap;
  overflow: visible;
}

.row-actions :deep(.icon-btn) {
  margin-right: 0.15rem;
}

.chrome {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.55rem;
  overflow: visible;
}

.chrome-sep {
  width: 1px;
  height: 1.15rem;
  background: var(--line);
  flex-shrink: 0;
}

.default-hint {
  font-size: 0.8rem;
  color: var(--muted);
}

.dirty {
  margin-left: auto;
  color: var(--warn);
  font-size: 0.8rem;
  font-weight: 500;
}

.export-menu {
  position: relative;
}

.menu {
  position: absolute;
  right: 0;
  top: calc(100% + 0.35rem);
  min-width: 140px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 0.35rem;
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

.inline-field {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--muted);
  white-space: nowrap;
}

.pct-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  padding: 0.15rem 0.4rem 0.15rem 0.25rem;
}

.pct-wrap input {
  width: 2.6rem;
  border: none;
  background: transparent;
  padding: 0.1rem;
  font-weight: 600;
  text-align: right;
  color: var(--ink);
}

.pct-wrap input:focus {
  outline: none;
}

.id-field {
  min-width: 0;
}

.id-input {
  width: 7.5rem;
  border: none;
  border-bottom: 1px solid transparent;
  background: transparent;
  padding: 0.15rem 0;
  color: var(--muted);
  font-weight: 400;
  font-size: 0.85rem;
}

.id-input:hover,
.id-input:focus {
  border-bottom-color: var(--line-strong);
  color: var(--ink);
  outline: none;
}

.err {
  color: var(--danger);
  margin: 0;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
}

.name-cell input {
  flex: 1;
  min-width: 0;
}

.name-cell input.macro-name {
  font-weight: 600;
}

.collapse {
  border: none;
  background: transparent;
  color: var(--muted);
  width: 1.4rem;
  flex: 0 0 auto;
  padding: 0;
  font-size: 0.85rem;
  line-height: 1;
  cursor: pointer;
}

.collapse:hover {
  color: var(--ink);
}

.collapse-spacer {
  display: inline-block;
  width: 1.4rem;
  flex: 0 0 auto;
}

.task-mark {
  display: inline-block;
  width: 1.4rem;
  flex: 0 0 auto;
  text-align: center;
  color: var(--muted);
  font-weight: 700;
}

.cat {
  font-size: 0.9rem;
}

.readonly {
  font-variant-numeric: tabular-nums;
}

tr.macro td {
  background: var(--page-soft);
}

tr.sub td {
  background: var(--surface);
}

.formula-mark {
  width: 1.1rem;
  text-align: center;
  font-weight: 700;
  color: var(--accent);
  flex-shrink: 0;
}

.formula-btn {
  font-size: 0.78rem !important;
  font-weight: 600;
  color: var(--accent) !important;
}

.formula td {
  background: color-mix(in srgb, var(--accent) 5%, var(--surface));
}

.add-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.empty {
  grid-column: 1 / -1;
}

@media (max-width: 800px) {
  .models,
  .models.list-collapsed,
  .models.list-resizing {
    grid-template-columns: 1fr;
  }

  aside {
    border-right: none;
    border-bottom: 1px solid var(--line);
    padding-right: 0;
    padding-bottom: 1rem;
  }

  .list-resizer {
    display: none;
  }

  .list-collapsed aside {
    padding-right: 0;
  }

  .list-collapsed .aside-head {
    flex-direction: row;
  }

  .list-collapsed .toggle,
  .list-collapsed .icon-only {
    width: 1.9rem;
  }

  .list-collapsed li {
    justify-content: flex-start;
  }

  .chrome-sep {
    display: none;
  }
}
</style>
