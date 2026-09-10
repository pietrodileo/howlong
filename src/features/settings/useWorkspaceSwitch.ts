import { ref } from 'vue';
import { useSettingsStore } from './settings';
import { useLibraryStore } from '../library/library';
import { useModelsStore } from '../models/models';
import { useDocumentsStore } from '../../shared/documents';
import { ensureWorkspaceLayout } from './workspacePaths';
import { SettingsSchema } from '../../models/settings';

/** Coordinates workspace changes; documents remain open until loading and persistence succeed. */
export function useWorkspaceSwitch() {
  const settingsStore = useSettingsStore();
  const libraryStore = useLibraryStore();
  const modelsStore = useModelsStore();
  const documentsStore = useDocumentsStore();
  const isSwitching = ref(false);

  /** Save in the old workspace, load the destination, then close tabs; roll back on failure. */
  async function switchWorkspace(workspaceDir: string, saveChanges: boolean): Promise<void> {
    if (isSwitching.value) return;
    isSwitching.value = true;
    const previous = { ...settingsStore.settings, recentWorkspaceDirs: [...settingsStore.settings.recentWorkspaceDirs] };
    let changed = false;
    try {
      if (saveChanges) {
        for (const session of [...documentsStore.sessions]) {
          if (!session.dirty) continue;
          const saved = await libraryStore.saveEstimate(session.estimate);
          documentsStore.updateSessionEstimate(session.sessionId, saved.data);
          documentsStore.markSaved(session.sessionId, saved.path);
        }
      }
      if (workspaceDir) await ensureWorkspaceLayout(workspaceDir);
      settingsStore.settings.workspaceDir = workspaceDir;
      settingsStore.settings.estimatesDir = '';
      changed = true;
      await libraryStore.loadAll();
      if (libraryStore.lastError) throw new Error(libraryStore.lastError);
      await modelsStore.loadAll();
      if (modelsStore.lastError) throw new Error(modelsStore.lastError);
      settingsStore.settings.recentWorkspaceDirs = SettingsSchema.shape.recentWorkspaceDirs.parse([
        workspaceDir, previous.workspaceDir, ...previous.recentWorkspaceDirs,
      ]);
      await settingsStore.save();
      documentsStore.closeAll();
    } catch (error) {
      if (changed) {
        settingsStore.settings = previous;
        // Keep the original failure visible even if restoring a disconnected folder also fails.
        await Promise.allSettled([libraryStore.loadAll(), modelsStore.loadAll(), settingsStore.save()]);
      }
      throw error;
    } finally {
      isSwitching.value = false;
    }
  }

  return { isSwitching, switchWorkspace };
}
