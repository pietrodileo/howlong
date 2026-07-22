import { formatTagsList } from './tagColors';
import type { Estimate } from '../models/estimate';
import type { Model } from '../models/model';
import type { Settings } from '../models/settings';
import { hoursToDays } from './rounding';
import {
  buildClientPresentedLines,
  buildClientPresentedTotals,
  filterLinesForClientOutput,
  sumClientOutputPresented,
} from './clientPresentation';
import { computeTotals, type EstimateTotals } from './contingency';

/** Formati export stima: backup app / AI / condivisione. */
export type EstimateExportFormat = 'json' | 'yaml' | 'xlsx';
export type ExportFormat = EstimateExportFormat;

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

/**
 * YAML semplice per AI / lettura.
 * Non è pensato per re-import in HowLong.
 */
/** YAML semplice per AI / lettura (non re-importabile). */
export async function estimateToAiYaml(estimate: Estimate, clientOnly = false): Promise<string> {
  const v = visibleLines(estimate, clientOnly);
  const byId = new Map(estimate.items.map((i) => [i.id, i.name]));
  const hpd = estimate.meta.hoursPerDay || 8;

  const items = v.lines.map((line) => {
    const presented = presentationHours(line);
    const base: Record<string, unknown> = {
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
    if (line.depth) base.level = 'sub';
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

/** Excel per condivisione con persone. */
export async function estimateToXlsx(estimate: Estimate, clientOnly = false): Promise<Uint8Array> {
  const ExcelJS = await import('exceljs');
  const v = visibleLines(estimate, clientOnly);
  const hpd = estimate.meta.hoursPerDay || 8;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HowLong?';
  const sheet = workbook.addWorksheet(clientOnly ? 'Client' : 'Estimate');

  sheet.addRow(['Title', v.title]);
  sheet.addRow(['Client', estimate.meta.clientLabel]);
  sheet.addRow(['Unit', estimate.meta.unit]);
  sheet.addRow(['Hours / day', hpd]);
  sheet.addRow(['Contingency %', estimate.contingency.percent]);
  if (clientOnly) sheet.addRow(['Rounding', estimate.clientView.roundingMode]);
  sheet.addRow([]);
  sheet.addRow([
    'Name',
    'Category',
    'Hours',
    'Days',
    'CTG (h)',
    'CTG (D)',
    'With CTG (h)',
    'With CTG (D)',
    'Presented (h)',
    'Presented (D)',
    'Notes',
  ]);

  for (const line of v.lines) {
    const presented = presentationHours(line);
    const notes =
      clientOnly && estimate.clientView.hideClientNotes ? '' : line.item.notes;
    const indent = line.depth ? '  ' : '';
    sheet.addRow([
      `${indent}${line.item.name}`,
      line.item.category,
      line.hoursBase,
      hoursToDays(line.hoursBase, hpd),
      line.hoursContingency,
      hoursToDays(line.hoursContingency, hpd),
      line.hoursWithContingency,
      hoursToDays(line.hoursWithContingency, hpd),
      presented,
      hoursToDays(presented, hpd),
      notes,
    ]);
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

  return workbookToBuffer(workbook);
}

/** Excel essenziale, pronto da condividere con il cliente. */
export async function estimateToClientXlsx(estimate: Estimate): Promise<Uint8Array> {
  const ExcelJS = await import('exceljs');
  const all = buildClientPresentedLines(estimate);
  const lines = filterLinesForClientOutput(all, estimate);
  const totalPresented = sumClientOutputPresented(lines);
  const hpd = estimate.meta.hoursPerDay || 8;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HowLong?';
  const sheet = workbook.addWorksheet('Client');
  sheet.addRow(['Title', estimate.clientView.titleOverride || estimate.meta.title]);
  sheet.addRow(['Client', estimate.meta.clientLabel]);
  sheet.addRow([]);
  sheet.addRow([
    'Activity',
    ...(!estimate.clientView.hideClientTags ? ['Tag'] : []),
    ...(!estimate.clientView.hideClientNotes ? ['Notes'] : []),
    'Hours',
    'Days',
  ]);
  for (const line of lines) {
    sheet.addRow([
      `${line.depth ? '  ' : ''}${line.item.name}`,
      ...(!estimate.clientView.hideClientTags ? [formatTagsList(line.item.tags)] : []),
      ...(!estimate.clientView.hideClientNotes ? [line.item.notes] : []),
      line.hoursPresented,
      hoursToDays(line.hoursPresented, hpd),
    ]);
  }
  sheet.addRow([]);
  sheet.addRow(['Total', ...(!estimate.clientView.hideClientTags ? [''] : []), ...(!estimate.clientView.hideClientNotes ? [''] : []), totalPresented, hoursToDays(totalPresented, hpd)]);
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
