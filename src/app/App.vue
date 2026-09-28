<script setup lang="ts">
import { onMounted, computed, defineAsyncComponent, ref, watch } from 'vue';
import AboutModal from './components/AboutModal.vue';
import AppSidebar from './components/AppSidebar.vue';
import TitleBar from './components/TitleBar.vue';
import ConfirmModal from '../shared/components/ConfirmModal.vue';
import RefreshIcon from '../shared/components/RefreshIcon.vue';
import WorkingView from '../features/estimate/WorkingView.vue';
import { useSettingsStore } from '../features/settings/settings';
import { useModelsStore } from '../features/models/models';
import { useLibraryStore } from '../features/library/library';
import { useEstimateStore } from '../features/estimate/estimate';
import { useDocumentsStore } from '../shared/documents';
import { useUiStore, type AppView } from './ui';
import { useI18n } from './i18n/useI18n';
import { applyTheme } from '../features/settings/appearance';
import { isTauri, openContainingFolder, openFilePath, readTextFile } from '../platform/tauri';
import { toErrorMessage } from '../shared/errors';
import { APP_VERSION } from '../shared/version';
import { importEstimateText } from '../platform/files/import';

const LibraryView = defineAsyncComponent(() => import('../features/library/LibraryView.vue'));
const ModelsView = defineAsyncComponent(() => import('../features/models/ModelsView.vue'));
const SettingsView = defineAsyncComponent(() => import('../features/settings/SettingsView.vue'));
const CompareView = defineAsyncComponent(() => import('../features/comparison/CompareView.vue'));
const GanttView = defineAsyncComponent(() => import('../features/planning/GanttView.vue'));
const AnalyticsView = defineAsyncComponent(() => import('../features/analytics/AnalyticsView.vue'));
const WelcomeView = defineAsyncComponent(() => import('./WelcomeView.vue'));
const DocumentTabs = defineAsyncComponent(() => import('./components/DocumentTabs.vue'));

const settings = useSettingsStore();
const models = useModelsStore();
const library = useLibraryStore();
const estimate = useEstimateStore();
const docs = useDocumentsStore();
const ui = useUiStore();
const { t } = useI18n();
const reloadConfirmOpen = ref(false);
const reloading = ref(false);
const reloadAnimating = ref(false);

async function openToastFile() {
  const path = ui.toastFilePath;
  if (!path) return;
  try {
    if (isTauri()) await openFilePath(path);
    else window.open(path, '_blank', 'noopener,noreferrer');
    ui.dismissToast();
  } catch (error) {
    ui.notify(toErrorMessage(error), true);
  }
}

/** Reveal the exported toast file in its containing desktop folder. */
async function openToastFolder() {
  const path = ui.toastFilePath;
  if (!path) return;
  try {
    if (!isTauri()) {
      ui.notify(t('library.desktopOnly'), true);
      return;
    }
    await openContainingFolder(path);
    ui.dismissToast();
  } catch (error) {
    ui.notify(toErrorMessage(error), true);
  }
}

/** Keep document-aware feature views open when the active session changes. */
function onActivateDocument() {
  if (ui.currentView !== 'gantt' && ui.currentView !== 'analytics') ui.navigate('working');
}

/** Persist the active estimate from the shared Gantt header action. */
async function onSaveGantt() {
  try {
    const { path, data } = await library.saveEstimate(estimate.estimate);
    estimate.estimate.meta.updatedAt = data.meta.updatedAt;
    estimate.estimate.auditHistory = data.auditHistory;
    estimate.markSaved(path);
    const session = docs.activeSession;
    if (session) {
      docs.updateSessionEstimate(session.sessionId, estimate.estimate);
      docs.markSaved(session.sessionId, path);
    }
    ui.notify(t('working.saved', { path }));
  } catch (error) {
    ui.notify(toErrorMessage(error), true);
  }
}

/** Request confirmation before replacing the active Plan estimate from disk. */
function onReloadGantt() {
  reloadAnimating.value = true;
  window.setTimeout(() => { reloadAnimating.value = false; }, 700);
  if (!estimate.filePath) {
    ui.notify(t('common.noFileOpen'), true);
    return;
  }
  if (estimate.dirty || docs.activeSession?.dirty) {
    reloadConfirmOpen.value = true;
    return;
  }
  void doReloadGantt();
}

/** Reload the active estimate and reset its session history. */
async function doReloadGantt() {
  const path = estimate.filePath;
  if (!path) return;
  if (!isTauri()) {
    ui.notify(t('library.desktopOnly'), true);
    return;
  }
  reloading.value = true;
  try {
    const result = await importEstimateText(await readTextFile(path), 'json');
    if (!result.ok) {
      ui.notify(result.error, true);
      return;
    }
    estimate.setEstimate(result.data, path);
    const session = docs.activeSession;
    if (session) docs.replaceSessionEstimate(session.sessionId, result.data, path);
    ui.notify(t('working.reloaded'));
  } catch (error) {
    ui.notify(toErrorMessage(error), true);
  } finally {
    reloading.value = false;
  }
}

