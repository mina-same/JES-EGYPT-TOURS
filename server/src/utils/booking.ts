import { createHash } from 'node:crypto';

export const BOOKING_CURRENCIES = ['USD', 'EUR', 'GBP'] as const;

export type BookingCurrency = (typeof BOOKING_CURRENCIES)[number];

export interface TourStartingPrice {
  USD: number;
  EUR?: number;
  GBP?: number;
}

export interface BookingCurrencyRates {
  EUR?: number;
  GBP?: number;
}

export interface BookingFingerprintInput {
  tour: string;
  name: string;
  email: string;
  phone: string;
  nationality?: string;
  dateFrom: string;
  dateTo: string;
  adults: number;
  children?: number;
  infants?: number;
  requirements?: string;
  currency?: BookingCurrency;
  selectedPackage?: string;
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const INTERNATIONAL_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;
const BOOKING_BUSINESS_TIME_ZONE = 'Africa/Cairo';

/** Accept a real calendar day only. Date.parse alone normalizes impossible
 *  input such as 2026-02-31 instead of rejecting it. */
export const isValidBookingDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !DATE_ONLY_PATTERN.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

/** Bookings operate on Egyptian calendar days. Using Cairo rather than the
 * deployment server's timezone keeps the rule stable when the API runs in UTC. */
export const getBookingToday = (now: Date = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: BOOKING_BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((entry) => entry.type === type)?.value || '';

  return `${part('year')}-${part('month')}-${part('day')}`;
};

export const isBookingDateTodayOrFuture = (
  value: unknown,
  now: Date = new Date()
): value is string => isValidBookingDate(value) && value >= getBookingToday(now);

/** Structural E.164 validation for the public API: a leading + followed by
 * 8-15 digits. The browser additionally validates real country numbering rules. */
export const isValidInternationalPhone = (value: unknown): value is string =>
  typeof value === 'string' && INTERNATIONAL_PHONE_PATTERN.test(value);

/** The server-side identity of one exact public booking attempt. Explicit field
 * order and normalization make retries stable while SHA-256 avoids persisting a
 * second plaintext copy of the visitor's personal data. */
export const createBookingRequestFingerprint = (
  input: BookingFingerprintInput
): string => {
  const canonical = JSON.stringify([
    String(input.tour).toLowerCase(),
    input.name.trim(),
    input.email.trim().toLowerCase(),
    input.phone.trim(),
    input.nationality?.trim() || '',
    input.dateFrom,
    input.dateTo,
    Number(input.adults),
    Number(input.children || 0),
    Number(input.infants || 0),
    input.requirements?.trim() || '',
    input.currency || 'USD',
    // Part of the identity: changing the package and resubmitting is a
    // DIFFERENT enquiry, and without this it would collide with the previous
    // attempt's key and be rejected as a reused idempotency key.
    input.selectedPackage?.trim() || '',
  ]);

  return createHash('sha256').update(canonical).digest('hex');
};

const roundedMoney = (value: number): number => Math.round(value * 100) / 100;

/** Derive the stored quote from the tour document, never from public input.
 *  Exact per-currency admin prices win; configured rates are only a fallback
 *  when the selected currency is absent from priceStartingFrom. */
export const resolveTourStartingQuote = (
  price: TourStartingPrice | undefined,
  currency: BookingCurrency,
  rates: BookingCurrencyRates = {}
): number | undefined => {
  if (!price) return undefined;

  const exact = price[currency];
  if (typeof exact === 'number' && Number.isFinite(exact) && exact > 0) {
    return roundedMoney(exact);
  }

  const usd = price.USD;
  if (typeof usd !== 'number' || !Number.isFinite(usd) || usd <= 0) {
    return undefined;
  }

  if (currency === 'USD') return roundedMoney(usd);

  const rate = rates[currency];
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    return undefined;
  }

  return roundedMoney(usd * rate);
};
