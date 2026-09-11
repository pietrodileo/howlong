<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { tagBorderColor } from '../tagColors';

const props = withDefaults(defineProps<{
  modelValue: string;
  options: string[];
  disabled?: boolean;
  ariaLabel?: string;
  placeholder?: string;
  filterPlaceholder?: string;
  createLabel?: string;
  removeLabel?: string;
  lockedOptions?: string[];
  lockedLabel?: string;
}>(), { disabled: false, ariaLabel: 'Owner', placeholder: 'Unassigned', filterPlaceholder: 'Search or create…', createLabel: 'Create', removeLabel: 'Delete owner', lockedOptions: () => [], lockedLabel: 'Owner assigned to a task; remove assignments before deleting.' });
const emit = defineEmits<{ 'update:modelValue': [value: string]; 'delete-option': [value: string] }>();
const open = ref(false);
const query = ref('');
const rootEl = ref<HTMLElement | null>(null);
const menuEl = ref<HTMLElement | null>(null);
const filterEl = ref<HTMLInputElement | null>(null);
const menuStyle = ref<Record<string, string>>({});
const options = computed(() => [...new Set(props.options.map((name) => name.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
const filtered = computed(() => {
  const needle = query.value.trim().toLowerCase();
  return needle ? options.value.filter((name) => name.toLowerCase().includes(needle)) : options.value;
});
const canCreate = computed(() => {
  const name = query.value.trim().toLowerCase();
  return Boolean(name) && !options.value.some((option) => option.toLowerCase() === name);
});
const lockedOptions = computed(() => new Set(props.lockedOptions.map((name) => name.trim().toLowerCase())));
function ownerStyle(name: string) { return { borderColor: tagBorderColor(name) }; }
/** Report whether an owner is still assigned and cannot be deleted. */
function isLocked(name: string) { return lockedOptions.value.has(name.trim().toLowerCase()); }

function updatePosition() {
  const root = rootEl.value;
  const menu = menuEl.value;
  if (!root || !menu) return;
  const rect = root.getBoundingClientRect();
  const width = Math.min(Math.max(240, rect.width), window.innerWidth - 16);
  const height = Math.min(menu.offsetHeight, 224);
  const above = rect.bottom + height > window.innerHeight && rect.top > height;
  menuStyle.value = { left: `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`, top: `${Math.max(8, above ? rect.top - height - 4 : rect.bottom + 4)}px`, width: `${width}px` };
}
function close() { open.value = false; query.value = ''; }
function toggle() {
  if (props.disabled) return;
  open.value = !open.value;
  if (open.value) void nextTick(() => { updatePosition(); filterEl.value?.focus(); });
}
function choose(name: string) { emit('update:modelValue', name.trim()); close(); }
function clear(event: MouseEvent) { event.stopPropagation(); emit('update:modelValue', ''); }
function deleteOption(event: MouseEvent, name: string) { event.stopPropagation(); emit('delete-option', name); }
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); close(); }
  if (event.key === 'Enter' && canCreate.value) { event.preventDefault(); choose(query.value); }
}
function onDocumentPointerDown(event: PointerEvent) {
  if (open.value && !rootEl.value?.contains(event.target as Node)) close();
}
watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('pointerdown', onDocumentPointerDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
  } else {
    document.removeEventListener('pointerdown', onDocumentPointerDown);
    window.removeEventListener('resize', updatePosition);
    window.removeEventListener('scroll', updatePosition, true);
  }
});
onUnmounted(() => { document.removeEventListener('pointerdown', onDocumentPointerDown); window.removeEventListener('resize', updatePosition); window.removeEventListener('scroll', updatePosition, true); });
</script>

