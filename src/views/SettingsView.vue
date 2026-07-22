<script setup lang="ts">
import { ref } from 'vue';
import { useSettingsStore } from '../stores/settings';
import { useModelsStore } from '../stores/models';
import { useLibraryStore } from '../stores/library';
import { useUiStore } from '../stores/ui';
import { exportSettings, openSettingsFile } from '../lib/io';
import { importWorkspaceText } from '../lib/workspace';
import { openDirectoryDialog, isTauri } from '../lib/tauri';
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

const resolvedEstimatesDir = ref('');

async function refreshEstimatesDir() {
  if (!isTauri()) {
    resolvedEstimatesDir.value = '';
    return;
  }
  try {
    resolvedEstimatesDir.value = await library.resolveDir();
  } catch {
    resolvedEstimatesDir.value = '';
  }
}

refreshEstimatesDir();

/** Mini markdown: **bold** e `code`. */
function md(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

async function applyEstimatesFolderChange() {
  try {
    await settings.save();
    const n = await library.loadAll();
    await refreshEstimatesDir();
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
  }
}

async function save() {
  try {
    await settings.save();
    syncEstimateColumnsFromSettings();
    const n = await library.loadAll();
    await refreshEstimatesDir();
    ui.notify(
      n > 0
        ? `${t('settings.saved')} — ${t('settings.folderLoaded', { n: String(n) })}`
        : t('settings.saved'),
    );
  } catch (e) {
    ui.notify(toErrorMessage(e), true);
  }
}

async function onPickEstimatesDir() {
  if (!isTauri()) {
    ui.notify(t('library.desktopOnly'), true);
    return;
  }
  const path = await openDirectoryDialog(
    settings.settings.estimatesDir.trim() || resolvedEstimatesDir.value || undefined,
  );
  if (!path) return;
  settings.settings.estimatesDir = path;
  await applyEstimatesFolderChange();
}

async function onResetEstimatesDir() {
  if (!isTauri()) {
    ui.notify(t('library.desktopOnly'), true);
    return;
  }
  settings.settings.estimatesDir = '';
  await applyEstimatesFolderChange();
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
  await refreshEstimatesDir();
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
        <button type="button" class="primary" @click="save">{{ t('settings.save') }}</button>
      </div>
      <p v-if="settings.settings.username.trim()" class="user-badge">
        {{ settings.settings.username.trim() }}
      </p>
    </header>

    <SettingsPanel :title="t('settings.sectionProfile')">
      <label class="field">
        <span class="field-label">{{ t('settings.username') }}</span>
        <input
          type="text"
          class="username-input"
          :value="settings.settings.username"
          :placeholder="t('settings.usernamePh')"
          autocomplete="username"
          @input="settings.settings.username = ($event.target as HTMLInputElement).value"
        />
      </label>
      <p class="field-hint">{{ t('settings.usernameHelp') }}</p>
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

    <SettingsPanel :title="t('settings.sectionFolder')">
      <p class="field-hint">{{ t('settings.estimatesFolderHelp') }}</p>
      <dl class="meta">
        <dt>{{ t('settings.estimatesFolderActive') }}</dt>
        <dd class="path">{{ resolvedEstimatesDir || t('library.desktopOnly') }}</dd>
      </dl>
      <p v-if="settings.settings.estimatesDir.trim()" class="field-hint custom-note">
        {{ t('settings.estimatesFolderCustom') }}
      </p>
      <div class="chrome">
        <button type="button" class="ghost" @click="onPickEstimatesDir">
          {{ t('settings.pickFolder') }}
        </button>
        <button
          type="button"
          class="ghost"
          :disabled="!settings.settings.estimatesDir.trim()"
          @click="onResetEstimatesDir"
        >
          {{ t('settings.resetFolder') }}
        </button>
      </div>
    </SettingsPanel>

    <SettingsPanel :title="t('settings.sectionWorkspace')">
      <ul class="tips">
        <li v-html="md(t('settings.tipImport'))" />
        <li v-html="md(t('settings.tipExport'))" />
      </ul>
      <div class="chrome">
        <button type="button" class="ghost" @click="onImport">{{ t('settings.import') }}</button>
        <button type="button" class="ghost" @click="onExport">{{ t('settings.export') }}</button>
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
  gap: 0.35rem;
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
  gap: 0.35rem;
}

.username-input {
  height: 2.25rem;
  box-sizing: border-box;
  padding: 0 0.65rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink);
  font-size: 0.95rem;
  font-weight: 500;
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

.field-label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
}

.field-hint {
  margin: 0;
  font-size: 0.9rem;
  color: var(--ink-soft);
  line-height: 1.45;
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
  gap: 0.2rem;
  padding: 0.55rem 0.65rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  cursor: pointer;
}

.export-opt.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-opt-head {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-weight: 550;
  color: var(--ink);
}

.export-opt-hint {
  margin-left: 1.35rem;
  font-size: 0.8rem;
  color: var(--muted);
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
  margin: 0.15rem 0 0;
  display: grid;
  gap: 0.25rem;
}

.meta dt {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
}

.meta dd {
  margin: 0;
}

.tips {
  margin: 0;
  padding-left: 1.15rem;
  display: grid;
  gap: 0.55rem;
  font-size: 0.9rem;
  color: var(--ink-soft);
  line-height: 1.45;
}

.tips :deep(strong) {
  color: var(--ink);
  font-weight: 600;
}

.tips :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.84em;
  padding: 0.08em 0.35em;
  border-radius: 4px;
  background: var(--page-soft);
  border: 1px solid var(--line);
  color: var(--ink);
}

.err {
  color: var(--danger);
  margin: 0;
}

.path {
  margin: 0;
  font-size: 0.8rem;
  color: var(--muted);
  word-break: break-all;
  line-height: 1.4;
}
</style>
