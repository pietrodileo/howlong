/**
 * Smoke test contingency (node --experimental-strip-types or tsx).
 * Run: npx tsx scripts/smoke-contingency.ts
 */
import { computeTotals } from '../src/lib/contingency';
import type { Estimate } from '../src/models/estimate';

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
  ],
};

const nestedTotals = computeTotals(nested);
if (nestedTotals.totalBase !== 20) throw new Error(`nested base expected 20 got ${nestedTotals.totalBase}`);
if (nestedTotals.totalContingency !== 2) throw new Error(`nested ctg expected 2 got ${nestedTotals.totalContingency}`);
const macroLine = nestedTotals.lines.find((l) => l.item.id === 'm1');
if (!macroLine || macroLine.hoursBase !== 20 || macroLine.contributesToTotals) {
  throw new Error('macro should aggregate children and not double-count');
}

console.log('smoke-contingency: OK');
