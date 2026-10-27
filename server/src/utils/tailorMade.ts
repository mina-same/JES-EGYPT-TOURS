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

/** The form offers the current year and the five after it. One more is
 *  accepted: the form counts from the visitor's clock and this from Cairo's, so
 *  at New Year a visitor ahead of Cairo already sees next year's list. */
export const TRAVEL_YEARS_AHEAD = 6;

/** A travel year as the form sends it ("2027"; a whole number is accepted too),
 *  within that window on Cairo's calendar, like the rest of the range. There
 *  was no upper bound: "9999" was stored. */
export function isTravelYear(value: unknown, now: Date = new Date()): boolean {
  const text = typeof value === 'number' && Number.isInteger(value) ? String(value) : value;
  if (typeof text !== 'string' || !/^\d{4}$/.test(text)) return false;
  const current = Number(getBookingToday(now).slice(0, 4));
  return Number(text) >= current && Number(text) <= current + TRAVEL_YEARS_AHEAD;
}

/** E.164, the form's phone value: "+", a country code that does not start with
 *  0, and 7 to 15 digits in all — 15 is the E.164 maximum, 7 the smallest real
 *  numbering plans (Niue). The booking form's pattern starts at 8. Each
 *  country's own rules are checked by the form; this only keeps anything that
 *  is not a phone number out of the database. */
const TAILOR_MADE_PHONE_PATTERN = /^\+[1-9]\d{6,14}$/;
export const isTailorMadePhone = (value: unknown): boolean =>
  typeof value === 'string' && TAILOR_MADE_PHONE_PATTERN.test(value);
