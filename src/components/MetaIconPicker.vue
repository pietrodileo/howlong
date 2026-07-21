<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import ModelIcon from './ModelIcon.vue';
import { MODEL_ICON_OPTIONS, type ModelIcon as ModelIconId } from '../models/model';
import { useI18n } from '../i18n/useI18n';

const props = withDefaults(
  defineProps<{
    icon?: ModelIconId | null;
    name: string;
    size?: number;
  }>(),
  { icon: 'letter', size: 18 },
);

const emit = defineEmits<{
  'update:icon': [icon: ModelIconId];
}>();

const { t } = useI18n();
const open = ref(false);

const current = () => (props.icon ?? 'letter') as ModelIconId;

function iconTitle(opt: ModelIconId): string {
  const key = `models.icon_${opt}` as const;
  try {
    return t(key);
  } catch {
    return opt;
  }
}

function pick(opt: ModelIconId) {
  emit('update:icon', opt);
  open.value = false;
}

function onDocPointerDown(e: PointerEvent) {
  const el = e.target as HTMLElement | null;
  if (!el?.closest('.icon-picker')) open.value = false;
}

onMounted(() => document.addEventListener('pointerdown', onDocPointerDown));
onUnmounted(() => document.removeEventListener('pointerdown', onDocPointerDown));
</script>

<template>
  <div class="icon-picker">
    <button
      type="button"
      class="icon-trigger"
      :aria-label="t('models.iconLabel')"
      :aria-expanded="open"
      :title="iconTitle(current())"
      @click.stop="open = !open"
    >
      <ModelIcon :icon="current()" :name="name" :size="size" />
    </button>
    <div
      v-if="open"
      class="icon-menu"
      role="listbox"
      :aria-label="t('models.iconLabel')"
      @pointerdown.stop
    >
      <button
        v-for="opt in MODEL_ICON_OPTIONS"
        :key="opt"
        type="button"
        class="icon-opt"
        role="option"
        :aria-selected="current() === opt"
        :class="{ active: current() === opt }"
        :title="iconTitle(opt)"
        @click="pick(opt)"
      >
        <ModelIcon :icon="opt" :name="name" :size="15" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.icon-picker {
  position: relative;
  flex-shrink: 0;
}

.icon-trigger {
  display: inline-grid;
  place-items: center;
  width: 2.15rem;
  height: 2.15rem;
  margin: 0;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink-soft);
  cursor: pointer;
}

.icon-trigger:hover {
  border-color: var(--line-strong);
  background: var(--page-soft);
}

.icon-trigger[aria-expanded='true'] {
  border-color: var(--accent);
}

.icon-menu {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  z-index: 40;
  display: grid;
  grid-template-columns: repeat(6, 1.85rem);
  gap: 0.25rem;
  padding: 0.45rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-menu);
}

.icon-opt {
  display: inline-grid;
  place-items: center;
  width: 1.85rem;
  height: 1.85rem;
  margin: 0;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink-soft);
  cursor: pointer;
}

.icon-opt:hover {
  background: var(--page-soft);
}

.icon-opt.active {
  border-color: var(--accent);
  color: var(--accent);
}
</style>
