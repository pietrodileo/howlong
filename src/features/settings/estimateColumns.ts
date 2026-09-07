/** Colonne Stima selezionabili (Nome resta sempre visibile). */
export const ESTIMATE_TOGGLEABLE_COLUMNS = [
  'category',
  'base',
  'applyCtg',
  'ctg',
  'withCtg',
  'override',
  'tags',
  'notes',
  'actions',
] as const;

export type EstimateToggleableColumn = (typeof ESTIMATE_TOGGLEABLE_COLUMNS)[number];

export const DEFAULT_ESTIMATE_COLUMN_VISIBILITY: Record<EstimateToggleableColumn, boolean> = {
  category: true,
  base: true,
  applyCtg: true,
  ctg: true,
  withCtg: true,
  override: true,
  tags: true,
  notes: true,
  actions: true,
};

export const ESTIMATE_COLUMNS_STORAGE_KEY = 'howlong.visibleColumns';
