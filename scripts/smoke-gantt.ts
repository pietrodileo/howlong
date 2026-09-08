import assert from 'node:assert/strict';
import { createEmptyEstimate } from '../src/domain/factory';
import { addDays, aggregateMacroRange, listDays } from '../src/domain/gantt';
import { estimateToClientXlsx, estimateToXlsx, ganttToXlsx } from '../src/platform/files/export';
import { parseEstimate } from '../src/models/estimate';
import { DEFAULT_SETTINGS } from '../src/models/settings';
import { createPinia, setActivePinia } from 'pinia';
import { useEstimateStore } from '../src/features/estimate/estimate';

const estimate = createEmptyEstimate(DEFAULT_SETTINGS);
const macro = estimate.items[0];
const first = { ...macro, id: 'sub-1', parentId: macro.id };
const second = { ...macro, id: 'sub-2', parentId: macro.id };
first.color = '#c2410c';
first.tags = ['Backend'];
first.notes = 'Internal note';
first.clientHoursOverride = 10 / 3;
estimate.items.push(first, second);
estimate.planning.items[first.id] = { startDate: '2026-09-04', endDate: '2026-09-08' };
estimate.planning.items[second.id] = { startDate: '2026-09-10', endDate: '2026-09-12' };

assert.deepEqual(aggregateMacroRange(estimate, macro), {
  startDate: '2026-09-04',
  endDate: '2026-09-12',
});
assert.equal(addDays('2026-09-04', 3), '2026-09-07');
assert.deepEqual(listDays('2026-09-04', '2026-09-07', false), ['2026-09-04', '2026-09-07']);
assert.deepEqual(listDays('2026-09-04', '2026-09-07', false, [0]), ['2026-09-04', '2026-09-05', '2026-09-07']);
assert.deepEqual(listDays('2026-09-04', '2026-09-07', false, [6]), ['2026-09-04', '2026-09-06', '2026-09-07']);

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
  to: '2026-09-07',
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
assert.equal(ganttSheet.getCell('F7').border.right?.style, 'thin');
assert.equal(ganttSheet.getCell('I7').fill.type, 'pattern');
assert.equal((ganttSheet.getCell('I8').fill as { fgColor?: { argb?: string } }).fgColor?.argb, 'FFC2410C');
assert.equal(ganttSheet.getRow(8).outlineLevel, 1);
assert.deepEqual(
  ganttSheet.getRow(6).values.slice(6).map((value) => (value as Date).toISOString().slice(0, 10)),
  ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-07'],
);

const weekendsShown = await ganttToXlsx({ ...estimate, planning: { items: {} } }, {
  from: '2026-09-04',
  to: '2026-09-07',
  scale: 'day',
  includeWeekends: true,
});
const weekendsWorkbook = new ExcelJS.Workbook();
await weekendsWorkbook.xlsx.load(weekendsShown as unknown as ArrayBuffer);
const weekendsSheet = weekendsWorkbook.getWorksheet('Gantt')!;
const timelineFills = weekendsSheet.getRow(7).values.slice(6).map((_, index) =>
  (weekendsSheet.getRow(7).getCell(6 + index).fill as { fgColor?: { argb?: string } }).fgColor?.argb,
);
assert.deepEqual(timelineFills, [undefined, 'FFF3F5F8', 'FFF3F5F8', undefined]);

for (const [bytes, sheetName] of [
  [await estimateToXlsx(estimate), 'Estimate'],
  [await estimateToClientXlsx(estimate), 'Client'],
] as const) {
  const styledWorkbook = new ExcelJS.Workbook();
  await styledWorkbook.xlsx.load(bytes as unknown as ArrayBuffer);
  const styledSheet = styledWorkbook.getWorksheet(sheetName)!;
  const macroRow = styledSheet.getColumn(1).values.findIndex((value) => value === macro.name);
  const subRow = styledSheet.getColumn(1).values.findIndex((value) => value === `  ${first.name}`);
  assert.equal((styledSheet.getRow(macroRow).getCell(1).fill as { fgColor?: { argb?: string } }).fgColor?.argb, 'FFDCE6F1');
  assert.equal((styledSheet.getRow(subRow).getCell(1).fill as { fgColor?: { argb?: string } }).fgColor?.argb, 'FFF4F7FA');
}

