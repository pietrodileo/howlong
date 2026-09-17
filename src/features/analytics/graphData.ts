import type { Estimate } from '../../models/estimate';
import { computeTotals, type ComputedLineHours } from '../../domain/contingency';
import { normalizeOwners } from '../../domain/owners';

export type GraphMode = 'base' | 'contingency' | 'combined';

export interface MetricEntry {
  base: number;
  contingency: number;
  combined: number;
}

export interface GraphEntry extends MetricEntry {
  id: string;
  name: string;
  color: string;
  canDrillDown: boolean;
  type: 'macro' | 'subtask';
  parentName?: string;
}

export interface OwnerTaskEntry extends MetricEntry {
  id: string;
  name: string;
  type: 'macro' | 'subtask' | 'formula';
  parentName?: string;
}

export interface OwnerGraphEntry extends MetricEntry {
  id: string;
  owner: string | null;
  tasks: OwnerTaskEntry[];
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

/** Return the metric used by the active chart mode. */
export function graphValue(entry: MetricEntry, mode: GraphMode): number {
  return entry[mode];
}

/** Round chart shares to tenths while keeping the displayed total at exactly 100%. */
export function buildPercentageShares<T extends MetricEntry>(entries: T[], mode: GraphMode): number[] {
  const values = entries.map((entry) => Math.max(0, graphValue(entry, mode)));
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!total) return values.map(() => 0);

  const exactTenths = values.map((value) => (value / total) * 1000);
  const shares = exactTenths.map(Math.floor);
  const remaining = 1000 - shares.reduce((sum, value) => sum + value, 0);
  const order = exactTenths
    .map((value, index) => ({ index, remainder: value - shares[index] }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (let index = 0; index < remaining; index += 1) shares[order[index].index] += 1;
  return shares.map((value) => value / 10);
}

/** Aggregate visible, non-overlapping contributions by owner within the active macro scope. */
export function buildOwnerEntries(estimate: Estimate, macroId: string | null = null): OwnerGraphEntry[] {
  const totals = computeTotals(estimate);
  const itemById = new Map(estimate.items.map((item) => [item.id, item]));
  const owners = new Map<string, OwnerGraphEntry>();

  for (const line of totals.lines) {
    if (!line.item.clientVisible || !line.contributesToTotals || line.hoursWithContingency <= 0) continue;
    if (macroId && line.item.parentId !== macroId) continue;
    const assignedOwners = normalizeOwners(line.item.owners);
    const ownerNames: (string | null)[] = assignedOwners.length > 0 ? assignedOwners : [null];
    const divisor = ownerNames.length;
    for (const owner of ownerNames) {
      const id = owner?.toLowerCase() || '__unassigned__';
      const entry = owners.get(id) ?? {
        id,
        owner,
        base: 0,
        contingency: 0,
        combined: 0,
        tasks: [],
      };
      entry.base += line.hoursBase / divisor;
      entry.contingency += line.hoursContingency / divisor;
      entry.combined += line.hoursWithContingency / divisor;
      entry.tasks.push({
        id: line.item.id,
        name: line.item.name,
        type: line.isFormula ? 'formula' : line.item.parentId ? 'subtask' : 'macro',
        parentName: line.item.parentId ? itemById.get(line.item.parentId)?.name : undefined,
        base: line.hoursBase / divisor,
        contingency: line.hoursContingency / divisor,
        combined: line.hoursWithContingency / divisor,
      });
      owners.set(id, entry);
    }
  }

  return [...owners.values()].sort((a, b) =>
    b.combined - a.combined || (a.owner ?? '').localeCompare(b.owner ?? ''),
  );
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
