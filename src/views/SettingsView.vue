<script setup lang="ts">
import { ref, watch } from 'vue';
import { useSettingsStore } from '../stores/settings';
import { useModelsStore } from '../stores/models';
import { useLibraryStore } from '../stores/library';
import { useUiStore } from '../stores/ui';
import { exportSettings, openSettingsFile } from '../lib/io';
import { importWorkspaceText } from '../lib/workspace';
import { openDirectoryDialog, isTauri } from '../lib/tauri';
import { ensureWorkspaceLayout, resolveEstimatesDir, resolveModelsDir, workspaceRootFromSettings } from '../lib/workspacePaths';
import { useI18n } from '../i18n/useI18n';
import { isDialogCancelled } from '../lib/dialogResult';
import { toErrorMessage } from '../lib/errors';
import type { Locale, Theme } from '../models/settings';
import SettingsPanel from '../components/SettingsPanel.vue';
import { ESTIMATE_TOGGLEABLE_COLUMNS, type EstimateToggleableColumn } from '../lib/estimateColumns';
import { syncEstimateColumnsFromSettings } from '../lib/useResizableColumns';

const settings = useSettingsStore();
const models = useModelsStore();
const library = useLibraryStore();
const ui = useUiStore();
const { t, setLocale, locale } = useI18n();

const resolvedWorkspaceDir = ref('');
const resolvedEstimatesDir = ref('');
const resolvedModelsDir = ref('');
const openFolderSection = ref(ui.consumeSettingsSection() === 'folder');

// Flag to prevent duplicate saves
let isSaving = false;

// Auto-save settings when they change
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
watch(
  () => settings.settings,
  async () => {
    if (isSaving) return;
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      try {
        isSaving = true;
        await settings.save();
        syncEstimateColumnsFromSettings();
        await library.loadAll();
        await models.loadAll();
        await refreshWorkspacePaths();
      } catch (e) {
        ui.notify(toErrorMessage(e), true);
      } finally {
        isSaving = false;
      }
    }, 1000);
  },
  { deep: true },
);

async function refreshWorkspacePaths() {
  if (!isTauri()) {
    resolvedWorkspaceDir.value = '';
    resolvedEstimatesDir.value = '';
    resolvedModelsDir.value = '';
    return;
  }
  try {
    const root = workspaceRootFromSettings();
    resolvedWorkspaceDir.value = root || settings.appDataDir || '';
    resolvedEstimatesDir.value = await resolveEstimatesDir();
    resolvedModelsDir.value = await resolveModelsDir();
  } catch {
    resolvedWorkspaceDir.value = '';
    resolvedEstimatesDir.value = '';
    resolvedModelsDir.value = '';
  }
}

refreshWorkspacePaths();

