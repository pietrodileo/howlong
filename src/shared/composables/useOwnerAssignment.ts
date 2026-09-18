import { computed, ref, watch } from 'vue';
import { useUiStore } from '../../app/ui';
import { mergeOwners, normalizeOwners } from '../../domain/owners';
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
    ...estimate.estimate.items.flatMap((item) => item.owners ?? []),
  ]));

  watch(() => [settings.settings.workspaceDir, settings.appDataDir], () => {
    void library.loadOwners().catch((error) => ui.notify(String(error), true));
  }, { immediate: true });

  /** Persist reusable names before assigning and discard late edits after a tab or workspace switch. */
  async function onOwnerChange(item: LineItem, value: string | string[]) {
    if (isSavingOwner.value) return;
    const owners = normalizeOwners(Array.isArray(value) ? value : [value]);
    if (!settings.settings.allowMultipleOwners && owners.length > 1) {
      const currentOwners = normalizeOwners(item.owners ?? []);
      const currentOwnerIds = new Set(currentOwners.map((owner) => owner.toLowerCase()));
      const isReduction = owners.length < currentOwners.length
        && owners.every((owner) => currentOwnerIds.has(owner.toLowerCase()));
      if (!isReduction) return;
    }
    const sessionId = docs.activeId;
    const workspaceDir = settings.settings.workspaceDir;
    isSavingOwner.value = true;
    try {
      await Promise.all(owners.map((owner) => library.rememberOwner(owner)));
      if (docs.activeId !== sessionId || settings.settings.workspaceDir !== workspaceDir) return;
      if (JSON.stringify(item.owners ?? []) !== JSON.stringify(owners)) {
        mutate(() => estimate.updateItem(item.id, { owners }));
      }
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
      const matchingItems = estimate.estimate.items.filter((item) =>
        (item.owners ?? []).some((owner) => owner.trim().toLowerCase() === normalizedName),
      );
      if (matchingItems.length > 0) {
        mutate(() => matchingItems.forEach((item) => estimate.updateItem(item.id, {
          owners: (item.owners ?? []).filter((owner) => owner.trim().toLowerCase() !== normalizedName),
        })));
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
