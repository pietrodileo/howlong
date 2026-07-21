import type { Estimate } from '../models/estimate';
import { newId, nowIso } from './ids';

/** Se l’id esiste già in libreria, assegna un nuovo id. */
export function ensureUniqueEstimateId(
  estimate: Estimate,
  existingIds: Set<string>,
): Estimate {
  if (!existingIds.has(estimate.meta.id)) return estimate;
  const id = newId('est');
  return {
    ...estimate,
    meta: {
      ...estimate.meta,
      id,
      updatedAt: nowIso(),
    },
  };
}
