<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from '../i18n/useI18n';

const props = defineProps<{
  open: boolean;
  itemName: string;
  notes: string;
}>();

const emit = defineEmits<{
  save: [notes: string];
  close: [];
}>();

const { t } = useI18n();
const draft = ref(props.notes);

watch(
  () => [props.open, props.notes, props.itemName] as const,
  ([open]) => {
    if (open) draft.value = props.notes;
  },
);

function onSave() {
  emit('save', draft.value);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation();
    emit('close');
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    onSave();
  }
}
</script>

<template>
  <div
    v-if="open"
    class="overlay"
    @click.self="emit('close')"
    @keydown="onKeydown"
  >
    <div
      class="modal"
      role="dialog"
      aria-labelledby="notes-title"
      aria-modal="true"
    >
      <header>
        <div>
          <h2 id="notes-title">{{ t('working.notesModalTitle') }}</h2>
          <p class="sub">{{ itemName }}</p>
        </div>
      </header>

      <label class="field">
        <span class="sr">{{ t('common.notes') }}</span>
        <textarea
          v-model="draft"
          class="notes-area"
          rows="12"
          :placeholder="t('working.notesPh')"
          autofocus
        />
      </label>

      <p class="hint">{{ t('working.notesModalHint') }}</p>

      <footer>
        <button type="button" class="ghost" @click="emit('close')">
          {{ t('common.cancel') }}
        </button>
        <button type="button" class="primary" @click="onSave">
          {{ t('common.save') }}
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
  width: min(560px, 100%);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1.25rem 1.35rem 1.2rem;
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: calc(var(--radius) + 2px);
  box-shadow: var(--shadow-menu);
}

header {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 650;
}

.sub {
  margin: 0.2rem 0 0;
  font-size: 0.88rem;
  color: var(--muted);
  line-height: 1.35;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0;
}

.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.notes-area {
  width: 100%;
  min-height: 14rem;
  box-sizing: border-box;
  resize: vertical;
  padding: 0.7rem 0.8rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--page-soft);
  color: var(--ink);
  font: inherit;
  line-height: 1.45;
  white-space: pre-wrap;
}

.notes-area:focus {
  outline: none;
  border-color: color-mix(in srgb, var(--accent) 45%, var(--line));
  background: var(--surface);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.notes-area::placeholder {
  color: var(--muted-soft);
}

.hint {
  margin: 0;
  font-size: 0.78rem;
  color: var(--muted);
}

footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
