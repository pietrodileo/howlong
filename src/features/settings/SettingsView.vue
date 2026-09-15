<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue';
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
import UpdatesPanel from './UpdatesPanel.vue';

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
const settingsFilter = ref('');

const settingsGroupRows = {
  preferences: ['profile', 'locale', 'appearance'],
  workspace: ['folder', 'workspace'],
  estimates: ['estimate', 'presentation', 'export'],
  planning: ['workingCalendar', 'activityStatuses'],
  application: ['updates', 'shortcuts'],
} as const;
type SettingsGroupId = keyof typeof settingsGroupRows;
const settingsGroupIds = Object.keys(settingsGroupRows) as SettingsGroupId[];
const settingsGroupOpen = ref<Record<SettingsGroupId, boolean>>({
  preferences: false,
  workspace: false,
  estimates: false,
  planning: false,
  application: false,
});

const normalizedSettingsFilter = computed(() => normalizeSettingsText(settingsFilter.value));
const isFilteringSettings = computed(() => normalizedSettingsFilter.value.length > 0);

/** Normalize filter text so case and accents do not affect matching. */
function normalizeSettingsText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

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

const settingsGroupSearchText = computed<Record<SettingsGroupId, string>>(() => ({
  preferences: [t('settings.groupPreferences'), t('settings.groupPreferencesIntro')].join(' '),
  workspace: [t('settings.groupWorkspace'), t('settings.groupWorkspaceIntro')].join(' '),
  estimates: [t('settings.groupEstimates'), t('settings.groupEstimatesIntro')].join(' '),
  planning: [t('settings.groupPlanning'), t('settings.groupPlanningIntro')].join(' '),
  application: [t('settings.groupApplication'), t('settings.groupApplicationIntro')].join(' '),
}));

const settingsRowSearchText = computed<Record<string, string>>(() => ({
  profile: [
    t('settings.sectionProfile'),
    t('settings.usernameHelp'),
    t('settings.usernameDesktopHint'),
    t('settings.username'),
  ].join(' '),
  locale: [
    t('settings.sectionLocale'),
    t('settings.languageHelp'),
    t('settings.language'),
    t('settings.italian'),
    t('settings.english'),
  ].join(' '),
  appearance: [
    t('settings.sectionAppearance'),
    t('settings.appearanceHelp'),
    t('settings.appearance'),
    t('settings.appearanceLight'),
    t('settings.appearanceDark'),
  ].join(' '),
  folder: [
    t('settings.sectionFolder'),
    t('settings.workspaceFolderHelp'),
    t('settings.workspaceFolderActive'),
    t('settings.workspaceFolderDefault'),
    t('settings.estimatesFolderActive'),
    t('settings.modelsFolderActive'),
    t('settings.workspaceFolderCustom'),
    t('settings.pickFolder'),
    t('settings.resetFolder'),
    t('settings.recentWorkspaces'),
  ].join(' '),
  workspace: [
    t('settings.sectionWorkspace'),
    t('settings.tipImport'),
    t('settings.tipExport'),
    t('settings.import'),
    t('settings.export'),
  ].join(' '),
  estimate: [
    t('settings.sectionEstimate'),
    t('settings.estimateColumnsIntro'),
    ...estimateColumnKeys.map(estimateColumnLabel),
  ].join(' '),
  presentation: [
    t('settings.sectionPresentation'),
    t('settings.presentationIntro'),
    t('settings.managerViewLegend'),
    t('settings.clientOutputLegend'),
    t('settings.defaultManagerHideNotes'),
    t('settings.defaultManagerHideTags'),
    t('settings.defaultClientHideNotes'),
    t('settings.defaultClientHideTags'),
  ].join(' '),
  export: [
    t('settings.sectionExport'),
    t('settings.exportFilenameLegend'),
    t('settings.exportIncludeDate'),
    t('settings.exportIncludeDateHint'),
    t('settings.exportIncludeTime'),
    t('settings.exportIncludeTimeHint'),
  ].join(' '),
  workingCalendar: [
    t('settings.sectionGanttWeekends'),
    t('settings.ganttWeekendIntro'),
    t('settings.saturday'),
    t('settings.sunday'),
    t('settings.ganttWorkingDaysExcludeWeekend'),
    t('settings.ganttWorkingDaysExcludeWeekendHelp'),
  ].join(' '),
  activityStatuses: [
    t('settings.sectionGanttStatuses'),
    t('settings.ganttAllowedStatuses'),
    t('settings.ganttStatusIntro'),
    t('settings.ganttStatusPriority'),
    t('settings.ganttStatusCancelledRule'),
    ...ACTIVITY_STATUSES.map((status) => t(`settings.status${status.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join('')}Meaning`)),
  ].join(' '),
  updates: [
    t('settings.sectionUpdates'),
    t('settings.updateIntro'),
    t('settings.updateCurrentVersion'),
    t('settings.updateAvailableVersion'),
    t('settings.updateReleaseNotes'),
    t('settings.checkForUpdates'),
    t('settings.downloadUpdate'),
    t('settings.installAndRestart'),
    t('settings.updatesDesktopOnly'),
  ].join(' '),
  shortcuts: [
    t('settings.sectionShortcuts'),
    t('settings.shortcutsIntro'),
    t('settings.shortcutSave'),
    t('settings.shortcutNewTab'),
    t('settings.shortcutCloseTab'),
    t('settings.shortcutToggleView'),
    t('settings.shortcutUndo'),
    t('settings.shortcutRedo'),
    t('settings.shortcutPreviousTab'),
    t('settings.shortcutNextTab'),
  ].join(' '),
}));

