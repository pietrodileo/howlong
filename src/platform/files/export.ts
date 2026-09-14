import { formatTagsList } from '../../shared/tagColors';
import type { Estimate } from '../../models/estimate';
import type { Model } from '../../models/model';
import type { Settings } from '../../models/settings';
import { hoursToDays } from '../../domain/rounding';
import {
  buildClientPresentedLines,
  buildClientPresentedTotals,
  filterLinesForClientOutput,
  sumClientOutputPresented,
} from '../../features/estimate/clientPresentation';
import { computeTotals, type EstimateTotals } from '../../domain/contingency';
import {
  ACTIVITY_STATUS_COLORS,
  aggregateMacroRange,
  aggregateMacroStatus,
  addMonths,
  listDays,
  monthEnd,
  monthStart,
} from '../../domain/gantt';

/** Formati export stima: backup app / AI / condivisione. */
export type EstimateExportFormat = 'json' | 'yaml' | 'xlsx';
export type ExportFormat = EstimateExportFormat;
export type EstimateXlsxView = 'estimate' | 'manager';

function presentationHours(line: { hoursWithContingency: number; hoursPresented?: number }): number {
  return line.hoursPresented ?? line.hoursWithContingency;
}

function visibleLines(estimate: Estimate, clientOnly: boolean) {
  if (clientOnly) {
    const all = buildClientPresentedLines(estimate);
    const lines = filterLinesForClientOutput(all, estimate);
    const totals = buildClientPresentedTotals(all);
    const totalPresented = sumClientOutputPresented(lines);
    return {
      lines,
      totalBase: totals.totalBase,
      totalContingency: totals.totalContingency,
      totalWithContingency: totals.totalWithContingency,
      totalPresented,
      title: estimate.clientView.titleOverride || estimate.meta.title,
    };
  }

  const totals = computeTotals(estimate);
  const totalBase = totals.lines
    .filter((l) => l.contributesToTotals)
    .reduce((s, l) => s + l.hoursBase, 0);
  const totalContingency = totals.lines
    .filter((l) => l.contributesToTotals)
    .reduce((s, l) => s + l.hoursContingency, 0);

  return {
    lines: totals.lines,
    totalBase,
    totalContingency,
    totalWithContingency: totalBase + totalContingency,
    totalPresented: totalBase + totalContingency,
    title: estimate.meta.title,
  };
}

/** Backup / ripristino HowLong — schema Estimate puro. */
export function estimateToJson(estimate: Estimate): string {
  return JSON.stringify(estimate, null, 2);
}

type AiYamlItem = Record<string, unknown>;

type NestableLine = {
  item: { id: string; parentId: string | null };
  depth: number;
};

/** Flat computed lines → tree: macro at root, sub under `items`. */
function nestAiYamlItems<T extends NestableLine>(
  lines: T[],
  toItem: (line: T) => AiYamlItem,
): AiYamlItem[] {
  const roots: AiYamlItem[] = [];
  const byId = new Map<string, AiYamlItem>();
  const pendingSubs: { parentId: string; item: AiYamlItem }[] = [];

  for (const line of lines) {
    const node = toItem(line);
    byId.set(line.item.id, node);
    const parentId = line.item.parentId;
    if (parentId && line.depth) {
      pendingSubs.push({ parentId, item: node });
    } else {
      roots.push(node);
    }
  }

  for (const { parentId, item } of pendingSubs) {
    const parent = byId.get(parentId);
    if (!parent) {
      roots.push(item);
      continue;
    }
    const kids = (parent.items as AiYamlItem[] | undefined) ?? [];
    kids.push(item);
    parent.items = kids;
  }

  return roots;
}

/**
 * YAML semplice per AI / lettura.
 * Non è pensato per re-import in HowLong.
 * Macro in `items`; sotto-task annidati in `items` della macro (niente `level`).
 */
