import type { Estimate } from '../src/models/estimate';
import { buildGraphEntries, graphValue } from '../src/features/analytics/graphData';

const estimate = {
  schemaVersion: 3,
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

const expanded = buildGraphEntries(estimate, null, new Set(['macro']));
if (expanded.length !== 1 || expanded[0].name !== 'Visible task' || expanded[0].parentName !== 'Build') {
  throw new Error(`expanded overview must replace macros with owned subtasks: ${JSON.stringify(expanded)}`);
}
if (expanded[0].canDrillDown || expanded[0].color === macros[0].color) {
  throw new Error('expanded subtasks must be terminal and use a shaded macro color');
}

console.log('analytics smoke: OK');
