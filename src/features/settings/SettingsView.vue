<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { useDocumentsStore } from '../../shared/documents';
import ConfirmModal from '../../shared/components/ConfirmModal.vue';
import { useWorkspaceSwitch } from './useWorkspaceSwitch';
import { useSettingsStore } from './settings';
import { useModelsStore } from '../models/models';
import { useLibraryStore } from '../library/library';
import { useUiStore } from '../../app/ui';
import { exportSettings, openSettingsFile } from '../../platform/files/io';
import { importWorkspaceText } from './workspace';
import { openDirectoryDialog, isTauri } from '../../platform/tauri';
import { resolveEstimatesDir, resolveModelsDir, workspaceRootFromSettings } from './workspacePaths';
import { useI18n } from '../../app/i18n/useI18n';
import { isDialogCancelled } from '../../platform/files/dialogResult';
import { toErrorMessage } from '../../shared/errors';
import type { Locale, Theme } from '../../models/settings';
import SettingsPanel from './SettingsPanel.vue';
import { ESTIMATE_TOGGLEABLE_COLUMNS, type EstimateToggleableColumn } from './estimateColumns';
import { syncEstimateColumnsFromSettings } from '../../shared/composables/useResizableColumns';
import { ACTIVITY_STATUSES, ACTIVITY_STATUS_COLORS } from '../../domain/gantt';

const settings = useSettingsStore();
const models = useModelsStore();
const library = useLibraryStore();
const ui = useUiStore();
const documentsStore = useDocumentsStore();
const { isSwitching, switchWorkspace } = useWorkspaceSwitch();
const pendingWorkspaceDir = ref<string | null>(null);
const { t, setLocale, locale } = useI18n();

const resolvedWorkspaceDir = ref('');
const resolvedEstimatesDir = ref('');
const resolvedModelsDir = ref('');
const openFolderSection = ref(ui.consumeSettingsSection() === 'folder');

// Flag to prevent duplicate saves
const isSaving = ref(false);

// Auto-save settings when they change
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
watch(
  () => settings.settings,
  async () => {
    if (isSaving.value || isSwitching.value) return;
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      saveTimeout = null;
      try {
        isSaving.value = true;
        await settings.save();
        syncEstimateColumnsFromSettings();
        await library.loadAll();
        await models.loadAll();
        await refreshWorkspacePaths();
      } catch (e) {
        ui.notify(toErrorMessage(e), true);
      } finally {
        isSaving.value = false;
      }
    }, 1000);
  },
  { deep: true, flush: 'sync' },
);

onUnmounted(() => {
  if (!saveTimeout) return;
  clearTimeout(saveTimeout);
  if (!isSaving.value && !isSwitching.value) void settings.save().catch(error => ui.notify(toErrorMessage(error), true));
});

/** Refresh the displayed native workspace paths. */
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

/** Execute the confirmed switch while suppressing the settings autosave timer. */
async function applyWorkspaceFolderChange(saveChanges: boolean) {
  const path = pendingWorkspaceDir.value;
  if (path === null || isSaving.value || isSwitching.value) return;
  pendingWorkspaceDir.value = null;
  if (saveTimeout) { clearTimeout(saveTimeout); saveTimeout = null; }
  try {
    await switchWorkspace(path, saveChanges);
    await refreshWorkspacePaths();
    ui.notify(library.entries.length
      ? t('settings.folderLoaded', { n: String(library.entries.length) })
      : t('settings.folderEmpty'));
  } catch (error) {
    await refreshWorkspacePaths();
    ui.notify(toErrorMessage(error), true);
  }
}

/** Ask about dirty estimates before changing any workspace state. */
async function onSelectWorkspace(path: string) {
  if (isSaving.value || isSwitching.value) return;
  if (!isTauri()) { ui.notify(t('library.desktopOnly'), true); return; }
  if (path === settings.settings.workspaceDir.trim()) return;
  pendingWorkspaceDir.value = path;
  if (!documentsStore.sessions.some(session => session.dirty)) await applyWorkspaceFolderChange(false);
}

