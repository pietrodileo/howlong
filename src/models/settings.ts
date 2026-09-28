import { z } from 'zod';
import {
  DEFAULT_ESTIMATE_COLUMN_VISIBILITY,
  ESTIMATE_TOGGLEABLE_COLUMNS,
} from '../features/settings/estimateColumns';
import {
  CLIENT_PRESENTATION_COLUMNS,
  DEFAULT_CLIENT_PRESENTATION_VISIBILITY,
  DEFAULT_MANAGER_PRESENTATION_VISIBILITY,
  MANAGER_PRESENTATION_COLUMNS,
} from '../features/settings/presentationColumns';

const estimateColumnVisibilityShape = Object.fromEntries(
  ESTIMATE_TOGGLEABLE_COLUMNS.map((k) => [k, z.boolean().default(DEFAULT_ESTIMATE_COLUMN_VISIBILITY[k])]),
) as Record<(typeof ESTIMATE_TOGGLEABLE_COLUMNS)[number], z.ZodDefault<z.ZodBoolean>>;

export const EstimateColumnVisibilitySchema = z.object(estimateColumnVisibilityShape);

export type EstimateColumnVisibility = z.infer<typeof EstimateColumnVisibilitySchema>;

const managerPresentationVisibilityShape = Object.fromEntries(
  MANAGER_PRESENTATION_COLUMNS.map((key) => [
    key,
    z.boolean().default(DEFAULT_MANAGER_PRESENTATION_VISIBILITY[key]),
  ]),
) as Record<(typeof MANAGER_PRESENTATION_COLUMNS)[number], z.ZodDefault<z.ZodBoolean>>;

const clientPresentationVisibilityShape = Object.fromEntries(
  CLIENT_PRESENTATION_COLUMNS.map((key) => [
    key,
    z.boolean().default(DEFAULT_CLIENT_PRESENTATION_VISIBILITY[key]),
  ]),
) as Record<(typeof CLIENT_PRESENTATION_COLUMNS)[number], z.ZodDefault<z.ZodBoolean>>;

export const ManagerPresentationVisibilitySchema = z.object(managerPresentationVisibilityShape);
export const ClientPresentationVisibilitySchema = z.object(clientPresentationVisibilityShape);

export type ManagerPresentationVisibility = z.infer<typeof ManagerPresentationVisibilitySchema>;
export type ClientPresentationVisibility = z.infer<typeof ClientPresentationVisibilitySchema>;

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
  /** Default visible columns for the Manager presentation table. */
  defaultManagerColumnVisibility: ManagerPresentationVisibilitySchema.default({
    ...DEFAULT_MANAGER_PRESENTATION_VISIBILITY,
  }),
  /** Default visible columns for the Client presentation table. */
  defaultClientColumnVisibility: ClientPresentationVisibilitySchema.default({
    ...DEFAULT_CLIENT_PRESENTATION_VISIBILITY,
  }),
  /** Allow assigning more than one owner to a line item. */
  allowMultipleOwners: z.boolean().default(false),
  /** Colonne visibili di default nella vista Stima (prima scelta / reset). */
  estimateColumnVisibility: EstimateColumnVisibilitySchema.default({
    ...DEFAULT_ESTIMATE_COLUMN_VISIBILITY,
  }),
  exportIncludeDate: z.boolean().default(true),
  exportIncludeTime: z.boolean().default(true),
  /** Giorni considerati weekend nella vista Gantt. */
  ganttDisabledStatuses: z.array(z.enum(['in-progress', 'at-risk', 'stuck', 'blocked', 'on-hold', 'completed', 'cancelled'])).default([]),
  ganttShowWeekends: z.boolean().default(true),
  ganttWeekendSaturday: z.boolean().default(true),
  ganttWeekendSunday: z.boolean().default(true),
  /** Exclude Saturday and Sunday from working days calculation in Gantt. */
  ganttWorkingDaysExcludeWeekend: z.boolean().default(true),
  /** Ore in un giorno-uomo (1 gg = N h). */
  hoursPerDay: z.number().min(1).max(24).default(8),
  /** UI language. */
  locale: LocaleSchema.default('it'),
  /** Nome utente / etichetta per riconoscere queste impostazioni. */
  username: z.string().default(''),
  /**
   * Cartella workspace condivisa (stime + modelli).
   * Vuota = `{appData}/estimates` e `{appData}/models`.
   */
  workspaceDir: z.string().default(''),
  /** Machine-local recently used workspace folders, newest first. */
  recentWorkspaceDirs: z.array(z.string().trim()).default([]).transform(paths =>
    [...new Map(paths.filter(Boolean).map(path => [
      path.replace(/\\/g, '/').replace(/\/$/, '').toLowerCase(), path,
    ])).values()].slice(0, 5)),
  /**
   * @deprecated Preferire `workspaceDir`. Se valorizzata e workspaceDir vuota, viene migrata.
   * Cartella libreria stime. Vuota = `{appData}/estimates`.
   */
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
  defaultManagerColumnVisibility: { ...DEFAULT_MANAGER_PRESENTATION_VISIBILITY },
  defaultClientColumnVisibility: { ...DEFAULT_CLIENT_PRESENTATION_VISIBILITY },
  allowMultipleOwners: false,
  estimateColumnVisibility: { ...DEFAULT_ESTIMATE_COLUMN_VISIBILITY },
  exportIncludeDate: true,
  exportIncludeTime: true,
  ganttDisabledStatuses: [],
  ganttShowWeekends: true,
  ganttWeekendSaturday: true,
  ganttWeekendSunday: true,
  hoursPerDay: 8,
  locale: 'it',
  username: '',
  workspaceDir: '',
  recentWorkspaceDirs: [],
  estimatesDir: '',
  theme: 'light',
  ganttWorkingDaysExcludeWeekend: true,
};

export function parseSettings(data: unknown): { ok: true; data: Settings } | { ok: false; error: string } {
  let input = data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const legacy = data as Record<string, unknown>;
    input = { ...legacy };
    if (!Object.prototype.hasOwnProperty.call(legacy, 'defaultManagerColumnVisibility')) {
      (input as Record<string, unknown>).defaultManagerColumnVisibility = {
        ...DEFAULT_MANAGER_PRESENTATION_VISIBILITY,
        notes: legacy.defaultManagerHideNotes !== true,
        tags: legacy.defaultManagerHideTags !== true,
      };
    }
    if (!Object.prototype.hasOwnProperty.call(legacy, 'defaultClientColumnVisibility')) {
      (input as Record<string, unknown>).defaultClientColumnVisibility = {
        ...DEFAULT_CLIENT_PRESENTATION_VISIBILITY,
        notes: legacy.defaultClientHideNotes !== true,
        tags: legacy.defaultClientHideTags !== true,
      };
    }
  }
  const result = SettingsSchema.safeParse(input);
  if (!result.success) {
    return { ok: false, error: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
  }
  return { ok: true, data: result.data };
}
