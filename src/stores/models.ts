import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { DEFAULT_MODEL, type Model, parseModel } from '../models/model';
import { createBlankModel } from '../lib/factory';
import { newId } from '../lib/ids';
import {
  ensureAppDefaults,
  joinPath,
  listModelFiles,
  readTextFile,
  writeTextFile,
  deleteFile,
  isTauri,
} from '../lib/tauri';
import { importModelText } from '../lib/import';
import { modelToJson } from '../lib/export';
import { toErrorMessage } from '../lib/errors';
import { useSettingsStore } from './settings';

export const useModelsStore = defineStore('models', () => {
  const models = ref<Model[]>([]);
  const selectedId = ref<string | null>(null);
  const lastError = ref<string | null>(null);
  const dirty = ref(false);

  function selected(): Model | null {
    return models.value.find((m) => m.id === selectedId.value) ?? null;
  }

  const defaultModel = computed((): Model | null => {
    const settings = useSettingsStore();
    const id = settings.settings.lastModelId;
    if (id) {
      const found = models.value.find((m) => m.id === id);
      if (found) return found;
    }
    return models.value[0] ?? null;
  });

  function isDefault(id: string): boolean {
    return defaultModel.value?.id === id;
  }

  async function setDefaultModel(id: string) {
    if (!models.value.some((m) => m.id === id)) return;
    const settings = useSettingsStore();
    selectedId.value = id;
    settings.settings.lastModelId = id;
    await settings.save();
  }

  async function loadAll() {
    lastError.value = null;
    if (!isTauri()) {
      models.value = [structuredClone(DEFAULT_MODEL)];
      selectedId.value = DEFAULT_MODEL.id;
      const settings = useSettingsStore();
      settings.settings.lastModelId = DEFAULT_MODEL.id;
      return;
    }
    try {
      const dir = await ensureAppDefaults();
      const files = await listModelFiles();
      const loaded: Model[] = [];
      for (const file of files) {
        try {
          const text = await readTextFile(file);
          const parsed = parseModel(JSON.parse(text));
          if (parsed.ok) loaded.push(parsed.data);
          else lastError.value = `Modello ignorato (${file}): ${parsed.error}`;
        } catch (e) {
          lastError.value = `Errore lettura modello: ${toErrorMessage(e)}`;
        }
      }
      if (loaded.length === 0) {
        loaded.push(structuredClone(DEFAULT_MODEL));
        const path = await joinPath(dir, 'models', 'default.howlong.json');
        await writeTextFile(path, modelToJson(DEFAULT_MODEL));
      }
      models.value = loaded;
      const settings = useSettingsStore();
      const preferred =
        settings.settings.lastModelId && loaded.some((m) => m.id === settings.settings.lastModelId)
          ? settings.settings.lastModelId
          : loaded.find((m) => m.id === DEFAULT_MODEL.id)?.id ?? loaded[0].id;
      selectedId.value = preferred;
      if (settings.settings.lastModelId !== preferred) {
        settings.settings.lastModelId = preferred;
        await settings.save();
      }
    } catch (e) {
      lastError.value = toErrorMessage(e);
      models.value = [structuredClone(DEFAULT_MODEL)];
      selectedId.value = DEFAULT_MODEL.id;
      const settings = useSettingsStore();
      settings.settings.lastModelId = DEFAULT_MODEL.id;
    }
  }

  async function persist(model: Model) {
    if (!isTauri()) return;
    const dir = await ensureAppDefaults();
    const filename = `${model.id}.howlong.json`;
    const path = await joinPath(dir, 'models', filename);
    await writeTextFile(path, modelToJson(model));
  }

  async function saveSelected() {
    const m = selected();
    if (!m) return;
    lastError.value = null;
    const parsed = parseModel(m);
    if (!parsed.ok) {
      lastError.value = `Modello non valido: ${parsed.error}`;
      return false;
    }
    await persist(parsed.data);
    dirty.value = false;
    return true;
  }

  function createNew() {
    const settings = useSettingsStore();
    const model = createBlankModel(settings.settings);
    models.value.push(model);
    selectedId.value = model.id;
    dirty.value = true;
  }

  function duplicateSelected(): Model | null {
    const m = selected();
    if (!m) return null;
    const copy = structuredClone(m);
    copy.id = newId('modello');
    copy.name = `${m.name} (copia)`;
    const idMap = new Map<string, string>();
    for (const a of copy.macroActivities) {
      idMap.set(
        a.id,
        newId(a.parentId ? 'task' : a.kind === 'formula' ? 'formula' : 'macro'),
      );
    }
    copy.macroActivities = copy.macroActivities.map((a) => ({
      ...a,
      id: idMap.get(a.id)!,
      parentId: a.parentId ? (idMap.get(a.parentId) ?? null) : null,
      formula: a.formula
        ? {
            ...a.formula,
            sourceIds: a.formula.sourceIds.map((sid) => idMap.get(sid) ?? sid),
          }
        : undefined,
    }));
    models.value.push(copy);
    selectedId.value = copy.id;
    dirty.value = true;
    return copy;
  }

  function updateSelected(patch: Partial<Model>) {
    const idx = models.value.findIndex((m) => m.id === selectedId.value);
    if (idx < 0) return;
    models.value[idx] = { ...models.value[idx], ...patch };
    dirty.value = true;
  }

  function setMacroActivities(macros: Model['macroActivities']) {
    const m = selected();
    if (!m) return;
    const cats = m.categories.length > 0 ? m.categories : ['Generale'];
    const fallback = cats[0];
    updateSelected({
      macroActivities: macros.map((a) => ({
        ...a,
        category: cats.includes(a.category) ? a.category : fallback,
      })),
      categories: cats,
    });
  }

  function setCategories(next: string[]) {
    const cleaned = [
      ...new Set(next.map((c) => c.trim()).filter((c) => c.length > 0)),
    ];
    if (cleaned.length === 0) return;
    const m = selected();
    if (!m) return;
    const fallback = cleaned[0];
    updateSelected({
      categories: cleaned,
      macroActivities: m.macroActivities.map((a) =>
        cleaned.includes(a.category) ? a : { ...a, category: fallback },
      ),
    });
  }

  function addCategory(name: string) {
    const m = selected();
    if (!m) return;
    const cat = name.trim();
    if (!cat || m.categories.includes(cat)) return;
    setCategories([...m.categories, cat]);
  }

  function removeCategory(name: string) {
    const m = selected();
    if (!m) return;
    if (m.categories.length <= 1) return;
    setCategories(m.categories.filter((c) => c !== name));
  }

  async function importFromText(text: string): Promise<boolean> {
    const result = await importModelText(text);
    if (!result.ok) {
      lastError.value = result.error;
      return false;
    }
    // Sempre nuovo id: import = copia, non sovrascrive un modello esistente.
    const data = { ...result.data, id: newId('modello') };
    models.value.push(data);
    selectedId.value = data.id;
    dirty.value = true;
    lastError.value = null;
    return true;
  }

  async function removeSelected() {
    const m = selected();
    if (!m) return false;
    if (models.value.length <= 1) {
      lastError.value = 'Serve almeno un modello';
      return false;
    }

    const id = m.id;
    models.value = models.value.filter((x) => x.id !== id);
    selectedId.value = models.value[0]?.id ?? null;
    dirty.value = false;
    lastError.value = null;

    if (isTauri()) {
      try {
        const dir = await ensureAppDefaults();
        const path = await joinPath(dir, 'models', `${id}.howlong.json`);
        await deleteFile(path);
        // Legacy default file name
        if (id === DEFAULT_MODEL.id) {
          const legacy = await joinPath(dir, 'models', 'default.howlong.json');
          await deleteFile(legacy);
        }
      } catch (e) {
        lastError.value = toErrorMessage(e);
      }
    }

    const settings = useSettingsStore();
    if (settings.settings.lastModelId === id && selectedId.value) {
      await setDefaultModel(selectedId.value);
    }
    return true;
  }

  async function replaceAll(next: Model[]): Promise<boolean> {
    if (next.length === 0) {
      lastError.value = 'Serve almeno un modello';
      return false;
    }
    for (const m of next) {
      const parsed = parseModel(m);
      if (!parsed.ok) {
        lastError.value = `Modello non valido (${m.id}): ${parsed.error}`;
        return false;
      }
    }

    const previous = [...models.value];
    models.value = next.map((m) => structuredClone(m));
    const settings = useSettingsStore();
    const preferred =
      settings.settings.lastModelId &&
      models.value.some((m) => m.id === settings.settings.lastModelId)
        ? settings.settings.lastModelId
        : models.value[0].id;
    selectedId.value = preferred;
    settings.settings.lastModelId = preferred;
    dirty.value = false;
    lastError.value = null;

    if (!isTauri()) return true;

    try {
      const dir = await ensureAppDefaults();
      const files = await listModelFiles();
      for (const file of files) {
        await deleteFile(file);
      }
      for (const m of models.value) {
        await persist(m);
      }
      // cleanup legacy name if still present somehow
      const legacy = await joinPath(dir, 'models', 'default.howlong.json');
      if (!models.value.some((m) => m.id === DEFAULT_MODEL.id)) {
        await deleteFile(legacy);
      }
      await settings.save();
    } catch (e) {
      models.value = previous;
      selectedId.value = previous[0]?.id ?? null;
      lastError.value = toErrorMessage(e);
      return false;
    }
    return true;
  }

  return {
    models,
    selectedId,
    lastError,
    dirty,
    selected,
    defaultModel,
    isDefault,
    setDefaultModel,
    loadAll,
    persist,
    saveSelected,
    createNew,
    duplicateSelected,
    updateSelected,
    setMacroActivities,
    setCategories,
    addCategory,
    removeCategory,
    importFromText,
    removeSelected,
    replaceAll,
  };
});
