import { z } from 'zod';
import { parseSettings, type Settings } from '../models/settings';
import { parseModel, type Model } from '../models/model';
import { toErrorMessage } from './errors';
import { nowIso } from './ids';

export const WORKSPACE_KIND = 'howlong-workspace' as const;

const WorkspaceSchema = z.object({
  schemaVersion: z.literal(1),
  kind: z.literal(WORKSPACE_KIND),
  exportedAt: z.string().optional(),
  settings: z.unknown(),
  models: z.array(z.unknown()).min(1),
});

export type HowLongWorkspace = {
  schemaVersion: 1;
  kind: typeof WORKSPACE_KIND;
  exportedAt: string;
  settings: Settings;
  models: Model[];
};

/** Bundle Impostazioni + modelli (JSON HowLong). */
export function workspaceToJson(settings: Settings, models: Model[]): string {
  const bundle: HowLongWorkspace = {
    schemaVersion: 1,
    kind: WORKSPACE_KIND,
    exportedAt: nowIso(),
    settings,
    models,
  };
  return JSON.stringify(bundle, null, 2);
}

export type WorkspaceImport =
  | { ok: true; settings: Settings; models: Model[] }
  | { ok: true; settings: Settings; models: null; legacy: true }
  | { ok: false; error: string };

/**
 * Importa un workspace completo, oppure (legacy) solo settings.json.
 */
export function importWorkspaceText(text: string): WorkspaceImport {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: `File non valido: ${toErrorMessage(e)}` };
  }

  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'File non valido' };
  }

  const obj = data as Record<string, unknown>;

  if (obj.kind === WORKSPACE_KIND) {
    const raw = WorkspaceSchema.safeParse(data);
    if (!raw.success) {
      return {
        ok: false,
        error: raw.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      };
    }
    const settings = parseSettings(raw.data.settings);
    if (!settings.ok) return { ok: false, error: settings.error };

    const models: Model[] = [];
    for (let i = 0; i < raw.data.models.length; i++) {
      const parsed = parseModel(raw.data.models[i]);
      if (!parsed.ok) {
        return { ok: false, error: `Modello #${i + 1}: ${parsed.error}` };
      }
      models.push(parsed.data);
    }
    return { ok: true, settings: settings.data, models };
  }

  // Legacy: solo settings
  const settings = parseSettings(data);
  if (!settings.ok) return { ok: false, error: settings.error };
  return { ok: true, settings: settings.data, models: null, legacy: true };
}