export async function estimateToAiYaml(estimate: Estimate, clientOnly = false): Promise<string> {
  const v = visibleLines(estimate, clientOnly);
  const byId = new Map(estimate.items.map((i) => [i.id, i.name]));
  const hpd = estimate.meta.hoursPerDay || 8;

  const items = nestAiYamlItems(v.lines, (line) => {
    const presented = presentationHours(line);
    const base: AiYamlItem = {
      name: line.item.name,
      category: line.item.category,
      hours: line.hoursBase,
      days: hoursToDays(line.hoursBase, hpd),
      contingency: line.hoursContingency,
      contingencyDays: hoursToDays(line.hoursContingency, hpd),
      withContingency: line.hoursWithContingency,
      withContingencyDays: hoursToDays(line.hoursWithContingency, hpd),
      presented,
      presentedDays: hoursToDays(presented, hpd),
    };
    if (line.isFormula || line.item.kind === 'formula') {
      base.kind = 'calculated';
      if (line.item.formula) {
        base.percent = line.item.formula.percent;
        base.aggregate = line.item.formula.aggregate ?? 'sum';
        base.of = line.item.formula.sourceIds.map((id) => byId.get(id) ?? id);
      }
    }
    const notes =
      clientOnly && estimate.clientView.hideClientNotes ? '' : line.item.notes;
    if (notes) base.notes = notes;
    return base;
  });

  const doc = {
    _note: 'HowLong? — readable export for AI / sharing. Not for re-import into the app.',
    title: v.title,
    client: estimate.meta.clientLabel || null,
    unit: estimate.meta.unit,
    hoursPerDay: hpd,
    contingencyPercent: estimate.contingency.percent,
    rounding: clientOnly ? estimate.clientView.roundingMode : undefined,
    totals: {
      base: v.totalBase,
      baseDays: hoursToDays(v.totalBase, hpd),
      contingency: v.totalContingency,
      contingencyDays: hoursToDays(v.totalContingency, hpd),
      withContingency: v.totalWithContingency,
      withContingencyDays: hoursToDays(v.totalWithContingency, hpd),
      presented: v.totalPresented,
      presentedDays: hoursToDays(v.totalPresented, hpd),
    },
    items,
  };

  const { stringify } = await import('yaml');
  return stringify(doc);
}

/** YAML essenziale, pronto da condividere con il cliente. */
export async function estimateToClientYaml(estimate: Estimate): Promise<string> {
  const all = buildClientPresentedLines(estimate);
  const lines = filterLinesForClientOutput(all, estimate);
  const totalPresented = sumClientOutputPresented(lines);
  const hpd = estimate.meta.hoursPerDay || 8;
  const { stringify } = await import('yaml');
  return stringify({
    title: estimate.clientView.titleOverride || estimate.meta.title,
    client: estimate.meta.clientLabel || null,
    total: { hours: totalPresented, days: hoursToDays(totalPresented, hpd) },
    activities: lines.map((line) => ({
      activity: line.item.name,
      ...(estimate.clientView.hideClientTags ? {} : { tags: line.item.tags?.length ? line.item.tags : undefined }),
      ...(estimate.clientView.hideClientNotes ? {} : { notes: line.item.notes || undefined }),
      hours: line.hoursPresented,
      days: hoursToDays(line.hoursPresented, hpd),
    })),
  });
}

async function workbookToBuffer(workbook: {
  xlsx: { writeBuffer: () => Promise<ArrayBuffer> };
}): Promise<Uint8Array> {
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}

async function loadExcelJs() {
  const module = await import('exceljs');
  return module.default ?? module;
}

export type GanttExportOptions = {
  from: string;
  to: string;
  scale: 'day' | 'month';
  includeWeekends: boolean;
  weekendDays?: number[];
};

/** Convert an ISO calendar date without shifting it across time zones. */
function excelDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

