import { ref } from 'vue';
import { canReorderRows, type HierarchicalItem } from './reorderHierarchical';

/**
 * Drag threshold in pixels to distinguish between click and drag.
 */
const DRAG_THRESHOLD = 5;

/**
 * Pointer-based + HTML5 drag-and-drop helpers for hierarchical table rows.
 * Drop is valid only macro↔macro or sub↔sub (same parent).
 * Uses pointer events as the primary mechanism (works in Tauri/WebView2).
 * Falls back to HTML5 drag-and-drop for compatibility.
 */
export function useRowDragReorder(options: {
  getItems: () => HierarchicalItem[];
  onReorder: (dragId: string, targetId: string) => void;
}) {
  const draggingId = ref<string | null>(null);
  const overId = ref<string | null>(null);

  // Pointer-based drag state
  const pointerDragId = ref<string | null>(null);
  const pointerStartX = ref<number>(0);
  const pointerStartY = ref<number>(0);
  const pointerDragActive = ref<boolean>(false);

  function getRowAtPoint(clientX: number, clientY: number): string | null {
    const element = document.elementFromPoint(clientX, clientY);
    if (!element) return null;
    const rowEl = (element as HTMLElement).closest ? (element as HTMLElement).closest('[data-row-id]') : null;
    if (rowEl && rowEl instanceof HTMLElement) {
      return rowEl.dataset.rowId || null;
    }
    return null;
  }

  function onPointerDown(id: string, e: PointerEvent) {
    // Only handle primary button (left mouse or touch contact)
    if (e.button !== 0 && e.button !== -1) return;
    
    // Prevent text selection and default browser behavior
    e.preventDefault();
    e.stopPropagation();
    
    // Store start position
    pointerDragId.value = id;
    pointerStartX.value = e.clientX;
    pointerStartY.value = e.clientY;
    pointerDragActive.value = false;

    // Capture pointer for continuous tracking
    const target = e.target as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      // Only process if this is the active drag
      if (pointerDragId.value !== id) {
        cleanupPointerDrag();
        target.releasePointerCapture(moveEvent.pointerId);
        return;
      }
      
      // Check if we've crossed the drag threshold
      const dx = Math.abs(moveEvent.clientX - pointerStartX.value);
      const dy = Math.abs(moveEvent.clientY - pointerStartY.value);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance >= DRAG_THRESHOLD && !pointerDragActive.value) {
        pointerDragActive.value = true;
        draggingId.value = id;
        overId.value = null;
      }

      // Update over state if dragging is active
      if (pointerDragActive.value) {
        const targetRowId = getRowAtPoint(moveEvent.clientX, moveEvent.clientY);
        if (targetRowId && targetRowId !== id) {
          const items = options.getItems();
          if (canReorderRows(items, id, targetRowId)) {
            overId.value = targetRowId;
          } else {
            overId.value = null;
          }
        } else {
          overId.value = null;
        }
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      if (pointerDragId.value !== id) {
        cleanupPointerDrag();
        target.releasePointerCapture(upEvent.pointerId);
        return;
      }
      
      const targetRowId = getRowAtPoint(upEvent.clientX, upEvent.clientY);
      
      // Only trigger reorder if we were actively dragging
      if (pointerDragActive.value && targetRowId && targetRowId !== id) {
        const items = options.getItems();
        if (canReorderRows(items, id, targetRowId)) {
          options.onReorder(id, targetRowId);
        }
      }
      
      // Clean up
      cleanupPointerDrag();
      target.releasePointerCapture(upEvent.pointerId);
    };

    const handlePointerCancel = (cancelEvent: PointerEvent) => {
      if (pointerDragId.value !== id) {
        cleanupPointerDrag();
        target.releasePointerCapture(cancelEvent.pointerId);
        return;
      }
      cleanupPointerDrag();
      target.releasePointerCapture(cancelEvent.pointerId);
    };

    // Use passive: false to allow preventDefault
    target.addEventListener('pointermove', handlePointerMove, { passive: false });
    target.addEventListener('pointerup', handlePointerUp, { passive: false });
    target.addEventListener('pointercancel', handlePointerCancel, { passive: false });

    // Cleanup function to remove listeners
    const cleanupListeners = () => {
      target.removeEventListener('pointermove', handlePointerMove);
      target.removeEventListener('pointerup', handlePointerUp);
      target.removeEventListener('pointercancel', handlePointerCancel);
      if (pointerDragId.value === id) {
        cleanupPointerDrag();
      }
    };

    // Auto-cleanup as a safety measure
    setTimeout(() => {
      cleanupListeners();
    }, 10000);
  }

  function cleanupPointerDrag() {
    pointerDragId.value = null;
    pointerDragActive.value = false;
    draggingId.value = null;
    overId.value = null;
  }

  // HTML5 drag-and-drop handlers (fallback)
  function onDragStart(id: string, e: DragEvent) {
    if (pointerDragActive.value) {
      // Pointer drag is already active, prevent HTML5 drag
      e.preventDefault();
      return;
    }
    draggingId.value = id;
    overId.value = null;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
    }
  }

  function onDragEnd() {
    if (!pointerDragActive.value) {
      draggingId.value = null;
      overId.value = null;
    }
  }

  function onDragOver(targetId: string, e: DragEvent) {
    if (pointerDragActive.value) {
      // Pointer drag is active, prevent HTML5 drag
      e.preventDefault();
      return;
    }
    const dragId = draggingId.value;
    if (!dragId || dragId === targetId) return;
    if (!canReorderRows(options.getItems(), dragId, targetId)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    overId.value = targetId;
  }

  function onDragLeave(targetId: string) {
    if (pointerDragActive.value) return;
    if (overId.value === targetId) overId.value = null;
  }

  function onDrop(targetId: string, e: DragEvent) {
    if (pointerDragActive.value) {
      // Pointer drag is active, prevent HTML5 drop
      e.preventDefault();
      return;
    }
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
    // Pointer-based handlers
    onPointerDown,
    // HTML5 drag-and-drop handlers (fallback)
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
    rowClass,
  };
}