/** Browse for a destination and route it through the same unsaved-work guard. */
async function onPickWorkspaceDir() {
  if (!isTauri()) { ui.notify(t('library.desktopOnly'), true); return; }
  const path = await openDirectoryDialog(settings.settings.workspaceDir.trim() || resolvedWorkspaceDir.value || undefined);
  if (path) await onSelectWorkspace(path);
}

/** Select the built-in workspace using the shared switching flow. */
async function onResetWorkspaceDir() {
  await onSelectWorkspace('');
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
    if (path) ui.notify(t('settings.exported'), false, path);
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

/** Restricts future status choices without rewriting existing activity statuses. */
function onStatusAvailabilityChange(status: typeof ACTIVITY_STATUSES[number], enabled: boolean) {
  if (status === 'to-plan' || status === 'planned') return;
  settings.settings.ganttDisabledStatuses = enabled
    ? settings.settings.ganttDisabledStatuses.filter(value => value !== status)
    : [...new Set([...settings.settings.ganttDisabledStatuses, status])];
}
</script>

<template>
  <div class="settings" :key="locale">
    <ConfirmModal
      :open="pendingWorkspaceDir !== null"
      :title="t('settings.switchWorkspaceTitle')"
      :message="t('settings.switchWorkspaceBody')"
      :confirm-label="t('common.save')"
      :secondary-label="t('tabs.closeDirtyDiscard')"
      @confirm="applyWorkspaceFolderChange(true)"
      @secondary="applyWorkspaceFolderChange(false)"
      @cancel="pendingWorkspaceDir = null"
    />
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

    <SettingsPanel :title="t('settings.sectionShortcuts')">
      <p class="field-hint">{{ t('settings.shortcutsIntro') }}</p>
      <dl class="shortcut-list">
        <template v-for="shortcut in [
          ['S', 'shortcutSave'],
          ['T', 'shortcutNewTab'],
          ['W', 'shortcutCloseTab'],
          ['E', 'shortcutToggleView'],
          ['Z', 'shortcutUndo'],
        ]" :key="shortcut[0]">
          <dt><kbd>Ctrl/Cmd</kbd><span>+</span><kbd>{{ shortcut[0] }}</kbd></dt>
          <dd>{{ t(`settings.${shortcut[1]}`) }}</dd>
        </template>
        <dt><kbd>Ctrl+Y</kbd><span>/</span><kbd>Cmd+Shift+Z</kbd></dt>
        <dd>{{ t('settings.shortcutRedo') }}</dd>
        <dt><kbd>Ctrl/Cmd</kbd><span>+</span><kbd>←</kbd></dt>
        <dd>{{ t('settings.shortcutPreviousTab') }}</dd>
        <dt><kbd>Ctrl/Cmd</kbd><span>+</span><kbd>→</kbd></dt>
        <dd>{{ t('settings.shortcutNextTab') }}</dd>
      </dl>
    </SettingsPanel>

    <SettingsPanel :title="t('settings.sectionGanttWeekends')">
      <p class="field-hint">{{ t('settings.ganttWeekendIntro') }}</p>
      <div class="lang-row">
        <label class="lang-opt compact">
          <input v-model="settings.settings.ganttWeekendSaturday" type="checkbox" />
          <span>{{ t('settings.saturday') }}</span>
        </label>
        <label class="lang-opt compact">
          <input v-model="settings.settings.ganttWeekendSunday" type="checkbox" />
          <span>{{ t('settings.sunday') }}</span>
        </label>
      </div>
      <div class="lang-row">
        <label class="lang-opt compact">
          <input v-model="settings.settings.ganttWorkingDaysExcludeWeekend" type="checkbox" />
          <span>{{ t('settings.ganttWorkingDaysExcludeWeekend') }}</span>
        </label>
      </div>
      <p class="field-hint">{{ t('settings.ganttWorkingDaysExcludeWeekendHelp') }}</p>
    </SettingsPanel>

    <SettingsPanel :title="t('settings.sectionGanttStatuses')">
      <p class="field-hint">{{ t('settings.ganttAllowedStatuses') }}</p>
      <div class="status-reference">
        <p>{{ t('settings.ganttStatusIntro') }}</p>
        <ul>
          <li v-for="status in ACTIVITY_STATUSES" :key="status">
            <label class="status-choice"><input type="checkbox" :checked="!settings.settings.ganttDisabledStatuses.some(disabled => disabled === status)" :disabled="status === 'to-plan' || status === 'planned'" @change="onStatusAvailabilityChange(status, ($event.target as HTMLInputElement).checked)" /><span :style="{ background: ACTIVITY_STATUS_COLORS[status] }" />
            {{ t(`settings.status${status.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join('')}Meaning`) }}
          </label></li>
        </ul>
      </div>
      <div class="status-rules">
        <p>{{ t('settings.ganttStatusPriority') }}</p>
        <p>{{ t('settings.ganttStatusCancelledRule') }}</p>
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
        <button type="button" class="settings-action" :disabled="isSaving || isSwitching" @click="onPickWorkspaceDir">
          {{ t('settings.pickFolder') }}
        </button>
        <button
          type="button"
          class="settings-action"
          :disabled="isSaving || isSwitching || !settings.settings.workspaceDir.trim()"
          @click="onResetWorkspaceDir"
        >
          {{ t('settings.resetFolder') }}
        </button>
      </div>
      <label v-if="settings.settings.recentWorkspaceDirs.length" class="recent-workspaces">
        <span>{{ t('settings.recentWorkspaces') }}</span>
        <select :value="settings.settings.workspaceDir" :disabled="isSaving || isSwitching" @change="onSelectWorkspace(($event.target as HTMLSelectElement).value); ($event.target as HTMLSelectElement).value = settings.settings.workspaceDir">
          <option value="">{{ t('settings.workspaceFolderDefault') }}</option>
          <option v-for="path in settings.settings.recentWorkspaceDirs" :key="path" :value="path">{{ path }}</option>
        </select>
      </label>
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
.recent-workspaces {
  display: grid;
  gap: .35rem;
  max-width: 36rem;
  margin-top: .75rem;
  font-size: .8rem;
  color: var(--muted);
}
.recent-workspaces select {
  width: 100%;
  min-width: 0;
  font: inherit;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: .45rem .6rem;
}
.settings {
  width: 100%;
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

.shortcut-list {
  display: grid;
  grid-template-columns: minmax(12rem, max-content) 1fr;
  gap: 0.65rem 1.25rem;
  align-items: center;
  margin: 0;
  padding: 0.85rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--page-soft);
}

