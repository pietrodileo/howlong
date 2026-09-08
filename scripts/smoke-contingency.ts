/**
 * Smoke test contingency (node --experimental-strip-types or tsx).
 * Run: npx tsx scripts/smoke-contingency.ts
 */
import { computeTotals } from '../src/domain/contingency';
import {
  buildClientPresentedLines,
  buildClientPresentedTotals,
  buildClientSystemTotals,
} from '../src/features/estimate/clientPresentation';
import { comparisonItemHours } from '../src/features/comparison/compare';
import { resolveEstimateCategories } from '../src/features/estimate/estimateCategories';
import type { Estimate } from '../src/models/estimate';

const modelCategories = resolveEstimateCategories(
  ['Analisi', 'Sviluppo'],
  ['Development'],
  ['Analysis', 'Development'],
);
if (modelCategories.join('|') !== 'Analysis|Development') {
  throw new Error(`model categories leaked defaults: ${modelCategories.join('|')}`);
}
const standaloneCategories = resolveEstimateCategories(['Analisi'], ['Custom']);
if (standaloneCategories.join('|') !== 'Analisi|Custom') {
  throw new Error(`standalone categories lost fallback values: ${standaloneCategories.join('|')}`);
}

const estimate: Estimate = {
  schemaVersion: 1,
  meta: {
    id: 't1',
    title: 'Test',
    clientLabel: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    unit: 'hours',
  },
  contingency: {
    percent: 20,
    mode: 'project',
    targetCategories: [],
    placement: 'both',
  },
  items: [
    {
      id: '1',
      name: 'Dev',
      hours: 100,
      category: 'Sviluppo',
      kind: 'operational',
      parentId: null,
      contingencyPercentOverride: null,
      notes: '',
      clientVisible: true,
    },
    {
      id: '2',
      name: 'Summary',
      hours: 999,
      category: 'Sviluppo',
      kind: 'summary',
      parentId: null,
      contingencyPercentOverride: null,
      notes: '',
      clientVisible: true,
    },
  ],
  clientView: {
    roundingMode: 'none',
    hideInternalNotes: true,
    titleOverride: '',
  },
};

const totals = computeTotals(estimate);
if (totals.totalBase !== 100) throw new Error(`base expected 100 got ${totals.totalBase}`);
if (totals.totalContingency !== 20) throw new Error(`ctg expected 20 got ${totals.totalContingency}`);
if (totals.totalWithContingency !== 120) throw new Error(`with expected 120 got ${totals.totalWithContingency}`);

estimate.contingency.mode = 'custom';
estimate.items[0].contingencyPercentOverride = 50;
const custom = computeTotals(estimate);
if (custom.totalContingency !== 50) throw new Error(`custom ctg expected 50 got ${custom.totalContingency}`);

const nested: Estimate = {
  ...estimate,
  contingency: { ...estimate.contingency, mode: 'project', percent: 10 },
  items: [
    {
      id: 'm1',
      name: 'Analisi',
      hours: 0,
      category: 'Analisi',
      kind: 'operational',
      parentId: null,
      contingencyPercentOverride: null,
      notes: '',
      clientVisible: true,
    },
    {
      id: 't1',
      name: 'Kickoff',
      hours: 8,
      category: 'Analisi',
      kind: 'operational',
      parentId: 'm1',
      contingencyPercentOverride: null,
      notes: '',
      clientVisible: true,
    },
    {
      id: 't2',
      name: 'Doc',
      hours: 12,
      category: 'Analisi',
      kind: 'operational',
      parentId: 'm1',
      contingencyPercentOverride: null,
      notes: '',
      clientVisible: true,
    },
    {
      id: 'f1',
      name: 'Review',
      hours: 0,
      category: 'Analisi',
      kind: 'formula',
      parentId: null,
      contingencyPercentOverride: null,
      notes: '',
      clientVisible: true,
      formula: {
        percent: 50,
        sourceIds: ['m1'],
        aggregate: 'sum',
        includeFormulaSources: false,
        applyGlobalContingency: false,
      },
    },
  ],
};

const nestedTotals = computeTotals(nested);
if (nestedTotals.totalBase !== 30) throw new Error(`nested base expected 30 got ${nestedTotals.totalBase}`);
if (nestedTotals.totalContingency !== 2) throw new Error(`nested ctg expected 2 got ${nestedTotals.totalContingency}`);
const macroLine = nestedTotals.lines.find((l) => l.item.id === 'm1');
if (!macroLine || macroLine.hoursBase !== 20 || macroLine.contributesToTotals) {
  throw new Error('macro should aggregate children and not double-count');
}

const baselineLines = buildClientPresentedLines(nested, { includeHidden: true, ignoreOverrides: true });
const estimatorPresented = buildClientSystemTotals(baselineLines).totalWithContingency;
const unchangedManagerPresented = buildClientPresentedTotals(
  buildClientPresentedLines(nested, { includeHidden: true }),
).totalPresented;
if (estimatorPresented !== 32 || unchangedManagerPresented - estimatorPresented !== 0) {
  throw new Error(`unchanged manager summary should match the estimator total: estimator=${estimatorPresented}, manager=${unchangedManagerPresented}`);
}

const overridden: Estimate = {
  ...nested,
  clientView: {
    ...nested.clientView,
    lineOverrides: { t1: { hoursPresented: 20 } },
  },
};
const overriddenManagerPresented = buildClientPresentedTotals(
  buildClientPresentedLines(overridden, { includeHidden: true }),
).totalPresented;
if (Math.abs(overriddenManagerPresented - estimatorPresented - 11.2) > 0.0001) {
  throw new Error('manager override should update the summary delta');
}

const hidden: Estimate = {
  ...nested,
  items: nested.items.map((item) => item.id === 't2' ? { ...item, clientVisible: false } : item),
};
const hiddenManagerPresented = buildClientPresentedTotals(
  buildClientPresentedLines(hidden, { includeHidden: true }),
).totalPresented;
if (estimatorPresented !== 32 || Math.abs(hiddenManagerPresented - estimatorPresented + 13.2) > 0.0001) {
  throw new Error('hidden rows should change only the manager total and delta');
}

const reset: Estimate = {
  ...hidden,
  clientView: { ...hidden.clientView, lineOverrides: {} },
  items: hidden.items.map((item) => ({ ...item, clientVisible: true })),
};
const resetManagerPresented = buildClientPresentedTotals(
  buildClientPresentedLines(reset, { includeHidden: true }),
).totalPresented;
if (resetManagerPresented - estimatorPresented !== 0) {
  throw new Error('reset manager summary should match the estimator total');
}
if (comparisonItemHours(nested, 'f1') !== 10) {
  throw new Error('comparison should display computed formula hours');
}

console.log('smoke-contingency: OK');