const estimateWorkbook = new ExcelJS.Workbook();
await estimateWorkbook.xlsx.load(await estimateToXlsx(estimate) as unknown as ArrayBuffer);
const estimateSheet = estimateWorkbook.getWorksheet('Estimate')!;
const estimateHeaders = estimateSheet.getRow(7).values.slice(1);
assert.ok(estimateHeaders.includes('Tags'));
assert.ok(estimateHeaders.includes('Notes'));
const estimateSubRow = estimateSheet.getColumn(1).values.findIndex((value) => value === `  ${first.name}`);
assert.equal(estimateSheet.getRow(estimateSubRow).getCell(estimateHeaders.indexOf('Tags') + 1).value, 'Backend');
assert.equal(estimateSheet.getRow(estimateSubRow).getCell(estimateHeaders.indexOf('Notes') + 1).value, 'Internal note');

const managerWorkbook = new ExcelJS.Workbook();
await managerWorkbook.xlsx.load(await estimateToXlsx(estimate, 'manager') as unknown as ArrayBuffer);
const managerSheet = managerWorkbook.getWorksheet('Manager')!;
const managerHeaders = managerSheet.getRow(8).values.slice(1);
assert.ok(managerHeaders.includes('Tags'));
assert.ok(managerHeaders.includes('Notes'));
const managerSubRow = managerSheet.getColumn(1).values.findIndex((value) => value === `  ${first.name}`);
assert.equal(managerSheet.getRow(managerSubRow).getCell(managerHeaders.indexOf('Tags') + 1).value, 'Backend');
assert.equal(managerSheet.getRow(managerSubRow).getCell(managerHeaders.indexOf('Notes') + 1).value, 'Internal note');

const hiddenManagerWorkbook = new ExcelJS.Workbook();
await hiddenManagerWorkbook.xlsx.load(await estimateToXlsx({
  ...estimate,
  clientView: { ...estimate.clientView, hideManagerTags: true, hideManagerNotes: true },
}, 'manager') as unknown as ArrayBuffer);
const hiddenManagerHeaders = hiddenManagerWorkbook.getWorksheet('Manager')!.getRow(8).values.slice(1);
assert.equal(hiddenManagerHeaders.includes('Tags'), false);
assert.equal(hiddenManagerHeaders.includes('Notes'), false);

const clientWorkbook = new ExcelJS.Workbook();
await clientWorkbook.xlsx.load(await estimateToClientXlsx(estimate) as unknown as ArrayBuffer);
const clientSheet = clientWorkbook.getWorksheet('Client')!;
const clientHeaders = clientSheet.getRow(4).values.slice(1);
const clientSubRow = clientSheet.getColumn(1).values.findIndex((value) => value === `  ${first.name}`);
assert.equal(clientSheet.getRow(clientSubRow).getCell(clientHeaders.indexOf('Hours') + 1).numFmt, '0.##');
assert.equal(clientSheet.getRow(clientSubRow).getCell(clientHeaders.indexOf('Days') + 1).numFmt, '0.##');

setActivePinia(createPinia());
const store = useEstimateStore();
const firstMacroId = store.estimate.items[0].id;
const secondMacroId = store.addMacro()!;
const subtaskId = store.addSubtask(firstMacroId)!;
assert.equal(store.estimate.items.findIndex((item) => item.id === subtaskId), 1);
assert.ok(store.estimate.items.findIndex((item) => item.id === subtaskId)
  < store.estimate.items.findIndex((item) => item.id === secondMacroId));

console.log('Gantt smoke tests passed');
