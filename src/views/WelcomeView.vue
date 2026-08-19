<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useModelsStore } from '../stores/models';
import { useLibraryStore } from '../stores/library';
import { useUiStore } from '../stores/ui';
import { useEstimateStore } from '../stores/estimate';
import { useI18n } from '../i18n/useI18n';
import { openEstimateFile } from '../lib/io';
import { isDialogCancelled, isDialogDesktopOnly } from '../lib/dialogResult';

const ui = useUiStore();
const modelsStore = useModelsStore();
const library = useLibraryStore();
const estimate = useEstimateStore();
const { defaultModel } = storeToRefs(modelsStore);
const { t, tList } = useI18n();

const welcomePhraseIndex = Math.floor(Math.random() * 20);
const welcomeTitle = computed(() => {
  const phrases = tList('welcome.phrases');
  return phrases[welcomePhraseIndex] ?? t('welcome.title');
});

const recentEstimates = computed(() => {
  return library.sorted.slice(0, 5); // Show up to 5 most recent estimates
});

async function onNewEstimate() {
  const m = defaultModel.value ?? modelsStore.models[0] ?? null;
  if (!m) {
    ui.notify(t('working.noModelAvail'), true);
    return;
  }
  modelsStore.selectedId = m.id;
  estimate.newFromModel(m);
  ui.navigate('working');
}

async function onOpenEstimate() {
  const result = await openEstimateFile();
  if (!result.ok) {
    if (!isDialogCancelled(result)) {
      ui.notify(
        isDialogDesktopOnly(result) ? t('library.desktopOnly') : result.error,
        true,
      );
    }
    return;
  }
  estimate.setEstimate(result.data, result.path);
  ui.navigate('working');
}

function onOpenLibrary() {
  ui.navigate('library');
}

async function onOpenRecent(entry: { path: string; title: string; clientLabel: string; updatedAt: string }) {
  // Load the estimate from the library by path
  const result = await library.loadEstimate(entry.path);
  if (!result.ok) {
    ui.notify(result.error, true);
    return;
  }
  estimate.setEstimate(result.data, entry.path);
  ui.navigate('working');
}
</script>

<template>
  <div class="welcome">
    <header class="welcome-header">
      <h1 class="welcome-title">{{ welcomeTitle }}</h1>
      <p class="welcome-description">{{ t('welcome.description') }}</p>
    </header>

    <div class="welcome-actions">
      <div class="action-group">
        <h2 class="action-title">{{ t('common.start') }}</h2>
        <div class="action-buttons">
          <button class="action-btn primary" @click="onNewEstimate">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                d="M8 2.5v11M2.5 8h11"
              />
            </svg>
            <span>{{ t('welcome.newEstimate') }}</span>
          </button>
          <button class="action-btn" @click="onOpenEstimate">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3.5 8.5V18a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V9.5a1.5 1.5 0 0 0-1.5-1.5H12l-1.6-1.8A1.5 1.5 0 0 0 9.3 5.5H5.5A2 2 0 0 0 3.5 7.5v1Z" />
            </svg>
            <span>{{ t('welcome.openEstimate') }}</span>
          </button>
          <button class="action-btn" @click="onOpenLibrary">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 6.5h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6.5Z" />
              <path d="M6 6.5V4.5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M12 4.5v2" />
            </svg>
            <span>{{ t('welcome.openLibrary') }}</span>
          </button>
        </div>
      </div>

      <div v-if="recentEstimates.length > 0" class="recent-group">
        <h2 class="action-title">{{ t('welcome.recentTitle') }}</h2>
        <ul class="recent-list">
          <li v-for="est in recentEstimates" :key="est.path" class="recent-item">
            <button class="recent-btn" @click="onOpenRecent(est)">
              <span class="recent-name">{{ est.title || t('working.untitled') }}</span>
              <span class="recent-date">{{ new Date(est.updatedAt).toLocaleDateString() }}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 2rem;
  text-align: center;
}

.welcome-header {
  margin-bottom: 3rem;
}

.welcome-title {
  margin: 0 0 0.75rem;
  font-family: var(--font-brand);
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.2;
  color: var(--ink);
}

.welcome-description {
  margin: 0;
  color: var(--muted);
  font-size: 1rem;
  line-height: 1.5;
  max-width: 420px;
}

.welcome-actions {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.action-group {
  margin-bottom: 2.5rem;
}

.action-title {
  margin: 0 0 1rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--muted);
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-start;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.95rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn:hover {
  border-color: var(--accent);
  background: var(--accent-subtle);
}

.action-btn.primary {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--on-accent);
}

.action-btn.primary:hover {
  background: var(--accent-dark);
  border-color: var(--accent-dark);
}

.action-btn svg {
  flex-shrink: 0;
}

.recent-group {
  margin-bottom: 1.5rem;
}

.recent-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recent-item {
  margin: 0;
}

.recent-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.recent-btn:hover {
  border-color: var(--accent);
  background: var(--accent-subtle);
}

.recent-name {
  font-weight: 500;
}

.recent-date {
  font-size: 0.85rem;
  color: var(--muted);
}
</style>