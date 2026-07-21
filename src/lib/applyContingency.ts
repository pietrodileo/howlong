/**
 * Flag CTG per-voce, con fallback legacy su formula.applyGlobalContingency.
 * Stessa regola usata in contingency, factory, viste e import.
 */
export function resolveAppliesContingency(item: {
  kind?: string;
  applyContingency?: boolean;
  formula?: { applyGlobalContingency?: boolean };
}): boolean {
  if (item.applyContingency != null) return item.applyContingency;
  if (item.kind === 'formula') return !!item.formula?.applyGlobalContingency;
  return true;
}
