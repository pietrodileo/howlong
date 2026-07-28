<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';

const props = defineProps<{
  title: string;
  intro?: string;
  /** Se true, la sezione parte (o diventa) aperta. */
  open?: boolean;
}>();

const root = ref<HTMLDetailsElement | null>(null);

async function applyOpen(shouldOpen: boolean) {
  if (!shouldOpen || !root.value) return;
  root.value.open = true;
  await nextTick();
  root.value.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

onMounted(() => {
  void applyOpen(!!props.open);
});

watch(
  () => props.open,
  (value) => {
    void applyOpen(!!value);
  },
);
</script>

<template>
  <details ref="root" class="settings-panel">
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
}

.settings-panel:last-child {
  border-bottom: none;
}

.settings-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 0 -0.45rem;
  padding: 0.75rem 0.45rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  list-style: none;
  user-select: none;
  transition: background 0.12s ease, color 0.12s ease;
}

.settings-panel-head:hover {
  background: color-mix(in srgb, var(--page-soft) 80%, transparent);
}

.settings-panel-head::-webkit-details-marker {
  display: none;
}

.settings-panel-title {
  font-family: var(--font-ui);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.settings-panel[open] .settings-panel-title {
  color: var(--ink);
}

.settings-panel-chev {
  font-size: 0.7rem;
  color: var(--muted);
  transition: transform 0.15s ease, color 0.12s ease;
}

.settings-panel-head:hover .settings-panel-chev,
.settings-panel[open] .settings-panel-chev {
  color: var(--ink-soft);
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
  padding: 0.15rem 0 1.15rem;
}
</style>
