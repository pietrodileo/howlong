<script setup lang="ts">
import { onMounted, computed, defineAsyncComponent, watch } from 'vue';
import AboutModal from './components/AboutModal.vue';
import AppSidebar from './components/AppSidebar.vue';
import WorkingView from './views/WorkingView.vue';
import { useSettingsStore } from './stores/settings';
import { useModelsStore } from './stores/models';
import { useEstimateStore } from './stores/estimate';
import { useLibraryStore } from './stores/library';
import { useUiStore, type AppView } from './stores/ui';
import { useI18n } from './i18n/useI18n';
import { applyTheme } from './lib/appearance';

const LibraryView = defineAsyncComponent(() => import('./views/LibraryView.vue'));
const ModelsView = defineAsyncComponent(() => import('./views/ModelsView.vue'));
const SettingsView = defineAsyncComponent(() => import('./views/SettingsView.vue'));

const APP_VERSION = '0.1.0';

const settings = useSettingsStore();
const models = useModelsStore();
const estimate = useEstimateStore();
const library = useLibraryStore();
const ui = useUiStore();
const { t } = useI18n();

const pageTitle = computed(() => {
  const keys: Record<AppView, string> = {
    working: 'nav.working',
    library: 'nav.library',
    models: 'nav.models',
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
  const starter = models.defaultModel;
  if (starter) {
    estimate.newFromModel(starter);
  } else {
    estimate.newEmpty();
  }
  if (settings.lastError) {
    ui.notify(settings.lastError, true);
  }
});
</script>

<template>
  <div class="app-shell">
    <AppSidebar />

    <div class="workspace">
      <header v-if="ui.currentView === 'library' || ui.currentView === 'models'" class="topbar">
        <h2>{{ pageTitle }}</h2>
        <p v-if="ui.currentView === 'library'" class="sub">
          {{ t('library.lede') }}
        </p>
      </header>

      <main :class="{ flush: ui.currentView === 'working' || ui.currentView === 'settings' }">
        <WorkingView v-if="ui.currentView === 'working'" />
        <LibraryView v-else-if="ui.currentView === 'library'" />
        <ModelsView v-else-if="ui.currentView === 'models'" />
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
        type="button"
        class="toast-dismiss"
        :aria-label="t('about.close')"
        :title="t('about.close')"
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
  min-height: 100vh;
  display: flex;
  align-items: stretch;
}

.workspace {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.topbar {
  padding: 1.15rem 1.75rem 0.35rem;
}

.topbar h2 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 600;
}

.sub {
  margin: 0.25rem 0 0;
  color: var(--muted);
  font-size: 0.88rem;
}

main {
  flex: 1;
  padding: 0.85rem 1.75rem 2rem;
}

main.flush {
  padding-top: 1.35rem;
}

.toast {
  position: fixed;
  bottom: 1.25rem;
  right: 1.25rem;
  max-width: min(400px, calc(100vw - 2rem));
  display: flex;
  align-items: flex-start;
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
  padding: 0.15rem 0;
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

.toast-dismiss:hover {
  opacity: 1;
  background: color-mix(in srgb, currentColor 14%, transparent);
}

.toast.error {
  background: var(--danger);
  color: var(--on-accent);
}
</style>
