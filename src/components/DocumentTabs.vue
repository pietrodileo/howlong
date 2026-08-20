<script setup lang="ts">
import { computed, nextTick, ref, onMounted, onUnmounted } from 'vue';
import ConfirmModal from './ConfirmModal.vue';
import { useDocumentsStore } from '../stores/documents';
import { useModelsStore } from '../stores/models';
import { useUiStore } from '../stores/ui';
import { useI18n } from '../i18n/useI18n';
import { storeToRefs } from 'pinia';

const emit = defineEmits<{
  'activate': [sessionId: string]
  'close-dirty': [sessionId: string]
}>();

const docs = useDocumentsStore();
const modelsStore = useModelsStore();
const { defaultModel, models: modelList } = storeToRefs(modelsStore);
const ui = useUiStore();
const { t } = useI18n();

const tabs = computed(() => docs.sessions);
const activeId = computed(() => docs.activeId);

// Model dropdown for new tab
const newMenuOpen = ref(false);
const searchQuery = ref('');
const modelButton = ref<HTMLButtonElement | null>(null);
const menuPosition = ref({ left: 8, top: 40 });
const draggingId = ref<string | null>(null);
const dropTargetId = ref<string | null>(null);
const dropBefore = ref(true);
const suppressTabClick = ref(false);

function closeNewMenu() {
  newMenuOpen.value = false;
  searchQuery.value = '';
}

function onDocumentPointerDown(e: PointerEvent) {
  const target = e.target as HTMLElement | null;
  if (!target?.closest?.('.new-estimate-group') && !target?.closest?.('.model-dropdown')) {
    closeNewMenu();
  }
}

function updateMenuPosition() {
  const button = modelButton.value;
  if (!button) return;
  const rect = button.getBoundingClientRect();
  const menuWidth = Math.min(300, window.innerWidth - 16);
  menuPosition.value = {
    left: Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8)),
    top: rect.bottom + 4,
  };
}

function onWindowChange() {
  if (newMenuOpen.value) updateMenuPosition();
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown);
  window.addEventListener('resize', onWindowChange);
  window.addEventListener('scroll', onWindowChange, true);
});

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown);
  window.removeEventListener('resize', onWindowChange);
  window.removeEventListener('scroll', onWindowChange, true);
});

// Filtered models for search
const filteredModels = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return modelList.value.filter(m => m.name.toLowerCase().includes(query));
});

// Tooltip for new tab button
const newTabTooltip = computed(() => {
  const modelName = defaultModel.value?.name ?? t('common.default');
  return t('working.newFrom', { name: modelName });
});

// Confirmation modal for closing dirty tabs
const confirmDirtyClose = ref<{ sessionId: string, sessionTitle: string } | null>(null);

function activateTab(sessionId: string) {
  if (suppressTabClick.value) {
    suppressTabClick.value = false;
    return;
  }
  docs.activate(sessionId);
  // Emit event to sync estimate store
  emit('activate', sessionId);
}

function clearDragState() {
  draggingId.value = null;
  dropTargetId.value = null;
}

function closeTab(sessionId: string, event: Event) {
  event.stopPropagation(); // Don't trigger tab activation when clicking close
  
  const session = docs.sessions.find(s => s.sessionId === sessionId);
  if (!session) return;
  
  // Check if dirty and ask for confirmation
  if (session.dirty) {
    confirmDirtyClose.value = {
      sessionId: session.sessionId,
      sessionTitle: session.displayTitle
    };
  } else {
    docs.closeSession(sessionId);
  }
}

function cancelClose() {
  confirmDirtyClose.value = null;
}

function confirmClose() {
  if (confirmDirtyClose.value) {
    docs.closeSession(confirmDirtyClose.value.sessionId);
    confirmDirtyClose.value = null;
  }
}

function toggleNewMenu() {
  newMenuOpen.value = !newMenuOpen.value;
  if (newMenuOpen.value) nextTick(updateMenuPosition);
}

function onTabPointerDown(sessionId: string, event: PointerEvent) {
  if (event.button !== 0 || (event.target as HTMLElement).closest('.tab-close')) return;

  const tab = event.currentTarget as HTMLElement;
  const startX = event.clientX;
  const startY = event.clientY;
  let active = false;

  const cleanup = () => {
    tab.removeEventListener('pointermove', onMove);
    tab.removeEventListener('pointerup', onUp);
    tab.removeEventListener('pointercancel', onCancel);
    if (tab.hasPointerCapture(event.pointerId)) tab.releasePointerCapture(event.pointerId);
    clearDragState();
  };

  const onMove = (moveEvent: PointerEvent) => {
    const distance = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
    if (distance < 5) return;
    if (!active) {
      active = true;
      draggingId.value = sessionId;
    }
    moveEvent.preventDefault();
    const element = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY) as HTMLElement | null;
    const target = element?.closest<HTMLElement>('[data-session-id]');
    const targetId = target?.dataset.sessionId ?? null;
    if (!target || !targetId || targetId === sessionId) {
      dropTargetId.value = null;
      return;
    }
    dropTargetId.value = targetId;
    dropBefore.value = moveEvent.clientX < target.getBoundingClientRect().left + target.offsetWidth / 2;
  };

  const onUp = () => {
    if (active) {
      const targetId = dropTargetId.value;
      if (targetId && targetId !== sessionId) {
        docs.reorderSessions(sessionId, targetId, dropBefore.value);
      }
      suppressTabClick.value = true;
    }
    cleanup();
  };

  const onCancel = () => cleanup();
  tab.setPointerCapture(event.pointerId);
  tab.addEventListener('pointermove', onMove, { passive: false });
  tab.addEventListener('pointerup', onUp);
  tab.addEventListener('pointercancel', onCancel);
}