/** Confirm discarding Plan changes before reloading its source file. */
function confirmReloadGantt() {
  reloadConfirmOpen.value = false;
  void doReloadGantt();
}



const pageTitle = computed(() => {
  const keys: Record<AppView, string> = {
    welcome: 'nav.welcome',
    working: 'nav.working',
    gantt: 'gantt.navLabel',
    analytics: 'analytics.title',
    library: 'nav.library',
    models: 'nav.models',
    compare: 'nav.compare',
    settings: 'nav.settings',
  };
  return t(keys[ui.currentView]);
});

watch(
  () => settings.settings.theme,
  (theme) => applyTheme(theme === 'dark' ? 'dark' : 'light'),
  { immediate: true },
);

watch(
  () => settings.settings.locale,
  (locale) => { document.documentElement.lang = locale; },
  { immediate: true },
);

onMounted(async () => {
  await settings.load();
  applyTheme(settings.settings.theme === 'dark' ? 'dark' : 'light');
  await models.loadAll();
  await library.loadAll();
  if (settings.lastError) {
    ui.notify(settings.lastError, true);
  }
});

// Watch for when there are no sessions and we're in working view - go to welcome
watch(() => docs.hasSessions, (hasSessions) => {
  if (!hasSessions && ui.currentView === 'working') {
    ui.navigate('welcome');
  }
});
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">{{ t('common.skipToContent') }}</a>
    <AppSidebar />

    <div class="workspace">
      <TitleBar />
      <DocumentTabs v-if="(ui.currentView === 'working' || ui.currentView === 'gantt' || ui.currentView === 'analytics') && docs.hasSessions" @activate="onActivateDocument" />
      <header v-if="ui.currentView === 'library' || ui.currentView === 'models' || ui.currentView === 'compare' || ui.currentView === 'gantt' || ui.currentView === 'analytics'" class="topbar" :class="{ 'topbar-feature': ui.currentView === 'gantt' || ui.currentView === 'analytics' }">
        <div class="topbar-copy">
          <h2>{{ pageTitle }}</h2>
          <p v-if="ui.currentView === 'library'" class="sub">
            {{ t('library.lede') }}
          </p>
          <p v-else-if="ui.currentView === 'models'" class="sub">
            {{ t('models.lede') }}
          </p>
          <p v-else-if="ui.currentView === 'compare'" class="sub">
            {{ t('compare.lede') }}
          </p>
          <p v-else-if="ui.currentView === 'gantt'" class="sub">
            {{ t('gantt.lede') }}
          </p>
          <p v-else-if="ui.currentView === 'analytics'" class="sub">
            {{ t('analytics.lede') }}
          </p>
        </div>
        <div v-if="ui.currentView === 'gantt' && docs.hasSessions" class="topbar-actions">
          <button
            type="button"
            class="ghost refresh-action"
            :disabled="reloading"
            :aria-label="t('common.reload')"
            v-tip="estimate.filePath ? t('common.reload') : t('common.noFileOpen')"
            @click="onReloadGantt"
          >
            <RefreshIcon :spinning="reloadAnimating || reloading" />
          </button>
          <button type="button" class="primary save-action" @click="onSaveGantt">
            {{ t('common.save') }}
            <span
              v-if="estimate.dirty || docs.activeSession?.dirty === true"
              class="save-dirty-dot"
              role="status"
              :aria-label="t('common.unsavedF')"
              v-tip="t('common.unsavedF')"
            />
          </button>
        </div>
      </header>

      <main id="main-content" :class="{ flush: ui.currentView === 'working' || ui.currentView === 'settings' || ui.currentView === 'welcome', 'centered-empty-view': (ui.currentView === 'gantt' || ui.currentView === 'analytics') && !docs.hasSessions }">
        <WelcomeView v-if="ui.currentView === 'welcome' || (ui.currentView === 'working' && !docs.hasSessions)" />
        <WorkingView v-else-if="ui.currentView === 'working' && docs.hasSessions" />
        <GanttView v-else-if="ui.currentView === 'gantt'" />
        <AnalyticsView v-else-if="ui.currentView === 'analytics'" />
        <LibraryView v-else-if="ui.currentView === 'library'" />
        <ModelsView v-else-if="ui.currentView === 'models'" />
        <CompareView v-else-if="ui.currentView === 'compare'" />
        <SettingsView v-else-if="ui.currentView === 'settings'" />
      </main>
    </div>

    <div
      v-if="ui.toast"
      class="toast"
      :class="{ error: ui.toastError }"
      role="status"
    >
      <p class="toast-msg">{{ ui.toast }}</p>
      <div v-if="ui.toastFilePath" class="toast-actions">
        <button type="button" class="toast-open" @click="openToastFile">
          {{ t('welcome.openEstimate') }}
        </button>
        <button type="button" class="toast-open" @click="openToastFolder">
          {{ t('common.openFolder') }}
        </button>
      </div>
      <button
        type="button"
        class="toast-dismiss"
        :aria-label="t('about.close')"
        v-tip="t('about.close')"
        @click="ui.dismissToast()"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path
            fill="currentColor"
            d="M3.2 3.2a.75.75 0 0 1 1.06 0L8 6.94l3.74-3.74a.75.75 0 1 1 1.06 1.06L9.06 8l3.74 3.74a.75.75 0 1 1-1.06 1.06L8 9.06l-3.74 3.74a.75.75 0 1 1-1.06-1.06L6.94 8 3.2 4.26a.75.75 0 0 1 0-1.06Z"
          />
        </svg>
      </button>
    </div>

    <AboutModal :open="ui.aboutOpen" :version="APP_VERSION" @close="ui.hideAbout" />
    <ConfirmModal
      :open="reloadConfirmOpen"
      :title="t('working.unsavedTitle')"
      :message="t('working.unsavedBody')"
      :confirm-label="t('working.unsavedDiscard')"
      danger
      @cancel="reloadConfirmOpen = false"
      @confirm="confirmReloadGantt"
    />
  </div>
