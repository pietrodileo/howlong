import type { Estimate } from '../models/estimate';
import { computeTotals, type ComputedLineHours } from './contingency';
import { applyRounding } from './rounding';

export type ClientPresentedLine = ComputedLineHours & {
  overridden: boolean;
};

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
      const hoursBase = ov?.hoursBase ?? applyRounding(l.hoursBase, mode);
      const hoursContingency = ov?.hoursContingency ?? applyRounding(l.hoursContingency, mode);
      const hoursWithContingency =
        ov?.hoursWithContingency ?? applyRounding(l.hoursWithContingency, mode);
      return {
        ...l,
        hoursBase,
        hoursContingency,
        hoursWithContingency,
        overridden: Boolean(
          !opts?.ignoreOverrides &&
            ov &&
            (ov.hoursBase != null ||
              ov.hoursContingency != null ||
              ov.hoursWithContingency != null),
        ),
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
  return {
    totalBase: base,
    totalContingency: ctg,
    totalWithContingency: withCtg,
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
