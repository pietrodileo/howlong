import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Estimate, LineItem } from '../models/estimate';
import { useLibraryStore } from './library';

export const useCompareStore = defineStore('compare', () => {
  const library = useLibraryStore();

  const estimatePaths = ref<string[]>([]);
  const estimates = ref<Estimate[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const failedPaths = ref<string[]>([]);

  const selectedCount = computed(() => estimatePaths.value.length);

  const hasSelection = computed(() => selectedCount.value > 0);
  const hasComparableSelection = computed(() => selectedCount.value >= 2);

  function setEstimatePaths(paths: string[]): void {
    estimatePaths.value = [...new Set(paths)];
    estimates.value = [];
    error.value = null;
    failedPaths.value = [];
  }

  function selectPath(path: string): void {
    const next = new Set(estimatePaths.value);
    next.add(path);
    setEstimatePaths([...next]);
  }

  function unselectPath(path: string): void {
    estimatePaths.value = estimatePaths.value.filter((p) => p !== path);
    if (estimatePaths.value.length === 0) {
      estimates.value = [];
      error.value = null;
      failedPaths.value = [];
    }
  }

  function togglePath(path: string): void {
    if (estimatePaths.value.includes(path)) {
      unselectPath(path);
    } else {
      selectPath(path);
    }
  }

  function replaceSelection(paths: string[]): void {
    setEstimatePaths(paths);
  }

  function clearSelection(): void {
    setEstimatePaths([]);
  }

  async function reloadSelected(): Promise<void> {
    if (estimatePaths.value.length === 0) {
      estimates.value = [];
      return;
    }
    await loadEstimates(estimatePaths.value);
  }

  async function loadEstimates(paths: string[]): Promise<void> {
    if (paths.length === 0) {
      estimates.value = [];
      return;
    }

    loading.value = true;
    error.value = null;
    estimates.value = [];
    failedPaths.value = [];

    try {
      const loadedEstimates: Estimate[] = [];
      for (const path of paths) {
        const result = await library.loadEstimate(path);
        if (result.ok) {
          loadedEstimates.push(result.data);
        } else {
          console.warn(`Failed to load estimate at ${path}: ${result.error}`);
          failedPaths.value.push(path);
        }
      }
      estimates.value = loadedEstimates;
    } catch (e) {
      error.value = `Failed to load estimates: ${e}`;
    } finally {
      loading.value = false;
    }
  }



  function getFilteredItems(estimate: Estimate, hideSubtasks: boolean = true): LineItem[] {
    if (!hideSubtasks) return estimate.items;
    return estimate.items.filter((item) => item.parentId == null);
  }

  function getAllCategories(hideSubtasks: boolean = true): string[] {
    const categories = new Set<string>();
    for (const est of estimates.value) {
      const items = getFilteredItems(est, hideSubtasks);
      for (const item of items) {
        if (item.category) categories.add(item.category);
      }
    }
    return [...categories].sort();
  }

  function getAllItemNames(hideSubtasks: boolean = true): string[] {
    const names = new Set<string>();
    for (const est of estimates.value) {
      const items = getFilteredItems(est, hideSubtasks);
      for (const item of items) {
        names.add(item.name);
      }
    }
    return [...names].sort();
  }

  function clear(): void {
    estimatePaths.value = [];
    estimates.value = [];
    error.value = null;
  }

  return {
    estimatePaths,
    estimates,
    loading,
    error,
    failedPaths,
    selectedCount,
    hasSelection,
    hasComparableSelection,
    setEstimatePaths,
    loadEstimates,
    getFilteredItems,
    getAllCategories,
    getAllItemNames,
    clear,
    selectPath,
    unselectPath,
    togglePath,
    replaceSelection,
    clearSelection,
    reloadSelected,
  };
});