</template>

<style scoped>
.app-shell {
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: stretch;
}

.workspace {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.15rem 1.75rem 0.85rem;
  border-bottom: 1px solid var(--line);
  margin-bottom: 0.15rem;
}

.topbar-copy {
  min-width: 0;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.save-action {
  position: relative;
  flex-shrink: 0;
}

.save-dirty-dot {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 9px;
  height: 9px;
  border: 2px solid var(--page);
  border-radius: 50%;
  background: var(--warn);
}

.topbar h2 {
  margin: 0;
  font-family: var(--font-brand);
  font-size: clamp(1.35rem, 2vw, 1.75rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.2;
  color: var(--ink);
}

.topbar-feature h2 {
  font-size: clamp(1.55rem, 2.2vw, 2rem);
  line-height: 1.1;
}

.sub {
  margin: 0.35rem 0 0;
  color: var(--muted);
  font-size: 0.88rem;
  line-height: 1.4;
}

.topbar-feature .sub {
  margin-top: 0.15rem;
}

main {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 1rem 1.75rem 2rem;
}

main.flush {
  padding-top: 0.85rem;
}

main.centered-empty-view {
  display: flex;
  flex-direction: column;
}

main.centered-empty-view > .gantt-empty,
main.centered-empty-view > .analytics-empty {
  flex: 1;
  min-height: 0;
  width: 100%;
}

.toast {
  position: fixed;
  bottom: 1.25rem;
  right: 1.25rem;
  max-width: min(560px, calc(100vw - 2rem));
  display: flex;
  align-items: center;
  gap: 0.55rem;
  background: var(--toast-bg);
  color: var(--toast-fg);
  padding: 0.7rem 0.7rem 0.7rem 1rem;
  border-radius: var(--radius);
  font-size: 0.9rem;
  z-index: 50;
  box-shadow: var(--shadow-menu);
}

.toast-msg {
  margin: 0;
  flex: 1;
  min-width: 0;
  line-height: 1.4;
}

.toast-dismiss {
  flex-shrink: 0;
  width: 1.7rem;
  height: 1.7rem;
  margin: 0;
  padding: 0;
  display: inline-grid;
  place-items: center;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: inherit;
  opacity: 0.72;
  cursor: pointer;
}

.toast-actions {
  display: flex;
  flex-shrink: 0;
  gap: 0.4rem;
}

.toast-open {
  flex-shrink: 0;
  align-self: center;
  min-height: 1.8rem;
  padding: .3rem .65rem;
  border: 1px solid color-mix(in srgb, currentColor 45%, transparent);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, currentColor 10%, transparent);
  color: inherit;
  font-size: .78rem;
  font-weight: 600;
  white-space: nowrap;
}

.toast-open:hover {
  background: color-mix(in srgb, currentColor 18%, transparent);
}

.toast-dismiss:hover {
  opacity: 1;
  background: color-mix(in srgb, currentColor 14%, transparent);
}

.toast.error {
  background: var(--danger);
  color: var(--on-accent);
}
</style>
