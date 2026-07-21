import type { RoundingMode } from '../models/settings';

/** Ore standard per un giorno-uomo (stime). */
export const HOURS_PER_DAY = 8;

export type EffortUnit = 'hours' | 'days';

export function applyRounding(value: number, mode: RoundingMode): number {
  switch (mode) {
    case 'none':
      return value;
    case 'ceil_0_5':
      return Math.ceil(value * 2) / 2;
    case 'ceil_1':
      return Math.ceil(value);
    case 'round_1':
      return Math.round(value);
    default:
      return value;
  }
}

export function formatHours(value: number, digits = 2): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(digits).replace(/\.?0+$/, '');
}

export function hoursToDays(hours: number, hoursPerDay = HOURS_PER_DAY): number {
  if (hoursPerDay <= 0) return 0;
  return hours / hoursPerDay;
}

export function daysToHours(days: number, hoursPerDay = HOURS_PER_DAY): number {
  return days * hoursPerDay;
}

export function formatDays(hours: number, hoursPerDay = HOURS_PER_DAY, digits = 2): string {
  return formatHours(hoursToDays(hours, hoursPerDay), digits);
}

/** Converte ore canoniche → valore da mostrare/editare nell’unità scelta. */
export function hoursToInputUnit(
  hours: number,
  unit: EffortUnit,
  hoursPerDay = HOURS_PER_DAY,
): number {
  return unit === 'days' ? hoursToDays(hours, hoursPerDay) : hours;
}

/** Converte valore inserito nell’unità scelta → ore canoniche (storage). */
export function inputUnitToHours(
  value: number,
  unit: EffortUnit,
  hoursPerDay = HOURS_PER_DAY,
): number {
  return unit === 'days' ? daysToHours(value, hoursPerDay) : value;
}

export function formatEffort(
  hours: number,
  unit: EffortUnit,
  hoursPerDay = HOURS_PER_DAY,
  digits = 2,
): string {
  return formatHours(hoursToInputUnit(hours, unit, hoursPerDay), digits);
}

export function unitShortLabel(unit: EffortUnit): string {
  return unit === 'days' ? 'D' : 'h';
}

export function unitColumnLabel(unit: EffortUnit): string {
  return unit === 'days' ? 'Giorni' : 'Ore';
}
