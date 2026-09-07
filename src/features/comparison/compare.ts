import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Estimate } from '../../models/estimate';
import { useLibraryStore } from '../library/library';

/** Own selected comparison files and their loaded estimates. */
export const useCompareStore = defineStore('compare', () => {
  const library = useLibraryStore();

  const estimatePaths = ref<string[]>([]);
  const estimates = ref<Estimate[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const failedPaths = ref<string[]>([]);

  const selectedCount = computed(() => estimatePaths.value.length);

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

  function replaceSelection(paths: string[]): void {
    setEstimatePaths(paths);
  }

  function clearSelection(): void {
    setEstimatePaths([]);
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

  return {
    estimatePaths,
    estimates,
    loading,
    error,
    failedPaths,
    selectedCount,
    hasComparableSelection,
    setEstimatePaths,
    loadEstimates,
    selectPath,
    unselectPath,
    replaceSelection,
    clearSelection,
  };
});
