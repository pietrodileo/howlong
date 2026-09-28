<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

export type ColumnVisibilityOption = {
  key: string;
  label: string;
  visible: boolean;
  locked?: boolean;
};

const props = defineProps<{
  label: string;
  options: readonly ColumnVisibilityOption[];
}>();

const emit = defineEmits<{
  toggle: [key: string, visible: boolean];
}>();

const root = ref<HTMLElement | null>(null);
const open = ref(false);

/** Close the picker when focus moves to another surface of the application. */
function onDocumentPointerDown(event: PointerEvent): void {
  const target = event.target as Node | null;
  if (!target || !root.value?.contains(target)) open.value = false;
}

/** Toggle the native column visibility popup. */
function toggleOpen(): void {
  open.value = !open.value;
}

/** Close the popup from the keyboard without changing a column selection. */
function close(): void {
  open.value = false;
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown));
onUnmounted(() => document.removeEventListener('pointerdown', onDocumentPointerDown));
</script>

<template>
  <div ref="root" class="col-picker">
    <button
      type="button"
      class="ghost columns-trigger"
      :aria-expanded="open"
      :aria-label="props.label"
      aria-haspopup="true"
      v-tip="props.label"
      @click.stop="toggleOpen"
      @keydown.esc="close"
    >
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <path
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          d="M3 2.5v11M8 2.5v11M13 2.5v11"
        />
      </svg>
    </button>
    <div
      v-if="open"
      class="col-menu"
      role="group"
      :aria-label="props.label"
      @pointerdown.stop
    >
      <p class="col-menu-title">{{ props.label }}</p>
      <label
        v-for="option in props.options"
        :key="option.key"
        class="col-opt"
        :class="{ locked: option.locked }"
      >
        <input
          type="checkbox"
          :checked="option.visible"
          :disabled="option.locked"
          @change="emit('toggle', option.key, ($event.target as HTMLInputElement).checked)"
        />
        {{ option.label }}
      </label>
    </div>
  </div>
</template>

<style scoped>
.col-picker {
  position: relative;
}

.columns-trigger {
  display: inline-grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
}

.col-menu {
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 0;
  z-index: 80;
  display: grid;
  min-width: 12rem;
  gap: 0.35rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-menu);
}

.col-menu-title {
  margin: 0 0 0.25rem;
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 600;
}

.col-opt {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--ink);
  cursor: pointer;
  font-size: 0.9rem;
}

.col-opt.locked {
  color: var(--muted);
  cursor: default;
}
</style>