/** Gantt colorato, separato dai calcoli di effort. */
export async function ganttToXlsx(estimate: Estimate, options: GanttExportOptions): Promise<Uint8Array> {
  const ExcelJS = await loadExcelJs();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HowLong?';
  const sheet = workbook.addWorksheet('Gantt', {
    properties: { defaultRowHeight: 20, tabColor: { argb: 'FF2B3D55' } },
    views: [{ state: 'frozen', xSplit: 8, ySplit: 6, topLeftCell: 'I7', activeCell: 'I7', showGridLines: false, zoomScale: 90 }],
    pageSetup: {
      orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0,
      paperSize: 9, printTitlesRow: '1:6', printTitlesColumn: '1:8',
      margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
    headerFooter: {
      oddFooter: '&LHowLong?&CPage &P of &N&R&D',
    },
  });
  const palette = [
    ['2B3D55', 'C9D4E3'], ['5B4B73', 'D9D0E5'], ['35605A', 'C9DFDB'],
    ['8A5A44', 'E7D4C8'], ['546A3A', 'D8E2C8'], ['7A4A5A', 'E5CDD5'],
  ];
  const items = estimate.items.filter((item) => item.kind !== 'formula' && item.kind !== 'summary');
  const macros = items.filter((item) => item.parentId == null);
  const slots: { label: Date; from: string; to: string }[] = [];
  if (options.scale === 'day') {
    for (const day of listDays(options.from, options.to, options.includeWeekends, options.weekendDays)) {
      slots.push({ label: excelDate(day), from: day, to: day });
    }
  } else {
    for (let month = monthStart(options.from); month <= options.to; month = addMonths(month, 1)) {
      slots.push({ label: excelDate(month), from: month, to: monthEnd(month) });
    }
  }

  sheet.addRow([estimate.meta.title]);
  sheet.mergeCells(1, 1, 1, Math.max(8, 8 + slots.length));
  sheet.getRow(1).height = 30;
  sheet.getCell('A1').font = { name: 'Arial', bold: true, size: 18, color: { argb: 'FF2B3D55' } };
  sheet.getCell('A1').alignment = { vertical: 'middle' };
  sheet.addRow(['Client', estimate.meta.clientLabel || '—']);
  sheet.addRow(['Range', excelDate(options.from), excelDate(options.to)]);
  sheet.addRow(['Scale', options.scale === 'day' ? 'Days' : 'Months', 'Weekends', options.includeWeekends ? 'Shown' : 'Hidden']);
  sheet.addRow(['Legend', 'Macro / aggregate', 'Planned activity', 'To schedule']);
  sheet.getRow(3).getCell(2).numFmt = 'dd mmm yyyy';
  sheet.getRow(3).getCell(3).numFmt = 'dd mmm yyyy';
  sheet.getRow(5).getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${palette[0][0]}` } };
  sheet.getRow(5).getCell(2).font = { color: { argb: 'FFFFFFFF' }, bold: true };
  sheet.getRow(5).getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${palette[0][1]}` } };
  sheet.getRow(5).getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F4F7' } };
  // Row five has room above the timeline without changing frozen rows or filters.
  if (options.scale === 'day') {
    for (let start = 0; start < slots.length;) {
      let end = start;
      const month = slots[start].from.slice(0, 7);
      while (end + 1 < slots.length && slots[end + 1].from.slice(0, 7) === month) end += 1;
      if (end > start) sheet.mergeCells(5, 9 + start, 5, 9 + end);
      const monthCell = sheet.getRow(5).getCell(9 + start);
      monthCell.value = slots[start].label;
      monthCell.numFmt = 'mmmm yyyy';
      monthCell.font = { name: 'Arial', bold: true, color: { argb: 'FF2B3D55' } };
      monthCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCEBFE' } };
      monthCell.alignment = { horizontal: 'center', vertical: 'middle' };
      start = end + 1;
    }
  }
  const header = sheet.addRow(['Activity', 'Macro', 'Start', 'End', 'Planning', 'Status', 'Notes', 'Owner', ...slots.map((slot) => slot.label)]);
  header.height = 32;
  header.eachCell((cell) => {
    cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2B3D55' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      right: { style: 'thin', color: { argb: 'FF52657E' } },
      bottom: { style: 'medium', color: { argb: 'FF1E2E43' } },
    };
  });
  for (let index = 0; index < slots.length; index += 1) {
    header.getCell(9 + index).numFmt = options.scale === 'day' ? 'ddd dd' : 'mmm yyyy';
  }

  for (const [macroIndex, macro] of macros.entries()) {
    const children = items.filter((item) => item.parentId === macro.id);
    for (const item of [macro, ...children]) {
      const aggregate = item.id === macro.id && children.length > 0;
      const range = aggregate ? aggregateMacroRange(estimate, macro) : estimate.planning.items[item.id] ?? null;
      const activityStatus = aggregate ? aggregateMacroStatus(estimate, macro) : item.status;
      const row = sheet.addRow([
        `${item.parentId ? '  ' : ''}${item.name}`,
        item.parentId ? macro.name : '',
        range ? excelDate(range.startDate) : '',
        range ? excelDate(range.endDate) : '',
        range ? (aggregate ? 'Aggregate' : 'Planned') : 'To schedule',
        activityStatus.replace(/-/g, ' '),
        item.notes,
        item.owner ?? '',
        ...slots.map(() => ''),
      ]);
      row.height = 22;
      const [macroColor, subColor] = palette[macroIndex % palette.length];
      const barColor = item.color?.slice(1).toUpperCase() ?? (item.parentId ? subColor : macroColor);
      row.outlineLevel = item.parentId ? 1 : 0;
      row.getCell(1).font = { name: 'Arial', bold: !item.parentId, color: { argb: 'FF202938' } };
      row.getCell(2).font = { name: 'Arial', color: { argb: 'FF667085' } };
      row.getCell(3).numFmt = 'dd mmm yyyy';
      row.getCell(4).numFmt = 'dd mmm yyyy';
      if (!item.parentId) {
        for (let index = 1; index <= 8; index += 1) {
          row.getCell(index).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F8FA' } };
        }
      }
      const statusCell = row.getCell(5);
      statusCell.font = { name: 'Arial', italic: !range, color: { argb: range ? 'FF344054' : 'FF8A5A44' } };
      if (!range) statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF4E5' } };
      row.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${ACTIVITY_STATUS_COLORS[activityStatus].slice(1).toUpperCase()}` } };
      row.getCell(6).font = { name: 'Arial', color: { argb: 'FFFFFFFF' } };
      for (let index = 0; index < slots.length; index += 1) {
        const slot = slots[index];
        const timelineCell = row.getCell(9 + index);
        const planned = range && range.startDate <= slot.to && range.endDate >= slot.from;
        if (planned) {
          timelineCell.fill = {
            type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${barColor}` },
          };
        } else if (options.scale === 'day' && (options.weekendDays ?? [0, 6]).includes(slot.label.getUTCDay())) {
          timelineCell.fill = {
            type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F5F8' },
          };
        }
        timelineCell.border = {
          right: { style: 'thin', color: { argb: 'FFD1D7E0' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D7E0' } },
        };
      }
      row.eachCell({ includeEmpty: true }, (cell) => {
        if (Number(cell.col) <= 8) cell.border = {
          right: { style: 'thin', color: { argb: 'FFE3E7ED' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D7E0' } },
        };
        cell.alignment = { vertical: 'middle', wrapText: false };
        if (!cell.font?.name) cell.font = { ...cell.font, name: 'Arial' };
      });
    }
  }

  if (!macros.length) {
    const empty = sheet.addRow(['No activities']);
    empty.getCell(1).font = { name: 'Arial', italic: true, color: { argb: 'FF667085' } };
  }

  sheet.columns = [
    { width: 34 }, { width: 24 }, { width: 13 }, { width: 13 }, { width: 14 }, { width: 14 }, { width: 30 }, { width: 22 },
    ...slots.map(() => ({ width: options.scale === 'day' ? 8 : 12 })),
  ];
  sheet.getColumn(3).alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getColumn(4).alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getColumn(5).alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getColumn(6).alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.autoFilter = { from: { row: 6, column: 1 }, to: { row: 6, column: 8 } };
  return workbookToBuffer(workbook);
}

