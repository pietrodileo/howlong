import { computeTotals } from '../../domain/contingency';
import {
  ACTIVITY_STATUSES,
  addDays,
  daysBetween,
  monthEnd,
  monthStart,
} from '../../domain/gantt';
import type { ActivityStatus, Estimate, PlanningRange } from '../../models/estimate';
import { normalizeOwners } from '../../domain/owners';
import type { GraphMode, MetricEntry } from './graphData';

export type PlanningWeightMode = 'effort' | 'count';
export type PlanningWindow = 'all' | '3' | '6' | '12';

export interface PlanningEntry extends MetricEntry {
  id: string;
  name: string;
  notes: string;
  category: string;
  status: ActivityStatus;
  owners: string[];
  range: PlanningRange | null;
  type: 'macro' | 'subtask';
  parentName?: string;
}

export interface PlanningCoverage {
  planned: number;
  unplanned: number;
  unassigned: number;
  total: number;
  percentage: number;
  unplannedPercentage: number;
  unassignedPercentage: number;
}

export interface StatusCategoryEntry {
  status: ActivityStatus;
  value: number;
}

export interface StatusCategoryGroup {
  category: string;
  total: number;
  cancelledCount: number;
  statuses: StatusCategoryEntry[];
}

export interface TimelineStatusEntry {
  status: ActivityStatus;
  count: number;
}

export interface TimelineBucket {
  id: string;
  startDate: string;
  endDate: string;
  total: number;
  statuses: TimelineStatusEntry[];
  entryIds: string[];
}

/** Project the estimate into non-overlapping operational line items used by planning analytics. */
export function buildPlanningEntries(estimate: Estimate): PlanningEntry[] {
  const itemById = new Map(estimate.items.map((item) => [item.id, item]));
  return computeTotals(estimate).lines
    .filter((line) => line.contributesToTotals && !line.isFormula)
    .map((line) => ({
      id: line.item.id,
      name: line.item.name,
      notes: line.item.notes,
      category: line.item.category,
      status: line.item.status ?? 'to-plan',
      owners: normalizeOwners(line.item.owners),
      range: estimate.planning.items[line.item.id] ?? null,
      type: line.item.parentId ? 'subtask' : 'macro',
      parentName: line.item.parentId ? itemById.get(line.item.parentId)?.name : undefined,
      base: line.hoursBase,
      contingency: line.hoursContingency,
      combined: line.hoursWithContingency,
    }));
}

/** Calculate the share of active operational effort that has a planning range. */
export function buildPlanningCoverage(entries: PlanningEntry[], mode: GraphMode): PlanningCoverage {
  const activeEntries = entries.filter((entry) => entry.status !== 'cancelled');
  const planned = activeEntries
    .filter((entry) => entry.range)
    .reduce((sum, entry) => sum + entry[mode], 0);
  const unplanned = activeEntries
    .filter((entry) => !entry.range)
    .reduce((sum, entry) => sum + entry[mode], 0);
  const unassigned = activeEntries
    .filter((entry) => entry.owners.length === 0)
    .reduce((sum, entry) => sum + entry[mode], 0);
  const total = planned + unplanned;
  return {
    planned,
    unplanned,
    unassigned,
    total,
    percentage: total > 0 ? (planned / total) * 100 : 0,
    unplannedPercentage: total > 0 ? (unplanned / total) * 100 : 0,
    unassignedPercentage: total > 0 ? (unassigned / total) * 100 : 0,
  };
}

