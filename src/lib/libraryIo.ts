import type { Estimate } from '../models/estimate';
import {
  estimateToAiYaml,
  estimateToJson,
  extensionFor,
  mimeFilters,
  type EstimateExportFormat,
} from './export';
import {
  isTauri,
  openFilesDialog,
  readTextFile,
  saveFileDialog,
  writeBinaryFile,
  writeTextFile,
} from './tauri';
import { importEstimateText } from './import';
import { downloadBrowser } from './download';
import { toErrorMessage } from './errors';

function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/** Nome file sicuro da titolo + id. */
export function estimateExportBasename(estimate: Estimate): string {
  const raw = estimate.meta.title.trim() || estimate.meta.id;
  const slug = raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
  const idShort = estimate.meta.id.replace(/^est-/, '').slice(0, 8);
  return `${slug || 'stima'}_${idShort}`;
}

export async function buildEstimateExportBytes(
  estimate: Estimate,
  format: EstimateExportFormat,
): Promise<{ filename: string; bytes: Uint8Array }> {
  const base = estimateExportBasename(estimate);
  const ext = extensionFor(format);
  const filename = `${base}.${ext}`;
  if (format === 'json') {
    return { filename, bytes: utf8(estimateToJson(estimate)) };
  }
  if (format === 'yaml') {
    return { filename, bytes: utf8(await estimateToAiYaml(estimate, false)) };
  }
  const { estimateToXlsx } = await import('./export');
  return { filename, bytes: await estimateToXlsx(estimate, false) };
}

async function saveBytes(
  filename: string,
  format: EstimateExportFormat | 'zip',
  bytes: Uint8Array,
): Promise<string | null> {
  if (!isTauri()) {
    downloadBrowser(
      filename,
      bytes,
      format === 'zip' ? 'application/zip' : 'application/octet-stream',
    );
    return filename;
  }
  const filters =
    format === 'zip'
      ? [{ name: 'ZIP', extensions: ['zip'] }]
      : mimeFilters(format);
  const path = await saveFileDialog(filters, filename);
  if (!path) return null;
  await writeBinaryFile(path, Array.from(bytes));
  return path;
}

/**
 * Esporta una o più stime.
 * - 1 file → dialog salva singolo
 * - 2+ → ZIP con un file per stima
 */
export async function exportLibraryEstimates(
  estimates: Estimate[],
  format: EstimateExportFormat,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  if (estimates.length === 0) {
    return { ok: false, error: 'Nessuna stima selezionata' };
  }

  try {
    if (estimates.length === 1) {
      const built = await buildEstimateExportBytes(estimates[0], format);
      if (!isTauri()) {
        const text =
          format === 'xlsx' ? null : new TextDecoder().decode(built.bytes);
        if (format === 'xlsx') {
          downloadBrowser(built.filename, built.bytes, 'application/octet-stream');
        } else if (text) {
          downloadBrowser(
            built.filename,
            text,
            format === 'json' ? 'application/json' : 'text/yaml',
          );
        }
        return { ok: true, path: built.filename };
      }
      const filters = mimeFilters(format);
      const path = await saveFileDialog(filters, built.filename);
      if (!path) return { ok: false, error: 'Operazione annullata' };
      if (format === 'xlsx') await writeBinaryFile(path, Array.from(built.bytes));
      else await writeTextFile(path, new TextDecoder().decode(built.bytes));
      return { ok: true, path };
    }

    const files: Record<string, Uint8Array> = {};
    const usedNames = new Set<string>();
    for (const est of estimates) {
      const built = await buildEstimateExportBytes(est, format);
      let name = built.filename;
      let n = 2;
      while (usedNames.has(name.toLowerCase())) {
        const ext = extensionFor(format);
        const stem = built.filename.replace(new RegExp(`\\.${ext}$`), '');
        name = `${stem}_${n}.${ext}`;
        n += 1;
      }
      usedNames.add(name.toLowerCase());
      files[name] = built.bytes;
    }
    const { zipSync } = await import('fflate');
    const zipped = zipSync(files, { level: 6 });
    const zipName = `howlong-stime_${estimates.length}.zip`;
    const path = await saveBytes(zipName, 'zip', zipped);
    if (!path) return { ok: false, error: 'Operazione annullata' };
    return { ok: true, path };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}

export async function pickHowLongEstimateFiles(): Promise<
  { ok: true; paths: string[] } | { ok: false; error: string }
> {
  if (!isTauri()) {
    return { ok: false, error: 'Import disponibile solo nell’app desktop' };
  }
  const paths = await openFilesDialog([
    { name: 'HowLong JSON', extensions: ['json'] },
  ]);
  if (paths.length === 0) return { ok: false, error: 'Operazione annullata' };
  return { ok: true, paths };
}

export async function readHowLongEstimateFromPath(
  path: string,
): Promise<{ ok: true; data: Estimate } | { ok: false; error: string }> {
  try {
    const text = await readTextFile(path);
    return await importEstimateText(text, 'json');
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}

export { ensureUniqueEstimateId } from './estimateIdentity';
