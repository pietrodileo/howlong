/** Columns that can be configured for the Manager presentation table. */
export const MANAGER_PRESENTATION_COLUMNS = [
  'show',
  'name',
  'category',
  'owner',
  'tags',
  'base',
  'ctg',
  'withCtg',
  'presented',
  'delta',
  'notes',
  'actions',
] as const;

export type ManagerPresentationColumn = (typeof MANAGER_PRESENTATION_COLUMNS)[number];

/** Manager columns excluding the required activity-name column. */
export const MANAGER_TOGGLEABLE_COLUMNS = MANAGER_PRESENTATION_COLUMNS.filter(
  (key) => key !== 'name',
) as Exclude<ManagerPresentationColumn, 'name'>[];

/** Default visibility for a new Manager presentation. */
export const DEFAULT_MANAGER_PRESENTATION_VISIBILITY: Record<ManagerPresentationColumn, boolean> = {
  show: true,
  name: true,
  category: true,
  owner: true,
  tags: true,
  base: true,
  ctg: true,
  withCtg: true,
  presented: true,
  delta: true,
  notes: true,
  actions: true,
};

/** Columns that can be configured for the Client presentation table. */
export const CLIENT_PRESENTATION_COLUMNS = [
  'subs',
  'name',
  'tags',
  'notes',
  'hours',
  'days',
] as const;

export type ClientPresentationColumn = (typeof CLIENT_PRESENTATION_COLUMNS)[number];

/** Client columns excluding the required activity-name column. */
export const CLIENT_TOGGLEABLE_COLUMNS = CLIENT_PRESENTATION_COLUMNS.filter(
  (key) => key !== 'name',
) as Exclude<ClientPresentationColumn, 'name'>[];

/** Default visibility for a new Client presentation. */
export const DEFAULT_CLIENT_PRESENTATION_VISIBILITY: Record<ClientPresentationColumn, boolean> = {
  subs: true,
  name: true,
  tags: true,
  notes: false,
  hours: true,
  days: true,
};
