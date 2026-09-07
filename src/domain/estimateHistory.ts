import type { Estimate } from '../models/estimate';

export const ESTIMATE_HISTORY_LIMIT = 100;

export type EstimateHistoryEntry = {
  revision: number;
  estimate: Estimate;
};

export type EstimateHistory = {
  past: EstimateHistoryEntry[];
  present: EstimateHistoryEntry;
  future: EstimateHistoryEntry[];
  savedRevision: number;
  nextRevision: number;
};

export function cloneEstimateSnapshot(estimate: Estimate): Estimate {
  return JSON.parse(JSON.stringify(estimate)) as Estimate;
}

function isSameEstimate(left: Estimate, right: Estimate): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function createEstimateHistory(estimate: Estimate): EstimateHistory {
  return {
    past: [],
    present: { revision: 0, estimate: cloneEstimateSnapshot(estimate) },
    future: [],
    savedRevision: 0,
    nextRevision: 1,
  };
}

export function recordEstimate(history: EstimateHistory, estimate: Estimate): boolean {
  if (isSameEstimate(history.present.estimate, estimate)) return false;
  history.past = [...history.past, history.present].slice(-ESTIMATE_HISTORY_LIMIT);
  history.present = { revision: history.nextRevision, estimate: cloneEstimateSnapshot(estimate) };
  history.future = [];
  history.nextRevision += 1;
  return true;
}

export function undoEstimate(history: EstimateHistory): Estimate | null {
  const previous = history.past.pop();
  if (!previous) return null;
  history.future.unshift(history.present);
  history.present = previous;
  return cloneEstimateSnapshot(previous.estimate);
}

export function redoEstimate(history: EstimateHistory): Estimate | null {
  const next = history.future.shift();
  if (!next) return null;
  history.past.push(history.present);
  history.present = next;
  return cloneEstimateSnapshot(next.estimate);
}

export function markEstimateHistorySaved(history: EstimateHistory): void {
  history.savedRevision = history.present.revision;
}

export function isEstimateHistoryDirty(history: EstimateHistory): boolean {
  return history.present.revision !== history.savedRevision;
}
