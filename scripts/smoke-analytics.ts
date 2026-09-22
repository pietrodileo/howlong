import type { Estimate } from '../src/models/estimate';
import { getLineItemColor } from '../src/domain/itemColors';
import { buildGraphEntries, buildOwnerEntries, buildPercentageShares, graphValue } from '../src/features/analytics/graphData';
import { buildPlanningCoverage, buildPlanningEntries, buildStatusCategoryGroups, buildTimelineBuckets, buildUnestimatedEntries } from '../src/features/analytics/planningData';

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

const percentageEntries = [
  { base: 1, contingency: 2, combined: 3 },
  { base: 1, contingency: 3, combined: 4 },
  { base: 1, contingency: 4, combined: 5 },
];
for (const mode of ['base', 'contingency', 'combined'] as const) {
  const shares = buildPercentageShares(percentageEntries, mode);
  if (shares.reduce((sum, share) => sum + Math.round(share * 10), 0) !== 1000) {
    throw new Error(`rounded ${mode} analytics shares must add up to 100%: ${shares}`);
  }
}

const expanded = buildGraphEntries(estimate, null, new Set(['macro']));
if (expanded.length !== 1 || expanded[0].name !== 'Visible task' || expanded[0].parentName !== 'Build') {
  throw new Error(`expanded overview must replace macros with owned subtasks: ${JSON.stringify(expanded)}`);
}
if (expanded[0].canDrillDown || expanded[0].color === macros[0].color) {
  throw new Error('expanded subtasks must be terminal and use a shaded macro color');
}

const siblingEstimate = {
  ...estimate,
  items: [
    estimate.items[0],
    estimate.items[1],
    { ...estimate.items[1], id: 'visible-2', name: 'Visible task 2' },
  ],
} as Estimate;
const siblingColors = buildGraphEntries(siblingEstimate, null, new Set(['macro'])).map((entry) => entry.color);
if (siblingColors.length !== 2 || new Set(siblingColors).size !== 2 || siblingColors.some((color) => color === getLineItemColor(siblingEstimate, siblingEstimate.items[0]))) {
  throw new Error(`sibling subtasks must have distinct macro-related colors: ${JSON.stringify(siblingColors)}`);
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
const aliceVisibleTask = alice.tasks.find((task) => task.id === 'visible');
if (!aliceVisibleTask || aliceVisibleTask.ownerCount !== 2 || aliceVisibleTask.ownerAllocationShare !== 0.5) {
  throw new Error(`owner allocation metadata is wrong: ${JSON.stringify(aliceVisibleTask)}`);
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

const planningEstimate = {
  ...estimate,
  items: [
    { ...estimate.items[0], status: 'planned' },
    { ...estimate.items[1], status: 'in-progress', owners: ['Alice'] },
    { ...estimate.items[2], status: 'cancelled', owners: [] },
    { ...estimate.items[3], status: 'to-plan', owners: [] },
    { id: 'zero-macro', name: 'Zero macro', hours: 0, category: 'Other', kind: 'operational', parentId: null, contingencyPercentOverride: null, notes: '', owners: [], status: 'to-plan', tags: [], clientVisible: true, applyContingency: true },
    { id: 'zero-subtask', name: 'Zero subtask', hours: 0, category: 'Other', kind: 'operational', parentId: 'zero-macro', contingencyPercentOverride: null, notes: '', owners: [], status: 'to-plan', tags: [], clientVisible: true, applyContingency: true },
    { id: 'standalone', name: 'Test', hours: 5, category: 'Test', kind: 'operational', parentId: null, contingencyPercentOverride: null, notes: '', owners: [], status: 'blocked', tags: [], clientVisible: true, applyContingency: true },
    { id: 'formula-plan', name: 'Formula', hours: 0, category: 'Other', kind: 'formula', parentId: null, contingencyPercentOverride: null, notes: '', owners: [], status: 'planned', tags: [], clientVisible: true, applyContingency: true, formula: { percent: 10, sourceIds: ['visible'], aggregate: 'sum', includeFormulaSources: true, applyGlobalContingency: true } },
    { id: 'formula-zero', name: 'Zero formula', hours: 0, category: 'Other', kind: 'formula', parentId: null, contingencyPercentOverride: null, notes: '', owners: [], status: 'to-plan', tags: [], clientVisible: true, applyContingency: true, formula: { percent: 10, sourceIds: ['zero'], aggregate: 'sum', includeFormulaSources: true, applyGlobalContingency: true } },
  ],
  planning: {
    items: {
      visible: { startDate: '2026-01-01', endDate: '2026-01-15' },
      hidden: { startDate: '2026-01-08', endDate: '2026-01-10' },
      standalone: { startDate: '2026-01-10', endDate: '2026-01-20' },
      'formula-plan': { startDate: '2026-01-01', endDate: '2026-01-02' },
    },
  },
} as Estimate;

const planningEntries = buildPlanningEntries(planningEstimate);
if (planningEntries.some((entry) => entry.id === 'macro' || entry.id === 'formula-plan')) {
  throw new Error(`planning analytics must exclude aggregate macros and formulas: ${JSON.stringify(planningEntries)}`);
}
const planningCoverage = buildPlanningCoverage(planningEntries, 'base');
if (planningCoverage.planned !== 15 || planningCoverage.unplanned !== 0 || planningCoverage.percentage !== 100) {
  throw new Error(`planning coverage is wrong: ${JSON.stringify(planningCoverage)}`);
}
const unestimatedEntries = buildUnestimatedEntries(planningEstimate);
if (unestimatedEntries.map((entry) => entry.id).join(',') !== 'zero,zero-macro,zero-subtask,formula-zero') {
  throw new Error(`unestimated entries must include macros and formulas but exclude cancelled work: ${JSON.stringify(unestimatedEntries)}`);
}
if (planningCoverage.unassigned !== 5 || planningCoverage.unplannedPercentage !== 0 || planningCoverage.unassignedPercentage !== (5 / 15) * 100) {
  throw new Error(`unassigned effort coverage is wrong: ${JSON.stringify(planningCoverage)}`);
}
const statusGroups = buildStatusCategoryGroups(planningEntries, 'base', 'effort');
const buildGroup = statusGroups.find((group) => group.category === 'Build');
if (!buildGroup || buildGroup.total !== 10 || buildGroup.cancelledCount !== 1) {
  throw new Error(`status-by-category aggregation is wrong: ${JSON.stringify(statusGroups)}`);
}
const countGroups = buildStatusCategoryGroups(planningEntries, 'base', 'count');
if (countGroups.find((group) => group.category === 'Build')?.total !== 1) {
  throw new Error(`status activity counts are wrong: ${JSON.stringify(countGroups)}`);
}
const timeline = buildTimelineBuckets(planningEntries, 'all', '2026-01-01');
if (timeline.length !== 3 || timeline[0].total !== 1 || timeline[1].total !== 2 || timeline.some((bucket) => bucket.entryIds.includes('hidden'))) {
  throw new Error(`planning timeline buckets are wrong: ${JSON.stringify(timeline)}`);
}

console.log('analytics smoke: OK');
