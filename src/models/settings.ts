import { z } from 'zod';
import {
  DEFAULT_ESTIMATE_COLUMN_VISIBILITY,
  ESTIMATE_TOGGLEABLE_COLUMNS,
} from '../lib/estimateColumns';

const estimateColumnVisibilityShape = Object.fromEntries(
  ESTIMATE_TOGGLEABLE_COLUMNS.map((k) => [k, z.boolean().default(DEFAULT_ESTIMATE_COLUMN_VISIBILITY[k])]),
) as Record<(typeof ESTIMATE_TOGGLEABLE_COLUMNS)[number], z.ZodDefault<z.ZodBoolean>>;

export const EstimateColumnVisibilitySchema = z.object(estimateColumnVisibilityShape);

export type EstimateColumnVisibility = z.infer<typeof EstimateColumnVisibilitySchema>;

export const ContingencyModeSchema = z.enum(['project', 'categories', 'custom']);
export const ContingencyPlacementSchema = z.enum(['inline', 'separate_line', 'both']);
export const RoundingModeSchema = z.enum(['none', 'ceil_0_5', 'ceil_1', 'round_1']);
export const LocaleSchema = z.enum(['it', 'en']);
export const ThemeSchema = z.enum(['light', 'dark']);

export const SettingsSchema = z.object({
  defaultCategories: z.array(z.string()).min(1),
  defaultContingencyPercentage: z.number().min(0).max(100),
  contingencyTargetCategories: z.array(z.string()),
  defaultContingencyMode: ContingencyModeSchema.default('project'),
  defaultContingencyPlacement: ContingencyPlacementSchema.default('both'),
  defaultClientRoundingMode: RoundingModeSchema.default('ceil_1'),
  defaultManagerHideNotes: z.boolean().default(false),
  defaultManagerHideTags: z.boolean().default(false),
  defaultClientHideNotes: z.boolean().default(true),
  defaultClientHideTags: z.boolean().default(false),
  /** Colonne visibili di default nella vista Stima (prima scelta / reset). */
  estimateColumnVisibility: EstimateColumnVisibilitySchema.default({
    ...DEFAULT_ESTIMATE_COLUMN_VISIBILITY,
  }),
  exportIncludeDate: z.boolean().default(true),
  exportIncludeTime: z.boolean().default(true),
  /** Ore in un giorno-uomo (1 gg = N h). */
  hoursPerDay: z.number().min(1).max(24).default(8),
  /** UI language. */
  locale: LocaleSchema.default('it'),
  /** Nome utente / etichetta per riconoscere queste impostazioni. */
  username: z.string().default(''),
  /** Cartella libreria stime. Vuota = `{appData}/estimates`. */
  estimatesDir: z.string().default(''),
  /** Tema interfaccia: chiaro o scuro. */
  theme: ThemeSchema.default('light'),
  lastModelId: z.string().optional(),
});

export type Settings = z.infer<typeof SettingsSchema>;
export type ContingencyMode = z.infer<typeof ContingencyModeSchema>;
export type ContingencyPlacement = z.infer<typeof ContingencyPlacementSchema>;
export type RoundingMode = z.infer<typeof RoundingModeSchema>;
export type Locale = z.infer<typeof LocaleSchema>;
export type Theme = z.infer<typeof ThemeSchema>;

export const DEFAULT_SETTINGS: Settings = {
  defaultCategories: ['Analisi', 'Sviluppo', 'Test', 'Collaudo', 'Rilascio'],
  defaultContingencyPercentage: 20,
  contingencyTargetCategories: ['Sviluppo', 'Test'],
  defaultContingencyMode: 'project',
  defaultContingencyPlacement: 'both',
  defaultClientRoundingMode: 'ceil_1',
  defaultManagerHideNotes: false,
  defaultManagerHideTags: false,
  defaultClientHideNotes: true,
  defaultClientHideTags: false,
  estimateColumnVisibility: { ...DEFAULT_ESTIMATE_COLUMN_VISIBILITY },
  exportIncludeDate: true,
  exportIncludeTime: true,
  hoursPerDay: 8,
  locale: 'it',
  username: '',
  estimatesDir: '',
  theme: 'light',
};

export function parseSettings(data: unknown): { ok: true; data: Settings } | { ok: false; error: string } {
  const result = SettingsSchema.safeParse(data);
  if (!result.success) {
    return { ok: false, error: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
  }
  return { ok: true, data: result.data };
}
