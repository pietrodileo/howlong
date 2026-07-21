import type { Estimate, LineItem } from '../models/estimate';
import type { ContingencyMode } from '../models/settings';
import { resolveAppliesContingency } from './applyContingency';
import {
  computeFormulaHours,
  isFormulaItem,
  orderFormulaItems,
} from './formulas';

export interface ComputedLineHours {
  item: LineItem;
  hoursBase: number;
  hoursContingency: number;
  hoursWithContingency: number;
  contingencyPercentApplied: number;
  /** True only for leaf rows that enter project totals. */
  contributesToTotals: boolean;
  isMacro: boolean;
  hasChildren: boolean;
  depth: number;
  isFormula?: boolean;
  formulaError?: string;
}

export interface CategoryBreakdown {
  category: string;
  hoursBase: number;
  hoursContingency: number;
  hoursWithContingency: number;
}

export interface EstimateTotals {
  totalBase: number;
  totalContingency: number;
  totalWithContingency: number;
  byCategory: CategoryBreakdown[];
  lines: ComputedLineHours[];
}

function resolvePercent(
  item: LineItem,
  percent: number,
  mode: ContingencyMode,
  targetCategories: string[],
): number {
  if (item.kind === 'summary') return 0;
  if (!resolveAppliesContingency(item)) return 0;

  if (item.contingencyPercentOverride != null) {
    return item.contingencyPercentOverride;
  }

  if (mode === 'project') {
    return percent;
  }

  if (mode === 'categories') {
    return targetCategories.includes(item.category) ? percent : 0;
  }

  return percent;
}

function childrenOf(items: LineItem[], parentId: string): LineItem[] {
  return items.filter((i) => i.parentId === parentId);
}

export function computeLineHours(
  item: LineItem,
  percent: number,
  mode: ContingencyMode,
  targetCategories: string[],
  options?: {
    contributesToTotals?: boolean;
    isMacro?: boolean;
    hasChildren?: boolean;
    depth?: number;
    hoursBaseOverride?: number;
    skipContingency?: boolean;
  },
): ComputedLineHours {
  const contributesToTotals = options?.contributesToTotals ?? item.kind !== 'summary';
  const hoursBase = options?.hoursBaseOverride ?? item.hours;
  const contingencyPercentApplied =
    contributesToTotals && !options?.skipContingency
      ? resolvePercent(item, percent, mode, targetCategories)
      : 0;
  const hoursContingency = contributesToTotals
    ? (hoursBase * contingencyPercentApplied) / 100
    : 0;

  return {
    item,
    hoursBase,
    hoursContingency,
    hoursWithContingency: hoursBase + hoursContingency,
    contingencyPercentApplied,
    contributesToTotals,
    isMacro: options?.isMacro ?? item.parentId == null,
    hasChildren: options?.hasChildren ?? false,
    depth: options?.depth ?? (item.parentId ? 1 : 0),
    isFormula: isFormulaItem(item),
  };
}

function aggregateChildren(
  children: ComputedLineHours[],
  parent: LineItem,
): ComputedLineHours {
  const leafish = children.filter((c) => c.contributesToTotals || c.hasChildren);
  const hoursBase = children.reduce((s, c) => s + c.hoursBase, 0);
  const hoursContingency = children.reduce((s, c) => s + c.hoursContingency, 0);
  return {
    item: parent,
    hoursBase,
    hoursContingency,
    hoursWithContingency: hoursBase + hoursContingency,
    contingencyPercentApplied:
      hoursBase > 0 ? Math.round((hoursContingency / hoursBase) * 1000) / 10 : 0,
    contributesToTotals: false,
    isMacro: true,
    hasChildren: leafish.length > 0 || children.length > 0,
    depth: 0,
  };
}

/** Build display order: macros first (file order), each followed by its subtasks. */
export function orderedItems(items: LineItem[]): LineItem[] {
  const macros = items.filter((i) => i.parentId == null);
  const result: LineItem[] = [];
  for (const macro of macros) {
    result.push(macro);
    result.push(...childrenOf(items, macro.id));
  }
  const known = new Set(result.map((i) => i.id));
  for (const item of items) {
    if (!known.has(item.id)) result.push(item);
  }
  return result;
}