.shortcut-list dt {
  display: flex;
  gap: 0.3rem;
  align-items: center;
}

.shortcut-list dd {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.88rem;
}

.shortcut-list kbd {
  padding: 0.15rem 0.4rem;
  border: 1px solid var(--line);
  border-radius: 0.3rem;
  background: var(--surface);
  box-shadow: 0 1px 0 var(--line);
  color: var(--ink);
  font: 600 0.75rem var(--font-ui);
}

@media (max-width: 620px) {
  .shortcut-list {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }

  .shortcut-list dd:not(:last-child) {
    margin-bottom: 0.65rem;
  }
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

.status-reference {
  margin-top: .8rem;
  padding: .85rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--page-soft);
}

.status-reference p { margin: 0; color: var(--ink-soft); }
.status-reference p + p { margin-top: .55rem; }
.status-reference ul { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: .45rem 1rem; margin: .75rem 0; padding: 0; list-style: none; }
.status-reference li { display: flex; align-items: center; gap: .5rem; color: var(--ink-soft); font-size: .85rem; }
.status-reference li span { width: .65rem; height: .65rem; flex: 0 0 .65rem; border-radius: 50%; }

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
.status-choice { display: flex; align-items: center; gap: .5rem; cursor: pointer; }
.status-rules { margin-top: .75rem; padding: .75rem .85rem; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--page-soft); color: var(--ink-soft); font-size: .8rem; line-height: 1.5; }
.status-rules p { margin: 0; }
.status-rules p + p { margin-top: .45rem; }
</style>
