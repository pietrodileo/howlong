export type DocumentShortcutAction =
  | 'save'
  | 'new-tab'
  | 'close'
  | 'toggle-view'
  | 'undo'
  | 'redo'
  | 'previous'
  | 'next';

/** Resolves document-level shortcuts shared by estimate-backed views. */
export function resolveDocumentShortcut(event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>): DocumentShortcutAction | null {
  if ((!event.ctrlKey && !event.metaKey) || event.altKey) return null;
  const key = event.key.toLowerCase();
  if (key === 'z' && event.metaKey && event.shiftKey) return 'redo';
  if (event.shiftKey) return null;
  if (key === 'z') return 'undo';
  if (key === 'y' && event.ctrlKey) return 'redo';
  if (key === 's') return 'save';
  if (key === 't') return 'new-tab';
  if (key === 'w') return 'close';
  if (key === 'e') return 'toggle-view';
  if (event.key === 'ArrowLeft') return 'previous';
  if (event.key === 'ArrowRight') return 'next';
  return null;
}
