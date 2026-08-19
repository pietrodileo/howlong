<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import EstimateCompareTable from '../components/EstimateCompareTable.vue';
import ModelIcon from '../components/ModelIcon.vue';
import { useCompareStore } from '../stores/compare';
import { useLibraryStore } from '../stores/library';
import { useI18n } from '../i18n/useI18n';
import { formatAuditDateTime } from '../lib/formatAuditDate';

const compare = useCompareStore();
const library = useLibraryStore();
const { t } = useI18n();

const { estimatePaths, estimates, loading, error, failedPaths, hasComparableSelection } =
  storeToRefs(compare);

const LIST_KEY = 'howlong.compareListCollapsed';
const LIST_WIDTH_KEY = 'howlong.compareListWidth';
const LIST_COLLAPSED_W = 56;
const LIST_MIN_W = 140;
const LIST_MAX_W = 800;
const LIST_COLLAPSE_AT = 100;
const LIST_DEFAULT_W = 280;

function loadListWidth(): number {
  try {
    const n = Number(localStorage.getItem(LIST_WIDTH_KEY));
    if (Number.isFinite(n) && n >= LIST_MIN_W && n <= LIST_MAX_W) return n;
  } catch {
    /* ignore */
  }
  return LIST_DEFAULT_W;
}

function loadListCollapsed(): boolean {
  try {
    return localStorage.getItem(LIST_KEY) === '1';
  } catch {
    return false;
  }
}

const listCollapsed = ref(loadListCollapsed());
const listResizing = ref(false);
const listWidth = ref(loadListWidth());

const listStyle = computed(() => ({
  '--list-w': listCollapsed.value ? `${LIST_COLLAPSED_W}px` : `${listWidth.value}px`,
}));

const searchQuery = ref('');

// Sort options
type SortBy = 'title' | 'client' | 'updated';
const sortBy = ref<SortBy>('title');
const sortDesc = ref(false);

// Selection state
const selectedCount = computed(() => estimatePaths.value.length);

const allFilteredSelected = computed(
  () =>
    filteredEntries.value.length > 0 &&
    filteredEntries.value.every((e) => estimatePaths.value.includes(e.path)),
);

function selectAllFiltered() {
  const paths = filteredEntries.value.map((e) => e.path);
  compare.replaceSelection(paths);
}

function clearSelection() {
  compare.clearSelection();
}

// Load library on mount
onMounted(() => {
  if (library.entries.length === 0) {
    void library.loadAll();
  }
  // If there are paths but no estimates loaded, load them
  if (estimatePaths.value.length > 0 && estimates.value.length === 0) {
    void compare.loadEstimates(estimatePaths.value);
  }
});

// Watch for selection changes and reload estimates
watch(
  estimatePaths,
  (newPaths) => {
    if (newPaths.length > 0) {
      void compare.loadEstimates(newPaths);
    }
    // Note: When newPaths is empty, estimates are already cleared by unselectPath
    // No need to call clearSelection() as it would cause unnecessary updates
  },
  { deep: true }
);

const filteredEntries = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  let list = library.sorted;
  
  // Filter
  if (q) {
    list = list.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.clientLabel.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q),
    );
  }
  
  // Sort
  return [...list].sort((a, b) => {
    let aVal: string;
    let bVal: string;
    
    switch (sortBy.value) {
      case 'title':
        aVal = a.title;
        bVal = b.title;
        break;
      case 'client':
        aVal = a.clientLabel || '';
        bVal = b.clientLabel || '';
        break;
      case 'updated':
        aVal = a.updatedAt;
        bVal = b.updatedAt;
        break;
      default:
        aVal = a.title;
        bVal = b.title;
    }
    
    const comparison = aVal.localeCompare(bVal);
    return sortDesc.value ? -comparison : comparison;
  });
});

function toggleSort(field: SortBy) {
  if (sortBy.value === field) {
    sortDesc.value = !sortDesc.value;
  } else {
    sortBy.value = field;
    sortDesc.value = false;
  }
}

function getSortLabel(field: SortBy): string {
  const labels: Record<SortBy, string> = {
    title: t('common.name'),
    client: t('common.client'),
    updated: t('settings.exportIncludeDate'),
  };
  return labels[field];
}

const selectedSet = computed(() => new Set(estimatePaths.value));

function isSelected(path: string): boolean {
  return selectedSet.value.has(path);
}

function toggleSelect(path: string, on: boolean) {
  if (on) {
    compare.selectPath(path);
  } else {
    compare.unselectPath(path);
  }
}

function formatUpdated(iso: string): string {
  return formatAuditDateTime(iso);
}

function persistListLayout() {
  try {
    localStorage.setItem(LIST_KEY, listCollapsed.value ? '1' : '0');
    localStorage.setItem(LIST_WIDTH_KEY, String(listWidth.value));
  } catch {
    /* ignore */
  }
}

function toggleList() {
  listCollapsed.value = !listCollapsed.value;
  persistListLayout();
}

