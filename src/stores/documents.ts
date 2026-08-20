import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Estimate } from '../models/estimate';
import type { Model } from '../models/model';
import { createEmptyEstimate, createEstimateFromModel } from '../lib/factory';
import { newId } from '../lib/ids';
import { useSettingsStore } from './settings';

export type SessionId = string;

export interface DocumentSession {
  sessionId: SessionId;
  estimate: Estimate;
  filePath: string | null;
  dirty: boolean;
  displayTitle: string;
  collapsedMacros: Set<string>;
}

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
  const hasUnsaved = computed(() => sessions.value.some(s => s.dirty));
  
  const sessionsCount = computed(() => sessions.value.length);

  // Check if a specific session has unsaved changes
  function hasUnsavedChanges(sessionId: SessionId): boolean {
    const session = sessions.value.find(s => s.sessionId === sessionId);
    return session?.dirty ?? false;
  }

  // Find session by filePath (for opening existing files)
  function findSessionByPath(filePath: string | null): DocumentSession | null {
    if (!filePath) return null;
    return sessions.value.find(s => s.filePath === filePath) ?? null;
  }

  // Create a new empty estimate
  function createEmpty(): SessionId {
    const sessionId = newId('session');
    const estimate = createEmptyEstimate(settingsStore.settings);
    
    const newSession: DocumentSession = {
      sessionId,
      estimate,
      filePath: null,
      dirty: false,
      displayTitle: 'Untitled',
      collapsedMacros: new Set(),
    };
    
    sessions.value = [...sessions.value, newSession];
    activate(sessionId);
    return sessionId;
  }

  // Create a new estimate from a model
  function createFromModel(model: Model): SessionId {
    const sessionId = newId('session');
    const estimate = createEstimateFromModel(model, settingsStore.settings);
    
    const newSession: DocumentSession = {
      sessionId,
      estimate,
      filePath: null,
      dirty: false,
      displayTitle: model.name,
      collapsedMacros: new Set(),
    };
    
    sessions.value = [...sessions.value, newSession];
    activate(sessionId);
    return sessionId;
  }

  // Open an estimate from a file
  async function openFromFile(estimateData: Estimate, filePath: string | null): Promise<SessionId> {
    const sessionId = newId('session');
    
    const newSession: DocumentSession = {
      sessionId,
      estimate: estimateData,
      filePath,
      dirty: false,
      displayTitle: estimateData.meta.title || 'Untitled',
      collapsedMacros: new Set(),
    };
    
    // Check if this file is already open
    const existingSession = findSessionByPath(filePath);
    if (existingSession) {
      // Activate existing session instead
      activate(existingSession.sessionId);
      return existingSession.sessionId;
    }
    
    sessions.value = [...sessions.value, newSession];
    activate(sessionId);
    return sessionId;
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

  // Mark a session as active
  function markActive(sessionId: SessionId): void {
    activeId.value = sessionId;
  }

  // Update a session's estimate
  function updateSessionEstimate(sessionId: SessionId, estimate: Estimate): void {
    const index = sessions.value.findIndex(s => s.sessionId === sessionId);
    if (index !== -1) {
      sessions.value[index] = {
        ...sessions.value[index],
        estimate,
        dirty: true,
        displayTitle: estimate.meta.title || 'Untitled',
      };
    }
  }

  // Update a session's metadata
  function updateSessionMeta(sessionId: SessionId, metaUpdates: Partial<Estimate['meta']>): void {
    const index = sessions.value.findIndex(s => s.sessionId === sessionId);
    if (index !== -1) {
      sessions.value[index] = {
        ...sessions.value[index],
        estimate: {
          ...sessions.value[index].estimate,
          meta: {
            ...sessions.value[index].estimate.meta,
            ...metaUpdates,
          },
        },
        dirty: true,
        displayTitle: metaUpdates.title || sessions.value[index].displayTitle,
      };
    }
  }

  // Mark a session as saved
  function markSaved(sessionId: SessionId, filePath: string): void {
    const index = sessions.value.findIndex(s => s.sessionId === sessionId);
    if (index !== -1) {
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

  // Close the active session
  function closeActive(): void {
    if (activeId.value) {
      closeSession(activeId.value);
    }
  }

  // Close all sessions
  function closeAll(): void {
    sessions.value = [];
    activeId.value = null;
  }

  // Toggle macro collapse for a session
  function toggleSessionMacro(sessionId: SessionId, macroId: string): void {
    const index = sessions.value.findIndex(s => s.sessionId === sessionId);
    if (index !== -1) {
      const collapsed = new Set(sessions.value[index].collapsedMacros);
      if (collapsed.has(macroId)) {
        collapsed.delete(macroId);
      } else {
        collapsed.add(macroId);
      }
      sessions.value[index] = {
        ...sessions.value[index],
        collapsedMacros: collapsed,
      };
    }
  }

  // Check if macro is collapsed in a session
  function isMacroCollapsed(sessionId: SessionId, macroId: string): boolean {
    const session = sessions.value.find(s => s.sessionId === sessionId);
    return session?.collapsedMacros.has(macroId) ?? false;
  }

  return {
    // State
    sessions,
    activeId,
    
    // Computed
    activeSession,
    hasSessions,
    hasUnsaved,
    sessionsCount,
    
    // Methods
    createEmpty,
    createFromModel,
    openFromFile,
    activate,
    reorderSessions,
    markActive,
    updateSessionEstimate,
    updateSessionMeta,
    markSaved,
    markDirty,
    closeSession,
    closeActive,
    closeAll,
    hasUnsavedChanges,
    findSessionByPath,
    toggleSessionMacro,
    isMacroCollapsed,
  };
});