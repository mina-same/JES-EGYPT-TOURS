import { GB, DE, IT, ES } from "country-flag-icons/react/3x2";
import type { CurrencyCode } from "@/contexts/CurrencyContext";

export const FLAGS: Record<string, typeof GB> = {
  en: GB,
  de: DE,
  it: IT,
  es: ES,
};

/**
 * Each language in its own name, whatever the page's language: a visitor
 * who cannot read the current page still finds theirs.
 */
export const ENDONYMS: Record<string, string> = {
  en: "English",
  de: "Deutsch",
  it: "Italiano",
  es: "Español",
};

export const CURRENCIES: readonly CurrencyCode[] = ["USD", "EUR", "GBP"];

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};
