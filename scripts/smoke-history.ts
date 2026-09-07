import assert from 'node:assert/strict';
import { createEmptyEstimate } from '../src/domain/factory';
import {
  ESTIMATE_HISTORY_LIMIT,
  createEstimateHistory,
  isEstimateHistoryDirty,
  markEstimateHistorySaved,
  recordEstimate,
  redoEstimate,
  undoEstimate,
} from '../src/domain/estimateHistory';
import { DEFAULT_SETTINGS } from '../src/models/settings';

function withTitle(title: string) {
  const estimate = createEmptyEstimate(DEFAULT_SETTINGS);
  estimate.meta.title = title;
  return estimate;
}

const history = createEstimateHistory(withTitle('Initial'));
recordEstimate(history, withTitle('Saved'));
assert.equal(isEstimateHistoryDirty(history), true);
markEstimateHistorySaved(history);
assert.equal(isEstimateHistoryDirty(history), false);

recordEstimate(history, withTitle('Latest'));
assert.equal(undoEstimate(history)?.meta.title, 'Saved');
assert.equal(isEstimateHistoryDirty(history), false);
assert.equal(undoEstimate(history)?.meta.title, 'Initial');
assert.equal(isEstimateHistoryDirty(history), true);
assert.equal(redoEstimate(history)?.meta.title, 'Saved');
assert.equal(isEstimateHistoryDirty(history), false);

undoEstimate(history);
recordEstimate(history, withTitle('Replacement'));
assert.equal(redoEstimate(history), null, 'a new edit must clear redo history');

const bounded = createEstimateHistory(withTitle('0'));
for (let index = 1; index <= ESTIMATE_HISTORY_LIMIT + 5; index += 1) {
  recordEstimate(bounded, withTitle(String(index)));
}
assert.equal(bounded.past.length, ESTIMATE_HISTORY_LIMIT);

const firstTab = createEstimateHistory(withTitle('First'));
const secondTab = createEstimateHistory(withTitle('Second'));
recordEstimate(firstTab, withTitle('First changed'));
assert.equal(secondTab.present.estimate.meta.title, 'Second');

console.log('history smoke checks passed');
