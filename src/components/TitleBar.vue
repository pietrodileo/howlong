<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { isTauri } from '../lib/tauri';

const maximized = ref(false);
let unlistenResize: (() => void) | undefined;

const refreshMaximized = async () => {
  if (!isTauri()) return;
  maximized.value = await getCurrentWindow().isMaximized();
};

const minimize = async () => {
  if (!isTauri()) return;
  await getCurrentWindow().minimize();
};

const toggleMaximize = async () => {
  if (!isTauri()) return;
  await getCurrentWindow().toggleMaximize();
  await refreshMaximized();
};

const closeWindow = async () => {
  if (!isTauri()) return;
  await getCurrentWindow().close();
};

onMounted(async () => {
  if (!isTauri()) return;
  await refreshMaximized();
  unlistenResize = await getCurrentWindow().onResized(() => {
    void refreshMaximized();
  });
});

onUnmounted(() => {
  unlistenResize?.();
});
</script>

<template>
  <div v-if="isTauri()" class="titlebar">
    <div class="drag" data-tauri-drag-region aria-hidden="true"></div>
    <div class="controls">
      <button type="button" class="win-btn" aria-label="Minimize" v-tip="'Minimize'" @click="minimize">
        <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
          <path fill="currentColor" d="M2 5.25h8v1.5H2z" />
        </svg>
      </button>
      <button
        type="button"
        class="win-btn"
        :aria-label="maximized ? 'Restore' : 'Maximize'"
        v-tip="maximized ? 'Restore' : 'Maximize'"
        @click="toggleMaximize"
      >
        <svg v-if="!maximized" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
          <path class="win-frame" fill="none" stroke="currentColor" d="M2.5 2.5h7v7h-7z" />
        </svg>
        <svg v-else viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
          <path
            class="win-frame"
            fill="none"
            stroke="currentColor"
            d="M3.5 4.5h6v6h-6zM2.5 7.5V2.5h5"
          />
        </svg>
      </button>
      <button type="button" class="win-btn close" aria-label="Close" v-tip="'Close'" @click="closeWindow">
        <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
          <path
            fill="currentColor"
            d="M2.4 1.55 6 5.15l3.6-3.6.85.85L6.85 6l3.6 3.6-.85.85L6 6.85l-3.6 3.6-.85-.85L5.15 6l-3.6-3.6.85-.85Z"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.titlebar {
  flex-shrink: 0;
  height: 36px;
  display: flex;
  align-items: stretch;
  background: var(--page);
}

.drag {
  flex: 1;
  min-width: 0;
}

.controls {
  display: flex;
  align-items: stretch;
  flex-shrink: 0;
}

.win-btn {
  width: 46px;
  margin: 0;
  padding: 0;
  display: inline-grid;
  place-items: center;
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.win-frame {
  stroke-width: 1.2;
}

.win-btn:hover {
  background: color-mix(in srgb, var(--ink) 8%, transparent);
  color: var(--ink);
}

.win-btn.close:hover {
  background: #c42b1c;
  color: #fff;
}
</style>
