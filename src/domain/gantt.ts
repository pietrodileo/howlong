import type { ActivityStatus, Estimate, LineItem, PlanningRange } from '../models/estimate';

const DAY_MS = 86_400_000;

export const ACTIVITY_STATUSES: ActivityStatus[] = [
  'to-plan', 'planned', 'in-progress', 'at-risk', 'stuck',
  'blocked', 'on-hold', 'completed', 'cancelled',
];

export const ACTIVITY_STATUS_COLORS: Record<ActivityStatus, string> = {
  'to-plan': '#8a94a3',
  planned: '#2563eb',
  'in-progress': '#0891b2',
  'at-risk': '#d97706',
  stuck: '#ea580c',
  blocked: '#dc2626',
  'on-hold': '#7c3aed',
  completed: '#16a34a',
  cancelled: '#475467',
};

const STATUS_PRIORITY: ActivityStatus[] = [
  'blocked', 'stuck', 'at-risk', 'in-progress', 'on-hold',
  'planned', 'to-plan', 'completed',
];

/** Resolves a macro status from its children using the documented priority. */
export function aggregateMacroStatus(estimate: Estimate, macro: LineItem): ActivityStatus {
  const children = estimate.items.filter((item) => item.parentId === macro.id);
  if (children.length === 0) return macro.status;
  if (children.every((item) => item.status === 'cancelled')) return 'cancelled';
  const activeStatuses = new Set(children.filter((item) => item.status !== 'cancelled').map((item) => item.status));
  return STATUS_PRIORITY.find((status) => activeStatuses.has(status)) ?? 'to-plan';
}

export function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(value: string, days: number): string {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / DAY_MS);
}

export function monthStart(value: string): string {
  const date = parseDate(value);
  date.setUTCDate(1);
  return formatDate(date);
}

export function monthEnd(value: string): string {
  const date = parseDate(value);
  date.setUTCMonth(date.getUTCMonth() + 1, 0);
  return formatDate(date);
}

export function addMonths(value: string, months: number): string {
  const date = parseDate(monthStart(value));
  date.setUTCMonth(date.getUTCMonth() + months);
  return formatDate(date);
}

export function listDays(from: string, to: string, includeWeekends = true, weekendDays: number[] = [0, 6]): string[] {
  const days: string[] = [];
  for (let value = from; value <= to; value = addDays(value, 1)) {
    const weekday = parseDate(value).getUTCDay();
    if (includeWeekends || !weekendDays.includes(weekday)) days.push(value);
  }
  return days;
}

/**
 * Calculate working days between two dates.
 * If excludeWeekend is true, Saturday (6) and Sunday (0) are excluded from the count.
 * This is used to show how many working days are in a Gantt task range.
 */
export function workingDaysBetween(from: string, to: string, excludeWeekend: boolean = true): number {
  if (from > to) return 0;
  let count = 0;
  for (let value = from; value <= to; value = addDays(value, 1)) {
    const weekday = parseDate(value).getUTCDay();
    if (!excludeWeekend || (weekday !== 0 && weekday !== 6)) {
      count++;
    }
  }
  return count;
}

export function aggregateMacroRange(estimate: Estimate, macro: LineItem): PlanningRange | null {
  const children = estimate.items.filter((item) => item.parentId === macro.id);
  if (children.length === 0) return estimate.planning.items[macro.id] ?? null;
  const ranges = children
    .map((item) => estimate.planning.items[item.id])
    .filter((range): range is PlanningRange => Boolean(range));
  if (ranges.length === 0) return null;
  return {
    startDate: ranges.reduce((min, range) => range.startDate < min ? range.startDate : min, ranges[0].startDate),
    endDate: ranges.reduce((max, range) => range.endDate > max ? range.endDate : max, ranges[0].endDate),
  };
}
