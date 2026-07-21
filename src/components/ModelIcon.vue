<script setup lang="ts">
import { computed } from 'vue';
import type { ModelIcon } from '../models/model';

const props = withDefaults(
  defineProps<{
    icon?: ModelIcon | null;
    name: string;
    size?: number;
  }>(),
  { icon: 'letter', size: 15 },
);

function letter(): string {
  const t = props.name.trim();
  return t ? t.charAt(0).toUpperCase() : '?';
}

/** Path SVG 24×24 (stroke icons). */
const PATHS: Record<Exclude<ModelIcon, 'letter'>, string[]> = {
  layers: [
    'M12 3.5 20 8l-8 4.5L4 8l8-4.5Z',
    'M4 12.5 12 17l8-4.5',
    'M4 16.5 12 21l8-4.5',
  ],
  table: [
    'M3.5 4.5h17v15h-17z',
    'M3.5 9.5h17',
    'M3.5 14.5h17',
    'M9.5 9.5v10',
  ],
  folder: [
    'M3.5 8.5V18a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V9.5a1.5 1.5 0 0 0-1.5-1.5H12l-1.6-1.8A1.5 1.5 0 0 0 9.3 5.5H5.5A2 2 0 0 0 3.5 7.5v1Z',
  ],
  gear: [
    'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
    'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.9 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z',
  ],
  star: ['M12 3.5 14.4 9l5.9.5-4.5 3.9 1.4 5.7L12 16.4 6.8 19.1l1.4-5.7-4.5-3.9L9.6 9 12 3.5Z'],
  bolt: ['M13 3 5.5 13.5H12L11 21l7.5-10.5H12L13 3Z'],
  check: ['M5 12.5 9.5 17 19 7'],
  code: ['M9 7.5 4.5 12 9 16.5', 'M15 7.5 19.5 12 15 16.5'],
  chart: ['M4 19.5h16', 'M7 16.5V10', 'M12 16.5V6.5', 'M17 16.5v-4'],
  clipboard: [
    'M8.5 5.5h7a1 1 0 0 1 1 1V19a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 7.5 19V6.5a1 1 0 0 1 1-1Z',
    'M9.5 5.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v.7',
  ],
  calendar: [
    'M5 6.5h14v13H5z',
    'M5 10.5h14',
    'M9 4.5v4',
    'M15 4.5v4',
  ],
  users: [
    'M15.5 19.5v-1.2a3.3 3.3 0 0 0-3.3-3.3H7.8a3.3 3.3 0 0 0-3.3 3.3v1.2',
    'M10 11.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    'M19.5 19.5v-1a2.8 2.8 0 0 0-2-2.7',
    'M15.2 5.6a3 3 0 0 1 0 5.8',
  ],
  flag: ['M5.5 4.5v16', 'M5.5 5.5h10.5l-1.8 3.5 1.8 3.5H5.5'],
  target: [
    'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    'M12.5 12a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0',
  ],
  box: [
    'M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5Z',
    'M12 12.5 20 8',
    'M12 12.5 4 8',
    'M12 12.5V21',
  ],
  book: [
    'M5 5.5A2 2 0 0 1 7 3.5h10.5v16H7a2 2 0 0 0-2 2V5.5Z',
    'M7 3.5v16',
  ],
  cloud: [
    'M7.5 17.5h10a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6-1.5A3.5 3.5 0 0 0 7.5 17.5Z',
  ],
  rocket: [
    'M12 3.5c3.5 2 5.5 5.5 5.5 9.5 0 1.5-.3 2.8-.8 4H7.3c-.5-1.2-.8-2.5-.8-4 0-4 2-7.5 5.5-9.5Z',
    'M9.5 17l-2 3.5',
    'M14.5 17l2 3.5',
    'M12 11.5v.01',
  ],
  shield: ['M12 3.5 19 6.5v5c0 4.5-3 7.8-7 9.5-4-1.7-7-5-7-9.5v-5L12 3.5Z'],
  grid: [
    'M5 5h5.5v5.5H5z',
    'M13.5 5H19v5.5h-5.5z',
    'M5 13.5h5.5V19H5z',
    'M13.5 13.5H19V19h-5.5z',
  ],
  list: ['M8.5 7h11', 'M8.5 12h11', 'M8.5 17h11', 'M4.5 7h.01', 'M4.5 12h.01', 'M4.5 17h.01'],
  pen: [
    'M13.5 5.5 18.5 10.5',
    'M5 19l1.2-5.2L15.5 4.5a2 2 0 0 1 2.8 0l1.2 1.2a2 2 0 0 1 0 2.8L10.2 17.8 5 19Z',
  ],
  link: [
    'M9.5 14.5a4 4 0 0 1 0-5.6l2.1-2.1a4 4 0 0 1 5.6 5.6l-1 1',
    'M14.5 9.5a4 4 0 0 1 0 5.6l-2.1 2.1a4 4 0 1 1-5.6-5.6l1-1',
  ],
  database: [
    'M5 7c0-1.9 3.1-3.5 7-3.5s7 1.6 7 3.5-3.1 3.5-7 3.5S5 8.9 5 7Z',
    'M5 7v10c0 1.9 3.1 3.5 7 3.5s7-1.6 7-3.5V7',
    'M5 12c0 1.9 3.1 3.5 7 3.5s7-1.6 7-3.5',
  ],
  briefcase: [
    'M4.5 8.5h15v10a1.5 1.5 0 0 1-1.5 1.5h-12a1.5 1.5 0 0 1-1.5-1.5v-10Z',
    'M9 8.5V6.8A1.3 1.3 0 0 1 10.3 5.5h3.4A1.3 1.3 0 0 1 15 6.8v1.7',
    'M4.5 12.5h15',
  ],
};

const resolved = computed(() => {
  const id = props.icon || 'letter';
  if (id === 'letter') return null;
  return PATHS[id] ?? PATHS.check;
});
</script>

<template>
  <span class="model-icon" aria-hidden="true">
    <template v-if="!resolved">{{ letter() }}</template>
    <svg
      v-else
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path v-for="(d, i) in resolved" :key="i" :d="d" />
    </svg>
  </span>
</template>

<style scoped>
.model-icon {
  display: inline-grid;
  place-items: center;
  line-height: 1;
  font-weight: 650;
  font-size: 0.78em;
}

.model-icon svg {
  display: block;
}
</style>
