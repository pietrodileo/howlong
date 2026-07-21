<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import IconBtn from '../components/IconBtn.vue';
import MetaIconPicker from '../components/MetaIconPicker.vue';
import { useI18n } from '../i18n/useI18n';
import type { EstimateExportFormat } from '../lib/export';
import {
  exportLibraryEstimates,
  pickHowLongEstimateFiles,
} from '../lib/libraryIo';
import { toErrorMessage } from '../lib/errors';
import { isTauri } from '../lib/tauri';
import type { ModelIcon } from '../models/model';
import { useEstimateStore } from '../stores/estimate';
import { useLibraryStore, type LibraryEntry } from '../stores/library';
import { useUiStore } from '../stores/ui';

const library = useLibraryStore();
const estimate = useEstimateStore();
const ui = useUiStore();
const { t, locale } = useI18n();

const searchQuery = ref('');
const folderPath = ref('');
const pendingDelete = ref<LibraryEntry | null>(null);
const selected = ref<Set<string>>(new Set());
const exportMenuOpen = ref(false);
const busy = ref(false);

const filtered = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const list = library.sorted;
  if (!q) return list;
  return list.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.clientLabel.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q),
  );
});

const selectedCount = computed(() => selected.value.size);

const allFilteredSelected = computed(
  () =>
    filtered.value.length > 0 &&
    filtered.value.every((e) => selected.value.has(e.path)),
);

const dateFmt = computed(
  () =>
    new Intl.DateTimeFormat(locale.value === 'en' ? 'en-GB' : 'it-IT', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
);

function formatUpdated(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return dateFmt.value.format(d);
}

async function refresh() {
  await library.loadAll();
  try {
    folderPath.value = await library.resolveDir();
  } catch {
    folderPath.value = '';
  }
  if (library.lastError) ui.notify(library.lastError, true);
  const known = new Set(library.entries.map((e) => e.path));
  selected.value = new Set([...selected.value].filter((p) => known.has(p)));
}

function isSelected(path: string): boolean {
  return selected.value.has(path);
}

function toggleSelect(path: string, on: boolean) {
  const next = new Set(selected.value);
  if (on) next.add(path);
  else next.delete(path);
  selected.value = next;
}

function selectAllFiltered() {
  const next = new Set(selected.value);
  for (const e of filtered.value) next.add(e.path);
  selected.value = next;
}

function clearSelection() {
  selected.value = new Set();
}

function openEntry(entry: LibraryEntry) {
  const run = async () => {
    const result = await library.loadEstimate(entry.path);
    if (!result.ok) {
      ui.notify(result.error, true);
      return;
    }
    estimate.setEstimate(result.data, entry.path);
    ui.navigate('working');
    ui.notify(t('library.opened', { name: result.data.meta.title }));
  };

  if (!estimate.dirty) {
    void run();
    return;
  }
  pendingOpen.value = run;
}

const pendingOpen = ref<null | (() => void | Promise<void>)>(null);

async function confirmOpen() {
  const action = pendingOpen.value;
  pendingOpen.value = null;
  if (action) await action();
}

function cancelOpen() {
  pendingOpen.value = null;
}

function askDelete(entry: LibraryEntry) {
  pendingDelete.value = entry;
}

async function confirmDelete() {
  const entry = pendingDelete.value;
  pendingDelete.value = null;
  if (!entry) return;
  try {
    await library.removeEntry(entry.path);
    toggleSelect(entry.path, false);
    if (estimate.filePath === entry.path) {
      estimate.markSaved(null);
    }
    ui.notify(t('library.deleted', { name: entry.title }));
  } catch (e) {
    ui.notify(toErrorMessage(e), true);
  }
}

async function onTitleChange(entry: LibraryEntry, raw: string) {
  const title = raw.trim();
  if (!title || title === entry.title) return;
  const result = await library.updateEntryMeta(entry.path, { title });
  if (!result.ok) ui.notify(result.error, true);
}

async function onIconChange(entry: LibraryEntry, icon: ModelIcon) {
  if (icon === entry.icon) return;
  const result = await library.updateEntryMeta(entry.path, { icon });
  if (!result.ok) ui.notify(result.error, true);
}

async function onImport() {
  if (busy.value) return;
  const picked = await pickHowLongEstimateFiles();
  if (!picked.ok) {
    if (picked.error !== 'Operazione annullata') ui.notify(picked.error, true);
    return;
  }
  busy.value = true;
  try {
    const { imported, errors } = await library.importFromPaths(picked.paths);
    if (errors.length === 0) {
      ui.notify(t('library.importOk', { n: String(imported) }));
    } else if (imported > 0) {
      ui.notify(
        t('library.importPartial', {
          ok: String(imported),
          fail: String(errors.length),
        }),
        true,
      );
    } else {
      ui.notify(errors[0] ?? t('library.importPartial', { ok: '0', fail: String(errors.length) }), true);
    }
  } finally {
    busy.value = false;
  }
}

async function onExport(format: EstimateExportFormat) {
  exportMenuOpen.value = false;
  if (selected.value.size === 0) {
    ui.notify(t('library.noneSelected'), true);
    return;
  }
  if (busy.value) return;
  busy.value = true;
  try {
    const estimates = [];
    for (const path of selected.value) {
      const loaded = await library.loadEstimate(path);
      if (!loaded.ok) {
        ui.notify(loaded.error, true);
        return;
      }
      estimates.push(loaded.data);
    }
    const result = await exportLibraryEstimates(estimates, format);
    if (!result.ok) {
      if (result.error !== 'Operazione annullata') ui.notify(result.error, true);
      return;
    }
    ui.notify(
      t('library.exportOk', {
        n: String(estimates.length),
        path: result.path,
      }),
    );
  } finally {
    busy.value = false;
  }
}

function toggleExportMenu() {
  exportMenuOpen.value = !exportMenuOpen.value;
}

function onDocPointerDown(e: PointerEvent) {
  const el = e.target as HTMLElement | null;
  if (!el?.closest?.('.export-menu')) exportMenuOpen.value = false;
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown);
  void refresh();
});

onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointerDown);
});
</script>

<template>
  <div class="library">
    <header class="hero">
      <p v-if="folderPath" class="path" :title="folderPath">{{ folderPath }}</p>
      <p v-else-if="!isTauri()" class="path muted">{{ t('library.desktopOnly') }}</p>
      <button type="button" class="ghost" :disabled="library.loading || busy" @click="refresh">
        {{ t('library.refresh') }}
      </button>
    </header>

    <div class="toolbar">
      <input
        v-model="searchQuery"
        type="search"
        class="search"
        :placeholder="t('library.searchPh')"
        :aria-label="t('library.searchAria')"
      />
      <button
        type="button"
        class="ghost"
        :title="t('library.importHint')"
        :disabled="busy || !isTauri()"
        @click="onImport"
      >
        {{ t('library.import') }}
      </button>
      <div class="export-menu">
        <button
          type="button"
          class="ghost"
          :title="t('library.exportHint')"
          :disabled="busy || selectedCount === 0"
          :aria-expanded="exportMenuOpen"
          @click.stop="toggleExportMenu"
        >
          {{ t('library.export') }} ▾
        </button>
        <div v-if="exportMenuOpen" class="menu" role="menu" @pointerdown.stop>
          <p class="menu-hint">{{ t('library.exportZipHint') }}</p>
          <button type="button" role="menuitem" @click="onExport('json')">
            {{ t('export.backup') }}
          </button>
          <button type="button" role="menuitem" @click="onExport('yaml')">
            {{ t('export.ai') }}
          </button>
          <button type="button" role="menuitem" @click="onExport('xlsx')">
            {{ t('export.excel') }}
          </button>
        </div>
      </div>
      <button type="button" class="ghost" @click="ui.navigate('settings')">
        {{ t('library.changeFolder') }}
      </button>
    </div>

    <div v-if="filtered.length > 0" class="selection-bar">
      <label class="check-all">
        <input
          type="checkbox"
          :checked="allFilteredSelected"
          :indeterminate.prop="selectedCount > 0 && !allFilteredSelected"
          @change="($event.target as HTMLInputElement).checked ? selectAllFiltered() : clearSelection()"
        />
        <span>{{ allFilteredSelected ? t('library.selectNone') : t('library.selectAll') }}</span>
      </label>
      <span v-if="selectedCount > 0" class="sel-count">
        {{ t('library.selected', { n: String(selectedCount) }) }}
      </span>
    </div>

    <p v-if="library.loading" class="empty">{{ t('library.loading') }}</p>
    <p v-else-if="filtered.length === 0" class="empty">
      {{ searchQuery.trim() ? t('library.noResults') : t('library.empty') }}
    </p>

    <ul v-else class="list">
      <li v-for="entry in filtered" :key="entry.path" :class="{ selected: isSelected(entry.path) }">
        <input
          type="checkbox"
          class="row-check"
          :checked="isSelected(entry.path)"
          :aria-label="entry.title"
          @change="toggleSelect(entry.path, ($event.target as HTMLInputElement).checked)"
        />
        <MetaIconPicker
          :icon="entry.icon"
          :name="entry.title"
          :size="16"
          @update:icon="onIconChange(entry, $event)"
        />
        <div class="body">
          <input
            class="title-input"
            :value="entry.title"
            :aria-label="t('library.renameAria')"
            :title="t('library.renameHint')"
            @click.stop
            @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
            @change="onTitleChange(entry, ($event.target as HTMLInputElement).value)"
          />
          <button type="button" class="open-meta" @click="openEntry(entry)">
            <span v-if="entry.clientLabel" class="client">{{ entry.clientLabel }}</span>
            <span class="meta">{{ formatUpdated(entry.updatedAt) }}</span>
            <span class="open-label">{{ t('common.open') }}</span>
          </button>
        </div>
        <IconBtn
          kind="delete"
          :label="t('common.delete')"
          @click.stop="askDelete(entry)"
        />
      </li>
    </ul>

    <ConfirmModal
      :open="pendingOpen != null"
      :title="t('working.unsavedTitle')"
      :message="t('working.unsavedBody')"
      :confirm-label="t('working.unsavedDiscard')"
      danger
      @cancel="cancelOpen"
      @confirm="confirmOpen"
    />

    <ConfirmModal
      :open="pendingDelete != null"
      :title="t('library.deleteTitle')"
      :message="t('library.deleteBody', { name: pendingDelete?.title ?? '' })"
      :confirm-label="t('common.delete')"
      danger
      @cancel="pendingDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.library {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 720px;
}

