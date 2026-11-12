import type { CurrencyCode } from "@/contexts/CurrencyContext";

/** Units of each currency per US dollar. USD is always 1. */
export type CurrencyRates = Record<CurrencyCode, number>;

/**
 * LAST RESORT ONLY: used when the rates stored in the database (Admin →
 * Tour → Exchange Rates, `PUT /api/currency/rates`) cannot be read. The
 * server layout reads the stored rates and hands them to the browser, so in
 * normal operation these numbers are never shown.
 */
export const FALLBACK_RATES: CurrencyRates = { USD: 1, EUR: 0.92, GBP: 0.79 };

/** A usable rate: a finite positive number. */
const isRate = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

/** The EUR and GBP rates from an API payload, or null when either is missing or invalid. */
export const parseRatesPayload = (rates: unknown): CurrencyRates | null => {
  const data = rates as Partial<Record<CurrencyCode, unknown>> | null | undefined;
  return isRate(data?.EUR) && isRate(data?.GBP) ? { USD: 1, EUR: data.EUR, GBP: data.GBP } : null;
};
