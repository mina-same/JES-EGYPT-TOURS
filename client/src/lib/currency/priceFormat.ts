import type { CurrencyCode } from "@/contexts/CurrencyContext";

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};

/**
 * The site's ONE rule for a converted price (USD × rate): the nearest 5, and
 * never below 5. 92 → 90, 79 → 80, 97.5 → 100.
 *
 * Only converted amounts pass through here. A price typed for a currency (a
 * manual EUR or GBP price, or any USD price) is shown exactly as entered.
 *
 * Every converted price uses it: the pricing table, the "from" prices, the
 * tour cards, the booking card and the tour JSON-LD (all through
 * lib/tours/startingPrice.ts `tierDisplayAmount` or CurrencyContext). The API
 * applies the identical rule to the listing price, its filter and sort, and to
 * the booking quote: server/src/utils/priceRounding.ts mirrors this function,
 * and tests/exchange-rates.test.ts checks the two agree.
 *
 * The product is first rounded to cents so binary noise cannot move a value
 * across a half: 100 × 0.925 is 92.49999… in floating point, and must still
 * count as 92.5 (→ 95). Halves round up. Written as floor(x + 0.5) rather
 * than Math.round so the API's aggregation expression (MongoDB has no
 * Math.round, and its $round rounds halves to even) computes the very same
 * double, step for step.
 */
export const roundConvertedPrice = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const cents = Math.floor(value * 100 + 0.5) / 100;
  return Math.max(5, Math.floor(cents / 5 + 0.5) * 5);
};

/** A USD amount in `currency` at `usdRate` (units per dollar): USD as entered, otherwise converted and rounded. */
export const convertUsdPrice = (usd: number, currency: CurrencyCode, usdRate: number): number =>
  currency === "USD" ? usd : roundConvertedPrice(usd * usdRate);

/**
 * An amount that is ALREADY in `currency` and already final (as entered, or
 * converted and rounded), formatted with its symbol. No conversion and no
 * rounding: whole numbers print without decimals, anything else (a manual
 * 87.50) with two.
 */
export const formatPriceAmount = (value: number, currency: CurrencyCode): string => {
  const symbol = CURRENCY_SYMBOLS[currency];
  return Number.isInteger(value) ? `${symbol}${value}` : `${symbol}${value.toFixed(2)}`;
};