/** Builds the estimator or manager workbook with the fields visible in that view. */
export async function estimateToXlsx(
  estimate: Estimate,
  view: EstimateXlsxView = 'estimate',
): Promise<Uint8Array> {
  const ExcelJS = await loadExcelJs();
  const isManager = view === 'manager';
  const includeTags = !isManager || !estimate.clientView.hideManagerTags;
  const includeNotes = !isManager || !estimate.clientView.hideManagerNotes;
  const v = visibleLines(estimate, isManager);
  const hpd = estimate.meta.hoursPerDay || 8;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HowLong?';
  const sheet = workbook.addWorksheet(isManager ? 'Manager' : 'Estimate', {
    views: [{ state: 'frozen', ySplit: isManager ? 8 : 7, showGridLines: false }],
  });

  sheet.addRow(['Title', v.title]);
  sheet.addRow(['Client', estimate.meta.clientLabel]);
  sheet.addRow(['Unit', estimate.meta.unit]);
  sheet.addRow(['Hours / day', hpd]);
  sheet.addRow(['Contingency %', estimate.contingency.percent]);
  if (isManager) sheet.addRow(['Rounding', estimate.clientView.roundingMode]);
  sheet.addRow([]);
  const header = sheet.addRow([
    'Name',
    'Category',
    ...(includeTags ? ['Tags'] : []),
    'Hours',
    'Days',
    'CTG (h)',
    'CTG (D)',
    'With CTG (h)',
    'With CTG (D)',
    'Presented (h)',
    'Presented (D)',
    ...(includeNotes ? ['Notes'] : []),
  ]);

  header.height = 26;
  header.eachCell((cell) => {
    cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2B3D55' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  for (let rowIndex = 1; rowIndex <= (isManager ? 6 : 5); rowIndex += 1) {
    const row = sheet.getRow(rowIndex);
    row.getCell(1).font = { name: 'Arial', bold: true, color: { argb: 'FF2B3D55' } };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEF5' } };
  }

  for (const line of v.lines) {
    const presented = presentationHours(line);
    const indent = line.depth ? '  ' : '';
    const row = sheet.addRow([
      `${indent}${line.item.name}`,
      line.item.category,
      ...(includeTags ? [formatTagsList(line.item.tags)] : []),
      line.hoursBase,
      hoursToDays(line.hoursBase, hpd),
      line.hoursContingency,
      hoursToDays(line.hoursContingency, hpd),
      line.hoursWithContingency,
      hoursToDays(line.hoursWithContingency, hpd),
      presented,
      hoursToDays(presented, hpd),
      ...(includeNotes ? [line.item.notes] : []),
    ]);
    row.outlineLevel = line.depth ? 1 : 0;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: line.depth ? 'FFF4F7FA' : 'FFDCE6F1' },
      };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFD6DCE5' } } };
      cell.alignment = { vertical: 'middle' };
    });
    row.getCell(1).font = { name: 'Arial', bold: !line.depth, color: { argb: 'FF202938' } };
  }

  sheet.addRow([]);
  sheet.addRow(['Total base (h)', v.totalBase, 'Total base (D)', hoursToDays(v.totalBase, hpd)]);
  sheet.addRow([
    'Total CTG (h)',
    v.totalContingency,
    'Total CTG (D)',
    hoursToDays(v.totalContingency, hpd),
  ]);
  sheet.addRow([
    'Total with CTG (h)',
    v.totalWithContingency,
    'Total with CTG (D)',
    hoursToDays(v.totalWithContingency, hpd),
  ]);
  sheet.addRow([
    'Total presented (h)',
    v.totalPresented,
    'Total presented (D)',
    hoursToDays(v.totalPresented, hpd),
  ]);

  sheet.columns = [
    { width: 34 }, { width: 18 }, ...(includeTags ? [{ width: 24 }] : []),
    { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 15 },
    { width: 15 }, { width: 16 }, { width: 16 }, ...(includeNotes ? [{ width: 38 }] : []),
  ];
  sheet.autoFilter = {
    from: { row: header.number, column: 1 },
    to: { row: header.number, column: header.cellCount },
  };
  return workbookToBuffer(workbook);
}

