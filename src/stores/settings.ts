import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  DEFAULT_SETTINGS,
  type Settings,
  parseSettings,
} from '../models/settings';
import {
  ensureAppDefaults,
  getAppDataDir,
  joinPath,
  readTextFile,
  writeTextFile,
  isTauri,
} from '../lib/tauri';
import { importSettingsText } from '../lib/import';
import { settingsToJson } from '../lib/export';

/** Copia deep-enough di DEFAULT_SETTINGS (array clonati). */
function cloneDefaults(): Settings {
  return {
    ...DEFAULT_SETTINGS,
    defaultCategories: [...DEFAULT_SETTINGS.defaultCategories],
    contingencyTargetCategories: [...DEFAULT_SETTINGS.contingencyTargetCategories],
  };
}

/** Unisce dati parziali/parsati sopra i default, clonando gli array. */
function mergeSettings(partial: Partial<Settings>): Settings {
  return {
    ...cloneDefaults(),
    ...partial,
    hoursPerDay: partial.hoursPerDay ?? DEFAULT_SETTINGS.hoursPerDay,
    locale: partial.locale ?? DEFAULT_SETTINGS.locale,
    username: partial.username ?? DEFAULT_SETTINGS.username,
    theme: partial.theme ?? DEFAULT_SETTINGS.theme,
    defaultCategories: [
      ...(partial.defaultCategories ?? DEFAULT_SETTINGS.defaultCategories),
    ],
    contingencyTargetCategories: [
      ...(partial.contingencyTargetCategories ??
        DEFAULT_SETTINGS.contingencyTargetCategories),
    ],
  };
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>(cloneDefaults());
  const loaded = ref(false);
  const lastError = ref<string | null>(null);
  const appDataDir = ref<string>('');

  const categories = computed(() => settings.value.defaultCategories);

  async function load() {
    lastError.value = null;
    try {
      if (!isTauri()) {
        settings.value = cloneDefaults();
        loaded.value = true;
        return;
      }
      appDataDir.value = await ensureAppDefaults();
      const path = await joinPath(appDataDir.value, 'settings.json');
      const text = await readTextFile(path);
      const parsed = parseSettings(JSON.parse(text));
      if (!parsed.ok) {
        lastError.value = `Settings non validi: ${parsed.error}`;
        return;
      }
      settings.value = mergeSettings(parsed.data);
      loaded.value = true;
    } catch (e) {
      settings.value = cloneDefaults();
      loaded.value = true;
      if (isTauri()) {
        try {
          appDataDir.value = await getAppDataDir();
        } catch {
          /* ignore */
        }
      }
      console.warn(e);
    }
  }

  async function save() {
    lastError.value = null;
    if (!isTauri()) return;
    const dir = appDataDir.value || (await ensureAppDefaults());
    const path = await joinPath(dir, 'settings.json');
    await writeTextFile(path, settingsToJson(settings.value));
  }

  function apply(next: Settings) {
    settings.value = next;
  }

  function resetToDefaults() {
    settings.value = cloneDefaults();
  }

  async function importFromText(text: string): Promise<boolean> {
    const result = await importSettingsText(text);
    if (!result.ok) {
      lastError.value = result.error;
      return false;
    }
    settings.value = mergeSettings(result.data);
    lastError.value = null;
    return true;
  }

  function exportJson(): string {
    return settingsToJson(settings.value);
  }

  return {
    settings,
    loaded,
    lastError,
    appDataDir,
    categories,
    load,
    save,
    apply,
    resetToDefaults,
    importFromText,
    exportJson,
  };
});