.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.path {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.78rem;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.path.muted {
  font-family: inherit;
}

.toolbar {
  display: flex;
  gap: 0.65rem;
  align-items: center;
  flex-wrap: wrap;
}

.search {
  flex: 1 1 220px;
  min-width: 0;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink);
  font-size: 0.92rem;
}

.search:focus {
  outline: none;
  border-color: var(--line-strong);
}

.export-menu {
  position: relative;
}

.menu {
  position: absolute;
  top: calc(100% + 0.3rem);
  right: 0;
  z-index: 30;
  min-width: 11rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.4rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-menu);
}

.menu-hint {
  margin: 0 0 0.25rem;
  padding: 0.25rem 0.45rem;
  font-size: 0.72rem;
  line-height: 1.35;
  color: var(--muted);
}

.menu button {
  display: block;
  width: 100%;
  margin: 0;
  padding: 0.45rem 0.55rem;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  text-align: left;
  font: inherit;
  font-size: 0.88rem;
  color: var(--ink);
  cursor: pointer;
}

.menu button:hover {
  background: var(--page-soft);
}

.selection-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.check-all {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.86rem;
  color: var(--ink-soft);
  cursor: pointer;
}

.sel-count {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--accent);
}

.empty {
  margin: 0.5rem 0 0;
  color: var(--muted);
  font-size: 0.92rem;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

li {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.45rem 0.45rem 0.45rem 0.55rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
}

li.selected {
  border-color: color-mix(in srgb, var(--accent) 45%, var(--line));
  background: color-mix(in srgb, var(--accent) 6%, var(--surface));
}

.row-check {
  flex-shrink: 0;
  margin: 0;
}

.body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.title-input {
  width: 100%;
  margin: 0;
  padding: 0.2rem 0.35rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-weight: 600;
}

.title-input:hover {
  border-color: var(--line);
}

.title-input:focus {
  outline: none;
  border-color: var(--line-strong);
  background: var(--page-soft);
}

.open-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.75rem;
  width: 100%;
  margin: 0;
  padding: 0.15rem 0.35rem;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: inherit;
}

.open-meta:hover {
  background: var(--page-soft);
}

.client {
  font-size: 0.84rem;
  color: var(--ink-soft);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  font-size: 0.78rem;
  color: var(--muted);
  white-space: nowrap;
}

.open-label {
  margin-left: auto;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--accent);
}

li :deep(.icon-btn) {
  flex-shrink: 0;
}

li :deep(.icon-trigger) {
  width: 2rem;
  height: 2rem;
}
</style>
