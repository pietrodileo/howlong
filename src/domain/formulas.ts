import type { LineItem } from '../models/estimate';
import type { FormulaAggregate, FormulaSpec } from '../models/model';

export function isFormulaItem(item: LineItem): boolean {
  return item.kind === 'formula' && item.formula != null;
}

const AGG_MARK: Record<FormulaAggregate, string> = {
  sum: 'Σ',
  avg: 'avg',
  min: 'min',
  max: 'max',
};

export function formulaLabel(spec: FormulaSpec): string {
  const agg = spec.aggregate ?? 'sum';
  return `${AGG_MARK[agg]} × ${spec.percent}%`;
}

function aggregateHours(values: number[], aggregate: FormulaAggregate): number {
  if (values.length === 0) return 0;
  switch (aggregate) {
    case 'avg':
      return values.reduce((s, v) => s + v, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'sum':
    default:
      return values.reduce((s, v) => s + v, 0);
  }
}

/**
 * Ordine topologico delle voci formula (dipendenze = sourceIds che sono altre formula).
 * Cicli → quelle voci restano in coda e andranno a 0.
 */
export function orderFormulaItems(items: LineItem[]): LineItem[] {
  const formulas = items.filter(isFormulaItem);
  const formulaIds = new Set(formulas.map((f) => f.id));
  const byId = new Map(formulas.map((f) => [f.id, f]));

  const indegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const f of formulas) {
    indegree.set(f.id, 0);
    dependents.set(f.id, []);
  }

  for (const f of formulas) {
    const deps = (f.formula?.sourceIds ?? []).filter((id) => formulaIds.has(id) && id !== f.id);
    const unique = [...new Set(deps)];
    indegree.set(f.id, unique.length);
    for (const d of unique) {
      dependents.get(d)?.push(f.id);
    }
  }

  const queue = formulas.filter((f) => (indegree.get(f.id) ?? 0) === 0).map((f) => f.id);
  const ordered: LineItem[] = [];

  while (queue.length) {
    const id = queue.shift()!;
    const item = byId.get(id);
    if (item) ordered.push(item);
    for (const next of dependents.get(id) ?? []) {
      const n = (indegree.get(next) ?? 1) - 1;
      indegree.set(next, n);
      if (n === 0) queue.push(next);
    }
  }

  for (const f of formulas) {
    if (!ordered.some((o) => o.id === f.id)) ordered.push(f);
  }

  return ordered;
}

/**
 * Calcola ore di una voce formula da una mappa id → ore base già note.
 * Sorgenti formula escluse se includeFormulaSources è false.
 */
export function computeFormulaHours(
  item: LineItem,
  hoursById: Map<string, number>,
  itemById: Map<string, LineItem>,
): number {
  const spec = item.formula;
  if (!spec) return 0;

  const values: number[] = [];
  const seen = new Set<string>();
  for (const sid of spec.sourceIds) {
    if (seen.has(sid) || sid === item.id) continue;
    seen.add(sid);
    const src = itemById.get(sid);
    if (!src) continue;
    if (isFormulaItem(src) && !spec.includeFormulaSources) continue;
    values.push(hoursById.get(sid) ?? 0);
  }

  const base = aggregateHours(values, spec.aggregate ?? 'sum');
  return (base * spec.percent) / 100;
}
