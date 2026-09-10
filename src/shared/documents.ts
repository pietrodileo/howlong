import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Estimate } from '../models/estimate';
import type { Model } from '../models/model';
import { createEmptyEstimate, createEstimateFromModel } from '../domain/factory';
import { newId } from './ids';
import { addRecentOpenPath } from '../platform/recentOpen';
import { useSettingsStore } from '../features/settings/settings';
import {
  createEstimateHistory,
  cloneEstimateSnapshot,
  isEstimateHistoryDirty,
  markEstimateHistorySaved,
  recordEstimate,
  redoEstimate,
  undoEstimate,
  type EstimateHistory,
} from '../domain/estimateHistory';

export type SessionId = string;

export interface DocumentSession {
  sessionId: SessionId;
  estimate: Estimate;
  filePath: string | null;
  dirty: boolean;
  displayTitle: string;
  collapsedMacros: Set<string>;
  history: EstimateHistory;
}

/** Own open-document snapshots, per-tab history, dirty state, and activation. */
export const useDocumentsStore = defineStore('documents', () => {
  const settingsStore = useSettingsStore();
  
  // List of open documents
  const sessions = ref<DocumentSession[]>([]);
  
  // Active session ID
  const activeId = ref<SessionId | null>(null);

  // Computed properties
  const activeSession = computed(() => {
    if (!activeId.value) return null;
    return sessions.value.find(s => s.sessionId === activeId.value) ?? null;
  });

  const hasSessions = computed(() => sessions.value.length > 0);

  /** Add and activate a clean session while preserving its caller-selected title. */
  function createSession(
    estimate: Estimate,
    filePath: string | null,
    displayTitle: string,
  ): SessionId {
    const sessionId = newId('session');
    sessions.value = [...sessions.value, {
      sessionId,
      estimate,
      filePath,
      dirty: false,
      displayTitle,
      collapsedMacros: new Set(),
      history: createEstimateHistory(estimate),
    }];
    activate(sessionId);
    return sessionId;
  }

  // Find session by filePath (for opening existing files)
  function findSessionByPath(filePath: string | null): DocumentSession | null {
    if (!filePath) return null;
    return sessions.value.find(s => s.filePath === filePath) ?? null;
  }

  // Create a new empty estimate
  function createEmpty(): SessionId {
    const estimate = createEmptyEstimate(settingsStore.settings);
    return createSession(estimate, null, 'Untitled');
  }

  // Create a new estimate from a model
  function createFromModel(model: Model): SessionId {
    const estimate = createEstimateFromModel(model, settingsStore.settings);
    return createSession(estimate, null, model.name);
  }

  // Open an estimate from a file
  async function openFromFile(estimateData: Estimate, filePath: string | null): Promise<SessionId> {
    if (filePath) addRecentOpenPath(filePath);

    // Check if this file is already open
    const existingSession = findSessionByPath(filePath);
    if (existingSession) {
      // Activate existing session instead
      activate(existingSession.sessionId);
      return existingSession.sessionId;
    }
    
    return createSession(estimateData, filePath, estimateData.meta.title || 'Untitled');
  }

  // Activate a session
  function activate(sessionId: SessionId): void {
    activeId.value = sessionId;
  }

  function reorderSessions(dragId: SessionId, targetId: SessionId, before = true): void {
    if (dragId === targetId) return;
    const from = sessions.value.findIndex((session) => session.sessionId === dragId);
    if (from < 0 || sessions.value.findIndex((session) => session.sessionId === targetId) < 0) return;

    const next = [...sessions.value];
    const [moved] = next.splice(from, 1);
    const targetIndex = next.findIndex((session) => session.sessionId === targetId);
    next.splice(targetIndex + (before ? 0 : 1), 0, moved);
    sessions.value = next;
  }

  // Update a session's estimate
  function updateSessionEstimate(sessionId: SessionId, estimate: Estimate): void {
    const index = sessions.value.findIndex(s => s.sessionId === sessionId);
    if (index !== -1) {
      const session = sessions.value[index];
      recordEstimate(session.history, estimate);
      sessions.value[index] = {
        ...session,
        estimate: cloneEstimateSnapshot(estimate),
        dirty: isEstimateHistoryDirty(session.history),
        displayTitle: estimate.meta.title || 'Untitled',
      };
    }
  }

  function replaceSessionEstimate(sessionId: SessionId, estimate: Estimate, filePath: string | null): void {
    const index = sessions.value.findIndex(s => s.sessionId === sessionId);
    if (index === -1) return;
    sessions.value[index] = {
      ...sessions.value[index],
      estimate: cloneEstimateSnapshot(estimate),
      filePath,
      dirty: false,
      displayTitle: estimate.meta.title || 'Untitled',
      history: createEstimateHistory(estimate),
    };
  }

  /** Restore one history revision and keep the returned snapshot isolated from the store. */
  function restoreHistory(
    sessionId: SessionId,
    restore: (history: EstimateHistory) => Estimate | null,
  ): Estimate | null {
    const index = sessions.value.findIndex(s => s.sessionId === sessionId);
    if (index === -1) return null;
    const session = sessions.value[index];
    const restored = restore(session.history);
    if (!restored) return null;
    sessions.value[index] = {
      ...session,
      estimate: restored,
      dirty: isEstimateHistoryDirty(session.history),
      displayTitle: restored.meta.title || 'Untitled',
    };
    return cloneEstimateSnapshot(restored);
  }

  function undo(sessionId: SessionId): Estimate | null {
    return restoreHistory(sessionId, undoEstimate);
  }

  function redo(sessionId: SessionId): Estimate | null {
    return restoreHistory(sessionId, redoEstimate);
  }

  // Mark a session as saved
  function markSaved(sessionId: SessionId, filePath: string): void {
    const index = sessions.value.findIndex(s => s.sessionId === sessionId);
    if (index !== -1) {
      markEstimateHistorySaved(sessions.value[index].history);
      sessions.value[index] = {
        ...sessions.value[index],
        filePath,
        dirty: false,
      };
    }
  }

  // Mark a session as dirty
  function markDirty(sessionId: SessionId): void {
    const index = sessions.value.findIndex(s => s.sessionId === sessionId);
    if (index !== -1) {
      sessions.value[index] = {
        ...sessions.value[index],
        dirty: true,
      };
    }
  }

  // Close a session
  function closeSession(sessionId: SessionId): void {
    const index = sessions.value.findIndex(s => s.sessionId === sessionId);
    if (index !== -1) {
      sessions.value.splice(index, 1);
      
      // If we closed the active session, activate the next one or previous one
      if (activeId.value === sessionId) {
        if (sessions.value.length > 0) {
          // Activate the next session or the last one
          const nextIndex = Math.min(index, sessions.value.length - 1);
          activate(sessions.value[nextIndex].sessionId);
        } else {
          activeId.value = null;
        }
      }
    }
  }

  /** Drop all workspace sessions and history after unsaved changes have been handled. */
  function closeAll(): void {
    activeId.value = null;
    sessions.value = [];
  }

  // Close the active session
  function closeActive(): void {
    if (activeId.value) {
      closeSession(activeId.value);
    }
  }

  return {
    // State
    sessions,
    activeId,
    
    // Computed
    activeSession,
    hasSessions,
    
    // Methods
    createEmpty,
    createFromModel,
    openFromFile,
    activate,
    reorderSessions,
    updateSessionEstimate,
    replaceSessionEstimate,
    undo,
    redo,
    markSaved,
    markDirty,
    closeSession,
    closeActive,
    closeAll,
    findSessionByPath,
  };
});
