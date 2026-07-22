import { ref } from 'vue';
import { canReorderRows, type HierarchicalItem } from './reorderHierarchical';

/**
 * HTML5 drag-and-drop helpers for hierarchical table rows.
 * Drop is valid only macro↔macro or sub↔sub (same parent).
 */
export function useRowDragReorder(options: {
  getItems: () => HierarchicalItem[];
  onReorder: (dragId: string, targetId: string) => void;
}) {
  const draggingId = ref<string | null>(null);
  const overId = ref<string | null>(null);

  function onDragStart(id: string, e: DragEvent) {
    draggingId.value = id;
    overId.value = null;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
    }
  }

  function onDragEnd() {
    draggingId.value = null;
    overId.value = null;
  }

  function onDragOver(targetId: string, e: DragEvent) {
    const dragId = draggingId.value;
    if (!dragId || dragId === targetId) return;
    if (!canReorderRows(options.getItems(), dragId, targetId)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    overId.value = targetId;
  }

  function onDragLeave(targetId: string) {
    if (overId.value === targetId) overId.value = null;
  }

  function onDrop(targetId: string, e: DragEvent) {
    e.preventDefault();
    const dragId =
      draggingId.value ?? e.dataTransfer?.getData('text/plain') ?? null;
    overId.value = null;
    draggingId.value = null;
    if (!dragId || dragId === targetId) return;
    if (!canReorderRows(options.getItems(), dragId, targetId)) return;
    options.onReorder(dragId, targetId);
  }

  function rowClass(id: string): Record<string, boolean> {
    return {
      'row-dragging': draggingId.value === id,
      'row-drag-over': overId.value === id && draggingId.value !== id,
    };
  }

  return {
    draggingId,
    overId,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
    rowClass,
  };
}
