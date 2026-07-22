import { parseEstimate, type Estimate, type LineItem } from '../models/estimate';
import {
  parseModel,
  type Model,
  type MacroActivity,
  type FormulaAggregate,
} from '../models/model';
import { parseSettings, type Settings } from '../models/settings';
import { resolveAppliesContingency } from './applyContingency';
import { toErrorMessage } from './errors';
import { newId, nowIso } from './ids';

function parseAggregate(raw: string | undefined): FormulaAggregate {
  const a = (raw || 'sum').toLowerCase();
  return a === 'avg' || a === 'min' || a === 'max' || a === 'sum' ? a : 'sum';
}

function tryJson(text: string): unknown {
  return JSON.parse(text);
}

async function tryYaml(text: string): Promise<unknown> {
  const { parse } = await import('yaml');
  return parse(text);
}

export async function importSettingsText(
  text: string,
): Promise<{ ok: true; data: Settings } | { ok: false; error: string }> {
  let data: unknown;
  try {
    data = text.trim().startsWith('{') ? tryJson(text) : await tryYaml(text);
  } catch (e) {
    return { ok: false, error: `File non valido: ${toErrorMessage(e)}` };
  }
  return parseSettings(data);
}

export async function importModelText(
  text: string,
): Promise<{ ok: true; data: Model } | { ok: false; error: string }> {
  let data: unknown;
  try {
    data =
      text.trim().startsWith('{') || text.trim().startsWith('[')
        ? tryJson(text)
        : await tryYaml(text);
  } catch (e) {
    return { ok: false, error: `File modello non valido: ${toErrorMessage(e)}` };
  }
  return parseModel(data);
}

export async function importEstimateText(
  text: string,
  hint?: 'json' | 'yaml' | 'csv',
): Promise<{ ok: true; data: Estimate } | { ok: false; error: string }> {
  const trimmed = text.trim();
  try {
    if (hint === 'csv' || (!hint && !trimmed.startsWith('{') && !trimmed.includes('schemaVersion'))) {
      return importEstimateCsv(text);
    }
    const data =
      hint === 'yaml' ||
      (!trimmed.startsWith('{') && (trimmed.includes(':') || trimmed.startsWith('---')))
        ? await tryYaml(text)
        : tryJson(text);

    if (data && typeof data === 'object' && 'schemaVersion' in (data as object)) {
      const obj = { ...(data as Record<string, unknown>) };
      delete obj.computed;
      delete obj.view;
      return parseEstimate(obj);
    }
    return parseEstimate(data);
  } catch (e) {
    return { ok: false, error: `Stima non valida: ${toErrorMessage(e)}` };
  }
}

function parseFormulaFromRow(row: Record<string, string>): LineItem['formula'] | undefined {
  const kind = row.kind || 'operational';
  if (kind !== 'formula') return undefined;
  const percent = Number(row.formulaPercent);
  const sourceIds = (row.formulaSources || '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
  const aggregate = parseAggregate(row.formulaAggregate);
  return {
    percent: Number.isFinite(percent) ? percent : 0,
    sourceIds,
    aggregate,
    includeFormulaSources: row.formulaInclude === '1' || row.formulaInclude === 'true',
    applyGlobalContingency: row.formulaApplyCtg === '1' || row.formulaApplyCtg === 'true',
  };
}

async function importEstimateCsv(
  text: string,
): Promise<{ ok: true; data: Estimate } | { ok: false; error: string }> {
  const Papa = (await import('papaparse')).default;
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) {
    return { ok: false, error: parsed.errors.map((e) => e.message).join('; ') };
  }
  const items: LineItem[] = parsed.data.map((row, i) => {
    const kind = (row.kind as LineItem['kind']) || 'operational';
    const formula = parseFormulaFromRow(row);
    return {
      id: row.id || String(i + 1),
      name: row.name || `Voce ${i + 1}`,
      hours: Number(row.hoursBase ?? row.hours ?? 0) || 0,
      category: row.category || 'Generale',
      kind,
      parentId: row.parentId?.trim() ? row.parentId.trim() : null,
      contingencyPercentOverride:
        row.contingencyPercentApplied !== undefined &&
        row.contingencyPercentApplied !== '' &&
        kind !== 'formula'
          ? Number(row.contingencyPercentApplied)
          : null,
      notes: row.notes || '',
      tags: (row.tags || row.tag || '')
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean),
      clientVisible: row.clientVisible !== 'false' && row.clientVisible !== '0',
      applyContingency: resolveAppliesContingency({
        kind,
        applyContingency:
          row.applyContingency === '0' || row.applyContingency === 'false'
            ? false
            : row.applyContingency === '1' || row.applyContingency === 'true'
              ? true
              : undefined,
        formula,
      }),
      ...(formula ? { formula } : {}),
    };
  });

  const now = nowIso();
  const estimate: Estimate = {
    schemaVersion: 1,
    meta: {
      id: newId('est'),
      title: 'Stima importata CSV',
      clientLabel: '',
      createdAt: now,
      updatedAt: now,
      unit: 'hours',
      hoursPerDay: 8,
      icon: 'letter',
    },
    contingency: {
      percent: 20,
      mode: 'project',
      targetCategories: [],
      placement: 'both',
    },
    items,
    tagOptions: [],
    clientView: {
      roundingMode: 'none',
      hideManagerNotes: false,
      hideManagerTags: false,
      hideClientNotes: true,
      hideClientTags: false,
      titleOverride: '',
      lineOverrides: {},
    },
  };
  return parseEstimate(estimate);
}

