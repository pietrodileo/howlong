import type { Estimate, LineItem, PlanningRange } from '../models/estimate';

const DAY_MS = 86_400_000;

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

export function listDays(from: string, to: string, includeWeekends = true): string[] {
  const days: string[] = [];
  for (let value = from; value <= to; value = addDays(value, 1)) {
    const weekday = parseDate(value).getUTCDay();
    if (includeWeekends || (weekday !== 0 && weekday !== 6)) days.push(value);
  }
  return days;
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
