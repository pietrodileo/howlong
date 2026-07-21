<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import {
  useUiStore,
  type AppView,
  SIDEBAR_COLLAPSED_W,
  SIDEBAR_COLLAPSE_AT,
  SIDEBAR_MAX_W,
  SIDEBAR_MIN_W,
} from '../stores/ui';
import { useI18n } from '../i18n/useI18n';
import { useSettingsStore } from '../stores/settings';

const ui = useUiStore();
const settingsStore = useSettingsStore();
const { sidebarCollapsed, sidebarWidth, currentView } = storeToRefs(ui);
const { t } = useI18n();
const sidebarResizing = ref(false);

const username = computed(() => settingsStore.settings.username?.trim() || '');

const nav = computed(() =>
  (
    [
      { id: 'working' as const, icon: 'estimate' as const, key: 'nav.working' },
      { id: 'library' as const, icon: 'library' as const, key: 'nav.library' },
      { id: 'models' as const, icon: 'models' as const, key: 'nav.models' },
      { id: 'settings' as const, icon: 'settings' as const, key: 'nav.settings' },
    ] as const
  ).map((item) => ({ ...item, label: t(item.key) })),
);

const sidebarStyle = computed(() => ({
  '--sidebar-w': `${sidebarCollapsed.value ? SIDEBAR_COLLAPSED_W : sidebarWidth.value}px`,
}));

function go(view: AppView) {
  ui.navigate(view);
}

function onToggleSidebar() {
  ui.toggleSidebar();
}

function startSidebarResize(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  const startX = e.clientX;
  const startW = sidebarCollapsed.value ? SIDEBAR_COLLAPSED_W : sidebarWidth.value;
  sidebarResizing.value = true;
  document.body.classList.add('col-resizing');

  function onMove(ev: MouseEvent) {
    const next = Math.min(
      SIDEBAR_MAX_W,
      Math.max(SIDEBAR_COLLAPSED_W, startW + (ev.clientX - startX)),
    );
    if (next < SIDEBAR_COLLAPSE_AT) {
      ui.setSidebarWidth(sidebarWidth.value, true);
    } else {
      ui.setSidebarWidth(Math.max(SIDEBAR_MIN_W, next), false);
    }
  }

  function onUp() {
    sidebarResizing.value = false;
    document.body.classList.remove('col-resizing');
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    ui.persistSidebarLayout();
  }

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

onUnmounted(() => {
  document.body.classList.remove('col-resizing');
});
</script>

<template>
  <aside
    class="sidebar"
    :class="{ collapsed: sidebarCollapsed, resizing: sidebarResizing }"
    :style="sidebarStyle"
    :aria-label="t('nav.navigation')"
  >
    <div class="side-top">
      <div v-show="!sidebarCollapsed" class="brand">
        <p class="tagline">Effort, made obvious.</p>
        <div class="brand-row">
          <img
            class="brand-mark"
            src="/howlong-icon.png"
            width="40"
            height="40"
            alt=""
            draggable="false"
          />
          <h1>HowLong?</h1>
        </div>
        <p v-if="username" class="user">{{ username }}</p>
      </div>
      <img
        v-show="sidebarCollapsed"
        class="brand-mark collapsed-mark"
        src="/howlong-icon.png"
        width="32"
        height="32"
        alt="HowLong?"
        draggable="false"
      />
      <button
        type="button"
        class="toggle"
        :title="sidebarCollapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')"
        :aria-expanded="!sidebarCollapsed"
        :aria-label="sidebarCollapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')"
        @click.stop.prevent="onToggleSidebar"
      >
        {{ sidebarCollapsed ? '»' : '«' }}
      </button>
    </div>

    <nav>
      <button
        v-for="item in nav"
        :key="item.id"
        type="button"
        class="nav-item"
        :class="{ active: currentView === item.id }"
        :title="item.label"
        @click="go(item.id)"
      >
        <span class="mark" aria-hidden="true">
          <!-- Stima: tabella -->
          <svg
            v-if="item.icon === 'estimate'"
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
            <path d="M3.5 9.5h17" />
            <path d="M3.5 14.5h17" />
            <path d="M9.5 9.5v10" />
          </svg>
          <!-- Libreria: cartella -->
          <svg
            v-else-if="item.icon === 'library'"
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3.5 8.5V18a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V9.5a1.5 1.5 0 0 0-1.5-1.5H12l-1.6-1.8A1.5 1.5 0 0 0 9.3 5.5H5.5A2 2 0 0 0 3.5 7.5v1Z" />
          </svg>
          <!-- Modelli: layers -->
          <svg
            v-else-if="item.icon === 'models'"
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 3.5 20 8l-8 4.5L4 8l8-4.5Z" />
            <path d="M4 12.5 12 17l8-4.5" />
            <path d="M4 16.5 12 21l8-4.5" />
          </svg>
          <!-- Impostazioni: ingranaggio -->
          <svg
            v-else
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.9 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
            />
          </svg>
        </span>
        <span v-show="!sidebarCollapsed" class="label">{{ item.label }}</span>
      </button>
    </nav>

    <div class="side-foot">
      <button
        type="button"
        class="nav-item"
        :title="t('nav.about')"
        @click="ui.showAbout()"
      >
        <span class="mark" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="8.25" />
            <path d="M12 11v5.5" />
            <path d="M12 8.2h.01" />
          </svg>
        </span>
        <span v-show="!sidebarCollapsed" class="label">{{ t('nav.about') }}</span>
      </button>
    </div>

    <div
      class="sidebar-resizer"
      role="separator"
      aria-orientation="vertical"
      :aria-label="t('nav.resizeSidebar')"
      :title="t('nav.resizeSidebar')"
      @mousedown="startSidebarResize"
      @dblclick.stop="onToggleSidebar"
    />
  </aside>
</template>

<style scoped>
.sidebar {
  position: relative;
  width: var(--sidebar-w, 228px);
  min-width: var(--sidebar-w, 228px);
  max-width: var(--sidebar-w, 228px);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow: hidden;
  background: var(--sidebar-bg);
  border-right: 1px solid color-mix(in srgb, var(--line) 85%, transparent);
  backdrop-filter: blur(10px);
  padding: 1.15rem 0.85rem;
  transition: width 0.18s ease, min-width 0.18s ease, max-width 0.18s ease, padding 0.18s ease;
  box-shadow: var(--sidebar-inset);
}

.sidebar.resizing {
  transition: none;
}

.sidebar.collapsed {
  padding-left: 0.55rem;
  padding-right: 0.55rem;
}

.sidebar-resizer {
  position: absolute;
  top: 0;
  right: -5px;
  width: 10px;
  height: 100%;
  cursor: col-resize;
  z-index: 5;
  touch-action: none;
}

.sidebar-resizer::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  border-radius: 1px;
  background: transparent;
  transition: background 0.12s ease;
}