function startListResize(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  const startX = e.clientX;
  const startW = listCollapsed.value ? LIST_COLLAPSED_W : listWidth.value;
  listResizing.value = true;
  document.body.classList.add('col-resizing');

  function onMove(ev: MouseEvent) {
    const next = Math.min(
      LIST_MAX_W,
      Math.max(LIST_COLLAPSED_W, startW + (ev.clientX - startX)),
    );
    if (next < LIST_COLLAPSE_AT) {
      listCollapsed.value = true;
    } else {
      listCollapsed.value = false;
      listWidth.value = Math.max(LIST_MIN_W, next);
    }
  }

  function onUp() {
    listResizing.value = false;
    document.body.classList.remove('col-resizing');
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    persistListLayout();
  }

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

onUnmounted(() => {
  document.body.classList.remove('col-resizing');
});
</script>

<template>
  <div
    class="compare"
    :class="{ 'list-collapsed': listCollapsed, 'list-resizing': listResizing }"
    :style="listStyle"
  >
    <div class="rest">
      <aside :aria-label="t('compare.availableEstimates')">
      <div class="aside-head">
        <div v-if="!listCollapsed" class="search-wrap">
          <input
            v-model="searchQuery"
            type="search"
            class="search"
            :placeholder="t('compare.searchEstimates')"
            :aria-label="t('compare.searchEstimatesAria')"
          />
        </div>
        <button
          type="button"
          class="ghost toggle"
          v-tip="listCollapsed ? t('models.expandList') : t('models.collapseList')"
          :aria-expanded="!listCollapsed"
          :aria-label="listCollapsed ? t('models.expandList') : t('models.collapseList')"
          @click="toggleList"
        >
          {{ listCollapsed ? '»' : '«' }}
        </button>
      </div>
      <div v-if="!listCollapsed && filteredEntries.length > 0" class="selection-bar">
        <label class="check-all">
          <input
            type="checkbox"
            :checked="allFilteredSelected"
            :indeterminate.prop="selectedCount > 0 && !allFilteredSelected"
            @change="($event.target as HTMLInputElement).checked ? selectAllFiltered() : clearSelection()"
          />
          <span>{{ allFilteredSelected ? t('compare.clearSelection') : t('compare.selectAllVisible') }}</span>
        </label>
        <span v-if="selectedCount > 0" class="sel-count">
          {{ t('compare.selectedCount', { n: String(selectedCount) }) }}
        </span>
      </div>
      <div v-if="!listCollapsed" class="sort-controls">
        <button
          type="button"
          class="sort-btn"
          :class="{ active: sortBy === 'title', desc: sortBy === 'title' && sortDesc }"
          v-tip="t('common.name')"
          @click="toggleSort('title')"
        >
          {{ getSortLabel('title') }}
          <span v-if="sortBy === 'title'" class="sort-icon">{{ sortDesc ? '▼' : '▲' }}</span>
        </button>
        <button
          type="button"
          class="sort-btn"
          :class="{ active: sortBy === 'client', desc: sortBy === 'client' && sortDesc }"
          v-tip="t('common.client')"
          @click="toggleSort('client')"
        >
          {{ getSortLabel('client') }}
          <span v-if="sortBy === 'client'" class="sort-icon">{{ sortDesc ? '▼' : '▲' }}</span>
        </button>
        <button
          type="button"
          class="sort-btn"
          :class="{ active: sortBy === 'updated', desc: sortBy === 'updated' && sortDesc }"
          v-tip="t('settings.exportIncludeDate')"
          @click="toggleSort('updated')"
        >
          {{ getSortLabel('updated') }}
          <span v-if="sortBy === 'updated'" class="sort-icon">{{ sortDesc ? '▼' : '▲' }}</span>
        </button>
      </div>
      <div v-if="library.loading" class="selector-loading">
        <p>{{ t('library.loading') }}</p>
      </div>
      <div v-else-if="filteredEntries.length === 0 && !listCollapsed" class="selector-empty">
        <p>{{ searchQuery.trim() ? t('library.noResults') : t('compare.noEstimatesAvailable') }}</p>
      </div>
      <ul v-else>
        <li
          v-for="entry in filteredEntries"
          :key="entry.path"
          :class="{ selected: isSelected(entry.path) }"
          v-tip="entry.title"
        >
          <input
            v-if="!listCollapsed"
            type="checkbox"
            class="row-check"
            :checked="isSelected(entry.path)"
            :aria-label="entry.title"
            @change="toggleSelect(entry.path, ($event.target as HTMLInputElement).checked)"
            @click.stop
          />
          <span class="mark" aria-hidden="true">
            <ModelIcon :icon="entry.icon" :name="entry.title" />
          </span>
          <template v-if="!listCollapsed">
            <span class="name">{{ entry.title }}</span>
            <span v-if="entry.clientLabel" class="badge">{{ entry.clientLabel }}</span>
            <span class="meta">{{ formatUpdated(entry.updatedAt) }}</span>
          </template>
        </li>
      </ul>
      <div v-if="!listCollapsed" class="list-resizer" draggable="false" @mousedown="startListResize" />
    </aside>

    <main>
      <div v-if="!hasComparableSelection" class="status empty">
        <p>{{ t('compare.selectAtLeastTwo') }}</p>
      </div>

      <template v-else>
        <div v-if="loading" class="status loading">
          <p>{{ t('compare.loadingComparison') }}</p>
        </div>
        <div v-else-if="error" class="status error">
          <p>{{ error }}</p>
        </div>
        <div v-else-if="estimates.length < 2" class="status empty">
          <p>{{ t('compare.selectAtLeastTwo') }}</p>
        </div>
        <template v-else>
          <div v-if="failedPaths.length > 0" class="warning">
            <p>{{ t('compare.partialLoadWarning') }}</p>
          </div>
          <EstimateCompareTable :estimates="estimates" :hideSubtasks="false" />
        </template>
      </template>
    </main>
  </div>
  </div>
</template>

<style scoped>
.compare {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 420px;
}

.compare > .rest {
  display: grid;
  grid-template-columns: var(--list-w, 200px) minmax(0, 1fr);
  gap: 1.25rem;
  flex: 1;
  transition: grid-template-columns 0.18s ease;
}

.compare.list-resizing {
  transition: none;
}

.compare.list-resizing > .rest {
  transition: none;
}

.compare.list-collapsed > .rest {
  grid-template-columns: var(--list-w, 56px) minmax(0, 1fr);
}

aside {
  position: relative;
  border-right: 1px solid var(--line);
  padding-right: 0.85rem;
  min-width: 0;
  overflow: hidden;
  height: 100%;
}

.compare.list-collapsed aside {
  padding-right: 0.35rem;
}

.list-resizer {
  position: absolute;
  top: 0;
  right: -5px;
  width: 10px;
  height: 100%;
  cursor: col-resize;
  z-index: 3;
  touch-action: none;
}

.list-resizer::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  border-radius: 1px;
  background: transparent;
  transition: background 0.12s ease;
}

