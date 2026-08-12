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
import { fetchOsUsername } from '../lib/auditUsername';
import { mergeImportedSettings } from '../lib/workspace';

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
  let workspaceDir = partial.workspaceDir ?? DEFAULT_SETTINGS.workspaceDir;
  let estimatesDir = partial.estimatesDir ?? DEFAULT_SETTINGS.estimatesDir;
  // Migrate legacy estimatesDir → workspaceDir
  if (!workspaceDir.trim() && estimatesDir.trim()) {
    workspaceDir = estimatesDir.trim();
    estimatesDir = '';
  }
  return {
    ...cloneDefaults(),
    ...partial,
    hoursPerDay: partial.hoursPerDay ?? DEFAULT_SETTINGS.hoursPerDay,
    locale: partial.locale ?? DEFAULT_SETTINGS.locale,
    username: partial.username ?? DEFAULT_SETTINGS.username,
    workspaceDir,
    estimatesDir,
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
  const osUsername = ref('');

  const categories = computed(() => settings.value.defaultCategories);

  async function seedUsernameIfEmpty(): Promise<boolean> {
    if (settings.value.username.trim()) return false;
    const os = osUsername.value || (await fetchOsUsername());
    osUsername.value = os;
    if (!os) return false;
    settings.value.username = os;
    return true;
  }

  async function load() {
    lastError.value = null;
    try {
      if (!isTauri()) {
        settings.value = cloneDefaults();
        loaded.value = true;
        return;
      }
      appDataDir.value = await ensureAppDefaults();
      osUsername.value = await fetchOsUsername();
      const path = await joinPath(appDataDir.value, 'settings.json');
      const text = await readTextFile(path);
      const parsed = parseSettings(JSON.parse(text));
      if (!parsed.ok) {
        lastError.value = `Settings non validi: ${parsed.error}`;
        return;
      }
      settings.value = mergeSettings(parsed.data);
      const seeded = await seedUsernameIfEmpty();
      const migrated =
        !!(parsed.data.estimatesDir?.trim() && !parsed.data.workspaceDir?.trim());
      loaded.value = true;
      if (seeded || migrated) {
        await save();
      }
    } catch (e) {
      settings.value = cloneDefaults();
      loaded.value = true;
      if (isTauri()) {
        try {
          appDataDir.value = await getAppDataDir();
          osUsername.value = await fetchOsUsername();
          if (await seedUsernameIfEmpty()) await save();
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
    // Persist cleaned legacy field
    const payload: Settings = {
      ...settings.value,
      estimatesDir: '',
    };
    await writeTextFile(path, settingsToJson(payload));
  }

  function apply(next: Settings) {
    settings.value = mergeSettings(next);
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
    const current = settings.value;
    settings.value = mergeImportedSettings(current, mergeSettings(result.data));
    await seedUsernameIfEmpty();
    lastError.value = null;
    return true;
  }

  function exportJson(): string {
    return settingsToJson({ ...settings.value, estimatesDir: '' });
  }

  return {
    settings,
    loaded,
    lastError,
    appDataDir,
    osUsername,
    categories,
    load,
    save,
    apply,
    resetToDefaults,
    importFromText,
    exportJson,
  };
});
