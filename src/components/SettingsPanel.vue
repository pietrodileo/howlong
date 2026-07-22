<script setup lang="ts">
defineProps<{
  title: string;
  intro?: string;
  /** Se true, la sezione parte aperta. */
  open?: boolean;
}>();
</script>

<template>
  <details class="settings-panel" :open="open ?? false">
    <summary class="settings-panel-head">
      <span class="settings-panel-title">{{ title }}</span>
      <span class="settings-panel-chev" aria-hidden="true">▸</span>
    </summary>
    <div v-if="intro" class="settings-panel-intro">{{ intro }}</div>
    <div class="settings-panel-body">
      <slot />
    </div>
  </details>
</template>

<style scoped>
.settings-panel {
  border-bottom: 1px solid var(--line);
  padding-bottom: 0.15rem;
}

.settings-panel:last-child {
  border-bottom: none;
}

.settings-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0;
  cursor: pointer;
  list-style: none;
  user-select: none;
}

.settings-panel-head::-webkit-details-marker {
  display: none;
}

.settings-panel-title {
  font-family: var(--font-ui);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
}

.settings-panel-chev {
  font-size: 0.75rem;
  color: var(--muted);
  transition: transform 0.15s ease;
}

.settings-panel[open] .settings-panel-chev {
  transform: rotate(90deg);
}

.settings-panel-intro {
  margin: 0 0 0.65rem;
  font-size: 0.9rem;
  color: var(--ink-soft);
  line-height: 1.45;
}

.settings-panel-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-bottom: 1rem;
}
</style>
