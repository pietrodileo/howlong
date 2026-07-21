import type { Estimate } from '../models/estimate';
import { computeTotals, type EstimateTotals } from './contingency';

/** Ricalcola i totali con una % CTG di scenario (senza mutare la stima). */
export function computeTotalsAtPercent(
  estimate: Estimate,
  percent: number,
): EstimateTotals {
  const p = Math.min(100, Math.max(0, Number(percent) || 0));
  return computeTotals({
    ...estimate,
    contingency: {
      ...estimate.contingency,
      percent: p,
    },
  });
}

/** Default scenari in ordine crescente: −10, attuale, +10 (fallback 10/20/30). */
export function defaultComparePercents(current: number): [number, number, number] {
  const cur = Math.min(100, Math.max(0, Number(current) || 0));
  const low = Math.max(0, cur - 10);
  const high = Math.min(100, cur + 10);
  const trio: [number, number, number] = [low, cur, high];
  if (new Set(trio).size < 2) {
    return [10, 20, 30];
  }
  return trio;
}
