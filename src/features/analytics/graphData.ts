import type { Estimate } from '../../models/estimate';
import { computeTotals, type ComputedLineHours } from '../../domain/contingency';

export type GraphMode = 'base' | 'contingency' | 'combined';

export interface GraphEntry {
  id: string;
  name: string;
  color: string;
  base: number;
  contingency: number;
  combined: number;
  canDrillDown: boolean;
  type: 'macro' | 'subtask';
  parentName?: string;
}

const FALLBACK_COLORS = ['#304764', '#675482', '#356d63', '#9a6047', '#59743b', '#8b6a36', '#536d8a', '#7c5268'];

/** Project canonical estimate totals into a drill-down or selectively expanded overview. */
export function buildGraphEntries(
  estimate: Estimate,
  macroId: string | null = null,
  expandedMacroIds: ReadonlySet<string> = new Set(),
): GraphEntry[] {
  const lines = computeTotals(estimate).lines;
  if (macroId) return childEntries(lines, macroId);

  return lines
    .filter((line) => line.depth === 0)
    .filter((line) => line.item.clientVisible)
    .map((line, index) => toGraphEntry(line, lines, index))
    .filter((entry) => entry.combined > 0)
    .flatMap((entry) => expandedMacroIds.has(entry.id)
      ? childEntries(lines, entry.id, entry.name, entry.color)
      : [entry]);
}

/** Return the metric used by the active donut mode. */
export function graphValue(entry: GraphEntry, mode: GraphMode): number {
  return entry[mode];
}

/** Convert one computed line without recalculating contingency rules. */
function toGraphEntry(line: ComputedLineHours, lines: ComputedLineHours[], index: number): GraphEntry {
  const visibleChildren = lines.filter(
    (candidate) => candidate.item.parentId === line.item.id && candidate.item.clientVisible,
  );
  const values = visibleChildren.length > 0
    ? visibleChildren.reduce(
      (sum, child) => ({
        base: sum.base + child.hoursBase,
        contingency: sum.contingency + child.hoursContingency,
        combined: sum.combined + child.hoursWithContingency,
      }),
      { base: 0, contingency: 0, combined: 0 },
    )
    : {
      base: line.hoursBase,
      contingency: line.hoursContingency,
      combined: line.hoursWithContingency,
    };

  return {
    id: line.item.id,
    name: line.item.name,
    color: line.item.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length],
    ...values,
    canDrillDown: visibleChildren.some((child) => child.hoursWithContingency > 0),
    type: 'macro',
  };
}

/** Build visible subtask entries, optionally prefixed and shaded for the mixed overview. */
function childEntries(
  lines: ComputedLineHours[],
  macroId: string,
  macroName?: string,
  macroColor?: string,
): GraphEntry[] {
  const children = lines.filter(
    (line) => line.item.parentId === macroId && line.item.clientVisible && line.hoursWithContingency > 0,
  );
  return children.map((line, index) => ({
    id: line.item.id,
    name: line.item.name,
    color: macroColor ? tintHex(macroColor, .14 + (index / Math.max(children.length - 1, 1)) * .3) : (line.item.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]),
    base: line.hoursBase,
    contingency: line.hoursContingency,
    combined: line.hoursWithContingency,
    canDrillDown: false,
    type: 'subtask',
    parentName: macroName ?? lines.find((candidate) => candidate.item.id === macroId)?.item.name,
  }));
}

/** Mix a six-digit hex color toward white to distinguish sibling subtasks. */
function tintHex(hex: string, amount: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const channel = (shift: number) => Math.round(((value >> shift) & 255) * (1 - amount) + 255 * amount);
  return `#${[channel(16), channel(8), channel(0)].map((part) => part.toString(16).padStart(2, '0')).join('')}`;
}
