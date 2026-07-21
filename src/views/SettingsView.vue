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

const settings = useSettingsStore();
const models = useModelsStore();
const library = useLibraryStore();
const ui = useUiStore();
const { t, setLocale } = useI18n();

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
</script>

<template>
  <div class="settings">
    <header class="hero">
      <h2 class="title">{{ t('settings.title') }}</h2>
      <p v-if="settings.settings.username.trim()" class="user-badge">
        {{ settings.settings.username.trim() }}
      </p>
    </header>

    <section class="block">
      <h3>{{ t('settings.username') }}</h3>
      <p class="intro">{{ t('settings.usernameHelp') }}</p>
      <label class="field">
        <input
          type="text"
          class="username-input"
          :value="settings.settings.username"
          :placeholder="t('settings.usernamePh')"
          autocomplete="username"
          @input="settings.settings.username = ($event.target as HTMLInputElement).value"
        />
      </label>
    </section>

    <section class="block">
      <h3>{{ t('settings.language') }}</h3>
      <p class="intro">{{ t('settings.languageHelp') }}</p>
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
        <button type="button" class="primary" @click="save">{{ t('settings.save') }}</button>
      </div>
    </section>

    <section class="block">
      <h3>{{ t('settings.appearance') }}</h3>
      <p class="intro">{{ t('settings.appearanceHelp') }}</p>
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
    </section>

    <section class="block">
      <h3>{{ t('settings.estimatesFolder') }}</h3>
      <p class="intro">{{ t('settings.estimatesFolderHelp') }}</p>
      <dl class="meta">
        <dt>{{ t('settings.estimatesFolderActive') }}</dt>
        <dd class="path">{{ resolvedEstimatesDir || t('library.desktopOnly') }}</dd>
      </dl>
      <p v-if="settings.settings.estimatesDir.trim()" class="intro custom-note">
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
    </section>

    <section class="block">
      <h3>{{ t('settings.importExport') }}</h3>
      <ul class="tips">
        <li v-html="md(t('settings.tipImport'))" />
        <li v-html="md(t('settings.tipExport'))" />
      </ul>
      <div class="chrome">
        <button type="button" class="ghost" @click="onImport">{{ t('settings.import') }}</button>
        <button type="button" class="ghost" @click="onExport">{{ t('settings.export') }}</button>
      </div>
    </section>

    <p v-if="settings.lastError" class="err">{{ settings.lastError }}</p>
  </div>
</template>

<style scoped>
.settings {
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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

.block {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-bottom: 1.15rem;
  border-bottom: 1px solid var(--line);
}

.block:last-of-type {
  border-bottom: none;
  padding-bottom: 0;
}

.block h3 {
  margin: 0;
  font-family: var(--font-ui);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
}

.intro {
  margin: 0;
  font-size: 0.9rem;
  color: var(--ink-soft);
  line-height: 1.5;
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
