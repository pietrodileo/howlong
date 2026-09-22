<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import type { PresentationStatus, PresentationStatusScope } from '../../models/estimate';
import { useI18n } from '../../app/i18n/useI18n';

const props = defineProps<{
  scope: PresentationStatusScope;
  status: PresentationStatus;
}>();

const emit = defineEmits<{ update: [status: PresentationStatus] }>();
const { t } = useI18n();
const root = ref<HTMLElement | null>(null);
const menu = ref<HTMLElement | null>(null);
const open = ref(false);
const menuStyle = ref<Record<string, string>>({});
const statuses: PresentationStatus[] = ['draft', 'in-progress', 'ready-for-revision', 'verified'];

const scopeLabel = computed(() => t(`presentation.${props.scope}`));
const statusLabel = computed(() => t(`presentation.status_${props.status.replace(/-/g, '_')}`));
const tooltip = computed(() => `${scopeLabel.value}: ${statusLabel.value}`);

/** Keep the status menu inside the visible viewport. */
function updateMenuPosition() {
  const trigger = root.value;
  const popup = menu.value;
  if (!trigger || !popup) return;
  const rect = trigger.getBoundingClientRect();
  const width = Math.min(Math.max(196, popup.offsetWidth), window.innerWidth - 16);
  const height = Math.min(popup.offsetHeight, window.innerHeight - 16);
  const opensAbove = rect.bottom + height + 8 > window.innerHeight && rect.top > height;
  const preferredLeft = props.scope === 'estimate' ? rect.right - width : rect.left;
  menuStyle.value = {
    left: `${Math.max(8, Math.min(preferredLeft, window.innerWidth - width - 8))}px`,
    top: `${Math.max(8, opensAbove ? rect.top - height - 4 : rect.bottom + 4)}px`,
    width: `${width}px`,
  };
}

/** Open or close the status menu and position it beside its trigger. */
function toggleMenu() {
  open.value = !open.value;
  if (open.value) void nextTick(updateMenuPosition);
}

/** Close the status menu when focus moves elsewhere. */
function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node;
  if (!root.value?.contains(target) && !menu.value?.contains(target)) open.value = false;
}

/** Choose a status and close its menu. */
function choose(status: PresentationStatus) {
  emit('update', status);
  open.value = false;
}

watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('pointerdown', onDocumentPointerDown);
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
  } else {
    document.removeEventListener('pointerdown', onDocumentPointerDown);
    window.removeEventListener('resize', updateMenuPosition);
    window.removeEventListener('scroll', updateMenuPosition, true);
  }
});

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown);
  window.removeEventListener('resize', updateMenuPosition);
  window.removeEventListener('scroll', updateMenuPosition, true);
});
</script>

<template>
  <div ref="root" class="presentation-status" @click.stop @keydown.esc="open = false">
    <button
      type="button"
      class="presentation-status-trigger"
      :class="`is-${status}`"
      :aria-label="tooltip"
      :aria-expanded="open"
      aria-haspopup="menu"
      v-tip="open ? undefined : tooltip"
      @click="toggleMenu"
    >
      <span aria-hidden="true">{{ status === 'verified' ? '✓' : '' }}</span>
    </button>
    <Teleport to="body">
    <div v-if="open" ref="menu" class="presentation-status-menu" :style="menuStyle" role="menu" :aria-label="scopeLabel" @pointerdown.stop>
      <button
        v-for="option in statuses"
        :key="option"
        type="button"
        role="menuitemradio"
        :aria-checked="status === option"
        :class="['presentation-status-option', `is-${option}`]"
        @click="choose(option)"
      >
        <span class="presentation-status-check" aria-hidden="true">{{ status === option ? '✓' : '' }}</span>
        <span class="presentation-status-dot" :class="`is-${option}`" aria-hidden="true">{{ option === 'verified' ? '✓' : '' }}</span>
        {{ t(`presentation.status_${option.replace(/-/g, '_')}`) }}
      </button>
    </div>
    </Teleport>
  </div>
</template>

<style scoped>
.presentation-status { display: inline-flex; flex: 0 0 auto; }
.presentation-status-trigger,
.presentation-status-dot { display: inline-grid; place-items: center; border-radius: 50%; color: #fff; }
.presentation-status-trigger { width: 1.1rem; height: 1.1rem; padding: 0; border: 2px solid var(--surface); font-size: 0.65rem; font-weight: 800; line-height: 1; box-shadow: 0 0 0 1px color-mix(in srgb, var(--ink) 16%, transparent); }
.presentation-status-trigger:hover { box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 24%, transparent); }
.presentation-status-menu { position: fixed; z-index: 1000; max-height: min(14rem, calc(100vh - 1rem)); overflow: auto; padding: .3rem; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface); box-shadow: var(--shadow-menu); }
.presentation-status-option { display: flex; align-items: center; width: 100%; gap: .42rem; padding: .42rem .48rem; border: 0; border-radius: calc(var(--radius-sm) - 1px); background: transparent; color: var(--ink); text-align: left; font: inherit; font-size: .84rem; }
.presentation-status-option:hover { background: var(--page-soft); }
.presentation-status-option[aria-checked="true"] { background: color-mix(in srgb, var(--accent) 10%, var(--surface)); color: var(--accent); }
.presentation-status-check { width: .78rem; color: var(--accent); font-size: .72rem; font-weight: 700; text-align: center; }
.presentation-status-dot { width: .68rem; height: .68rem; flex: 0 0 auto; font-size: .48rem; font-weight: 800; }
.presentation-status-trigger.is-draft, .presentation-status-dot.is-draft { background:rgb(195, 240, 71); }
.presentation-status-trigger.is-in-progress, .presentation-status-dot.is-in-progress { background:rgb(88, 143, 237); }
.presentation-status-trigger.is-ready-for-revision, .presentation-status-dot.is-ready-for-revision { background: rgb(20, 161, 15); }
.presentation-status-trigger.is-verified, .presentation-status-dot.is-verified {
  background: rgb(15, 68, 161);
}
</style>
