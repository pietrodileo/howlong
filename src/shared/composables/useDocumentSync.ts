import { watch } from 'vue';
import type { Estimate } from '../../models/estimate';
import { useDocumentsStore } from '../documents';
import { useEstimateStore } from '../../features/estimate/estimate';

/** Coordinate the editor and active tab; retain each view's existing recording cadence. */
export function useDocumentSync(view: 'working' | 'gantt') {
  const docs = useDocumentsStore();
  const estimate = useEstimateStore();

  /** Load the active tab, including Working's per-tab collapsed rows. */
  function restoreActive() {
    const session = docs.activeSession;
    if (!session) return;
    estimate.restoreEstimate(session.estimate, session.filePath, session.dirty);
    if (view === 'working') estimate.collapsedMacros = new Set(session.collapsedMacros);
  }

  /** Record Working's batched edits and copy its saved state and collapsed rows. */
  function syncWorking() {
    const session = docs.activeSession;
    if (!session) return;
    docs.updateSessionEstimate(session.sessionId, estimate.estimate);
    if (estimate.dirty) docs.markDirty(session.sessionId);
    else if (estimate.filePath) docs.markSaved(session.sessionId, estimate.filePath);
    docs.sessions = docs.sessions.map(s => s.sessionId === session.sessionId
      ? { ...s, collapsedMacros: new Set(estimate.collapsedMacros) }
      : s);
  }

  /** Record each Gantt action immediately as a single history entry. */
  function mutate(action: () => void) {
    action();
    const session = docs.activeSession;
    if (session) docs.updateSessionEstimate(session.sessionId, estimate.estimate);
  }

  /** Apply persisted audit metadata and mark the editor and active tab saved. */
  function applySaved(path: string, data: Estimate) {
    estimate.estimate.meta.updatedAt = data.meta.updatedAt;
    estimate.estimate.auditHistory = data.auditHistory;
    estimate.markSaved(path);
    // Working's watcher records this update on the next Vue tick, as before.
    const session = docs.activeSession;
    if (view === 'gantt' && session) {
      docs.updateSessionEstimate(session.sessionId, estimate.estimate);
      docs.markSaved(session.sessionId, path);
    }
  }

  /** Apply undo or redo to the active tab and restore the editor's saved state. */
  function restoreHistory(action: 'undo' | 'redo') {
    const session = docs.activeSession;
    if (!session) return;
    const restored = docs[action](session.sessionId);
    const current = docs.activeSession;
    if (restored && current) estimate.restoreEstimate(restored, current.filePath, current.dirty);
  }

  /** Replace reloaded content and reset the active tab's history. */
  function replaceFromFile(data: Estimate, path: string) {
    estimate.setEstimate(data, path);
    const session = docs.activeSession;
    if (session) docs.replaceSessionEstimate(session.sessionId, data, path);
  }

  // Setup-scoped watchers stop automatically when the owning view unmounts.
  watch(() => docs.activeId, restoreActive, { immediate: true });
  if (view === 'working') {
    watch(() => [estimate.estimate, estimate.dirty, estimate.filePath], syncWorking, { deep: true });
  }

  return { restoreActive, mutate, applySaved, restoreHistory, replaceFromFile };
}