/** Mini markdown: **bold** e `code`. */
function md(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

async function applyWorkspaceFolderChange() {
  if (isSaving) return;
  try {
    isSaving = true;
    await settings.save();
    const n = await library.loadAll();
    await models.loadAll();
    await refreshWorkspacePaths();
    if (library.lastError) {
      ui.notify(library.lastError, true);
      return;
    }
    if (n > 0) {
      ui.notify(t('settings.folderLoaded', { n: String(n) }));
    } else {
      ui.notify(t('settings.folderEmpty'));
    }
  } catch (e) {
    ui.notify(toErrorMessage(e), true);
  } finally {
    isSaving = false;
  }
}

async function onPickWorkspaceDir() {
  if (!isTauri()) {
    ui.notify(t('library.desktopOnly'), true);
    return;
  }
  const path = await openDirectoryDialog(
    settings.settings.workspaceDir.trim() ||
      resolvedWorkspaceDir.value ||
      undefined,
  );
  if (!path) return;
  await ensureWorkspaceLayout(path);
  settings.settings.workspaceDir = path;
  settings.settings.estimatesDir = '';
  await applyWorkspaceFolderChange();
}

async function onResetWorkspaceDir() {
  if (!isTauri()) {
    ui.notify(t('library.desktopOnly'), true);
    return;
  }
  settings.settings.workspaceDir = '';
  settings.settings.estimatesDir = '';
  await applyWorkspaceFolderChange();
}

async function onImport() {
  const result = await openSettingsFile();
  if (!result.ok) {
    if (!isDialogCancelled(result)) {
      ui.notify(result.error, true);
    }
    return;
  }

  const parsed = importWorkspaceText(result.text);
  if (!parsed.ok) {
    ui.notify(parsed.error || t('settings.importBad'), true);
    return;
  }

  if (!(await settings.importFromText(JSON.stringify(parsed.settings)))) {
    ui.notify(settings.lastError || t('settings.importBad'), true);
    return;
  }

  if (parsed.models) {
    const ok = await models.replaceAll(parsed.models);
    if (!ok) {
      ui.notify(models.lastError || t('settings.importBad'), true);
      return;
    }
    ui.notify(t('settings.importOkFull', { count: String(parsed.models.length) }));
  } else {
    ui.notify(t('settings.importOkLegacy'));
  }
  await refreshWorkspacePaths();
}

async function onExport() {
  try {
    const path = await exportSettings(settings.settings, models.models);
    if (path) ui.notify(`${t('settings.exported')}: ${path}`);
  } catch (e) {
    ui.notify(toErrorMessage(e), true);
  }
}

function onLocaleChange(value: string) {
  if (value === 'it' || value === 'en') setLocale(value as Locale);
}

function onThemeChange(value: Theme) {
  settings.settings.theme = value;
}

const estimateColumnKeys = ESTIMATE_TOGGLEABLE_COLUMNS;

function estimateColumnLabel(key: EstimateToggleableColumn): string {
  return t(`columns.${key}`);
}

function onEstimateColumnChange(key: EstimateToggleableColumn, checked: boolean) {
  settings.settings.estimateColumnVisibility[key] = checked;
}

function onExportDateChange(checked: boolean) {
  settings.settings.exportIncludeDate = checked;
  if (!checked) settings.settings.exportIncludeTime = false;
}
</script>

<template>
  <div class="settings" :key="locale">
    <header class="hero">
      <div class="hero-top">
        <h2 class="title">{{ t('settings.title') }}</h2>
      </div>
      <p v-if="settings.settings.username.trim()" class="user-badge">
        {{ settings.settings.username.trim() }}
      </p>
    </header>

    <SettingsPanel :title="t('settings.sectionProfile')">
      <div class="profile-hints">
        <span class="field-hint">{{ t('settings.usernameHelp') }}</span>
        <span class="field-hint">{{ t('settings.usernameDesktopHint') }}</span>
      </div>
      <label class="field">
        <span class="field-label">{{ t('settings.username') }}</span>
        <input
          type="text"
          class="username-input"
          :value="settings.settings.username"
          :placeholder="settings.osUsername || t('settings.usernamePh')"
          autocomplete="username"
          @input="settings.settings.username = ($event.target as HTMLInputElement).value"
        />
      </label>
    </SettingsPanel>

    <SettingsPanel :title="t('settings.sectionLocale')">
      <p class="field-hint">{{ t('settings.languageHelp') }}</p>
      <div class="lang-actions">
        <div class="lang-row" role="radiogroup" :aria-label="t('settings.language')">
          <label class="lang-opt">
            <input
              type="radio"
              name="locale"
              value="it"
              :checked="settings.settings.locale === 'it'"
              @change="onLocaleChange('it')"
            />
            <span>ITA — {{ t('settings.italian') }}</span>
          </label>
          <label class="lang-opt">
            <input
              type="radio"
              name="locale"
              value="en"
              :checked="settings.settings.locale === 'en'"
              @change="onLocaleChange('en')"
            />
            <span>ENG — {{ t('settings.english') }}</span>
          </label>
        </div>
      </div>
    </SettingsPanel>

    <SettingsPanel :title="t('settings.sectionAppearance')">
      <p class="field-hint">{{ t('settings.appearanceHelp') }}</p>
      <div class="lang-row" role="radiogroup" :aria-label="t('settings.appearance')">
        <label class="lang-opt">
          <input
            type="radio"
            name="appearance"
            value="light"
            :checked="settings.settings.theme !== 'dark'"
            @change="onThemeChange('light')"
          />
          <span>{{ t('settings.appearanceLight') }}</span>
        </label>
        <label class="lang-opt">
          <input
            type="radio"
            name="appearance"
            value="dark"
            :checked="settings.settings.theme === 'dark'"
            @change="onThemeChange('dark')"
          />
          <span>{{ t('settings.appearanceDark') }}</span>
        </label>
      </div>
    </SettingsPanel>

    <SettingsPanel :title="t('settings.sectionEstimate')">
      <p class="field-hint">{{ t('settings.estimateColumnsIntro') }}</p>
      <div class="option-grid columns-grid">
        <label v-for="key in estimateColumnKeys" :key="key" class="lang-opt compact">
          <input
            type="checkbox"
            :checked="settings.settings.estimateColumnVisibility[key]"
            @change="onEstimateColumnChange(key, ($event.target as HTMLInputElement).checked)"
          />
          <span>{{ estimateColumnLabel(key) }}</span>
        </label>
      </div>
    </SettingsPanel>

    <SettingsPanel :title="t('settings.sectionPresentation')">
      <p class="field-hint">{{ t('settings.presentationIntro') }}</p>
      <div class="pref-grid">
        <fieldset class="pref-group">
          <legend>{{ t('settings.managerViewLegend') }}</legend>
          <label class="lang-opt compact">
            <input
              type="checkbox"
              :checked="settings.settings.defaultManagerHideNotes"
              @change="settings.settings.defaultManagerHideNotes = ($event.target as HTMLInputElement).checked"
            />
            <span>{{ t('settings.defaultManagerHideNotes') }}</span>
          </label>
          <label class="lang-opt compact">
            <input
              type="checkbox"
              :checked="settings.settings.defaultManagerHideTags"
              @change="settings.settings.defaultManagerHideTags = ($event.target as HTMLInputElement).checked"
            />
            <span>{{ t('settings.defaultManagerHideTags') }}</span>
          </label>
        </fieldset>
        <fieldset class="pref-group">
          <legend>{{ t('settings.clientOutputLegend') }}</legend>
          <label class="lang-opt compact">
            <input
              type="checkbox"
              :checked="settings.settings.defaultClientHideNotes"
              @change="settings.settings.defaultClientHideNotes = ($event.target as HTMLInputElement).checked"
            />
            <span>{{ t('settings.defaultClientHideNotes') }}</span>
          </label>
          <label class="lang-opt compact">
            <input
              type="checkbox"
              :checked="settings.settings.defaultClientHideTags"
              @change="settings.settings.defaultClientHideTags = ($event.target as HTMLInputElement).checked"
            />
            <span>{{ t('settings.defaultClientHideTags') }}</span>
          </label>
        </fieldset>
      </div>
    </SettingsPanel>

    <SettingsPanel :title="t('settings.sectionExport')">
      <p class="field-hint">{{ t('settings.exportFilenameLegend') }}</p>
      <div class="export-filename-opts">
        <label class="export-opt">
          <span class="export-opt-head">
            <input
              type="checkbox"
              :checked="settings.settings.exportIncludeDate"
              @change="onExportDateChange(($event.target as HTMLInputElement).checked)"
            />
            <span>{{ t('settings.exportIncludeDate') }}</span>
          </span>
          <span class="export-opt-hint">{{ t('settings.exportIncludeDateHint') }}</span>
        </label>
        <label class="export-opt" :class="{ disabled: !settings.settings.exportIncludeDate }">
          <span class="export-opt-head">
            <input
              type="checkbox"
              :checked="settings.settings.exportIncludeTime"
              :disabled="!settings.settings.exportIncludeDate"
              @change="settings.settings.exportIncludeTime = ($event.target as HTMLInputElement).checked"
            />
            <span>{{ t('settings.exportIncludeTime') }}</span>
          </span>
          <span class="export-opt-hint">{{ t('settings.exportIncludeTimeHint') }}</span>
        </label>
      </div>
    </SettingsPanel>

    <SettingsPanel :title="t('settings.sectionFolder')" :open="openFolderSection">
      <p class="field-hint">{{ t('settings.workspaceFolderHelp') }}</p>
      <dl class="meta folder-box">
        <dt>{{ t('settings.workspaceFolderActive') }}</dt>
        <dd class="path">
          {{
            settings.settings.workspaceDir.trim()
              ? settings.settings.workspaceDir.trim()
              : t('settings.workspaceFolderDefault')
          }}
        </dd>
        <dt>{{ t('settings.estimatesFolderActive') }}</dt>
        <dd class="path">{{ resolvedEstimatesDir || t('library.desktopOnly') }}</dd>
        <dt>{{ t('settings.modelsFolderActive') }}</dt>
        <dd class="path">{{ resolvedModelsDir || t('library.desktopOnly') }}</dd>
      </dl>
      <p v-if="settings.settings.workspaceDir.trim()" class="field-hint custom-note">
        {{ t('settings.workspaceFolderCustom') }}
      </p>
      <div class="chrome">
        <button type="button" class="settings-action" @click="onPickWorkspaceDir">
          {{ t('settings.pickFolder') }}
        </button>
        <button
          type="button"
          class="settings-action"
          :disabled="!settings.settings.workspaceDir.trim()"
          @click="onResetWorkspaceDir"
        >
          {{ t('settings.resetFolder') }}
        </button>
      </div>
    </SettingsPanel>

    <SettingsPanel :title="t('settings.sectionWorkspace')">
      <ul class="tips tip-box">
        <li v-html="md(t('settings.tipImport'))" />
        <li v-html="md(t('settings.tipExport'))" />
      </ul>
      <div class="chrome">
        <button type="button" class="settings-action" @click="onImport">
          {{ t('settings.import') }}
        </button>
        <button type="button" class="settings-action" @click="onExport">
          {{ t('settings.export') }}
        </button>
      </div>
    </SettingsPanel>

    <p v-if="settings.lastError" class="err">{{ settings.lastError }}</p>
  </div>
</template>

<style scoped>
.settings {
  max-width: 620px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.hero-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.55rem;
  overflow: visible;
  margin-bottom: 1.15rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--line);
}

