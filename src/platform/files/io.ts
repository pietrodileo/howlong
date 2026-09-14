import type { EstimateExportFormat, GanttExportOptions } from './export';
import {
  estimateToJson,
  estimateToAiYaml,
  estimateToXlsx,
  estimateToClientYaml,
  estimateToClientXlsx,
  ganttToXlsx,
  modelToJson,
  extensionFor,
  mimeFilters,
} from './export';
import { workspaceToJson } from '../../features/settings/workspace';
import type { Estimate } from '../../models/estimate';
import type { Model } from '../../models/model';
import type { Settings } from '../../models/settings';
import {
  openFileDialog,
  openFilesDialog,
  saveFileDialog,
  readTextFile,
  writeTextFile,
  writeBinaryFile,
  isTauri,
} from '../tauri';
import { importEstimateText } from './import';
import { downloadBrowser } from './download';
import {
  dialogCancelled,
  dialogDesktopOnly,
  dialogError,
  type DialogFail,
} from './dialogResult';

async function saveContent(
  defaultName: string,
  format: EstimateExportFormat,
  text: string | null,
  binary: Uint8Array | null,
): Promise<string | null> {
  const filters = mimeFilters(format);
  const suggested = `${defaultName}.${extensionFor(format)}`;

  if (!isTauri()) {
    if (binary) return downloadBrowser(suggested, binary, 'application/octet-stream');
    if (text) return downloadBrowser(suggested, text, 'text/plain');
    return null;
  }

  const path = await saveFileDialog(filters, suggested);
  if (!path) return null;
  if (binary) await writeBinaryFile(path, Array.from(binary));
  else if (text) await writeTextFile(path, text);
  return path;
}

function safePart(value: string): string {
  return value.trim().replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '');
}

function exportName(estimate: Estimate, type: string, settings?: Settings): string {
  const parts = [safePart(estimate.meta.clientLabel), safePart(estimate.clientView.titleOverride || estimate.meta.title), safePart(type)].filter(Boolean);
  const now = new Date();
  if (settings?.exportIncludeDate !== false) {
    parts.push(now.toISOString().slice(0, 10));
    if (settings?.exportIncludeTime !== false) {
      parts.push(now.toTimeString().slice(0, 8).replace(/:/g, '_'));
    }
  }
  return parts.join('_') || type;
}

export async function exportEstimate(
  estimate: Estimate,
  format: EstimateExportFormat,
  view: 'estimate' | 'manager' | 'client' = 'estimate',
  settings?: Settings,
): Promise<string | null> {
  const base = exportName(estimate, view === 'manager' ? 'manager-view' : view === 'client' ? 'client-view' : 'estimate', settings);
  const manager = view === 'manager';
  switch (format) {
    case 'json':
      // Backup HowLong: solo stima completa (non vista cliente filtrata)
      return saveContent(base, format, estimateToJson(estimate), null);
    case 'yaml':
      return saveContent(base, format, view === 'client' ? await estimateToClientYaml(estimate) : await estimateToAiYaml(estimate, manager), null);
    case 'xlsx':
      return saveContent(base, format, null, view === 'client'
        ? await estimateToClientXlsx(estimate)
        : await estimateToXlsx(estimate, manager ? 'manager' : 'estimate'));
  }
}

export async function exportGanttXlsx(
  estimate: Estimate,
  options: GanttExportOptions,
  settings?: Settings,
): Promise<string | null> {
  const base = exportName(estimate, 'gantt', settings);
  return saveContent(base, 'xlsx', null, await ganttToXlsx(estimate, options));
}

export async function exportModel(model: Model): Promise<string | null> {
  const base = model.id || 'modello';
  return saveContent(base, 'json', modelToJson(model), null);
}

export async function exportSettings(
  settings: Settings,
  models: Model[],
): Promise<string | null> {
  const label = settings.username?.trim()
    ? `howlong-${settings.username.trim().replace(/[^\w.-]+/g, '_')}`
    : 'howlong-workspace';
  return saveContent(label, 'json', workspaceToJson(settings, models), null);
}

export async function openEstimateFile(): Promise<
  { ok: true; data: Estimate; path: string | null } | DialogFail
> {
  if (!isTauri()) return dialogDesktopOnly();
  const path = await openFileDialog([{ name: 'HowLong estimate', extensions: ['json'] }]);
  if (!path) return dialogCancelled();

  const text = await readTextFile(path);
  const result = await importEstimateText(text, 'json');
  if (!result.ok) return dialogError(result.error);
  return { ok: true, data: result.data, path };
}

/** Apre uno o più file modello HowLong JSON. */
export async function openModelFiles(): Promise<
  { ok: true; texts: string[] } | DialogFail
> {
  if (!isTauri()) return dialogDesktopOnly();
  const paths = await openFilesDialog([{ name: 'HowLong model', extensions: ['json'] }]);
  if (paths.length === 0) return dialogCancelled();
  const texts: string[] = [];
  for (const path of paths) {
    texts.push(await readTextFile(path));
  }
  return { ok: true, texts };
}

export async function openSettingsFile(): Promise<
  { ok: true; text: string } | DialogFail
> {
  if (!isTauri()) return dialogDesktopOnly();
  const path = await openFileDialog([{ name: 'HowLong workspace', extensions: ['json'] }]);
  if (!path) return dialogCancelled();
  return { ok: true, text: await readTextFile(path) };
}
