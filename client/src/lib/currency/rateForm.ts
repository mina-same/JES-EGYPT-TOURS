import { convertUsdPrice } from "./priceFormat";

/**
 * Input handling for Admin → Tour → Exchange Rates.
 *
 * A rate is "units of EUR (or GBP) per 1 US dollar". The API only requires a
 * positive number; the upper bound here catches the typical typo (92 for
 * 0.92), which would multiply every converted price on the site by 100.
 */
export const MAX_RATE = 10;

/** A typed rate as a number ("0.92" and "0,92" both work), or null. */
export const parseRateInput = (raw: string): number | null => {
  const text = raw.trim().replace(",", ".");
  if (!/^\d*\.?\d+$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
};

/** Why a typed rate cannot be saved, or null when it can. */
export const rateInputError = (raw: string): string | null => {
  if (!raw.trim()) return "Enter a rate, for example 0.92.";
  const value = parseRateInput(raw);
  if (value === null) return "Use a number, for example 0.92.";
  if (value <= 0) return "The rate must be greater than 0.";
  if (value > MAX_RATE) return `That would make 1 USD worth more than ${MAX_RATE}. Check the decimal point.`;
  return null;
};

/** USD prices used to preview what visitors will see. */
export const PREVIEW_USD_PRICES = [45, 65, 100, 250, 1000] as const;

/**
 * What each preview price becomes with the typed rates: converted and rounded
 * by the site's own rule (nearest 5), exactly as tour pages, cards, bookings
 * and the JSON-LD will show it. null where the rate is not valid yet.
 */
export const ratePreview = (eurRaw: string, gbpRaw: string) => {
  const eur = rateInputError(eurRaw) ? null : parseRateInput(eurRaw);
  const gbp = rateInputError(gbpRaw) ? null : parseRateInput(gbpRaw);
  return PREVIEW_USD_PRICES.map((usd) => ({
    usd,
    eur: eur === null ? null : convertUsdPrice(usd, "EUR", eur),
    gbp: gbp === null ? null : convertUsdPrice(usd, "GBP", gbp),
  }));
};