function onNewFromModelId(id: string) {
  const m = modelList.value.find((x) => x.id === id);
  if (!m) {
    ui.notify(t('working.modelNotFound'), true);
    return;
  }
  const sessionId = docs.createFromModel(m);
  docs.activate(sessionId);
  ui.navigate('working');
  newMenuOpen.value = false;
}

function onNewEstimate() {
  const m = defaultModel.value ?? modelsStore.models[0] ?? null;
  if (!m) {
    ui.notify(t('working.noModelAvail'), true);
    return;
  }
  // Create new session directly
  const sessionId = docs.createFromModel(m);
  docs.activate(sessionId);
  // Navigate to working view
  ui.navigate('working');
}
</script>

<template>
  <div class="document-tabs">
    <!-- Confirmation Modal for dirty close -->
    <ConfirmModal
      :open="confirmDirtyClose !== null"
      :title="t('tabs.closeDirtyTitle')"
      :message="t('tabs.closeDirtyBody', { name: confirmDirtyClose?.sessionTitle ?? '' })"
      :confirm-label="t('tabs.closeDirtyDiscard')"
      danger
      @cancel="cancelClose"
      @confirm="confirmClose"
    />

    <!-- Document tabs and new button in same container -->
    <div class="tabs-scroll">
      <button
        v-for="session in tabs" 
        :key="session.sessionId"
        type="button"
        class="tab document-tab"
        :class="{ active: activeId === session.sessionId, dirty: session.dirty, dragging: draggingId === session.sessionId, 'drop-target': dropTargetId === session.sessionId }"
        @click="activateTab(session.sessionId)"
        @pointerdown="onTabPointerDown(session.sessionId, $event)"
        :data-session-id="session.sessionId"
        :aria-label="`${session.displayTitle}${session.dirty ? ' (' + t('common.unsaved') + ')' : ''}`"
      >
        <span
          v-if="dropTargetId === session.sessionId && dropBefore"
          class="drop-indicator"
          aria-hidden="true"
        ></span>
        <span class="tab-title">{{ session.displayTitle }}</span>
        <span 
          class="tab-close" 
          @click.stop="closeTab(session.sessionId, $event)"
          v-tip.top="t('common.close')"
          :aria-label="t('common.close')"
          role="button"
          tabindex="0"
          @keydown.enter.stop="closeTab(session.sessionId, $event)"
          @keydown.space.prevent.stop="closeTab(session.sessionId, $event)"
        >
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <path
              fill="currentColor"
              d="M3.2 3.2a.75.75 0 0 1 1.06 0L8 6.94l3.74-3.74a.75.75 0 1 1 1.06 1.06L9.06 8l3.74 3.74a.75.75 0 1 1-1.06 1.06L8 9.06l-3.74 3.74a.75.75 0 1 1-1.06-1.06L6.94 8 3.2 4.26a.75.75 0 0 1 0-1.06Z"
            />
          </svg>
        </span>
        <span
          v-if="dropTargetId === session.sessionId && !dropBefore"
          class="drop-indicator drop-indicator-after"
          aria-hidden="true"
        ></span>
      </button>

      <!-- New estimate buttons stay after last tab in scroll order -->
      <div class="new-estimate-group">
      <button 
        type="button" 
        class="new-tab"
        @click="onNewEstimate"
        v-tip="newTabTooltip"
        :aria-label="newTabTooltip"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            d="M8 2.5v11M2.5 8h11"
          />
        </svg>
      </button>
      
      <!-- Model dropdown -->
      <div class="model-dropdown">
        <button
          type="button"
          class="model-select-btn ghost"
          ref="modelButton"
          :aria-expanded="newMenuOpen"
          :aria-label="t('working.pickModel')"
          v-tip="t('working.pickModel')"
          @click="toggleNewMenu"
        >
          ▾
        </button>
        <div
          v-if="newMenuOpen"
          class="menu model-menu"
          role="menu"
          :style="{ left: `${menuPosition.left}px`, top: `${menuPosition.top}px` }"
          @pointerdown.stop
        >
          <div class="model-search-wrapper">
            <input
              type="text"
              v-model="searchQuery"
              class="model-search"
              :placeholder="t('working.searchModel')"
            />
          </div>
          <div class="model-list-scrollable">
            <button
              v-for="m in filteredModels"
              :key="m.id"
              type="button"
              class="model-pick"
              role="menuitem"
              @click="onNewFromModelId(m.id)"
            >
              <span class="model-name">{{ m.name }}</span>
              <span v-if="modelsStore.isDefault(m.id)" class="badge">{{ t('common.default') }}</span>
            </button>
            <p v-if="filteredModels.length === 0" class="empty">{{ t('working.noModels') }}</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.document-tabs {
  display: flex;
  align-items: stretch;
  height: 36px;
  background: var(--page);
  border-bottom: 1px solid var(--line);
  overflow: visible;
}

