<script setup lang="ts">
import { onMounted, computed, defineAsyncComponent, watch } from 'vue';
import AboutModal from './components/AboutModal.vue';
import AppSidebar from './components/AppSidebar.vue';
import TitleBar from './components/TitleBar.vue';
import WorkingView from '../features/estimate/WorkingView.vue';
import { useSettingsStore } from '../features/settings/settings';
import { useModelsStore } from '../features/models/models';
import { useLibraryStore } from '../features/library/library';
import { useDocumentsStore } from '../shared/documents';
import { useUiStore, type AppView } from './ui';
import { useI18n } from './i18n/useI18n';
import { applyTheme } from '../features/settings/appearance';
import { isTauri, openFilePath } from '../platform/tauri';
import { toErrorMessage } from '../shared/errors';

const LibraryView = defineAsyncComponent(() => import('../features/library/LibraryView.vue'));
const ModelsView = defineAsyncComponent(() => import('../features/models/ModelsView.vue'));
const SettingsView = defineAsyncComponent(() => import('../features/settings/SettingsView.vue'));
const CompareView = defineAsyncComponent(() => import('../features/comparison/CompareView.vue'));
const GanttView = defineAsyncComponent(() => import('../features/planning/GanttView.vue'));
const AnalyticsView = defineAsyncComponent(() => import('../features/analytics/AnalyticsView.vue'));
const WelcomeView = defineAsyncComponent(() => import('./WelcomeView.vue'));
const DocumentTabs = defineAsyncComponent(() => import('./components/DocumentTabs.vue'));

const APP_VERSION = '0.6.0';

const settings = useSettingsStore();
const models = useModelsStore();
const library = useLibraryStore();
const docs = useDocumentsStore();
const ui = useUiStore();
const { t } = useI18n();

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

/** Keep document-aware feature views open when the active session changes. */
function onActivateDocument() {
  if (ui.currentView !== 'gantt' && ui.currentView !== 'analytics') ui.navigate('working');
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
    <AppSidebar />

    <div class="workspace">
      <TitleBar />
      <DocumentTabs v-if="(ui.currentView === 'working' || ui.currentView === 'gantt' || ui.currentView === 'analytics') && docs.hasSessions" @activate="onActivateDocument" />
      <header v-if="ui.currentView === 'library' || ui.currentView === 'models' || ui.currentView === 'compare' || ui.currentView === 'gantt' || ui.currentView === 'analytics'" class="topbar">
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
      </header>

      <main :class="{ flush: ui.currentView === 'working' || ui.currentView === 'settings' || ui.currentView === 'welcome' }">
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
      <button
        v-if="ui.toastFilePath"
        type="button"
        class="toast-open"
        @click="openToastFile"
      >{{ t('welcome.openEstimate') }}</button>
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
  padding: 1.15rem 1.75rem 0.85rem;
  border-bottom: 1px solid var(--line);
  margin-bottom: 0.15rem;
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

.sub {
  margin: 0.35rem 0 0;
  color: var(--muted);
  font-size: 0.88rem;
  line-height: 1.4;
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

.toast {
  position: fixed;
  bottom: 1.25rem;
  right: 1.25rem;
  max-width: min(400px, calc(100vw - 2rem));
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