function matchesSettingsFilter(searchText: string): boolean {
  const query = normalizedSettingsFilter.value;
  return !query || normalizeSettingsText(searchText).includes(query);
}

function shouldShowSettingsGroup(groupId: SettingsGroupId): boolean {
  return matchesSettingsFilter(settingsGroupSearchText.value[groupId])
    || settingsGroupRows[groupId].some((rowId) => matchesSettingsFilter(settingsRowSearchText.value[rowId] ?? ''));
}

function shouldShowSettingsRow(groupId: SettingsGroupId, rowId: string): boolean {
  return matchesSettingsFilter(settingsGroupSearchText.value[groupId])
    || matchesSettingsFilter(settingsRowSearchText.value[rowId] ?? '');
}

/** Open a settings group while its contents are being filtered. */
function shouldForceOpenSettingsGroup(groupId: SettingsGroupId): boolean {
  return isFilteringSettings.value && shouldShowSettingsGroup(groupId);
}

/** Return the effective disclosure state for a settings group. */
function isSettingsGroupOpen(groupId: SettingsGroupId): boolean {
  return settingsGroupOpen.value[groupId] || shouldForceOpenSettingsGroup(groupId);
}

/** Remember a user's settings group disclosure choice, not a filter's temporary state. */
function onSettingsGroupToggle(groupId: SettingsGroupId, event: Event) {
  if (shouldForceOpenSettingsGroup(groupId)) return;
  settingsGroupOpen.value[groupId] = (event.currentTarget as HTMLDetailsElement).open;
}

function shouldForceOpenSettingsRow(rowId: string): boolean {
  return isFilteringSettings.value && matchesSettingsFilter(settingsRowSearchText.value[rowId] ?? '');
}

