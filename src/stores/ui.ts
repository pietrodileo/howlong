import { defineStore } from 'pinia';
import { ref } from 'vue';

export type AppView = 'working' | 'library' | 'models' | 'settings';

const SIDEBAR_KEY = 'howlong.sidebarCollapsed';
const SIDEBAR_WIDTH_KEY = 'howlong.sidebarWidth';

export const SIDEBAR_COLLAPSED_W = 68;
export const SIDEBAR_MIN_W = 160;
export const SIDEBAR_MAX_W = 360;
export const SIDEBAR_COLLAPSE_AT = 110;
export const SIDEBAR_DEFAULT_W = 228;

function loadSidebarWidth(): number {
  try {
    const n = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
    if (Number.isFinite(n) && n >= SIDEBAR_MIN_W && n <= SIDEBAR_MAX_W) return n;
  } catch {
    /* ignore */
  }
  return SIDEBAR_DEFAULT_W;
}

export const useUiStore = defineStore('ui', () => {
  const currentView = ref<AppView>('working');
  const aboutOpen = ref(false);
  const toast = ref<string | null>(null);
  const toastError = ref(false);
  const sidebarCollapsed = ref(
    typeof localStorage !== 'undefined' && localStorage.getItem(SIDEBAR_KEY) === '1',
  );
  const sidebarWidth = ref(loadSidebarWidth());
  let toastTimer: ReturnType<typeof setTimeout> | null = null;

  function persistSidebarLayout() {
    try {
      localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed.value ? '1' : '0');
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth.value));
    } catch {
      /* ignore */
    }
  }

  function navigate(view: AppView) {
    currentView.value = view;
  }

  function showAbout() {
    aboutOpen.value = true;
  }

  function hideAbout() {
    aboutOpen.value = false;
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
    persistSidebarLayout();
  }

  function setSidebarWidth(width: number, collapsed?: boolean) {
    if (collapsed !== undefined) sidebarCollapsed.value = collapsed;
    if (!sidebarCollapsed.value) {
      sidebarWidth.value = Math.min(
        SIDEBAR_MAX_W,
        Math.max(SIDEBAR_MIN_W, width),
      );
    }
  }

  function notify(message: string, isError = false) {
    toast.value = message;
    toastError.value = isError;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.value = null;
    }, 4500);
  }

  function dismissToast() {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    toast.value = null;
    toastError.value = false;
  }

  return {
    currentView,
    aboutOpen,
    toast,
    toastError,
    sidebarCollapsed,
    sidebarWidth,
    navigate,
    showAbout,
    hideAbout,
    toggleSidebar,
    setSidebarWidth,
    persistSidebarLayout,
    notify,
    dismissToast,
  };
});