.sidebar-resizer:hover::after,
.sidebar.resizing .sidebar-resizer::after {
  background: color-mix(in srgb, var(--accent) 55%, var(--line));
}

.side-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.65rem;
  margin-bottom: 1.5rem;
  min-height: 3.2rem;
  padding: 0 0.2rem;
  position: relative;
}

.brand {
  flex: 1 1 auto;
  min-width: 0;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}

.brand-mark {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: block;
  object-fit: cover;
  box-shadow: 0 1px 2px rgba(20, 28, 40, 0.12);
}

.collapsed-mark {
  width: 32px;
  height: 32px;
  margin: 0;
}

.brand .tagline {
  margin: 0 0 0.35rem;
  font-size: 0.62rem;
  color: var(--muted-soft);
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height: 1.25;
}

.brand h1 {
  margin: 0;
  font-family: var(--font-brand);
  font-size: 1.45rem;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--ink);
  white-space: nowrap;
}

.brand p.user {
  margin: 0.45rem 0 0;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
  color: var(--accent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toggle {
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--muted);
  width: 1.9rem;
  height: 1.9rem;
  padding: 0;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  font-size: 0.8rem;
  line-height: 1;
  box-shadow: none;
  position: relative;
  z-index: 2;
  cursor: pointer;
}

.toggle:hover {
  color: var(--ink);
  border-color: var(--line-strong);
  background: var(--page-soft);
}

.sidebar.collapsed .side-top {
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0.35rem;
}

.sidebar.collapsed .collapsed-mark {
  margin: 0;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
  min-width: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  border: none;
  background: transparent;
  color: var(--muted);
  border-radius: var(--radius-sm);
  padding: 0.55rem 0.55rem;
  text-align: left;
  font-weight: 500;
  cursor: pointer;
  min-width: 0;
}

.nav-item:hover {
  background: var(--accent-glow);
  color: var(--ink-soft);
}

.nav-item.active {
  background: var(--accent-soft);
  color: var(--accent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 12%, transparent);
}

.mark {
  width: 1.55rem;
  height: 1.55rem;
  display: inline-grid;
  place-items: center;
  border-radius: 5px;
  background: color-mix(in srgb, var(--page) 70%, var(--surface));
  color: inherit;
  flex-shrink: 0;
}

.mark svg {
  display: block;
}

.nav-item.active .mark {
  background: var(--accent);
  color: var(--on-accent);
}

.label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.92rem;
  min-width: 0;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 0.55rem 0.35rem;
}

.side-foot {
  margin-top: auto;
  padding-top: 0.85rem;
  border-top: 1px solid var(--line);
}
</style>