const hasSettingsFilterMatch = computed(() => settingsGroupIds.some(shouldShowSettingsGroup));

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
      <p class="settings-intro">{{ t('settings.intro') }}</p>
    </header>

    <div class="settings-filter" role="search">
      <label class="settings-filter-label" for="settings-filter">{{ t('settings.filterLabel') }}</label>
      <input
        id="settings-filter"
        v-model="settingsFilter"
        type="search"
        class="settings-filter-input"
        :placeholder="t('settings.filterPlaceholder')"
        :aria-label="t('settings.filterLabel')"
        autocomplete="off"
      />
    </div>

    <p v-if="isFilteringSettings && !hasSettingsFilterMatch" class="settings-filter-empty" role="status">
      {{ t('settings.filterNoResults') }}
    </p>

    <details
      v-show="shouldShowSettingsGroup('preferences')"
      class="settings-group"
      :open="isSettingsGroupOpen('preferences')"
      aria-labelledby="settings-group-preferences"
      @toggle="onSettingsGroupToggle('preferences', $event)"
    >
      <summary class="settings-group-head">
        <h3 id="settings-group-preferences" class="settings-group-title">{{ t('settings.groupPreferences') }}</h3>
        <p class="settings-group-description">{{ t('settings.groupPreferencesIntro') }}</p>
      </summary>
      <div class="settings-group-rows">
        <SettingsPanel
          v-show="shouldShowSettingsRow('preferences', 'profile')"
          :title="t('settings.sectionProfile')"
          :force-open="shouldForceOpenSettingsRow('profile')"
        >
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

        <SettingsPanel
          v-show="shouldShowSettingsRow('preferences', 'locale')"
          :title="t('settings.sectionLocale')"
          :force-open="shouldForceOpenSettingsRow('locale')"
        >
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

        <SettingsPanel
          v-show="shouldShowSettingsRow('preferences', 'appearance')"
          :title="t('settings.sectionAppearance')"
          :force-open="shouldForceOpenSettingsRow('appearance')"
        >
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
      </div>
    </details>

    <details
      v-show="shouldShowSettingsGroup('workspace')"
      class="settings-group"
      :open="isSettingsGroupOpen('workspace')"
      aria-labelledby="settings-group-workspace"
      @toggle="onSettingsGroupToggle('workspace', $event)"
    >
      <summary class="settings-group-head">
        <h3 id="settings-group-workspace" class="settings-group-title">{{ t('settings.groupWorkspace') }}</h3>
        <p class="settings-group-description">{{ t('settings.groupWorkspaceIntro') }}</p>
      </summary>
      <div class="settings-group-rows">
        <SettingsPanel
          v-show="shouldShowSettingsRow('workspace', 'folder')"
          :title="t('settings.sectionFolder')"
          :open="openFolderSection"
          :force-open="shouldForceOpenSettingsRow('folder')"
        >
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

        <SettingsPanel
          v-show="shouldShowSettingsRow('workspace', 'workspace')"
          :title="t('settings.sectionWorkspace')"
          :force-open="shouldForceOpenSettingsRow('workspace')"
        >
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
      </div>
    </details>

    <details
      v-show="shouldShowSettingsGroup('estimates')"
      class="settings-group"
      :open="isSettingsGroupOpen('estimates')"
      aria-labelledby="settings-group-estimates"
      @toggle="onSettingsGroupToggle('estimates', $event)"
    >
      <summary class="settings-group-head">
        <h3 id="settings-group-estimates" class="settings-group-title">{{ t('settings.groupEstimates') }}</h3>
        <p class="settings-group-description">{{ t('settings.groupEstimatesIntro') }}</p>
      </summary>
      <div class="settings-group-rows">
        <SettingsPanel
          v-show="shouldShowSettingsRow('estimates', 'estimate')"
          :title="t('settings.sectionEstimate')"
          :force-open="shouldForceOpenSettingsRow('estimate')"
        >
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

        <SettingsPanel
          v-show="shouldShowSettingsRow('estimates', 'presentation')"
          :title="t('settings.sectionPresentation')"
          :force-open="shouldForceOpenSettingsRow('presentation')"
        >
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

        <SettingsPanel
          v-show="shouldShowSettingsRow('estimates', 'export')"
          :title="t('settings.sectionExport')"
          :force-open="shouldForceOpenSettingsRow('export')"
        >
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
      </div>
    </details>

    <details
      v-show="shouldShowSettingsGroup('planning')"
      class="settings-group"
      :open="isSettingsGroupOpen('planning')"
      aria-labelledby="settings-group-planning"
      @toggle="onSettingsGroupToggle('planning', $event)"
    >
      <summary class="settings-group-head">
        <h3 id="settings-group-planning" class="settings-group-title">{{ t('settings.groupPlanning') }}</h3>
        <p class="settings-group-description">{{ t('settings.groupPlanningIntro') }}</p>
      </summary>
      <div class="settings-group-rows">
        <SettingsPanel
          v-show="shouldShowSettingsRow('planning', 'workingCalendar')"
          :title="t('settings.sectionGanttWeekends')"
          :force-open="shouldForceOpenSettingsRow('workingCalendar')"
        >
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

        <SettingsPanel
          v-show="shouldShowSettingsRow('planning', 'activityStatuses')"
          :title="t('settings.sectionGanttStatuses')"
          :force-open="shouldForceOpenSettingsRow('activityStatuses')"
        >
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
      </div>
    </details>

    <details
      v-show="shouldShowSettingsGroup('application')"
      class="settings-group"
      :open="isSettingsGroupOpen('application')"
      aria-labelledby="settings-group-application"
      @toggle="onSettingsGroupToggle('application', $event)"
    >
      <summary class="settings-group-head">
        <h3 id="settings-group-application" class="settings-group-title">{{ t('settings.groupApplication') }}</h3>
        <p class="settings-group-description">{{ t('settings.groupApplicationIntro') }}</p>
      </summary>
      <div class="settings-group-rows">
        <UpdatesPanel
          v-show="shouldShowSettingsRow('application', 'updates')"
          :force-open="shouldForceOpenSettingsRow('updates')"
        />

        <SettingsPanel
          v-show="shouldShowSettingsRow('application', 'shortcuts')"
          :title="t('settings.sectionShortcuts')"
          :force-open="shouldForceOpenSettingsRow('shortcuts')"
        >
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
      </div>
    </details>

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

