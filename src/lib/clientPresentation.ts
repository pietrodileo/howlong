import type { Estimate } from '../models/estimate';
import { computeTotals, type ComputedLineHours } from './contingency';
import { applyRounding } from './rounding';

export type ClientPresentedLine = ComputedLineHours & {
  hoursPresented: number;
  overridden: boolean;
};

export type MacroClientPresentationMode = 'rollup' | 'detail';

export function getMacroClientPresentation(
  estimate: Estimate,
  macroId: string,
): MacroClientPresentationMode {
  return estimate.clientView.macroPresentation?.[macroId] ?? 'detail';
}

/** Righe effettive in anteprima/export cliente (rollup vs detail, collapse UI opzionale). */
export function filterLinesForClientOutput(
  lines: ClientPresentedLine[],
  estimate: Estimate,
  options?: {
    hideCollapsedSubs?: boolean;
    isMacroCollapsed?: (macroId: string) => boolean;
  },
): ClientPresentedLine[] {
  const out: ClientPresentedLine[] = [];
  for (const line of lines) {
    if (!line.item.clientVisible) continue;

    const parentId = line.item.parentId;
    if (parentId) {
      const mode = getMacroClientPresentation(estimate, parentId);
      if (mode === 'rollup') continue;
      if (
        options?.hideCollapsedSubs &&
        options.isMacroCollapsed?.(parentId)
      ) {
        continue;
      }
      out.push(line);
      continue;
    }

    if (line.isMacro && line.hasChildren) {
      const mode = getMacroClientPresentation(estimate, line.item.id);
      if (mode === 'detail') continue;
      out.push(line);
      continue;
    }

    out.push(line);
  }
  return out;
}

export function sumClientOutputPresented(lines: ClientPresentedLine[]): number {
  return lines.reduce((s, l) => s + l.hoursPresented, 0);
}

export function buildClientPresentedLines(
  estimate: Estimate,
  opts?: { includeHidden?: boolean; ignoreOverrides?: boolean },
): ClientPresentedLine[] {
  const mode = estimate.clientView.roundingMode;
  const overrides = opts?.ignoreOverrides ? {} : (estimate.clientView.lineOverrides ?? {});
  const includeHidden = opts?.includeHidden ?? false;

  return computeTotals(estimate)
    .lines.filter((l) => includeHidden || l.item.clientVisible)
    .filter((l) => l.contributesToTotals || (l.isMacro && l.hasChildren))
    .map((l) => {
      const ov = overrides[l.item.id];
      const hoursBase = applyRounding(l.hoursBase, mode);
      const hoursContingency = applyRounding(l.hoursContingency, mode);
      const hoursWithContingency = applyRounding(l.hoursWithContingency, mode);
      return {
        ...l,
        hoursBase,
        hoursContingency,
        hoursWithContingency,
        hoursPresented: ov?.hoursPresented ?? hoursWithContingency,
        overridden: Boolean(!opts?.ignoreOverrides && ov?.hoursPresented != null),
      };
    });
}

/** Distribuisce `amount` in proporzione a `weights` (parti uguali se somma pesi = 0). */
export function splitProportionally(amount: number, weights: number[]): number[] {
  const n = weights.length;
  if (n === 0) return [];
  const out = new Array(n).fill(0);
  if (!Number.isFinite(amount) || amount === 0) return out;

  const safeWeights = weights.map((w) => Math.max(0, Number.isFinite(w) ? w : 0));
  const sumW = safeWeights.reduce((s, w) => s + w, 0);

  if (sumW <= 0) {
    const each = amount / n;
    let allocated = 0;
    for (let i = 0; i < n - 1; i++) {
      out[i] = each;
      allocated += each;
    }
    out[n - 1] = amount - allocated;
    return out;
  }

  let allocated = 0;
  for (let i = 0; i < n - 1; i++) {
    out[i] = (amount * safeWeights[i]) / sumW;
    allocated += out[i];
  }
  out[n - 1] = amount - allocated;
  return out;
}

/** Totali solo sulle voci con flag cliente attivo. */
export function buildClientPresentedTotals(lines: ClientPresentedLine[]) {
  const contributing = lines.filter((l) => l.contributesToTotals && l.item.clientVisible);
  const base = contributing.reduce((s, l) => s + l.hoursBase, 0);
  const ctg = contributing.reduce((s, l) => s + l.hoursContingency, 0);
  const withCtg = contributing.reduce((s, l) => s + l.hoursWithContingency, 0);
  const presented = contributing.reduce((s, l) => s + l.hoursPresented, 0);
  return {
    totalBase: base,
    totalContingency: ctg,
    totalWithContingency: withCtg,
    totalPresented: presented,
  };
}

/**
 * Totali “di sistema”: ore arrotondate senza override, tutte le voci che
 * contribuiscono (ignora Mostra/nascondi — è il punto di partenza).
 */
export function buildClientSystemTotals(lines: ClientPresentedLine[]) {
  const contributing = lines.filter((l) => l.contributesToTotals);
  const base = contributing.reduce((s, l) => s + l.hoursBase, 0);
  const ctg = contributing.reduce((s, l) => s + l.hoursContingency, 0);
  const withCtg = contributing.reduce((s, l) => s + l.hoursWithContingency, 0);
  return {
    totalBase: base,
    totalContingency: ctg,
    totalWithContingency: withCtg,
  };
}
