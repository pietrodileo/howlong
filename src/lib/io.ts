import type { EstimateExportFormat } from './export';
import {
  estimateToJson,
  estimateToAiYaml,
  estimateToXlsx,
  modelToJson,
  extensionFor,
  mimeFilters,
} from './export';
import { workspaceToJson } from './workspace';
import type { Estimate } from '../models/estimate';
import type { Model } from '../models/model';
import type { Settings } from '../models/settings';
import {
  openFileDialog,
  openFilesDialog,
  saveFileDialog,
  readTextFile,
  writeTextFile,
  writeBinaryFile,
  isTauri,
} from './tauri';
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
    if (binary) downloadBrowser(suggested, binary, 'application/octet-stream');
    else if (text) downloadBrowser(suggested, text, 'text/plain');
    return suggested;
  }

  const path = await saveFileDialog(filters, suggested);
  if (!path) return null;
  if (binary) await writeBinaryFile(path, Array.from(binary));
  else if (text) await writeTextFile(path, text);
  return path;
}

export async function exportEstimate(
  estimate: Estimate,
  format: EstimateExportFormat,
  clientOnly = false,
): Promise<string | null> {
  const base = clientOnly ? 'vista-cliente' : 'stima';
  switch (format) {
    case 'json':
      // Backup HowLong: solo stima completa (non vista cliente filtrata)
      return saveContent(base, format, estimateToJson(estimate), null);
    case 'yaml':
      return saveContent(base, format, await estimateToAiYaml(estimate, clientOnly), null);
    case 'xlsx':
      return saveContent(base, format, null, await estimateToXlsx(estimate, clientOnly));
  }
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

export async function saveEstimateJson(
  estimate: Estimate,
  existingPath: string | null,
): Promise<string | null> {
  const text = estimateToJson(estimate);
  if (!isTauri()) {
    downloadBrowser('stima.json', text, 'application/json');
    return 'stima.json';
  }
  const path =
    existingPath ??
    (await saveFileDialog([{ name: 'HowLong JSON', extensions: ['json'] }], 'stima.json'));
  if (!path) return null;
  await writeTextFile(path, text);
  return path;
}

export async function openModelFile(): Promise<
  { ok: true; text: string } | DialogFail
> {
  if (!isTauri()) return dialogDesktopOnly();
  const path = await openFileDialog([{ name: 'HowLong model', extensions: ['json'] }]);
  if (!path) return dialogCancelled();
  return { ok: true, text: await readTextFile(path) };
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
