import assert from 'node:assert/strict';
import { createEmptyEstimate } from '../src/lib/factory';
import { addDays, aggregateMacroRange, listDays } from '../src/lib/gantt';
import { ganttToXlsx } from '../src/lib/export';
import { parseEstimate } from '../src/models/estimate';
import { DEFAULT_SETTINGS } from '../src/models/settings';
import { createPinia, setActivePinia } from 'pinia';
import { useEstimateStore } from '../src/stores/estimate';

const estimate = createEmptyEstimate(DEFAULT_SETTINGS);
const macro = estimate.items[0];
const first = { ...macro, id: 'sub-1', parentId: macro.id };
const second = { ...macro, id: 'sub-2', parentId: macro.id };
first.color = '#c2410c';
estimate.items.push(first, second);
estimate.planning.items[first.id] = { startDate: '2026-09-04', endDate: '2026-09-08' };
estimate.planning.items[second.id] = { startDate: '2026-09-10', endDate: '2026-09-12' };

assert.deepEqual(aggregateMacroRange(estimate, macro), {
  startDate: '2026-09-04',
  endDate: '2026-09-12',
});
assert.equal(addDays('2026-09-04', 3), '2026-09-07');
assert.deepEqual(listDays('2026-09-04', '2026-09-07', false), ['2026-09-04', '2026-09-07']);

const { planning: _planning, ...legacy } = estimate;
const parsed = parseEstimate({ ...legacy, schemaVersion: 2 });
assert.equal(parsed.ok, true);
if (parsed.ok) {
  assert.equal(parsed.data.schemaVersion, 3);
  assert.deepEqual(parsed.data.planning, { items: {} });
}
assert.equal(parseEstimate({
  ...estimate,
  planning: { items: { broken: { startDate: '2026-09-10', endDate: '2026-09-09' } } },
}).ok, false);

const xlsx = await ganttToXlsx(estimate, {
  from: '2026-09-01',
  to: '2026-09-30',
  scale: 'day',
  includeWeekends: false,
});
assert.ok(xlsx.byteLength > 1_000);
const ExcelJS = (await import('exceljs')).default;
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(xlsx as unknown as ArrayBuffer);
const ganttSheet = workbook.getWorksheet('Gantt')!;
assert.equal(ganttSheet.views[0].showGridLines, false);
assert.equal(ganttSheet.getCell('B3').value instanceof Date, true);
assert.equal(ganttSheet.getCell('F6').numFmt, 'ddd dd');
assert.equal(ganttSheet.getCell('I7').fill.type, 'pattern');
assert.equal((ganttSheet.getCell('I8').fill as { fgColor?: { argb?: string } }).fgColor?.argb, 'FFC2410C');
assert.equal(ganttSheet.getRow(8).outlineLevel, 1);

setActivePinia(createPinia());
const store = useEstimateStore();
const firstMacroId = store.estimate.items[0].id;
const secondMacroId = store.addMacro()!;
const subtaskId = store.addSubtask(firstMacroId)!;
assert.equal(store.estimate.items.findIndex((item) => item.id === subtaskId), 1);
assert.ok(store.estimate.items.findIndex((item) => item.id === subtaskId)
  < store.estimate.items.findIndex((item) => item.id === secondMacroId));

console.log('Gantt smoke tests passed');