function hasFormulaCycle(item: LineItem, allFormulas: LineItem[]): boolean {
  const formulaIds = new Set(allFormulas.map((f) => f.id));
  const byId = new Map(allFormulas.map((f) => [f.id, f]));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function dfs(id: string): boolean {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    const node = byId.get(id);
    for (const sid of node?.formula?.sourceIds ?? []) {
      if (!formulaIds.has(sid)) continue;
      if (dfs(sid)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  }

  return dfs(item.id);
}

export function computeTotals(estimate: Estimate): EstimateTotals {
  const { percent, mode, targetCategories } = estimate.contingency;
  const items = estimate.items;
  const itemById = new Map(items.map((i) => [i.id, i]));
  const lines: ComputedLineHours[] = [];
  const hoursById = new Map<string, number>();

  const macros = items.filter((i) => i.parentId == null && !isFormulaItem(i));
  const seen = new Set<string>();

  for (const macro of macros) {
    const kids = childrenOf(items, macro.id).filter((k) => !isFormulaItem(k));
    if (kids.length > 0) {
      const childLines = kids.map((child) =>
        computeLineHours(child, percent, mode, targetCategories, {
          contributesToTotals: child.kind !== 'summary',
          isMacro: false,
          hasChildren: false,
          depth: 1,
        }),
      );
      const agg = aggregateChildren(childLines, macro);
      lines.push(agg);
      lines.push(...childLines);
      hoursById.set(macro.id, agg.hoursBase);
      for (const c of childLines) hoursById.set(c.item.id, c.hoursBase);
      seen.add(macro.id);
      kids.forEach((k) => seen.add(k.id));
    } else {
      const line = computeLineHours(macro, percent, mode, targetCategories, {
        contributesToTotals: macro.kind !== 'summary',
        isMacro: true,
        hasChildren: false,
        depth: 0,
      });
      lines.push(line);
      hoursById.set(macro.id, line.hoursBase);
      seen.add(macro.id);
    }
  }

  for (const item of items) {
    if (seen.has(item.id) || isFormulaItem(item)) continue;
    const line = computeLineHours(item, percent, mode, targetCategories, {
      contributesToTotals: item.kind !== 'summary',
      isMacro: item.parentId == null,
      hasChildren: false,
      depth: item.parentId ? 1 : 0,
    });
    lines.push(line);
    hoursById.set(item.id, line.hoursBase);
  }

  const allFormulas = items.filter(isFormulaItem);
  const orderedFormulas = orderFormulaItems(items);

  for (const item of orderedFormulas) {
    const cyclic = hasFormulaCycle(item, allFormulas);
    let hoursBase = 0;
    let formulaError: string | undefined;
    if (cyclic) {
      formulaError = 'cycle';
    } else {
      hoursBase = computeFormulaHours(item, hoursById, itemById);
    }

    const line = computeLineHours(item, percent, mode, targetCategories, {
      contributesToTotals: true,
      isMacro: true,
      hasChildren: false,
      depth: 0,
      hoursBaseOverride: hoursBase,
      skipContingency: !resolveAppliesContingency(item),
    });
    line.isFormula = true;
    line.formulaError = formulaError;
    // Mantieni ordine: le formula top-level dopo le macro già processate, in ordine file
    lines.push(line);
    hoursById.set(item.id, hoursBase);
  }

  // Riordina lines secondo orderedItems per display coerente
  const order = orderedItems(items).map((i) => i.id);
  const lineById = new Map(lines.map((l) => [l.item.id, l]));
  const orderedLines: ComputedLineHours[] = [];
  for (const id of order) {
    const l = lineById.get(id);
    if (l) orderedLines.push(l);
  }
  for (const l of lines) {
    if (!orderedLines.includes(l)) orderedLines.push(l);
  }

  let totalBase = 0;
  let totalContingency = 0;
  const categoryMap = new Map<string, CategoryBreakdown>();

  for (const line of orderedLines) {
    if (!line.contributesToTotals) continue;
    totalBase += line.hoursBase;
    totalContingency += line.hoursContingency;

    const existing = categoryMap.get(line.item.category) ?? {
      category: line.item.category,
      hoursBase: 0,
      hoursContingency: 0,
      hoursWithContingency: 0,
    };
    existing.hoursBase += line.hoursBase;
    existing.hoursContingency += line.hoursContingency;
    existing.hoursWithContingency += line.hoursWithContingency;
    categoryMap.set(line.item.category, existing);
  }

  return {
    totalBase,
    totalContingency,
    totalWithContingency: totalBase + totalContingency,
    byCategory: Array.from(categoryMap.values()),
    lines: orderedLines,
  };
}

export function buildSeparateContingencyRows(
  totals: EstimateTotals,
  mode: ContingencyMode,
): Array<{ category: string | null; hours: number }> {
  if (mode === 'categories') {
    return totals.byCategory
      .filter((c) => c.hoursContingency > 0)
      .map((c) => ({ category: c.category, hours: c.hoursContingency }));
  }
  if (totals.totalContingency <= 0) return [];
  return [{ category: null, hours: totals.totalContingency }];
}
