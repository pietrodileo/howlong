import {
  ensureAppDefaults,
  ensureDir,
  joinPath,
  listJsonFiles,
} from './tauri';
import { useSettingsStore } from '../stores/settings';

/** Workspace root from settings, or null = use app-data defaults. */
export function workspaceRootFromSettings(): string | null {
  const settings = useSettingsStore();
  const ws = settings.settings.workspaceDir?.trim();
  return ws || null;
}

/**
 * Estimates folder:
 * - no workspace → `{appData}/estimates`
 * - workspace with `estimates/` that has files, or empty new layout → `{ws}/estimates`
 * - legacy flat workspace (json at root, empty estimates/) → `{ws}` itself
 */
export async function resolveEstimatesDir(): Promise<string> {
  const settings = useSettingsStore();
  const ws = workspaceRootFromSettings();
  if (!ws) {
    const appDir = settings.appDataDir || (await ensureAppDefaults());
    return joinPath(appDir, 'estimates');
  }

  const estimatesSub = await joinPath(ws, 'estimates');
  await ensureDir(estimatesSub);
  const subFiles = await listJsonFiles(estimatesSub);
  if (subFiles.length > 0) return estimatesSub;

  const topFiles = await listJsonFiles(ws);
  if (topFiles.length > 0) return ws;

  return estimatesSub;
}

/** Models folder: `{workspace}/models` or `{appData}/models`. */
export async function resolveModelsDir(): Promise<string> {
  const settings = useSettingsStore();
  const ws = workspaceRootFromSettings();
  if (!ws) {
    const appDir = settings.appDataDir || (await ensureAppDefaults());
    return joinPath(appDir, 'models');
  }
  const modelsDir = await joinPath(ws, 'models');
  await ensureDir(modelsDir);
  return modelsDir;
}

/** Ensure standard workspace children after user picks a folder. */
export async function ensureWorkspaceLayout(workspaceDir: string): Promise<void> {
  await ensureDir(await joinPath(workspaceDir, 'estimates'));
  await ensureDir(await joinPath(workspaceDir, 'models'));
}
