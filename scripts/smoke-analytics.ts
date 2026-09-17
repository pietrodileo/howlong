import type { Estimate } from '../src/models/estimate';
import { buildGraphEntries, buildOwnerEntries, buildPercentageShares, graphValue } from '../src/features/analytics/graphData';

const estimate = {
  schemaVersion: 4,
  meta: {
    id: 'analytics-smoke',
    title: 'Analytics smoke',
    clientLabel: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    unit: 'hours',
    hoursPerDay: 8,
    icon: 'letter',
  },
  contingency: { percent: 20, mode: 'project', targetCategories: [], placement: 'both' },
  tagOptions: [],
  items: [
    { id: 'macro', name: 'Build', hours: 0, category: 'Build', kind: 'operational', parentId: null, contingencyPercentOverride: null, notes: '', tags: [], clientVisible: true, applyContingency: true },
    { id: 'visible', name: 'Visible task', hours: 10, category: 'Build', kind: 'operational', parentId: 'macro', contingencyPercentOverride: null, notes: '', tags: [], clientVisible: true, applyContingency: true },
    { id: 'hidden', name: 'Hidden task', hours: 90, category: 'Build', kind: 'operational', parentId: 'macro', contingencyPercentOverride: null, notes: '', tags: [], clientVisible: false, applyContingency: true },
    { id: 'zero', name: 'Zero', hours: 0, category: 'Other', kind: 'operational', parentId: null, contingencyPercentOverride: null, notes: '', tags: [], clientVisible: true, applyContingency: true },
  ],
  clientView: { roundingMode: 'none', hideManagerNotes: false, hideManagerTags: false, hideClientNotes: true, hideClientTags: false, titleOverride: '', lineOverrides: {}, macroPresentation: {} },
  auditHistory: [],
  planning: { items: {} },
} as Estimate;

const macros = buildGraphEntries(estimate);
if (macros.length !== 1) throw new Error(`expected one non-zero macro, got ${macros.length}`);
if (macros[0].base !== 10 || macros[0].contingency !== 2 || macros[0].combined !== 12) {
  throw new Error(`visible macro totals are wrong: ${JSON.stringify(macros[0])}`);
}
if (!macros[0].canDrillDown) throw new Error('macro should allow drill-down');

const subtasks = buildGraphEntries(estimate, 'macro');
if (subtasks.length !== 1 || subtasks[0].id !== 'visible') {
  throw new Error(`hidden subtasks must be excluded: ${JSON.stringify(subtasks)}`);
}
if (graphValue(subtasks[0], 'base') !== 10 || graphValue(subtasks[0], 'contingency') !== 2) {
  throw new Error('metric selection returned the wrong value');
}

const roundedShares = buildPercentageShares([
  { base: 1, contingency: 0, combined: 1 },
  { base: 1, contingency: 0, combined: 1 },
  { base: 1, contingency: 0, combined: 1 },
], 'combined');
if (roundedShares.reduce((sum, share) => sum + Math.round(share * 10), 0) !== 1000) {
  throw new Error(`rounded analytics shares must add up to 100%: ${roundedShares}`);
}

const expanded = buildGraphEntries(estimate, null, new Set(['macro']));
if (expanded.length !== 1 || expanded[0].name !== 'Visible task' || expanded[0].parentName !== 'Build') {
  throw new Error(`expanded overview must replace macros with owned subtasks: ${JSON.stringify(expanded)}`);
}
if (expanded[0].canDrillDown || expanded[0].color === macros[0].color) {
  throw new Error('expanded subtasks must be terminal and use a shaded macro color');
}

const ownerEstimate = {
  ...estimate,
  items: [
    { ...estimate.items[0], owners: ['Macro owner'] },
    { ...estimate.items[1], owners: ['Alice', 'Bob'] },
    { ...estimate.items[2], owners: ['Bob'] },
    estimate.items[3],
    { id: 'unassigned', name: 'Unassigned task', hours: 4, category: 'Other', kind: 'operational', parentId: null, contingencyPercentOverride: null, notes: '', tags: [], clientVisible: true, applyContingency: true },
    { id: 'formula', name: 'Calculated overhead', hours: 0, category: 'Other', kind: 'formula', parentId: null, contingencyPercentOverride: null, notes: '', owners: ['Alice'], tags: [], clientVisible: true, applyContingency: true, formula: { percent: 50, sourceIds: ['visible'], aggregate: 'sum', includeFormulaSources: true, applyGlobalContingency: true } },
  ],
} as Estimate;

const owners = buildOwnerEntries(ownerEstimate);
const alice = owners.find((entry) => entry.owner === 'Alice');
const bob = owners.find((entry) => entry.owner === 'Bob');
const unassigned = owners.find((entry) => entry.owner === null);
if (!alice || !bob || !unassigned || owners.some((entry) => entry.owner === 'Macro owner')) {
  throw new Error(`owner aggregation has the wrong buckets: ${JSON.stringify(owners)}`);
}
if (alice.base !== 10 || alice.combined !== 12 || !alice.tasks.some((task) => task.id === 'formula' && task.type === 'formula')) {
  throw new Error(`formula contribution is missing from Alice: ${JSON.stringify(alice)}`);
}
if (unassigned.base !== 4) {
  throw new Error(`visible or unassigned work is missing: ${JSON.stringify(owners)}`);
}
if (bob.base !== 5 || bob.combined !== 6) {
  throw new Error(`multi-owner effort was not split equally: ${JSON.stringify(bob)}`);
}
const ownerBase = owners.reduce((sum, entry) => sum + entry.base, 0);
const visibleBase = buildGraphEntries(ownerEstimate).reduce((sum, entry) => sum + entry.base, 0);
if (ownerBase !== visibleBase) {
  throw new Error(`owner base does not reconcile with visible chart totals: ${ownerBase}`);
}
const macroOwners = buildOwnerEntries(ownerEstimate, 'macro');
const macroAlice = macroOwners.find((entry) => entry.owner === 'Alice');
if (!macroAlice || macroAlice.base !== 5 || macroAlice.combined !== 6 || macroAlice.tasks.some((task) => task.id === 'formula')) {
  throw new Error(`macro owner scope is wrong: ${JSON.stringify(macroOwners)}`);
}

console.log('analytics smoke: OK');
