import type { CurrencyCode } from "@/contexts/CurrencyContext";

/** The euro area is NOT the European Union: Sweden, Poland, Denmark, Czechia,
 *  Hungary and Romania are EU members that kept their own currency, while
 *  Monaco and San Marino are outside the EU and use the euro. Listing explicit
 *  country codes is the only way to get this right — any "is it in Europe?"
 *  shortcut misprices a large number of real visitors. */
const EUROZONE: ReadonlySet<string> = new Set([
  // The 20 euro-area member states.
  "AT", // Austria
  "BE", // Belgium
  "HR", // Croatia
  "CY", // Cyprus
  "EE", // Estonia
  "FI", // Finland
  "FR", // France
  "DE", // Germany
  "GR", // Greece
  "IE", // Ireland
  "IT", // Italy
  "LV", // Latvia
  "LT", // Lithuania
  "LU", // Luxembourg
  "MT", // Malta
  "NL", // Netherlands
  "PT", // Portugal
  "SK", // Slovakia
  "SI", // Slovenia
  "ES", // Spain

  // Bulgaria adopted the euro on 2026-01-01, which would make it the 21st
  // member. Worth confirming before launch: if that date moved, delete this
  // line and Bulgarian visitors fall back to the USD default.
  "BG", // Bulgaria

  // Not EU members, but the euro is their official currency under monetary
  // agreements with the Union. Showing them dollars would be plainly wrong.
  "AD", // Andorra
  "MC", // Monaco
  "SM", // San Marino
  "VA", // Vatican City
  // Adopted the euro unilaterally; it is what people actually pay with there.
  "ME", // Montenegro
  "XK", // Kosovo
]);

/** Sterling is legal tender across the Crown Dependencies too; their local
 *  issues are pegged 1:1 and interchangeable. */
const STERLING: ReadonlySet<string> = new Set([
  "GB", // United Kingdom
  "GG", // Guernsey
  "JE", // Jersey
  "IM", // Isle of Man
]);

/**
 * Maps a visitor's country to the currency we display prices in.
 *
 * Everything not listed falls back to USD — the tours are priced in dollars,
 * so this is the true amount rather than a converted approximation. That
 * covers Egypt, the United States, and every country whose own currency the
 * site does not support.
 *
 * @param country ISO 3166-1 alpha-2 code, or null/undefined when the visitor's
 *                location is unknown.
 */
export const currencyForCountry = (
  country: string | null | undefined
): CurrencyCode => {
  if (!country) return "USD";

  const code = country.trim().toUpperCase();
  if (EUROZONE.has(code)) return "EUR";
  if (STERLING.has(code)) return "GBP";
  return "USD";
};