.tabs-scroll {
  display: flex;
  align-items: stretch;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tabs-scroll::-webkit-scrollbar {
  display: none;
}

.tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 12px;
  height: 32px;
  margin: 2px 0;
  border: none;
  border-radius: 8px 8px 0 0;
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  transition: all 0.15s ease;
  white-space: nowrap;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: grab;
}

.tab.dragging {
  opacity: 0.45;
  cursor: grabbing;
}

.tab.drop-target {
  background: var(--accent-subtle);
}

.drop-indicator {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: -3px;
  width: 3px;
  border-radius: 2px;
  background: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-glow);
  pointer-events: none;
  z-index: 2;
}

.drop-indicator-after {
  left: auto;
  right: -3px;
}

.tab:first-child .drop-indicator {
  left: 0;
}

.tab:focus {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.tab:hover {
  background: var(--accent-subtle);
  color: var(--accent);
}

.tab.active {
  background: var(--page);
  color: var(--ink);
  font-weight: 500;
  margin-top: 0;
  height: 36px;
  border-bottom: 4px solid var(--accent);
}

.tab.active:hover {
  background: var(--page);
}

.tab.dirty::after {
  content: '';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--page);
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
  border-radius: 50%;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.15s ease;
}

.tab:hover .tab-close {
  opacity: 1;
  color: var(--ink);
}

.tab.active .tab-close {
  color: var(--muted);
}

.tab.active:hover .tab-close {
  opacity: 1;
  color: var(--ink);
}

.tab-close:hover {
  background: var(--danger-subtle);
  color: var(--danger);
  opacity: 1;
}

.tab-close:active,
.tab-close:focus {
  opacity: 0.8;
  transform: scale(0.95);
  outline: none;
}

.tab-close svg {
  width: 10px;
  height: 10px;
  display: block;
}

.new-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  height: 32px;
  margin: 2px 0;
  border: none;
  border-radius: 8px 8px 0 0;
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  white-space: nowrap;
}

.new-tab:hover {
  background: var(--accent-subtle);
  color: var(--accent);
}

.new-tab:active {
  background: var(--accent);
  color: var(--on-accent);
  transform: scale(0.95);
}

.new-tab svg {
  flex-shrink: 0;
}

.new-estimate-group {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.model-dropdown {
  position: relative;
}

.model-select-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  width: 36px;
  padding: 0;
  margin: 2px 0;
  border: 1px solid var(--line);
  border-radius: 8px 8px 0 0;
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  font-size: 0.875rem;
  white-space: nowrap;
}

.model-select-btn:hover {
  background: var(--accent-subtle);
  color: var(--accent);
}

.model-select-btn:active {
  background: var(--accent);
  color: var(--on-accent);
}

.model-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.caret {
  flex-shrink: 0;
  font-size: 0.7rem;
  color: var(--muted);
}

.model-menu {
  position: fixed;
  z-index: 50;
  min-width: 220px;
  max-width: 300px;
  width: min(300px, calc(100vw - 16px));
  margin-top: 0.25rem;
  padding: 0.5rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-menu);
  display: flex;
  flex-direction: column;
}

.model-search-wrapper {
  padding: 0.25rem 0.5rem 0.5rem;
  border-bottom: 1px solid var(--line);
  margin: 0 -0.5rem 0.5rem;
}

.model-search {
  width: 100%;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--page);
  color: var(--ink);
  font-size: 0.8rem;
  transition: border-color 0.15s ease;
}

.model-search:focus {
  outline: none;
  border-color: var(--accent);
}

.model-list-scrollable {
  max-height: 200px;
  overflow-y: auto;
  overflow-x: hidden;
}

.model-pick {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.4rem 0.6rem;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  font-size: 0.85rem;
  text-align: left;
  transition: background 0.15s ease;
}

.model-pick:hover {
  background: var(--accent-subtle);
}

.badge {
  flex-shrink: 0;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 500;
  background: var(--accent);
  color: var(--on-accent);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.empty {
  margin: 0;
  padding: 0.4rem 0.6rem;
  color: var(--muted);
  font-size: 0.8rem;
  text-align: center;
}
</style>