.list-resizer:hover::after,
.list-resizing .list-resizer::after {
  background: color-mix(in srgb, var(--accent) 55%, var(--line));
}

.aside-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
}

.aside-head .search-wrap {
  flex: 1;
  min-width: 0;
  margin-bottom: 0.55rem;
}

.aside-head .toggle {
  margin-left: auto;
  flex-shrink: 0;
}

.list-collapsed .aside-head .search-wrap {
  display: none;
}

.sort-controls {
  display: flex;
  gap: 0.25rem;
  padding: 0 0.45rem 0.5rem;
  border-bottom: 1px solid var(--line);
  margin-bottom: 0.5rem;
}

.sort-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s ease;
}

.sort-btn:hover {
  background: var(--page-soft);
  color: var(--ink);
  border-color: var(--line);
}

.sort-btn.active {
  background: var(--accent-soft);
  color: var(--accent);
  border-color: var(--accent);
}

.sort-icon {
  font-size: 0.65rem;
  color: inherit;
}

.selection-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0 0.45rem;
  margin-bottom: 0.55rem;
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

.row-check {
  flex-shrink: 0;
  margin: 0;
}

.search {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink);
  font-size: 0.88rem;
}

.search:focus {
  outline: none;
  border-color: var(--line-strong);
}

.selector-loading,
.selector-empty {
  margin: 0.35rem 0.15rem 0;
  font-size: 0.8rem;
  color: var(--muted);
  text-align: center;
}

.search::placeholder {
  color: var(--muted-soft);
}

.toggle {
  width: 1.9rem;
  height: 1.9rem;
  padding: 0 !important;
  flex-shrink: 0;
  font-size: 0.85rem;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

ul li {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.45rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  min-width: 0;
  transition: background 0.12s ease;
}

ul li:hover {
  background: var(--page-soft);
}

ul li.selected {
  background: color-mix(in srgb, var(--accent) 12%, var(--surface));
}

ul li.selected:hover {
  background: color-mix(in srgb, var(--accent) 18%, var(--surface));
}

.mark {
  flex-shrink: 0;
}

.name {
  flex: 1;
  min-width: 0;
  font-weight: 550;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.92rem;
}

.badge {
  flex-shrink: 0;
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-sm);
  background: var(--page-soft);
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--muted);
  white-space: nowrap;
}

.meta {
  font-size: 0.75rem;
  color: var(--muted);
  white-space: nowrap;
}

/* Main content */
main {
  min-width: 0;
}

/* Right Panel - Comparison */
.status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  text-align: center;
}

.status p {
  margin: 0;
}

.status.loading p {
  color: var(--ink-soft);
}

.status.error p {
  color: var(--danger);
}

.status.empty p {
  color: var(--muted);
}

.warning {
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border: 1px solid var(--warn);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--warn) 10%, transparent);
  color: var(--warn);
  font-size: 0.88rem;
}

/* Responsive */
@media (max-width: 900px) {
  .compare > .rest {
    grid-template-columns: var(--list-w, 200px) minmax(0, 1fr);
  }

  .compare.list-collapsed > .rest {
    grid-template-columns: var(--list-w, 56px) minmax(0, 1fr);
  }
}
</style>
