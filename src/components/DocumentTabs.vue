<script setup lang="ts">
import { computed } from 'vue';
import { useDocumentsStore } from '../stores/documents';
import { useUiStore } from '../stores/ui';
import { useI18n } from '../i18n/useI18n';

const emit = defineEmits<{
  'close-dirty': [sessionId: string]
}>();

const docs = useDocumentsStore();
const ui = useUiStore();
const { t } = useI18n();

const tabs = computed(() => docs.sessions);
const activeId = computed(() => docs.activeId);

function activateTab(sessionId: string) {
  docs.activate(sessionId);
}

function closeTab(sessionId: string, event: MouseEvent) {
  event.stopPropagation(); // Don't trigger tab activation when clicking close
  
  // Check if dirty and ask for confirmation
  if (docs.hasUnsavedChanges(sessionId)) {
    // For now, we'll emit an event for the parent to handle
    // In a real implementation, we'd use the same confirmation logic as WorkingView
    emit('close-dirty', sessionId);
  } else {
    docs.closeSession(sessionId);
  }
}

function goToWelcome() {
  ui.navigate('welcome');
}
</script>

<template>
  <div class="document-tabs">
    <!-- Welcome tab (persistent, not closable) -->
    <button 
      type="button" 
      class="tab welcome-tab"
      :class="{ active: !docs.hasSessions }"
      @click="goToWelcome"
      v-tip="t('nav.welcome')"
      :aria-label="t('nav.welcome')"
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3.5 9.5l8-5.5 8 5.5v7a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2v-7Z" />
        <path d="M9.5 9.5v7" />
        <path d="M14.5 9.5v7" />
        <path d="M19.5 12.5h-15" />
      </svg>
      <span>{{ t('nav.welcome') }}</span>
    </button>

    <!-- Document tabs -->
    <div class="tabs-scroll">
      <button 
        v-for="session in tabs" 
        :key="session.sessionId" 
        type="button" 
        class="tab document-tab"
        :class="{ active: activeId === session.sessionId, dirty: session.dirty }"
        @click="activateTab(session.sessionId)"
        :aria-label="`${session.displayTitle}${session.dirty ? ' (' + t('common.unsaved') + ')' : ''}`"
      >
        <span class="tab-title">{{ session.displayTitle }}</span>
        <button 
          type="button" 
          class="tab-close" 
          @click.stop="closeTab(session.sessionId, $event)"
          v-tip="t('common.close')"
          :aria-label="t('common.close')"
        >
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <path
              fill="currentColor"
              d="M3.2 3.2a.75.75 0 0 1 1.06 0L8 6.94l3.74-3.74a.75.75 0 1 1 1.06 1.06L9.06 8l3.74 3.74a.75.75 0 1 1-1.06 1.06L8 9.06l-3.74 3.74a.75.75 0 1 1-1.06-1.06L6.94 8 3.2 4.26a.75.75 0 0 1 0-1.06Z"
            />
          </svg>
        </button>
      </button>
    </div>
  </div>
</template>

<style scoped>
.document-tabs {
  display: flex;
  align-items: stretch;
  height: 36px;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
  padding: 0 0.5rem;
  gap: 0.25rem;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.document-tabs::-webkit-scrollbar {
  display: none;
}

.tabs-scroll {
  display: flex;
  align-items: stretch;
  gap: 0.25rem;
}

.tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1rem;
  height: 100%;
  border: none;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: 0.9rem;
  transition: all 0.15s ease;
  white-space: nowrap;
  position: relative;
}

.tab:hover {
  background: var(--accent-subtle);
  color: var(--accent);
}

.tab.active {
  background: var(--surface);
  color: var(--ink);
  font-weight: 500;
}

.tab.active:hover {
  background: var(--surface);
}

.tab.dirty::after {
  content: '';
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
}

.tab svg {
  flex-shrink: 0;
}

.tab-title {
  display: inline-block;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: inherit;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.15s ease;
}

.tab-close:hover {
  opacity: 1;
  background: var(--danger-subtle);
  color: var(--danger);
}

.tab-close:active {
  opacity: 0.8;
}

.tab-close svg {
  width: 10px;
  height: 10px;
  display: block;
}

.welcome-tab {
  border-right: 1px solid var(--line);
  margin-right: 0.5rem;
  padding-right: 1rem;
}

.welcome-tab.active {
  color: var(--ink);
}
</style>