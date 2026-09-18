import type { Estimate, LineItem } from '../models/estimate';

const LINE_ITEM_COLORS = ['#2b3d55', '#5b4b73', '#35605a', '#8a5a44', '#546a3a', '#7a4a5a'];

/** Return the shared deterministic color for a macro or subtask across Analytics and Gantt. */
export function getLineItemColor(estimate: Estimate, item: LineItem): string {
  if (item.color) return item.color;

  const macro = item.parentId
    ? estimate.items.find((candidate) => candidate.id === item.parentId)
    : item;
  if (!macro) return LINE_ITEM_COLORS[0];

  const macros = estimate.items.filter((candidate) =>
    candidate.parentId == null && candidate.kind !== 'formula' && candidate.kind !== 'summary',
  );
  const macroIndex = Math.max(0, macros.findIndex((candidate) => candidate.id === macro.id));
  const macroColor = macro.color ?? LINE_ITEM_COLORS[macroIndex % LINE_ITEM_COLORS.length];
  if (!item.parentId) return macroColor;

  const siblings = estimate.items.filter((candidate) =>
    candidate.parentId === macro.id && candidate.kind !== 'formula' && candidate.kind !== 'summary',
  );
  const childIndex = Math.max(0, siblings.findIndex((candidate) => candidate.id === item.id));
  const variation = stableColorVariation(item.id, childIndex);
  const tint = 0.2 + variation * 0.1;
  return tintHex(macroColor, tint);
}

/** Mix a six-digit hex color toward white to distinguish sibling subtasks. */
function tintHex(hex: string, amount: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const channel = (shift: number) => Math.round(((value >> shift) & 255) * (1 - amount) + 255 * amount);
  return `#${[channel(16), channel(8), channel(0)].map((part) => part.toString(16).padStart(2, '0')).join('')}`;
}

/** Return a stable pseudo-random variation so sibling colors stay consistent across views and renders. */
function stableColorVariation(id: string, siblingIndex: number): number {
  let hash = 2166136261;
  for (const character of id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  hash = Math.imul(hash ^ siblingIndex, 16777619);
  return ((hash >>> 0) % 1000) / 999;
}
