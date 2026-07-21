<script setup lang="ts">
import { useI18n } from '../i18n/useI18n';

defineProps<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div v-if="open" class="overlay" @click.self="emit('cancel')">
    <div class="modal" role="dialog" aria-labelledby="confirm-title" aria-modal="true">
      <h2 id="confirm-title">{{ title }}</h2>
      <p class="message">{{ message }}</p>
      <footer>
        <button type="button" class="ghost" @click="emit('cancel')">
          {{ t('common.cancel') }}
        </button>
        <button
          type="button"
          :class="danger ? 'danger' : 'primary'"
          @click="emit('confirm')"
        >
          {{ confirmLabel || t('common.confirm') }}
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
  width: min(400px, 100%);
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

.message {
  margin: 0.65rem 0 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--ink-soft);
}

footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.25rem;
}

button.danger {
  border: 1px solid color-mix(in srgb, var(--danger, #b42318) 35%, var(--line));
  background: color-mix(in srgb, var(--danger, #b42318) 12%, var(--surface));
  color: var(--danger, #b42318);
  font-weight: 600;
}

button.danger:hover {
  background: color-mix(in srgb, var(--danger, #b42318) 20%, var(--surface));
}
</style>
