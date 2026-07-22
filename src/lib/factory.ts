import type { Estimate, LineItem } from '../models/estimate';
import type { Model } from '../models/model';
import type { Settings } from '../models/settings';
import { DEFAULT_SETTINGS } from '../models/settings';
import { newId, nowIso } from './ids';
import { resolveAppliesContingency } from './applyContingency';

function macroFrom(
  id: string,
  name: string,
  category: string,
  kind: LineItem['kind'] = 'operational',
  formula?: LineItem['formula'],
  applyContingency = kind !== 'formula',
): LineItem {
  return {
    id,
    name,
    hours: 0,
    category,
    kind,
    parentId: null,
    contingencyPercentOverride: null,
    notes: '',
    tags: [],
    clientVisible: true,
    applyContingency,
    ...(formula ? { formula: { ...formula, sourceIds: [...formula.sourceIds] } } : {}),
  };
}

export function createEstimateFromModel(model: Model, settings?: Settings): Estimate {
  const s = settings ?? DEFAULT_SETTINGS;
  const now = nowIso();
  const items: LineItem[] = model.macroActivities.map((m) => {
    const apply = resolveAppliesContingency(m);
    const item = macroFrom(m.id, m.name, m.category, m.kind, m.formula, apply);
    item.parentId = m.parentId ?? null;
    if (m.kind !== 'formula') item.hours = m.defaultHours;
    item.tags = [...(m.tags ?? [])];
    return item;
  });

  // Macro con sotto-task: le ore stanno sui figli (come in Working).
  for (const item of items) {
    if (item.parentId != null) continue;
    if (items.some((c) => c.parentId === item.id)) {
      item.hours = 0;
    }
  }

  return {
    schemaVersion: 1,
    meta: {
      id: newId('est'),
      title: `Nuova stima — ${model.name}`,
      clientLabel: '',
      createdAt: now,
      updatedAt: now,
      unit: 'hours',
      hoursPerDay: model.hoursPerDay ?? 8,
      icon: model.icon ?? 'letter',
    },
    modelId: model.id,
    tagOptions: [...(model.tagOptions ?? [])],
    contingency: {
      percent: model.contingency.defaultPercent || s.defaultContingencyPercentage,
      mode: model.contingency.mode || s.defaultContingencyMode,
      targetCategories:
        model.contingency.targetCategories.length > 0
          ? model.contingency.targetCategories
          : s.contingencyTargetCategories,
      placement: model.contingency.placement || s.defaultContingencyPlacement,
    },
    items,
    clientView: {
      roundingMode: s.defaultClientRoundingMode,
      hideManagerNotes: s.defaultManagerHideNotes,
      hideManagerTags: s.defaultManagerHideTags,
      hideClientNotes: s.defaultClientHideNotes,
      hideClientTags: s.defaultClientHideTags,
      titleOverride: '',
      lineOverrides: {},
    },
  };
}

export function createEmptyEstimate(settings: Settings): Estimate {
  const now = nowIso();
  return {
    schemaVersion: 1,
    meta: {
      id: newId('est'),
      title: 'Nuova stima',
      clientLabel: '',
      createdAt: now,
      updatedAt: now,
      unit: 'hours',
      hoursPerDay: settings.hoursPerDay ?? 8,
      icon: 'letter',
    },
    contingency: {
      percent: settings.defaultContingencyPercentage,
      mode: settings.defaultContingencyMode,
      targetCategories: [...settings.contingencyTargetCategories],
      placement: settings.defaultContingencyPlacement,
    },
    items: settings.defaultCategories.map((cat, i) => macroFrom(String(i + 1), cat, cat)),
    tagOptions: [],
    clientView: {
      roundingMode: settings.defaultClientRoundingMode,
      hideManagerNotes: settings.defaultManagerHideNotes,
      hideManagerTags: settings.defaultManagerHideTags,
      hideClientNotes: settings.defaultClientHideNotes,
      hideClientTags: settings.defaultClientHideTags,
      titleOverride: '',
      lineOverrides: {},
    },
  };
}

export function createBlankModel(settings: Settings): Model {
  return {
    schemaVersion: 1,
    id: newId('mod'),
    name: 'Nuovo modello',
    macroActivities: settings.defaultCategories.map((cat, i) => ({
      id: String(i + 1),
      name: cat,
      category: cat,
      tags: [],
      defaultHours: 0,
      kind: 'operational' as const,
      parentId: null,
      applyContingency: true,
    })),
    categories: [...settings.defaultCategories],
    tagOptions: [],
    hoursPerDay: settings.hoursPerDay ?? 8,
    icon: 'letter',
    contingency: {
      defaultPercent: settings.defaultContingencyPercentage,
      mode: settings.defaultContingencyMode,
      targetCategories: [...settings.contingencyTargetCategories],
      placement: settings.defaultContingencyPlacement,
    },
  };
}
