import { z } from 'zod';
import { normalizeEstimateInput } from '../lib/normalizeTags';
import {
  ContingencyModeSchema,
  ContingencyPlacementSchema,
  RoundingModeSchema,
} from './settings';
import { FormulaSpecSchema, ItemKindSchema, ModelIconSchema } from './model';

export const LineItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  hours: z.number().min(0),
  category: z.string().min(1),
  kind: ItemKindSchema.default('operational'),
  /** null = macro-attività; altrimenti id della macro padre. */
  parentId: z.string().nullable().default(null),
  contingencyPercentOverride: z.number().min(0).max(100).nullable().default(null),
  notes: z.string().default(''),
  /** Etichette brevi (stile Jira) per presentazione e filtri. */
  tags: z.array(z.string()).default([]),
  clientVisible: z.boolean().default(true),
  /** Se false, la CTG globale non si applica a questa voce. */
  applyContingency: z.boolean().default(true),
  /** Presente se kind === 'formula': aggregate(sourceIds) × percent. */
  formula: FormulaSpecSchema.optional(),
});

export const EstimateContingencySchema = z.object({
  percent: z.number().min(0).max(100).default(20),
  mode: ContingencyModeSchema.default('project'),
  targetCategories: z.array(z.string()).default([]),
  placement: ContingencyPlacementSchema.default('both'),
});

export const ClientLineOverrideSchema = z.object({
  /** Valore liberamente presentabile al cliente; di default coincide con Con CTG. */
  hoursPresented: z.number().min(0).optional(),
});

export const MacroClientPresentationModeSchema = z.enum(['rollup', 'detail']);

export const ClientViewSchema = z.object({
  roundingMode: RoundingModeSchema.default('none'),
  hideManagerNotes: z.boolean().default(false),
  hideManagerTags: z.boolean().default(false),
  hideClientNotes: z.boolean().default(true),
  hideClientTags: z.boolean().default(false),
  titleOverride: z.string().default(''),
  /** Ritocchi presentazione in vista cliente (ore canoniche). */
  lineOverrides: z.record(z.string(), ClientLineOverrideSchema).default({}),
  /** Per macro id: rollup = solo riga macro con somma; detail = solo sotto-task. */
  macroPresentation: z
    .record(z.string(), MacroClientPresentationModeSchema)
    .default({}),
});

export const EstimateMetaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  clientLabel: z.string().default(''),
  createdAt: z.string(),
  updatedAt: z.string(),
  unit: z.enum(['hours', 'days']).default('hours'),
  /** Ore in un giorno-uomo (copiato dal modello). */
  hoursPerDay: z.number().min(1).max(24).default(8),
  /** Icona in libreria / header stima (stesso set dei modelli). */
  icon: ModelIconSchema.default('letter'),
});

export const EstimateSchema = z.object({
  schemaVersion: z.literal(1),
  meta: EstimateMetaSchema,
  modelId: z.string().optional(),
  contingency: EstimateContingencySchema,
  /** Etichette disponibili nella stima (copiate dal modello, estendibili). */
  tagOptions: z.array(z.string()).default([]),
  items: z.array(LineItemSchema),
  clientView: ClientViewSchema.default({
    roundingMode: 'none',
    hideManagerNotes: false,
    hideManagerTags: false,
    hideClientNotes: true,
    hideClientTags: false,
    titleOverride: '',
    lineOverrides: {},
    macroPresentation: {},
  }),
});

export type LineItem = z.infer<typeof LineItemSchema>;
export type Estimate = z.infer<typeof EstimateSchema>;
export type EstimateContingency = z.infer<typeof EstimateContingencySchema>;
export type ClientViewConfig = z.infer<typeof ClientViewSchema>;
export type ClientLineOverride = z.infer<typeof ClientLineOverrideSchema>;
export type MacroClientPresentationMode = z.infer<typeof MacroClientPresentationModeSchema>;

export function parseEstimate(data: unknown): { ok: true; data: Estimate } | { ok: false; error: string } {
  const result = EstimateSchema.safeParse(normalizeEstimateInput(data));
  if (!result.success) {
    return { ok: false, error: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
  }
  return { ok: true, data: result.data };
}
