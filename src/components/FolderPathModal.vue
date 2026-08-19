<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from '../i18n/useI18n';
import { useUiStore } from '../stores/ui';

const props = defineProps<{
  open: boolean;
  path: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();
const ui = useUiStore();

const copied = ref(false);

function close() {
  emit('close');
  copied.value = false;
}

function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') close();
}

function handleOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) close();
}

async function copyPath() {
  if (!props.path) return;
  
  try {
    await navigator.clipboard.writeText(props.path);
    copied.value = true;
    ui.notify(t('library.pathCopied'));
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    // Clipboard API not available or failed
    ui.notify(t('library.pathCopyFailed'), true);
  }
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    window.addEventListener('keydown', handleEscape);
  } else {
    window.removeEventListener('keydown', handleEscape);
  }
});
</script>

<template>
  <div v-if="open" class="overlay" @click="handleOverlayClick">
    <div class="modal" role="dialog" aria-labelledby="path-title" aria-modal="true">
      <h2 id="path-title">{{ t('library.pathTitle') }}</h2>
      <div class="path-container">
        <p class="path" ref="pathElement">{{ path || t('library.noPath') }}</p>
      </div>
      <footer>
        <button type="button" class="ghost" @click="close">
          {{ t('common.cancel') }}
        </button>
        <button
          type="button"
          class="primary"
          @click="copyPath"
          :disabled="!path"
        >
          {{ copied ? t('library.pathCopied') : t('library.copyPath') }}
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: color-mix(in srgb, var(--ink) 40%, transparent);
  backdrop-filter: blur(4px);
}

.modal {
  width: min(500px, 100%);
  padding: 1.35rem 1.45rem;
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: calc(var(--radius) + 2px);
  box-shadow: var(--shadow-menu);
}

h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 650;
}

.path-container {
  margin: 0.65rem 0 0;
  padding: 0.5rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--page-soft);
  overflow-x: auto;
}

.path {
  margin: 0;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--ink);
  white-space: pre;
  user-select: text;
  word-break: break-all;
}

footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.25rem;
}

button.primary {
  border: 1px solid var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, var(--surface));
  color: var(--accent);
  font-weight: 600;
}

button.primary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent) 20%, var(--surface));
}

button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
</style>
