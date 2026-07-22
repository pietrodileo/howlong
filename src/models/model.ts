import { z } from 'zod';
import { normalizeModelInput } from '../lib/normalizeTags';
import {
  ContingencyModeSchema,
  ContingencyPlacementSchema,
} from './settings';

export const ItemKindSchema = z.enum(['operational', 'summary', 'overhead', 'formula']);

export const FormulaAggregateSchema = z.enum(['sum', 'avg', 'min', 'max']);

/** Voce calcolata: aggregate(sourceIds) × percent. */
export const FormulaSpecSchema = z.object({
  percent: z.number().min(0).max(100),
  sourceIds: z.array(z.string()),
  /** Come aggregare le ore delle sorgenti prima del × %. */
  aggregate: FormulaAggregateSchema.default('sum'),
  /** Se true, anche altre voci formula nelle sorgenti entrano nell’aggregato. Default false. */
  includeFormulaSources: z.boolean().default(false),
  /** Se true, sulla voce calcolata si applica anche la CTG globale. Default false. */
  applyGlobalContingency: z.boolean().default(false),
});

export type FormulaAggregate = z.infer<typeof FormulaAggregateSchema>;
export type FormulaSpec = z.infer<typeof FormulaSpecSchema>;

export const MacroActivitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).default([]),
  defaultHours: z.number().min(0).default(0),
  kind: ItemKindSchema.default('operational'),
  /** null = macro top-level; altrimenti id della macro padre (sotto-task di default). */
  parentId: z.string().nullable().default(null),
  /** Se false, la CTG globale non si applica a questa voce. */
  applyContingency: z.boolean().default(true),
  formula: FormulaSpecSchema.optional(),
});

export const ModelContingencySchema = z.object({
  defaultPercent: z.number().min(0).max(100).default(20),
  mode: ContingencyModeSchema.default('project'),
  targetCategories: z.array(z.string()).default([]),
  placement: ContingencyPlacementSchema.default('both'),
});

export const ModelIconSchema = z.enum([
  'letter',
  'layers',
  'table',
  'folder',
  'gear',
  'star',
  'bolt',
  'check',
  'code',
  'chart',
  'clipboard',
  'calendar',
  'users',
  'flag',
  'target',
  'box',
  'book',
  'cloud',
  'rocket',
  'shield',
  'grid',
  'list',
  'pen',
  'link',
  'database',
  'briefcase',
]);

export type ModelIcon = z.infer<typeof ModelIconSchema>;

export const MODEL_ICON_OPTIONS: ModelIcon[] = [
  'letter',
  'layers',
  'table',
  'folder',
  'gear',
  'star',
  'bolt',
  'check',
  'code',
  'chart',
  'clipboard',
  'calendar',
  'users',
  'flag',
  'target',
  'box',
  'book',
  'cloud',
  'rocket',
  'shield',
  'grid',
  'list',
  'pen',
  'link',
  'database',
  'briefcase',
];

export const ModelSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  name: z.string().min(1),
  /** Icona in elenco; `letter` = prima lettera del nome. */
  icon: ModelIconSchema.default('letter'),
  macroActivities: z.array(MacroActivitySchema).min(1),
  categories: z.array(z.string()).min(1),
  /** Etichette disponibili per le voci (stile Jira). */
  tagOptions: z.array(z.string()).default([]),
  /** Ore in un giorno-uomo (1 gg = N h). */
  hoursPerDay: z.number().min(1).max(24).default(8),
  contingency: ModelContingencySchema.default({
    defaultPercent: 20,
    mode: 'project',
    targetCategories: [],
    placement: 'both',
  }),
});

export type Model = z.infer<typeof ModelSchema>;
export type MacroActivity = z.infer<typeof MacroActivitySchema>;
export type ItemKind = z.infer<typeof ItemKindSchema>;

export const DEFAULT_MODEL: Model = {
  schemaVersion: 1,
  id: 'modello-standard',
  name: 'Modello standard',
  icon: 'letter',
  macroActivities: [
    { id: '1', name: 'Analisi e documentazione', category: 'Analisi', tags: [], defaultHours: 0, kind: 'operational', parentId: null, applyContingency: true },
    { id: '2', name: 'Sviluppo', category: 'Sviluppo', tags: [], defaultHours: 0, kind: 'operational', parentId: null, applyContingency: true },
    { id: '3', name: 'Test', category: 'Test', tags: [], defaultHours: 0, kind: 'operational', parentId: null, applyContingency: true },
    { id: '4', name: 'Collaudo', category: 'Collaudo', tags: [], defaultHours: 0, kind: 'operational', parentId: null, applyContingency: true },
    { id: '5', name: 'Rilascio e monitoraggio', category: 'Rilascio', tags: [], defaultHours: 0, kind: 'operational', parentId: null, applyContingency: true },
  ],
  categories: ['Analisi', 'Sviluppo', 'Test', 'Collaudo', 'Rilascio'],
  tagOptions: [],
  hoursPerDay: 8,
  contingency: {
    defaultPercent: 20,
    mode: 'project',
    targetCategories: [],
    placement: 'both',
  },
};

export function parseModel(data: unknown): { ok: true; data: Model } | { ok: false; error: string } {
  const result = ModelSchema.safeParse(normalizeModelInput(data));
  if (!result.success) {
    return { ok: false, error: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
  }
  return { ok: true, data: result.data };
}
