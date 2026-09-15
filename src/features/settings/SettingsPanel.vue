<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import DisclosureIcon from '../../shared/components/DisclosureIcon.vue';

const props = defineProps<{
  title: string;
  summary?: string;
  summaryTitle?: string;
  intro?: string;
  /** Se true, la sezione parte (o diventa) aperta. */
  open?: boolean;
  /** Keep a matching panel open while settings are filtered. */
  forceOpen?: boolean;
}>();

const emit = defineEmits<{
  toggle: [open: boolean];
}>();

const root = ref<HTMLDetailsElement | null>(null);
const openBeforeForce = ref<boolean | null>(null);

async function applyOpen(shouldOpen: boolean) {
  if (!root.value || props.forceOpen) return;
  if (root.value.open === shouldOpen) return;
  root.value.open = shouldOpen;
  if (shouldOpen) {
    await nextTick();
    root.value.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/** Open a filtered panel and restore its previous disclosure state afterward. */
function applyForcedOpen(shouldOpen: boolean) {
  if (!root.value) return;
  if (shouldOpen) {
    if (openBeforeForce.value === null) openBeforeForce.value = root.value.open;
    root.value.open = true;
    return;
  }
  if (openBeforeForce.value !== null) {
    root.value.open = openBeforeForce.value;
    openBeforeForce.value = null;
  }
}

/** Report user disclosure changes so the parent can coordinate sibling panels. */
function onToggle(event: Event) {
  if (props.forceOpen) return;
  emit('toggle', (event.currentTarget as HTMLDetailsElement).open);
}

onMounted(() => {
  void applyOpen(!!props.open);
  applyForcedOpen(!!props.forceOpen);
});

watch(
  () => props.open,
  (value) => {
    void applyOpen(!!value);
  },
);

watch(
  () => props.forceOpen,
  (value) => {
    void nextTick(() => applyForcedOpen(!!value));
  },
);
</script>

<template>
  <details ref="root" class="settings-panel" @toggle="onToggle">
    <summary class="settings-panel-head">
      <span class="settings-panel-copy">
        <span class="settings-panel-title">{{ title }}</span>
        <span v-if="summary" class="settings-panel-summary" :title="summaryTitle || summary">{{ summary }}</span>
      </span>
      <span class="settings-panel-chev"><DisclosureIcon :expanded="true" /></span>
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  padding: 0.75rem 0.55rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  list-style: none;
  user-select: none;
  transition: background 0.12s ease, color 0.12s ease;
}

.settings-panel:not([open]) .settings-panel-head:hover {
  background: color-mix(in srgb, var(--accent-soft) 34%, var(--surface));
}

.settings-panel-head::-webkit-details-marker {
  display: none;
}

.settings-panel-copy {
  display: grid;
  min-width: 0;
  gap: 0.18rem;
}

.settings-panel-title {
  font-family: var(--font-ui);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.settings-panel-summary {
  min-width: 0;
  overflow: hidden;
  color: var(--muted);
  font-size: 0.8rem;
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.settings-panel[open] .settings-panel-title {
  color: var(--ink);
}

.settings-panel-chev {
  font-size: 0.7rem;
  color: var(--muted);
  transform: rotate(-90deg);
  transition: transform 0.15s ease, color 0.12s ease;
}

.settings-panel:not([open]) .settings-panel-head:hover .settings-panel-chev,
.settings-panel[open] .settings-panel-chev {
  color: var(--ink-soft);
}

.settings-panel[open] .settings-panel-chev { transform: rotate(0); }

.settings-panel-intro {
  margin: 0 0 0.65rem;
  font-size: 0.9rem;
  color: var(--ink-soft);
  line-height: 1.45;
}

.settings-panel[open] > .settings-panel-head {
  border-left: 3px solid color-mix(in srgb, var(--accent) 58%, var(--line));
  background: color-mix(in srgb, var(--accent-soft) 24%, var(--surface));
}

.settings-panel[open] .settings-panel-title {
  color: var(--ink);
}

.settings-panel-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem 0.55rem 1rem;
}
</style>