.title {
  margin: 0;
  font-family: var(--font-brand);
  font-size: clamp(1.45rem, 2.2vw, 1.95rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--ink);
  line-height: 1.2;
}

.user-badge {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--accent);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--page-soft);
  min-width: 0;
}

.username-input {
  height: 2.25rem;
  box-sizing: border-box;
  padding: 0 0.65rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink);
  font-size: 0.85rem;
  font-weight: 400;
}

.username-input::placeholder {
  color: var(--muted);
  font-weight: 400;
}

.username-input:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--accent) 45%, var(--line));
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.chrome {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: 0.5rem;
  row-gap: 0.35rem;
  overflow: visible;
  margin-top: 0.15rem;
}

.settings-action {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  color: var(--ink-soft);
  font-size: 0.9rem;
  font-weight: 550;
  padding: 0.45rem 0.7rem;
}

.settings-action:hover:not(:disabled) {
  background: var(--page-soft);
  border-color: color-mix(in srgb, var(--accent) 35%, var(--line));
  color: var(--ink);
}

.settings-action:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.field-label {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--ink);
}

.field-hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--ink-soft);
  line-height: 1.45;
}

.profile-hints {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.45rem;
}

.profile-hints .field-hint:first-child::after {
  content: '';
  display: inline-block;
  width: 1px;
  height: 1em;
  background: var(--line);
  margin-left: 0.45rem;
  vertical-align: middle;
}