export async function importEstimateXlsx(buffer: ArrayBuffer): Promise<
  { ok: true; data: Estimate } | { ok: false; error: string }
> {
  try {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) return { ok: false, error: 'Foglio Excel vuoto' };

    const rows: Record<string, string>[] = [];
    let header: string[] | null = null;
    sheet.eachRow((row) => {
      const values = row.values as Array<string | number | undefined>;
      const cells = values.slice(1).map((v) => (v == null ? '' : String(v)));
      if (!header) {
        if (cells[0] === 'id' || cells.includes('hoursBase')) {
          header = cells;
        }
        return;
      }
      const obj: Record<string, string> = {};
      header.forEach((h, i) => {
        obj[h] = cells[i] ?? '';
      });
      if (obj.id || obj.name) rows.push(obj);
    });

    if (!header || rows.length === 0) {
      return { ok: false, error: 'Nessuna riga voce trovata nel file XLSX' };
    }

    const Papa = (await import('papaparse')).default;
    const csv = Papa.unparse(rows);
    return importEstimateCsv(csv);
  } catch (e) {
    return { ok: false, error: `XLSX non valido: ${toErrorMessage(e)}` };
  }
}

export async function importModelCsv(
  text: string,
): Promise<{ ok: true; data: Model } | { ok: false; error: string }> {
  const Papa = (await import('papaparse')).default;
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) {
    return { ok: false, error: parsed.errors.map((e) => e.message).join('; ') };
  }
  const macroActivities: MacroActivity[] = parsed.data.map((row, i) => {
    const kind = (row.kind as MacroActivity['kind']) || 'operational';
    const formula =
      kind === 'formula'
        ? {
            percent: Number(row.formulaPercent) || 0,
            sourceIds: (row.formulaSources || '')
              .split('|')
              .map((s) => s.trim())
              .filter(Boolean),
            aggregate: parseAggregate(row.formulaAggregate),
            includeFormulaSources: row.formulaInclude === '1' || row.formulaInclude === 'true',
            applyGlobalContingency: row.formulaApplyCtg === '1' || row.formulaApplyCtg === 'true',
          }
        : undefined;
    return {
      id: row.id || String(i + 1),
      name: row.name || `Macro ${i + 1}`,
      category: row.category || 'Generale',
      tags: (row.tags || row.tag || '')
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean),
      defaultHours: Number(row.defaultHours ?? 0) || 0,
      kind,
      parentId: row.parentId?.trim() ? row.parentId.trim() : null,
      applyContingency: resolveAppliesContingency({
        kind,
        applyContingency:
          row.applyContingency === '0' || row.applyContingency === 'false'
            ? false
            : row.applyContingency === '1' || row.applyContingency === 'true'
              ? true
              : undefined,
        formula,
      }),
      ...(formula ? { formula } : {}),
    };
  });
  const categories = [...new Set(macroActivities.map((m) => m.category))];
  return parseModel({
    schemaVersion: 1,
    id: newId('mod'),
    name: 'Modello importato',
    macroActivities,
    categories,
    tagOptions: [],
    contingency: {
      defaultPercent: 20,
      mode: 'project',
      targetCategories: [],
      placement: 'both',
    },
  });
}