/** Group active status shares by category and keep cancelled work as a separate count. */
export function buildStatusCategoryGroups(
  entries: PlanningEntry[],
  mode: GraphMode,
  weightMode: PlanningWeightMode,
): StatusCategoryGroup[] {
  const grouped = new Map<string, PlanningEntry[]>();
  for (const entry of entries) {
    const categoryEntries = grouped.get(entry.category) ?? [];
    categoryEntries.push(entry);
    grouped.set(entry.category, categoryEntries);
  }

  return [...grouped.entries()]
    .map(([category, categoryEntries]) => {
      const activeEntries = categoryEntries.filter((entry) => entry.status !== 'cancelled');
      const statuses = ACTIVITY_STATUSES
        .filter((status) => status !== 'cancelled')
        .map((status) => ({
          status,
          value: activeEntries
            .filter((entry) => entry.status === status)
            .reduce((sum, entry) => sum + (weightMode === 'count' ? 1 : entry[mode]), 0),
        }))
        .filter((entry) => entry.value > 0);
      return {
        category,
        total: statuses.reduce((sum, entry) => sum + entry.value, 0),
        cancelledCount: categoryEntries.filter((entry) => entry.status === 'cancelled').length,
        statuses,
      };
    })
    .filter((group) => group.total > 0 || group.cancelledCount > 0);
}

/** Build weekly or monthly activity-count buckets across the selected planning window. */
export function buildTimelineBuckets(
  entries: PlanningEntry[],
  window: PlanningWindow,
  today: string = new Date().toISOString().slice(0, 10),
): TimelineBucket[] {
  const scheduledEntries = entries.filter((entry) => entry.status !== 'cancelled' && entry.range);
  if (scheduledEntries.length === 0) return [];

  const allStart = scheduledEntries.reduce(
    (start, entry) => entry.range!.startDate < start ? entry.range!.startDate : start,
    scheduledEntries[0].range!.startDate,
  );
  const allEnd = scheduledEntries.reduce(
    (end, entry) => entry.range!.endDate > end ? entry.range!.endDate : end,
    scheduledEntries[0].range!.endDate,
  );
  const requestedEnd = window === 'all' ? allEnd : addCalendarMonths(today, Number(window));
  const startDate = window === 'all' ? allStart : today;
  const endDate = requestedEnd < allEnd ? requestedEnd : allEnd;
  if (endDate < startDate) return [];

  const useMonths = daysBetween(startDate, endDate) > 180;
  const ranges = useMonths
    ? buildMonthRanges(startDate, endDate)
    : buildWeekRanges(startDate, endDate);

  return ranges.map((range) => {
    const bucketEntries = scheduledEntries.filter((entry) =>
      entry.range!.startDate <= range.endDate && entry.range!.endDate >= range.startDate,
    );
    const statuses = ACTIVITY_STATUSES
      .filter((status) => status !== 'cancelled')
      .map((status) => ({
        status,
        count: bucketEntries.filter((entry) => entry.status === status).length,
      }))
      .filter((entry) => entry.count > 0);
    return {
      id: range.startDate,
      ...range,
      total: bucketEntries.length,
      statuses,
      entryIds: bucketEntries.map((entry) => entry.id),
    };
  });
}

/** Add calendar months while retaining the day when the target month permits it. */
function addCalendarMonths(value: string, months: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString().slice(0, 10);
}

/** Split an inclusive date interval into contiguous seven-day ranges. */
function buildWeekRanges(startDate: string, endDate: string): PlanningRange[] {
  const ranges: PlanningRange[] = [];
  for (let start = startDate; start <= endDate; start = addDays(start, 7)) {
    const candidateEnd = addDays(start, 6);
    ranges.push({ startDate: start, endDate: candidateEnd < endDate ? candidateEnd : endDate });
  }
  return ranges;
}

/** Split an inclusive date interval into calendar-month ranges. */
function buildMonthRanges(startDate: string, endDate: string): PlanningRange[] {
  const ranges: PlanningRange[] = [];
  for (let start = monthStart(startDate); start <= endDate;) {
    const rangeStart = start < startDate ? startDate : start;
    const rangeEnd = monthEnd(start) > endDate ? endDate : monthEnd(start);
    ranges.push({ startDate: rangeStart, endDate: rangeEnd });
    start = addDays(monthEnd(start), 1);
  }
  return ranges;
}

