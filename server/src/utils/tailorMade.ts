import { getBookingToday } from './booking';
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function travelMonth(month: unknown, year: unknown): string | null {
  const index = MONTHS.indexOf(String(month));
  if (index < 0 || !/^\d{4}$/.test(String(year))) return null;
  return `${year}-${String(index + 1).padStart(2, '0')}`;
}
export function validTravelRange(body: any): boolean {
  const start = travelMonth(body.startMonth, body.startYear);
  const end = travelMonth(body.endMonth, body.endYear);
  return !!start && !!end && start >= getBookingToday().slice(0, 7) && end >= start;
}
export function budgetAmount(value: unknown): number | undefined {
  if (value === undefined || value === '' || value === 'No Limit') return undefined;
  const text = String(value).replace(/[$,+]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return NaN;
  return Number(text);
}
export function validBudgetRange(body: any): boolean {
  const min = budgetAmount(body.minBudget);
  const max = budgetAmount(body.maxBudget);
  return !Number.isNaN(min) && !Number.isNaN(max) && (min === undefined || max === undefined || min <= max);
}