<template>
  <div ref="rootEl" class="owner-picker-control" :class="{ open, disabled }">
    <button type="button" class="owner-trigger" :disabled="disabled" :aria-label="ariaLabel" :aria-expanded="open" @click="toggle">
      <span v-if="modelValue" class="owner-pill" :style="ownerStyle(modelValue)">{{ modelValue }} <span class="owner-remove" role="button" tabindex="-1" aria-label="Remove owner" @click="clear">×</span></span>
      <span v-else class="owner-placeholder">{{ placeholder }}</span>
      <span class="owner-chevron" aria-hidden="true">▾</span>
    </button>
    <Teleport to="body">
      <div v-if="open" ref="menuEl" class="owner-menu" :style="menuStyle" role="listbox" @pointerdown.stop>
        <input ref="filterEl" v-model="query" class="owner-filter" type="text" :placeholder="filterPlaceholder" @keydown="onKeydown" />
        <ul>
          <li v-if="canCreate"><button type="button" class="owner-option create" @click="choose(query)">{{ createLabel }} “{{ query.trim() }}”</button></li>
          <li v-for="option in filtered" :key="option" class="owner-option-row" :class="{ selected: option.toLowerCase() === modelValue.toLowerCase() }"><button type="button" class="owner-option" @click="choose(option)"><span class="owner-option-pill" :style="ownerStyle(option)">{{ option }}</span></button><button type="button" class="owner-delete" :disabled="isLocked(option)" :title="isLocked(option) ? lockedLabel : undefined" :aria-label="`${removeLabel}: ${option}`" @click="deleteOption($event, option)">×</button></li>
          <li v-if="!filtered.length && !canCreate" class="owner-empty">—</li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.owner-picker-control { width: 100%; min-width: 0; }
.owner-trigger { display: flex; align-items: center; gap: .25rem; width: 100%; min-height: 1.8rem; padding: .4rem .55rem; font: inherit; text-align: left; color: var(--ink); background: var(--page-soft); border: 1px solid var(--line); border-radius: var(--radius-sm); cursor: pointer; }
.owner-picker-control.open .owner-trigger { border-color: var(--accent); box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent); }
.owner-placeholder { color: var(--muted); font-size: .78rem; }
.owner-pill { display: inline-flex; align-items: center; gap: .15rem; max-width: 100%; padding: .08rem .4rem; font-size: .72rem; line-height: 1.35; white-space: nowrap; background: var(--surface); border: 1px solid; border-radius: 999px; }
.owner-remove { font-size: .85rem; opacity: .65; cursor: pointer; }
.owner-chevron { margin-left: auto; color: var(--muted); font-size: .65rem; }
.owner-menu { position: fixed; z-index: 1000; max-height: 14rem; overflow: auto; padding: .35rem; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-sm); box-shadow: var(--shadow-md, 0 8px 24px rgb(0 0 0 / 12%)); }
.owner-filter { width: 100%; box-sizing: border-box; margin: 0 0 .35rem; padding: .4rem .5rem; font: inherit; font-size: .74rem; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); color: var(--ink); }
.owner-menu ul { display: flex; flex-direction: column; gap: .25rem; list-style: none; margin: 0; padding: 0; }
.owner-option-row { display: flex; align-items: center; gap: .2rem; background: color-mix(in srgb, var(--ink) 7%, var(--surface)); border-radius: var(--radius-sm); }
.owner-option { display: flex; flex: 1; min-width: 0; padding: .35rem .4rem; font: inherit; font-size: .74rem; text-align: left; background: transparent; border: 0; border-radius: var(--radius-sm); cursor: pointer; }
.owner-option-pill { display: inline-flex; align-items: center; max-width: 100%; padding: .1rem .42rem; line-height: 1.35; white-space: nowrap; background: var(--surface); border: 1px solid; border-radius: 999px; }
.owner-delete { flex: 0 0 auto; padding: .2rem .35rem; font-size: .8rem; color: var(--muted); background: transparent; border: 0; cursor: pointer; }
.owner-delete:hover:not(:disabled) { color: var(--danger, #b42318); }
.owner-delete:disabled { color: var(--muted-soft); cursor: default; opacity: .55; }
.owner-option-row:hover, .owner-option-row.selected { background: color-mix(in srgb, var(--accent) 10%, var(--surface)); }
.owner-option.create { color: var(--accent); font-weight: 500; }
.owner-empty { padding: .35rem .4rem; font-size: .78rem; color: var(--muted); }
</style>