.pref-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.85rem;
}

.pref-group {
  margin: 0;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--page-soft);
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
}

.pref-group legend {
  padding: 0 0.25rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--ink-soft);
}

.option-grid.columns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: 0.45rem;
}

.lang-opt.compact {
  padding: 0.38rem 0.55rem;
  font-size: 0.85rem;
}

.export-filename-opts {
  display: grid;
  gap: 0.55rem;
}

.export-opt {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--page-soft);
  cursor: pointer;
  min-width: 0;
}

.export-opt.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-opt-head {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink);
}

.export-opt-hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--ink-soft);
}

.custom-note {
  color: var(--accent);
}

.lang-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem 0.85rem;
}

.lang-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.lang-opt {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--page-soft);
  color: var(--ink-soft);
  font-size: 0.9rem;
  font-weight: 550;
  cursor: pointer;
}

.lang-opt:has(input:checked) {
  border-color: color-mix(in srgb, var(--accent) 45%, var(--line));
  background: var(--accent-soft);
  color: var(--accent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 12%, transparent);
}

.lang-opt input {
  accent-color: var(--accent);
}

.meta {
  margin: 0;
  display: grid;
  gap: 0.25rem;
}

.meta.folder-box {
  grid-template-columns: auto 1fr;
  gap: 0.45rem 0.75rem;
  align-items: center;
}

.folder-box {
  margin: 0;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--page-soft);
}

.meta dt {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--ink);
}

.meta dd {
  margin: 0;
  padding-top: 0.15rem;
}

.tips {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  font-size: 0.85rem;
  color: var(--ink-soft);
  line-height: 1.45;
}

.tip-box {
  list-style: none;
  margin: 0;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--page-soft);
  color: var(--ink-soft);
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.tip-box li {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0 0.75rem;
  align-items: start;
}

.tip-box :deep(strong) {
  color: var(--ink);
  font-weight: 600;
  font-size: 0.85rem;
}

.tips :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.84em;
  padding: 0.08em 0.35em;
  border-radius: 4px;
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--ink);
}

.err {
  color: var(--danger);
  margin: 0;
}

.path {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--ink-soft);
  word-break: break-all;
  line-height: 1.4;
}
</style>
