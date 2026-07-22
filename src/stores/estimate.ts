import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Estimate, LineItem, MacroClientPresentationMode } from '../models/estimate';
import { parseEstimate } from '../models/estimate';
import type { Model } from '../models/model';
import type { FormulaAggregate } from '../models/model';
import { createEmptyEstimate, createEstimateFromModel } from '../lib/factory';
import { computeTotals, buildSeparateContingencyRows } from '../lib/contingency';
import {
  buildClientPresentedLines,
  buildClientPresentedTotals,
  buildClientSystemTotals,
  splitProportionally,
} from '../lib/clientPresentation';
import { nowIso, newId } from '../lib/ids';
import { nextCopyName } from '../lib/copyName';
import { reorderHierarchical } from '../lib/reorderHierarchical';
import { useSettingsStore } from './settings';
import type { ClientLineOverride } from '../models/estimate';

export const useEstimateStore = defineStore('estimate', () => {
  const settingsStore = useSettingsStore();
  const estimate = ref<Estimate>(createEmptyEstimate(settingsStore.settings));
  const filePath = ref<string | null>(null);
  const dirty = ref(false);
  const lastError = ref<string | null>(null);
  /** Macro ids currently collapsed in working view. */
  const collapsedMacros = ref<Set<string>>(new Set());

  const totals = computed(() => computeTotals(estimate.value));

  const showInlineCtg = computed(() => {
    const p = estimate.value.contingency.placement;
    return p === 'inline' || p === 'both';
  });

  const showSeparateCtg = computed(() => {
    const p = estimate.value.contingency.placement;
    return p === 'separate_line' || p === 'both';
  });

  const separateRows = computed(() =>
    showSeparateCtg.value
      ? buildSeparateContingencyRows(totals.value, estimate.value.contingency.mode)
      : [],
  );

  const visibleLines = computed(() =>
    totals.value.lines.filter((line) => {
      if (line.isMacro) return true;
      const parentId = line.item.parentId;
      if (!parentId) return true;
      return !collapsedMacros.value.has(parentId);
    }),
  );

  const clientLines = computed(() =>
    buildClientPresentedLines(estimate.value, { includeHidden: true }),
  );

  const clientTotals = computed(() => buildClientPresentedTotals(clientLines.value));

  /** Valori calcolati (arrotondamento), senza ritocchi utente. */
  const clientBaselineLines = computed(() =>
    buildClientPresentedLines(estimate.value, {
      includeHidden: true,
      ignoreOverrides: true,
    }),
  );

  const clientBaselineTotals = computed(() =>
    buildClientSystemTotals(clientBaselineLines.value),
  );

  const hasClientOverrides = computed(
    () =>
      Object.keys(estimate.value.clientView.lineOverrides ?? {}).length > 0 ||
      estimate.value.items.some((item) => !item.clientVisible),
  );

  const clientTitle = computed(
    () => estimate.value.clientView.titleOverride || estimate.value.meta.title,
  );

  function touch() {
    estimate.value.meta.updatedAt = nowIso();
    dirty.value = true;
  }

  function setEstimate(next: Estimate, path: string | null = null) {
    const parsed = parseEstimate(next);
    if (!parsed.ok) {
      lastError.value = parsed.error;
      return false;
    }
    estimate.value = parsed.data;
    filePath.value = path;
    dirty.value = false;
    lastError.value = null;
    collapsedMacros.value = new Set();
    return true;
  }

  function newFromModel(model: Model) {
    setEstimate(createEstimateFromModel(model, settingsStore.settings));
  }

  function newEmpty() {
    setEstimate(createEmptyEstimate(settingsStore.settings));
  }

  function updateMeta(patch: Partial<Estimate['meta']>) {
    estimate.value.meta = { ...estimate.value.meta, ...patch };
    touch();
  }

  function updateContingency(patch: Partial<Estimate['contingency']>) {
    estimate.value.contingency = { ...estimate.value.contingency, ...patch };
    touch();
  }

  function updateClientView(patch: Partial<Estimate['clientView']>) {
    estimate.value.clientView = { ...estimate.value.clientView, ...patch };
    touch();
  }

  function setMacroClientPresentation(macroId: string, mode: MacroClientPresentationMode) {
    const next = { ...(estimate.value.clientView.macroPresentation ?? {}) };
    next[macroId] = mode;
    updateClientView({ macroPresentation: next });
  }

  function setClientVisible(id: string, value: boolean) {
    const item = estimate.value.items.find((i) => i.id === id);
    if (!item) return;
    estimate.value.items = estimate.value.items.map((row) => {
      if (row.id === id) return { ...row, clientVisible: value };
      // Macro → propaga ai sotto-task
      if (item.parentId == null && item.kind !== 'formula' && row.parentId === id) {
        return { ...row, clientVisible: value };
      }
      return row;
    });
    touch();
  }

  function setClientPresentedEffort(id: string, hours: number) {
    const safe = Math.max(0, Number.isFinite(hours) ? hours : 0);
    const current = estimate.value.clientView.lineOverrides?.[id] ?? {};
    const next: ClientLineOverride = { ...current, hoursPresented: safe };

    estimate.value.clientView = {
      ...estimate.value.clientView,
      lineOverrides: {
        ...(estimate.value.clientView.lineOverrides ?? {}),
        [id]: next,
      },
    };
    touch();
  }

  function resetClientOverrides() {
    const hasOverrides = Object.keys(estimate.value.clientView.lineOverrides ?? {}).length > 0;
    const hasHiddenItems = estimate.value.items.some((item) => !item.clientVisible);
    if (!hasOverrides && !hasHiddenItems) return;
    estimate.value.clientView = {
      ...estimate.value.clientView,
      lineOverrides: {},
    };
    estimate.value.items = estimate.value.items.map((item) => ({ ...item, clientVisible: true }));
    touch();
  }

  /**
   * Nasconde la riga (e i sotto-task se è macro) e spalmma le sue ore
   * sulle altre voci ancora visibili al cliente, in proporzione.
   */
  function redistributeClientLine(id: string): boolean {
    const lines = clientLines.value;
    const source = lines.find((l) => l.item.id === id);
    if (!source || !source.item.clientVisible) return false;

    const childIds = new Set(
      estimate.value.items.filter((i) => i.parentId === id).map((i) => i.id),
    );
    const hideIds = new Set<string>([id, ...childIds]);

    let movePresented = 0;
    for (const l of lines) {
      if (!hideIds.has(l.item.id)) continue;
      if (!l.item.clientVisible) continue;
      if (!l.contributesToTotals) continue;
      movePresented += l.hoursPresented;
    }

    const targets = lines.filter(
      (l) =>
        l.contributesToTotals &&
        l.item.clientVisible &&
        !hideIds.has(l.item.id),
    );
    if (targets.length === 0) return false;

    const additions = splitProportionally(
      movePresented,
      targets.map((t) => t.hoursPresented),
    );

    const overrides: Record<string, ClientLineOverride> = {
      ...(estimate.value.clientView.lineOverrides ?? {}),
    };

    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      overrides[t.item.id] = {
        hoursPresented: t.hoursPresented + additions[i],
      };
    }

    // Azzera le ore presentate delle righe nascoste (se ri-mostrate non si doppiano).
    for (const hid of hideIds) {
      overrides[hid] = {
        hoursPresented: 0,
      };
    }

    estimate.value.clientView = {
      ...estimate.value.clientView,
      lineOverrides: overrides,
    };

    estimate.value.items = estimate.value.items.map((row) =>
      hideIds.has(row.id) ? { ...row, clientVisible: false } : row,
    );
    touch();
    return true;
  }

  function updateItem(id: string, patch: Partial<LineItem>) {
    const idx = estimate.value.items.findIndex((i) => i.id === id);
    if (idx < 0) return;
    const prev = estimate.value.items[idx];
    estimate.value.items[idx] = { ...prev, ...patch };

    // Se cambia categoria sulla macro, propaga ai sotto-task
    if (prev.parentId == null && patch.category && patch.category !== prev.category) {
      for (const item of estimate.value.items) {
        if (item.parentId === id) {
          item.category = patch.category;
        }
      }
    }
    touch();
  }

  function ensureTagOption(name: string) {
    const tag = name.trim();
    if (!tag) return;
    const opts = estimate.value.tagOptions ?? [];
    if (opts.includes(tag)) return;
    estimate.value.tagOptions = [...opts, tag];
    touch();
  }

  function addMacro() {
    const cats = settingsStore.settings.defaultCategories;
    const category = cats[0] ?? 'Generale';
    const id = newId('macro');
    estimate.value.items.push({
      id,
      name: 'Nuova macro',
      hours: 0,
      category,
      kind: 'operational',
      parentId: null,
      contingencyPercentOverride: null,
      notes: '',
      tags: [],
      clientVisible: true,
      applyContingency: true,
    });
    touch();
  }

  /** Voce derivata: aggregate(sourceIds) × percent. Default: tutte le macro operative top-level. */
  function addFormula(opts?: {
    id?: string;
    name?: string;
    percent?: number;
    sourceIds?: string[];
    includeFormulaSources?: boolean;
    aggregate?: FormulaAggregate;
    applyGlobalContingency?: boolean;
    category?: string;
  }) {
    const cats = settingsStore.settings.defaultCategories;
    const category = opts?.category ?? cats[0] ?? 'Generale';
    const defaultSources =
      opts?.sourceIds ??
      estimate.value.items
        .filter((i) => i.parentId == null && i.kind !== 'formula' && i.kind !== 'summary')
        .map((i) => i.id);
    const id = opts?.id ?? newId('formula');
    const applyCtg = opts?.applyGlobalContingency ?? false;
    estimate.value.items.push({
      id,
      name: opts?.name ?? 'Overhead',
      hours: 0,
      category,
      kind: 'formula',
      parentId: null,
      contingencyPercentOverride: null,
      notes: '',
      tags: [],
      clientVisible: true,
      applyContingency: applyCtg,
      formula: {
        percent: opts?.percent ?? 30,
        sourceIds: [...defaultSources],
        includeFormulaSources: opts?.includeFormulaSources ?? false,
        aggregate: opts?.aggregate ?? 'sum',
        applyGlobalContingency: applyCtg,
      },
    });
    touch();
    return id;
  }

  function updateFormula(
    id: string,
    patch: Partial<{
      percent: number;
      sourceIds: string[];
      includeFormulaSources: boolean;
      aggregate: FormulaAggregate;
      applyGlobalContingency: boolean;
    }>,
  ) {
    const idx = estimate.value.items.findIndex((i) => i.id === id);
    if (idx < 0) return;
    const prev = estimate.value.items[idx];
    if (prev.kind !== 'formula' || !prev.formula) return;
    const applyCtg =
      patch.applyGlobalContingency ??
      prev.applyContingency ??
      prev.formula.applyGlobalContingency ??
      false;
    const { applyGlobalContingency: _ignored, ...formulaPatch } = patch;
    estimate.value.items[idx] = {
      ...prev,
      applyContingency: applyCtg,
      formula: {
        ...prev.formula,
        ...formulaPatch,
        applyGlobalContingency: applyCtg,
        sourceIds: patch.sourceIds ? [...patch.sourceIds] : [...prev.formula.sourceIds],
      },
    };
    touch();
  }

  function addSubtask(macroId: string) {
    const macro = estimate.value.items.find(
      (i) => i.id === macroId && i.parentId == null && i.kind !== 'formula',
    );
    if (!macro) return;

    const alreadyHasChildren = estimate.value.items.some((i) => i.parentId === macroId);
    if (!alreadyHasChildren) {
      const mIdx = estimate.value.items.findIndex((i) => i.id === macroId);
      if (mIdx >= 0) estimate.value.items[mIdx].hours = 0;
    }

    collapsedMacros.value.delete(macroId);
    collapsedMacros.value = new Set(collapsedMacros.value);

    estimate.value.items.push({
      id: newId('task'),
      name: 'Nuovo sotto-task',
      hours: 0,
      category: macro.category,
      kind: 'operational',
      parentId: macroId,
      contingencyPercentOverride: null,
      notes: '',
      tags: [],
      clientVisible: true,
      applyContingency: macro.applyContingency ?? true,
    });
    touch();
  }

  /** Duplica una voce; se è macro, clona anche i sotto-task. */
  function duplicateItem(id: string, locale: 'it' | 'en' = 'it') {
    const items = estimate.value.items;
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return;

    const source = items[idx];
    const names = items.map((i) => i.name);
    const cloneOne = (item: LineItem, newParentId: string | null, rename: boolean): LineItem => {
      const next: LineItem = {
        ...item,
        id: newId(item.parentId ? 'task' : item.kind === 'formula' ? 'formula' : 'macro'),
        name: rename ? nextCopyName(item.name, names, locale) : item.name,
        parentId: newParentId,
        contingencyPercentOverride: item.contingencyPercentOverride,
        notes: item.notes,
        formula: item.formula
          ? {
              ...item.formula,
              sourceIds: [...item.formula.sourceIds],
            }
          : undefined,
      };
      if (rename) names.push(next.name);
      return next;
    };

    // Sotto-task: solo quella riga, subito dopo l’originale
    if (source.parentId != null) {
      const clone = cloneOne(source, source.parentId, true);
      items.splice(idx + 1, 0, clone);
      touch();
      return;
    }

    // Macro / formula top-level (+ eventuali figli della macro)
    const group = [source, ...items.filter((i) => i.parentId === id)];
    let end = idx;
    while (end + 1 < items.length && items[end + 1].parentId === id) end += 1;

    const idMap = new Map<string, string>();
    const clones: LineItem[] = [];
    for (const item of group) {
      const parent =
        item.parentId == null ? null : (idMap.get(item.parentId) ?? item.parentId);
      const clone = cloneOne(item, parent, item.id === id);
      idMap.set(item.id, clone.id);
      clones.push(clone);
    }

    // Rimappa sourceIds delle formule clonate se puntano a voci del gruppo
    for (const clone of clones) {
      if (!clone.formula) continue;
      clone.formula = {
        ...clone.formula,
        sourceIds: clone.formula.sourceIds.map((sid) => idMap.get(sid) ?? sid),
      };
    }

    items.splice(end + 1, 0, ...clones);
    touch();
  }

  function removeItem(id: string) {
    const target = estimate.value.items.find((i) => i.id === id);
    if (!target) return;
    if (target.parentId == null) {
      estimate.value.items = estimate.value.items.filter(
        (i) => i.id !== id && i.parentId !== id,
      );
      collapsedMacros.value.delete(id);
      collapsedMacros.value = new Set(collapsedMacros.value);
    } else {
      estimate.value.items = estimate.value.items.filter((i) => i.id !== id);
    }
    // Pulisci riferimenti nelle formule
    for (const item of estimate.value.items) {
      if (item.formula?.sourceIds.includes(id)) {
        item.formula = {
          ...item.formula,
          sourceIds: item.formula.sourceIds.filter((s) => s !== id),
        };
      }
    }
    touch();
  }

  function reorderItem(dragId: string, targetId: string) {
    const next = reorderHierarchical(estimate.value.items, dragId, targetId);
    if (!next) return;
    estimate.value.items = next;
    touch();
  }

  function toggleMacro(id: string) {
    const next = new Set(collapsedMacros.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    collapsedMacros.value = next;
  }

  function isCollapsed(id: string) {
    return collapsedMacros.value.has(id);
  }

  function applySessionPercentAsDefault() {
    settingsStore.settings.defaultContingencyPercentage = estimate.value.contingency.percent;
    settingsStore.settings.defaultContingencyMode = estimate.value.contingency.mode;
    settingsStore.settings.defaultContingencyPlacement = estimate.value.contingency.placement;
    settingsStore.settings.contingencyTargetCategories = [
      ...estimate.value.contingency.targetCategories,
    ];
  }

  function markSaved(path: string | null) {
    filePath.value = path;
    dirty.value = false;
  }

  return {
    estimate,
    filePath,
    dirty,
    lastError,
    collapsedMacros,
    totals,
    visibleLines,
    showInlineCtg,
    showSeparateCtg,
    separateRows,
    clientLines,
    clientTotals,
    clientBaselineLines,
    clientBaselineTotals,
    clientTitle,
    hasClientOverrides,
    setEstimate,
    newFromModel,
    newEmpty,
    updateMeta,
    updateContingency,
    updateClientView,
    setMacroClientPresentation,
    setClientVisible,
    setClientPresentedEffort,
    resetClientOverrides,
    redistributeClientLine,
    ensureTagOption,
    updateItem,
    addMacro,
    addFormula,
    updateFormula,
    addSubtask,
    duplicateItem,
    removeItem,
    reorderItem,
    toggleMacro,
    isCollapsed,
    applySessionPercentAsDefault,
    markSaved,
    touch,
  };
});
