<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { tagBorderColor } from '../tagColors';
import { useI18n } from '../../app/i18n/useI18n';

const props = withDefaults(
  defineProps<{
    modelValue: string[];
    options: string[];
    disabled?: boolean;
    readonly?: boolean;
    allowCreate?: boolean;
    ariaLabel?: string;
  }>(),
  {
    disabled: false,
    readonly: false,
    allowCreate: true,
  },
);

const { t } = useI18n();

const effectiveAriaLabel = computed(() => props.ariaLabel ?? t('columns.tags'));

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
  'create-option': [label: string];
}>();

const open = ref(false);
const query = ref('');
const rootEl = ref<HTMLElement | null>(null);
const filterEl = ref<HTMLInputElement | null>(null);
const menuEl = ref<HTMLElement | null>(null);
const menuStyle = ref<Record<string, string>>({});

const selected = computed(() => props.modelValue ?? []);

const mergedOptions = computed(() => {
  const set = new Set<string>();
  for (const o of props.options) {
    const t = o.trim();
    if (t) set.add(t);
  }
  for (const s of selected.value) {
    const t = s.trim();
    if (t) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
});

const filteredOptions = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return mergedOptions.value;
  return mergedOptions.value.filter((o) => o.toLowerCase().includes(q));
});

const canCreate = computed(() => {
  if (!props.allowCreate || props.disabled || props.readonly) return false;
  const q = query.value.trim();
  if (!q) return false;
  const lower = q.toLowerCase();
  return !mergedOptions.value.some((o) => o.toLowerCase() === lower);
});

function pillStyle(label: string) {
  const c = tagBorderColor(label);
  return { borderColor: c, color: 'var(--ink)' };
}

function toggleOpen() {
  if (props.disabled || props.readonly) return;
  open.value = !open.value;
  if (open.value) {
    query.value = '';
    void nextTick(() => {
      updateMenuPosition();
      filterEl.value?.focus();
    });
  }
}

/** Keep the teleported menu visible beside its trigger. */
function updateMenuPosition() {
  const root = rootEl.value;
  const menu = menuEl.value;
  if (!root || !menu) return;
  const rect = root.getBoundingClientRect();
  const width = Math.min(Math.max(240, rect.width), window.innerWidth - 16);
  const menuHeight = Math.min(menu.offsetHeight, 224);
  const spaceBelow = window.innerHeight - rect.bottom - 8;
  const opensAbove = spaceBelow < menuHeight && rect.top > spaceBelow;
  menuStyle.value = {
    left: `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`,
    top: `${Math.max(8, opensAbove ? rect.top - menuHeight - 4 : rect.bottom + 4)}px`,
    width: `${width}px`,
  };
}

function close() {
  open.value = false;
  query.value = '';
}

function setSelected(next: string[]) {
  emit('update:modelValue', [...new Set(next.map((s) => s.trim()).filter(Boolean))]);
}

function removeTag(label: string) {
  if (props.disabled || props.readonly) return;
  setSelected(selected.value.filter((s) => s !== label));
}

function addTag(label: string) {
  if (props.disabled || props.readonly) return;
  const trimmed = label.trim();
  if (!trimmed) return;
  const exists = mergedOptions.value.some((o) => o.toLowerCase() === trimmed.toLowerCase());
  if (!exists) emit('create-option', trimmed);
  if (!selected.value.includes(trimmed)) {
    setSelected([...selected.value, trimmed]);
  }
  query.value = '';
}

function onFilterKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault();
    close();
    return;
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    const q = query.value.trim();
    if (!q) return;
    if (canCreate.value) addTag(q);
    else {
      const match = mergedOptions.value.find((o) => o.toLowerCase() === q.toLowerCase());
      if (match) addTag(match);
    }
  }
}

function onDocPointerDown(e: PointerEvent) {
  if (!open.value) return;
  const t = e.target as Node | null;
  if (t && rootEl.value?.contains(t)) return;
  close();
}

watch(open, (v) => {
  if (v) {
    document.addEventListener('pointerdown', onDocPointerDown);
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
  } else {
    document.removeEventListener('pointerdown', onDocPointerDown);
    window.removeEventListener('resize', updateMenuPosition);
    window.removeEventListener('scroll', updateMenuPosition, true);
  }
});

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointerDown);
  window.removeEventListener('resize', updateMenuPosition);
  window.removeEventListener('scroll', updateMenuPosition, true);
});
</script>

