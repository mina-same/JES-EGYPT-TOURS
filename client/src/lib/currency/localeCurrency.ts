import type { CurrencyCode } from "@/contexts/CurrencyContext";

/**
 * Which currency a page shows, in one place.
 *
 * The order, applied the same way by the server layout (first HTML), the
 * browser (CurrencyContext), the server-side listing queries and the tour
 * JSON-LD:
 *
 *   1. the visitor's saved choice (the currency cookie);
 *   2. on /de, /it and /es: EUR, whatever the visitor's country;
 *   3. on /en: the country rule (countryCurrency.ts: UK → GBP, euro area →
 *      EUR, anything else or unknown → USD). Only the browser knows the
 *      country (/api/geo), so the server renders /en in USD and the browser
 *      may then move it to the country's currency.
 */

/** Page languages priced in one fixed currency, regardless of country. */
const LOCALE_CURRENCY: Readonly<Record<string, CurrencyCode>> = {
  de: "EUR",
  it: "EUR",
  es: "EUR",
};

/** The fixed currency of a page language, or null where the country decides (/en). */
export const localeCurrency = (locale: string | null | undefined): CurrencyCode | null =>
  (locale && LOCALE_CURRENCY[locale]) || null;

/**
 * The currency a page is rendered in on the server: the saved choice, then the
 * page language's currency, then USD (/en before the country is known).
 */
export const pageCurrency = (
  saved: CurrencyCode | null | undefined,
  locale: string | null | undefined
): CurrencyCode => saved ?? localeCurrency(locale) ?? "USD";

/**
 * The currency of a tour page's structured data. Search engines send no
 * cookie and no country, so it depends on the page language only: EUR on /de,
 * /it and /es, USD on /en.
 */
export const structuredDataCurrency = (locale: string | null | undefined): CurrencyCode =>
  localeCurrency(locale) ?? "USD";
