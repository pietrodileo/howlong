<script setup lang="ts">
withDefaults(
  defineProps<{
    kind: 'edit' | 'delete' | 'duplicate';
    label: string;
    disabled?: boolean;
  }>(),
  { disabled: false },
);

defineEmits<{ click: [e: MouseEvent] }>();
</script>

<template>
  <button
    type="button"
    class="icon-btn"
    :class="kind"
    :title="label"
    :aria-label="label"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <!-- Penna -->
    <svg
      v-if="kind === 'edit'"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M11.7 1.3a1.5 1.5 0 0 1 2.1 2.1l-.4.4-2.1-2.1.4-.4ZM10.6 2.9 1.8 11.7c-.2.2-.3.4-.3.7l-.4 2.3a.4.4 0 0 0 .5.5l2.3-.4c.3 0 .5-.1.7-.3l8.8-8.8-2.8-2.8Z"
      />
    </svg>
    <!-- Duplica -->
    <svg
      v-else-if="kind === 'duplicate'"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.2" />
      <path d="M10.5 5.5V4.2A1.2 1.2 0 0 0 9.3 3H3.7A1.2 1.2 0 0 0 2.5 4.2v5.6A1.2 1.2 0 0 0 3.7 11h1.8" />
    </svg>
    <!-- Cestino (outline pulito) -->
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
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6.5 7l.7 12.2A1.5 1.5 0 0 0 8.7 21h6.6a1.5 1.5 0 0 0 1.5-1.8L17.5 7" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  </button>
</template>

<style scoped>
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.85rem;
  height: 1.85rem;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.12s ease, background 0.12s ease, border-color 0.12s ease;
}

.icon-btn:hover:not(:disabled) {
  color: var(--ink);
  background: var(--page-soft);
  border-color: var(--line);
}

.icon-btn.delete:hover:not(:disabled) {
  color: var(--danger);
  background: var(--danger-soft);
  border-color: color-mix(in srgb, var(--danger) 25%, var(--line));
}

.icon-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
</style>
