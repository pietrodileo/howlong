<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { tagBorderColor } from '../tagColors';

const props = withDefaults(defineProps<{
  modelValue: string | string[];
  options: string[];
  multiple?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  placeholder?: string;
  filterPlaceholder?: string;
  createLabel?: string;
  removeLabel?: string;
  lockedOptions?: string[];
  lockedLabel?: string;
}>(), { multiple: false, disabled: false, ariaLabel: 'Owner', placeholder: 'Unassigned', filterPlaceholder: 'Search or create…', createLabel: 'Create', removeLabel: 'Delete owner', lockedOptions: () => [], lockedLabel: 'Owner assigned to a task; remove assignments before deleting.' });
const emit = defineEmits<{ 'update:modelValue': [value: string | string[]]; 'delete-option': [value: string] }>();
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
const selectedOwners = computed(() => {
  const raw = Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue];
  return raw
    .filter((name): name is string => typeof name === 'string')
    .map((name) => name.trim())
    .filter(Boolean);
});
const selectedOwnerIds = computed(() => new Set(selectedOwners.value.map((name) => name.toLowerCase())));
const isReducingMultiple = computed(() => !props.multiple && selectedOwners.value.length > 1);
const canCreate = computed(() => {
  if (isReducingMultiple.value) return false;
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
function isSelected(name: string) { return selectedOwnerIds.value.has(name.trim().toLowerCase()); }
function choose(name: string) {
  const normalized = name.trim();
  if (!normalized) return;
  if (props.multiple || isReducingMultiple.value) {
    if (isReducingMultiple.value && !isSelected(normalized)) return;
    const next = isSelected(normalized)
      ? selectedOwners.value.filter((owner) => owner.toLowerCase() !== normalized.toLowerCase())
      : [...selectedOwners.value, normalized];
    emit('update:modelValue', next);
    query.value = '';
    void nextTick(() => filterEl.value?.focus());
    return;
  }
  emit('update:modelValue', normalized);
  close();
}
function clear(name: string, event: Event) {
  event.stopPropagation();
  if (Array.isArray(props.modelValue)) {
    emit('update:modelValue', selectedOwners.value.filter((owner) => owner.toLowerCase() !== name.toLowerCase()));
  } else {
    emit('update:modelValue', '');
  }
}
function deleteOption(event: MouseEvent, name: string) { event.stopPropagation(); close(); emit('delete-option', name); }
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
      <span v-if="selectedOwners.length" class="owner-pills">
        <span v-for="owner in selectedOwners" :key="owner" class="owner-pill" :style="ownerStyle(owner)" :role="disabled ? undefined : 'button'" :tabindex="disabled ? -1 : 0" :aria-label="`${removeLabel}: ${owner}`" @click="clear(owner, $event)" @keydown.enter.prevent="clear(owner, $event)">{{ owner }} <span class="owner-remove" aria-hidden="true">×</span></span>
      </span>
      <span v-else class="owner-placeholder">{{ placeholder }}</span>
      <span class="owner-chevron" aria-hidden="true">▾</span>
    </button>
    <Teleport to="body">
      <div v-if="open" ref="menuEl" class="owner-menu" :style="menuStyle" role="listbox" :aria-label="ariaLabel" :aria-multiselectable="multiple || undefined" @pointerdown.stop>
        <input ref="filterEl" v-model="query" class="owner-filter" type="text" :placeholder="filterPlaceholder" @keydown="onKeydown" />
        <ul>
          <li v-if="canCreate"><button type="button" class="owner-option create" @click="choose(query)">{{ createLabel }} “{{ query.trim() }}”</button></li>
          <li v-for="option in filtered" :key="option" class="owner-option-row" :class="{ selected: isSelected(option), unavailable: isReducingMultiple && !isSelected(option) }"><button type="button" class="owner-option" :disabled="isReducingMultiple && !isSelected(option)" :aria-selected="isSelected(option)" @click="choose(option)"><span class="owner-option-pill" :style="ownerStyle(option)">{{ option }}</span></button><button type="button" class="owner-delete" :disabled="isLocked(option)" :title="isLocked(option) ? lockedLabel : undefined" :aria-label="`${removeLabel}: ${option}`" @click="deleteOption($event, option)">×</button></li>
          <li v-if="!filtered.length && !canCreate" class="owner-empty">—</li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.owner-picker-control { width: 100%; min-width: 0; }
.owner-trigger { display: flex; align-items: center; gap: .25rem; width: 100%; min-height: 1.8rem; padding: .25rem .55rem; font: inherit; text-align: left; color: var(--ink); background: var(--page-soft); border: 1px solid var(--line); border-radius: var(--radius-sm); cursor: pointer; }
.owner-picker-control.open .owner-trigger { border-color: var(--accent); box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent); }
.owner-placeholder { color: var(--muted); font-size: .78rem; }
.owner-pills { display: flex; flex-wrap: wrap; min-width: 0; gap: .2rem; }
.owner-pill { display: inline-flex; align-items: center; gap: .15rem; max-width: 100%; padding: .08rem .4rem; color: var(--ink); font: inherit; font-size: .72rem; line-height: 1.35; white-space: nowrap; background: var(--surface); border: 1px solid; border-radius: 999px; cursor: pointer; }
.owner-pill[tabindex="-1"] { cursor: default; opacity: .88; }
.owner-remove { font-size: .85rem; opacity: .65; cursor: pointer; }
.owner-chevron { margin-left: auto; color: var(--muted); font-size: .65rem; }
.owner-menu { position: fixed; z-index: 1000; max-height: 14rem; overflow: auto; padding: .35rem; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-sm); box-shadow: var(--shadow-md, 0 8px 24px rgb(0 0 0 / 12%)); }
.owner-filter { width: 100%; box-sizing: border-box; margin: 0 0 .35rem; padding: .4rem .5rem; font: inherit; font-size: .74rem; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); color: var(--ink); }
.owner-menu ul { display: flex; flex-direction: column; gap: .25rem; list-style: none; margin: 0; padding: 0; }
.owner-option-row { display: flex; align-items: center; gap: .2rem; background: var(--surface); border-radius: var(--radius-sm); }
.owner-option { display: flex; flex: 1; min-width: 0; padding: .35rem .4rem; font: inherit; font-size: .74rem; text-align: left; background: transparent; border: 0; border-radius: var(--radius-sm); cursor: pointer; }
.owner-option-pill { display: inline-flex; align-items: center; max-width: 100%; padding: .1rem .42rem; line-height: 1.35; white-space: nowrap; background: var(--surface); border: 1px solid; border-radius: 999px; }
.owner-delete { flex: 0 0 auto; padding: .2rem .35rem; font-size: .8rem; color: var(--muted); background: transparent; border: 0; cursor: pointer; }
.owner-delete:hover:not(:disabled) { color: var(--danger, #b42318); }
.owner-delete:disabled { color: var(--muted-soft); cursor: default; opacity: .55; }
.owner-option-row:hover { background: color-mix(in srgb, var(--accent) 3%, var(--surface)); }
.owner-option-row.selected { background: color-mix(in srgb, var(--accent) 7%, var(--surface)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 18%, var(--line)); }
.owner-option-row.unavailable .owner-option { cursor: default; opacity: .45; }
.owner-option.create { color: var(--accent); font-weight: 500; }
.owner-empty { padding: .35rem .4rem; font-size: .78rem; color: var(--muted); }
</style>