/** Excel essenziale, pronto da condividere con il cliente. */
export async function estimateToClientXlsx(estimate: Estimate): Promise<Uint8Array> {
  const ExcelJS = await loadExcelJs();
  const all = buildClientPresentedLines(estimate);
  const lines = filterLinesForClientOutput(all, estimate);
  const totalPresented = sumClientOutputPresented(lines);
  const hpd = estimate.meta.hoursPerDay || 8;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HowLong?';
  const sheet = workbook.addWorksheet('Client', {
    views: [{ state: 'frozen', ySplit: 4, showGridLines: false }],
  });
  sheet.addRow(['Title', estimate.clientView.titleOverride || estimate.meta.title]);
  sheet.addRow(['Client', estimate.meta.clientLabel]);
  sheet.addRow([]);
  const header = sheet.addRow([
    'Activity',
    ...(!estimate.clientView.hideClientTags ? ['Tag'] : []),
    ...(!estimate.clientView.hideClientNotes ? ['Notes'] : []),
    'Hours',
    'Days',
  ]);
  const hoursColumn = header.cellCount - 1;
  const daysColumn = header.cellCount;
  header.height = 26;
  header.eachCell((cell) => {
    cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2B3D55' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  for (let rowIndex = 1; rowIndex <= 2; rowIndex += 1) {
    const row = sheet.getRow(rowIndex);
    row.getCell(1).font = { name: 'Arial', bold: true, color: { argb: 'FF2B3D55' } };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEF5' } };
  }
  for (const line of lines) {
    const row = sheet.addRow([
      `${line.depth ? '  ' : ''}${line.item.name}`,
      ...(!estimate.clientView.hideClientTags ? [formatTagsList(line.item.tags)] : []),
      ...(!estimate.clientView.hideClientNotes ? [line.item.notes] : []),
      line.hoursPresented,
      hoursToDays(line.hoursPresented, hpd),
    ]);
    row.outlineLevel = line.depth ? 1 : 0;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: line.depth ? 'FFF4F7FA' : 'FFDCE6F1' },
      };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFD6DCE5' } } };
      cell.alignment = { vertical: 'middle' };
    });
    row.getCell(1).font = { name: 'Arial', bold: !line.depth, color: { argb: 'FF202938' } };
    row.getCell(hoursColumn).numFmt = '0.##';
    row.getCell(daysColumn).numFmt = '0.##';
  }
  sheet.addRow([]);
  const total = sheet.addRow(['Total', ...(!estimate.clientView.hideClientTags ? [''] : []), ...(!estimate.clientView.hideClientNotes ? [''] : []), totalPresented, hoursToDays(totalPresented, hpd)]);
  total.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { name: 'Arial', bold: true, color: { argb: 'FF2B3D55' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEF5' } };
  });
  total.getCell(hoursColumn).numFmt = '0.##';
  total.getCell(daysColumn).numFmt = '0.##';
  const columnCount = header.cellCount;
  sheet.columns = Array.from({ length: columnCount }, (_, index) => ({
    width: index === 0 ? 34 : index >= columnCount - 2 ? 12 : 30,
  }));
  sheet.autoFilter = { from: { row: header.number, column: 1 }, to: { row: header.number, column: columnCount } };
  return workbookToBuffer(workbook);
}

export function modelToJson(model: Model): string {
  return JSON.stringify(model, null, 2);
}

export function settingsToJson(settings: Settings): string {
  return JSON.stringify(settings, null, 2);
}

export function extensionFor(format: EstimateExportFormat): string {
  return format === 'xlsx' ? 'xlsx' : format;
}

export function mimeFilters(format: EstimateExportFormat): { name: string; extensions: string[] }[] {
  switch (format) {
    case 'json':
      return [{ name: 'HowLong JSON', extensions: ['json'] }];
    case 'yaml':
      return [{ name: 'YAML', extensions: ['yaml', 'yml'] }];
    case 'xlsx':
      return [{ name: 'Excel', extensions: ['xlsx'] }];
  }
}

export type { EstimateTotals };
