import type { CurrencyCode } from "@/contexts/CurrencyContext";

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};

/**
 * The one rounding rule for every price the site shows or publishes: whole
 * numbers from 10 up, two decimals below 10.
 *
 * Manual prices are whole numbers and pass through unchanged, so a visible
 * price and the JSON-LD Offer for it always carry the same number. Converted
 * amounts (USD × rate) are rounded the same way wherever they appear. The
 * listing API rounds with the identical rule (server/src/utils/tourQuery.ts
 * `effectiveStartingPrice`), so a price filter of 81 matches a card showing 81.
 */
export const roundPriceAmount = (value: number): number =>
  value >= 10 ? Math.round(value) : Math.round(value * 100) / 100;

/** An amount that is ALREADY in `currency`, formatted with its symbol. No conversion. */
export const formatPriceAmount = (value: number, currency: CurrencyCode): string => {
  const symbol = CURRENCY_SYMBOLS[currency];
  return value >= 10 ? `${symbol}${Math.round(value)}` : `${symbol}${value.toFixed(2)}`;
};
