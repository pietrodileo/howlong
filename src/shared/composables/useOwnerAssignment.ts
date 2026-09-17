import { computed, ref, watch } from 'vue';
import { useUiStore } from '../../app/ui';
import { mergeOwners, normalizeOwner } from '../../domain/owners';
import type { LineItem } from '../../models/estimate';
import { useLibraryStore } from '../../features/library/library';
import { useSettingsStore } from '../../features/settings/settings';
import { useDocumentsStore } from '../documents';
import { useEstimateStore } from '../../features/estimate/estimate';

type OwnerMutation = (action: () => void) => void;

/** Coordinate shared owner options, persistence, deletion, and guarded line-item mutations across editable views. */
export function useOwnerAssignment(mutate: OwnerMutation) {
  const docs = useDocumentsStore();
  const estimate = useEstimateStore();
  const settings = useSettingsStore();
  const library = useLibraryStore();
  const ui = useUiStore();
  const isSavingOwner = ref(false);
  const pendingOwnerDelete = ref<{ name: string; sessionId: string | null } | null>(null);
  const ownerOptions = computed(() => mergeOwners([
    ...library.ownerOptions,
    ...estimate.estimate.items.map((item) => item.owner ?? ''),
  ]));

  watch(() => [settings.settings.workspaceDir, settings.appDataDir], () => {
    void library.loadOwners().catch((error) => ui.notify(String(error), true));
  }, { immediate: true });

  /** Persist reusable names before assigning and discard late edits after a tab or workspace switch. */
  async function onOwnerChange(item: LineItem, name: string) {
    if (isSavingOwner.value) return;
    const sessionId = docs.activeId;
    const workspaceDir = settings.settings.workspaceDir;
    isSavingOwner.value = true;
    try {
      if (item.owner) await library.rememberOwner(item.owner);
      const owner = normalizeOwner(name) ? await library.rememberOwner(name) : '';
      if (docs.activeId !== sessionId || settings.settings.workspaceDir !== workspaceDir) return;
      if (item.owner !== owner) mutate(() => estimate.updateItem(item.id, { owner }));
    } catch (error) {
      ui.notify(error instanceof Error ? error.message : String(error), true);
    } finally {
      isSavingOwner.value = false;
    }
  }

  /** Ask before deleting an owner and clearing its assignments from the active estimate. */
  function onOwnerDelete(name: string) {
    pendingOwnerDelete.value = { name, sessionId: docs.activeId };
  }

  /** Confirm owner deletion, clear matching assignments once, and persist the shared option change. */
  async function confirmOwnerDelete() {
    const request = pendingOwnerDelete.value;
    pendingOwnerDelete.value = null;
    if (!request || request.sessionId !== docs.activeId) return;
    const normalizedName = request.name.trim().toLowerCase();
    try {
      await library.forgetOwner(request.name);
      if (request.sessionId !== docs.activeId) return;
      const matchingItems = estimate.estimate.items.filter((item) => item.owner?.trim().toLowerCase() === normalizedName);
      if (matchingItems.length > 0) {
        mutate(() => matchingItems.forEach((item) => estimate.updateItem(item.id, { owner: '' })));
      }
    } catch (error) {
      ui.notify(error instanceof Error ? error.message : String(error), true);
    }
  }

  return {
    isSavingOwner,
    ownerOptions,
    pendingOwnerDelete,
    onOwnerChange,
    onOwnerDelete,
    confirmOwnerDelete,
  };
}
