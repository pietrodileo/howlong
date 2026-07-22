/** Items with optional parent for macro/sub hierarchy. */
export type HierarchicalItem = { id: string; parentId?: string | null };

function isTopLevel(item: HierarchicalItem): boolean {
  return item.parentId == null;
}

export function canReorderRows(
  items: HierarchicalItem[],
  dragId: string,
  targetId: string,
): boolean {
  if (dragId === targetId) return false;
  const drag = items.find((i) => i.id === dragId);
  const target = items.find((i) => i.id === targetId);
  if (!drag || !target) return false;
  if (isTopLevel(drag) && isTopLevel(target)) return true;
  if (
    !isTopLevel(drag) &&
    !isTopLevel(target) &&
    drag.parentId === target.parentId
  ) {
    return true;
  }
  return false;
}

/**
 * Reorder macros among macros (whole block + children), or subs among siblings
 * of the same parent. Returns a new array, or null if the move is invalid.
 */
export function reorderHierarchical<T extends HierarchicalItem>(
  items: T[],
  dragId: string,
  targetId: string,
): T[] | null {
  if (!canReorderRows(items, dragId, targetId)) return null;

  const drag = items.find((i) => i.id === dragId)!;
  const target = items.find((i) => i.id === targetId)!;

  if (isTopLevel(drag) && isTopLevel(target)) {
    const tops = items.filter((i) => isTopLevel(i));
    const from = tops.findIndex((t) => t.id === dragId);
    const to = tops.findIndex((t) => t.id === targetId);
    if (from < 0 || to < 0) return null;

    const nextTops = [...tops];
    const [moved] = nextTops.splice(from, 1);
    const insertAt = nextTops.findIndex((t) => t.id === targetId);
    if (insertAt < 0) return null;
    nextTops.splice(insertAt, 0, moved);

    const result: T[] = [];
    const used = new Set<string>();
    for (const top of nextTops) {
      result.push(top);
      used.add(top.id);
      for (const child of items) {
        if (child.parentId === top.id) {
          result.push(child);
          used.add(child.id);
        }
      }
    }
    for (const item of items) {
      if (!used.has(item.id)) result.push(item);
    }
    return result;
  }

  const parentId = drag.parentId!;
  const siblings = items.filter((i) => i.parentId === parentId);
  const from = siblings.findIndex((s) => s.id === dragId);
  const to = siblings.findIndex((s) => s.id === targetId);
  if (from < 0 || to < 0) return null;

  const nextSiblings = [...siblings];
  const [moved] = nextSiblings.splice(from, 1);
  const insertAt = nextSiblings.findIndex((s) => s.id === targetId);
  if (insertAt < 0) return null;
  nextSiblings.splice(insertAt, 0, moved);

  const result: T[] = [];
  const used = new Set<string>();
  const tops = items.filter((i) => isTopLevel(i));
  for (const top of tops) {
    result.push(top);
    used.add(top.id);
    if (top.id === parentId) {
      for (const sib of nextSiblings) {
        result.push(sib);
        used.add(sib.id);
      }
    } else {
      for (const child of items) {
        if (child.parentId === top.id) {
          result.push(child);
          used.add(child.id);
        }
      }
    }
  }
  for (const item of items) {
    if (!used.has(item.id)) result.push(item);
  }
  return result;
}