.settings-intro {
  max-width: 48rem;
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.9rem;
  line-height: 1.45;
}

.settings-filter {
  display: grid;
  gap: 0.45rem;
  margin: 0 0 1.55rem;
}

.settings-filter-label {
  color: var(--ink);
  font-size: 0.82rem;
  font-weight: 600;
}

.settings-filter-input {
  flex: 1;
  min-width: 0;
  height: 2.35rem;
  box-sizing: border-box;
  padding: 0 0.7rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink);
  font: inherit;
  font-size: 0.86rem;
}

.settings-filter-input:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--accent) 45%, var(--line));
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.settings-filter-input::placeholder {
  color: var(--muted);
}

.settings-filter-empty {
  margin: -0.45rem 0 1.35rem;
  color: var(--ink-soft);
  font-size: 0.88rem;
}

.settings-group {
  margin-bottom: 0.8rem;
  padding: 0.65rem 1rem 0.85rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  transition: background 0.12s ease, border-color 0.12s ease;
}

.settings-group[open] {
  border-color: color-mix(in srgb, var(--accent) 30%, var(--line));
}

.settings-group:not([open]):hover {
  border-color: color-mix(in srgb, var(--accent) 30%, var(--line));
  background: color-mix(in srgb, var(--accent-soft) 34%, var(--surface));
}

.settings-group-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 0.75rem;
  margin: 0 0 0.35rem;
  padding: 0.45rem 0 0.6rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  list-style: none;
  transition: background 0.12s ease, box-shadow 0.12s ease;
}

.settings-group-head::-webkit-details-marker,
.settings-group-head::marker {
  display: none;
}

.settings-group-head::after {
  grid-column: 2;
  grid-row: 1;
  color: var(--muted);
  content: '›';
  font-size: 1.35rem;
  line-height: 1;
  transition: color 0.12s ease, transform 0.15s ease;
}

.settings-group-head:focus-visible {
  background: color-mix(in srgb, var(--accent-soft) 34%, var(--surface));
}

.settings-group:not([open]):hover > .settings-group-head::after,
.settings-group-head:focus-visible::after {
  color: var(--accent-hover);
}

.settings-group:not([open]):hover .settings-group-title,
.settings-group-head:focus-visible .settings-group-title {
  color: var(--accent);
}

.settings-group[open] > .settings-group-head::after {
  transform: rotate(90deg);
}

.settings-group-title {
  grid-column: 1;
  grid-row: 1;
  margin: 0;
  font-family: var(--font-ui);
  color: var(--ink);
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.settings-group-description {
  grid-column: 1 / -1;
  grid-row: 2;
  max-width: 48rem;
  margin: 0.25rem 0 0;
  color: var(--ink-soft);
  font-size: 0.84rem;
  line-height: 1.4;
}

.settings-group-rows {
  padding-top: 0.35rem;
  border-top: 1px solid var(--line);
}

.settings-group-rows :deep(.settings-panel:last-child) {
  border-bottom: none;
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