<template>
  <div
    v-if="readonly"
    class="tag-picker readonly"
    :aria-label="effectiveAriaLabel"
  >
    <span
      v-for="label in selected"
      :key="label"
      class="pill"
      :style="pillStyle(label)"
    >{{ label }}</span>
    <span v-if="!selected.length" class="empty muted">—</span>
  </div>

  <div
    v-else
    ref="rootEl"
    class="tag-picker"
    :class="{ open, disabled }"
  >
    <button
      type="button"
      class="tag-trigger"
      :disabled="disabled"
      :aria-label="effectiveAriaLabel"
      :aria-expanded="open"
      @click="toggleOpen"
    >
      <span class="tag-trigger-inner">
        <span
          v-for="label in selected"
          :key="label"
          class="pill"
          :style="pillStyle(label)"
        >
          {{ label }}
          <span
            class="pill-x"
            role="button"
            tabindex="-1"
            :aria-label="t('tagPicker.remove', { name: label })"
            @click.stop="removeTag(label)"
          >×</span>
        </span>
        <span v-if="!selected.length" class="placeholder">{{ t('tagPicker.placeholder') }}</span>
      </span>
      <span class="chev" aria-hidden="true">▾</span>
    </button>

    <Teleport to="body">
    <div v-if="open" ref="menuEl" class="tag-menu" :style="menuStyle" role="listbox" @pointerdown.stop>
      <input
        ref="filterEl"
        v-model="query"
        type="text"
        class="tag-filter"
        :placeholder="t('tagPicker.filterPh')"
        @keydown="onFilterKeydown"
      />
      <ul class="tag-options">
        <li v-if="canCreate">
          <button type="button" class="tag-opt create" @click="addTag(query.trim())">
            {{ t('tagPicker.create', { name: query.trim() }) }}
          </button>
        </li>
        <li v-for="opt in filteredOptions" :key="opt">
          <button
            type="button"
            class="tag-opt"
            :class="{ picked: selected.includes(opt) }"
            @click="
              selected.includes(opt) ? removeTag(opt) : addTag(opt)
            "
          >
            <span class="pill mini" :style="pillStyle(opt)">{{ opt }}</span>
          </button>
        </li>
        <li v-if="!filteredOptions.length && !canCreate" class="muted empty-opt">
          {{ t('tagPicker.none') }}
        </li>
      </ul>
    </div>
    </Teleport>
  </div>
</template>

<style scoped>
.tag-picker {
  position: relative;
  min-width: 0;
  width: 100%;
}

.tag-picker.disabled {
  opacity: 0.55;
}

.tag-trigger {
  display: flex;
  align-items: flex-start;
  gap: 0.25rem;
  width: 100%;
  min-height: 1.8rem;
  padding: 0.4rem 0.55rem;
  font: inherit;
  text-align: left;
  color: var(--ink);
  background: var(--page-soft);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.tag-trigger:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--line) 50%, var(--accent));
}

.tag-picker.open .tag-trigger {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent);
}

.tag-trigger-inner {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 0.25rem;
  min-width: 0;
  align-items: center;
}

.chev {
  flex-shrink: 0;
  margin-top: 0.15rem;
  font-size: 0.65rem;
  color: var(--muted);
}

.placeholder {
  font-size: 0.78rem;
  color: var(--muted);
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  max-width: 100%;
  padding: 0.08rem 0.4rem;
  font-size: 0.72rem;
  line-height: 1.35;
  white-space: nowrap;
  background: var(--surface);
  border: 1px solid;
  border-radius: 999px;
}

.pill.mini {
  font-size: 0.74rem;
  padding: 0.1rem 0.42rem;
}

.pill-x {
  margin-left: 0.05rem;
  font-size: 0.85rem;
  line-height: 1;
  opacity: 0.65;
  cursor: pointer;
}

.pill-x:hover {
  opacity: 1;
}

.tag-menu {
  position: fixed;
  z-index: 1000;
  max-height: 14rem;
  overflow: auto;
  padding: 0.35rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md, 0 8px 24px rgb(0 0 0 / 12%));
}

.tag-filter {
  width: 100%;
  box-sizing: border-box;
  margin: 0 0 0.35rem;
  padding: 0.4rem 0.5rem;
  font: inherit;
  font-size: 0.74rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink);
}

.tag-options {
  list-style: none;
  margin: 0;
  padding: 0;
}

.tag-opt {
  display: flex;
  width: 100%;
  padding: 0.35rem 0.4rem;
  font: inherit;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.tag-opt:hover,
.tag-opt.picked {
  background: color-mix(in srgb, var(--accent) 8%, var(--surface));
}

.tag-opt.create {
  color: var(--accent);
  font-weight: 500;
}

.empty-opt {
  padding: 0.35rem 0.4rem;
  font-size: 0.85rem;
}

.tag-picker.readonly {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-items: center;
}

.empty {
  font-size: 0.85rem;
}
</style>
