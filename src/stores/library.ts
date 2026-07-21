import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Estimate } from '../models/estimate';
import { parseEstimate } from '../models/estimate';
import type { ModelIcon } from '../models/model';
import { estimateToJson } from '../lib/export';
import { nowIso } from '../lib/ids';
import {
  deleteFile,
  ensureAppDefaults,
  ensureDir,
  isTauri,
  joinPath,
  listJsonFiles,
  readTextFile,
  writeTextFile,
} from '../lib/tauri';
import { useSettingsStore } from './settings';
import { useEstimateStore } from './estimate';
import { ensureUniqueEstimateId } from '../lib/estimateIdentity';
import { toErrorMessage } from '../lib/errors';

export type LibraryEntry = {
  path: string;
  id: string;
  title: string;
  clientLabel: string;
  updatedAt: string;
  icon: ModelIcon;
};

export async function resolveEstimatesDir(): Promise<string> {
  const settings = useSettingsStore();
  const custom = settings.settings.estimatesDir?.trim();
  if (custom) return custom;
  const appDir = settings.appDataDir || (await ensureAppDefaults());
  return joinPath(appDir, 'estimates');
}

function entryFromEstimate(estimate: Estimate, path: string): LibraryEntry {
  return {
    path,
    id: estimate.meta.id,
    title: estimate.meta.title,
    clientLabel: estimate.meta.clientLabel || '',
    updatedAt: estimate.meta.updatedAt,
    icon: estimate.meta.icon ?? 'letter',
  };
}

export const useLibraryStore = defineStore('library', () => {
  const entries = ref<LibraryEntry[]>([]);
  const lastError = ref<string | null>(null);
  const loading = ref(false);

  const sorted = computed(() =>
    [...entries.value].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  );

  async function resolveDir(): Promise<string> {
    return resolveEstimatesDir();
  }

  async function loadAll(): Promise<number> {
    lastError.value = null;
    if (!isTauri()) {
      entries.value = [];
      return 0;
    }
    loading.value = true;
    try {
      const dir = await resolveDir();
      await ensureDir(dir);
      const files = await listJsonFiles(dir);
      const loaded: LibraryEntry[] = [];
      for (const file of files) {
        try {
          const text = await readTextFile(file);
          const parsed = parseEstimate(JSON.parse(text));
          if (parsed.ok) loaded.push(entryFromEstimate(parsed.data, file));
        } catch {
          /* skip broken files */
        }
      }
      entries.value = loaded;
      return loaded.length;
    } catch (e) {
      lastError.value = toErrorMessage(e);
      entries.value = [];
      return 0;
    } finally {
      loading.value = false;
    }
  }

  async function saveEstimate(estimate: Estimate): Promise<{ path: string; data: Estimate }> {
    if (!isTauri()) {
      throw new Error('Salvataggio libreria disponibile solo nell’app desktop');
    }
    const next: Estimate = {
      ...estimate,
      meta: {
        ...estimate.meta,
        updatedAt: nowIso(),
      },
    };
    const dir = await resolveDir();
    const path = await joinPath(dir, `${next.meta.id}.howlong.json`);
    await writeTextFile(path, estimateToJson(next));
    const entry = entryFromEstimate(next, path);
    const idx = entries.value.findIndex((e) => e.id === next.meta.id || e.path === path);
    if (idx >= 0) entries.value[idx] = entry;
    else entries.value.push(entry);
    return { path, data: next };
  }

  async function loadEstimate(
    path: string,
  ): Promise<{ ok: true; data: Estimate } | { ok: false; error: string }> {
    try {
      const text = await readTextFile(path);
      const parsed = parseEstimate(JSON.parse(text));
      if (!parsed.ok) return { ok: false, error: parsed.error };
      return { ok: true, data: parsed.data };
    } catch (e) {
      return { ok: false, error: toErrorMessage(e) };
    }
  }

  /** Aggiorna titolo/icona di una stima in libreria (e sincronizza se aperta). */
  async function updateEntryMeta(
    path: string,
    patch: Partial<Pick<Estimate['meta'], 'title' | 'icon'>>,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!isTauri()) {
      return { ok: false, error: 'Modifica libreria disponibile solo nell’app desktop' };
    }
    const loaded = await loadEstimate(path);
    if (!loaded.ok) return loaded;

    const title =
      patch.title !== undefined
        ? patch.title.trim() || loaded.data.meta.title
        : loaded.data.meta.title;
    const next: Estimate = {
      ...loaded.data,
      meta: {
        ...loaded.data.meta,
        ...patch,
        title,
        updatedAt: nowIso(),
      },
    };
    try {
      await writeTextFile(path, estimateToJson(next));
      const entry = entryFromEstimate(next, path);
      const idx = entries.value.findIndex((e) => e.path === path);
      if (idx >= 0) entries.value[idx] = entry;

      const estimateStore = useEstimateStore();
      if (estimateStore.filePath === path) {
        const wasDirty = estimateStore.dirty;
        estimateStore.updateMeta({
          title: next.meta.title,
          icon: next.meta.icon,
          updatedAt: next.meta.updatedAt,
        });
        if (!wasDirty) estimateStore.markSaved(path);
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: toErrorMessage(e) };
    }
  }

  async function removeEntry(path: string) {
    if (!isTauri()) return;
    await deleteFile(path);
    entries.value = entries.value.filter((e) => e.path !== path);
  }

  /** Importa JSON HowLong in libreria (id nuovo se già presente). */
  async function importFromPaths(paths: string[]): Promise<{
    imported: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let imported = 0;
    const existingIds = new Set(entries.value.map((e) => e.id));

    for (const path of paths) {
      const loaded = await loadEstimate(path);
      if (!loaded.ok) {
        errors.push(`${path}: ${loaded.error}`);
        continue;
      }
      let data = loaded.data;
      if (existingIds.has(data.meta.id)) {
        data = ensureUniqueEstimateId(data, existingIds);
      }
      try {
        const saved = await saveEstimate(data);
        existingIds.add(saved.data.meta.id);
        imported += 1;
      } catch (e) {
        errors.push(`${path}: ${toErrorMessage(e)}`);
      }
    }
    return { imported, errors };
  }

  return {
    entries,
    sorted,
    lastError,
    loading,
    resolveDir,
    loadAll,
    saveEstimate,
    loadEstimate,
    updateEntryMeta,
    removeEntry,
    importFromPaths,
  };
});
