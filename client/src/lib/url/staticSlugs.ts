import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from "./locales";

/**
 * Localized slugs for STATIC pages (routes that live as folders under
 * app/(visitor)/[locale], unlike DB-driven content which carries its own
 * localized slugs).
 *
 * The canonical key is the English slug — it is also the internal Next.js
 * route folder name. next.config.ts rewrites the localized paths onto the
 * canonical route and 301-redirects the old English paths on non-English
 * locales, so each language has exactly ONE indexable URL.
 */
export const LOCALIZED_STATIC_SLUGS: Record<string, Record<SupportedLocale, string>> = {
  "special-offers": {
    en: "special-offers",
    de: "sonderangebote",
    it: "offerte-speciali",
    es: "ofertas-especiales",
  },
  "tailor-made": {
    en: "tailor-made",
    de: "individualreise-aegypten",
    it: "viaggio-su-misura",
    es: "viaje-a-medida",
  },
};

/** Any-locale slug → its canonical (English) key, or null if not a known
 *  static slug ("sonderangebote" → "special-offers"). */
export function getCanonicalStaticSlug(slug: string): string | null {
  for (const [canonical, map] of Object.entries(LOCALIZED_STATIC_SLUGS)) {
    if (canonical === slug || Object.values(map).includes(slug)) return canonical;
  }
  return null;
}

/** Canonical key → the slug for a locale ("special-offers", "de" → "sonderangebote"). */
export function getLocalizedStaticSlug(canonical: string, locale: string | null | undefined): string {
  const map = LOCALIZED_STATIC_SLUGS[canonical];
  if (!map) return canonical;
  const l = (SUPPORTED_LOCALES as readonly string[]).includes(locale || "")
    ? (locale as SupportedLocale)
    : DEFAULT_LOCALE;
  return map[l] || map[DEFAULT_LOCALE] || canonical;
}

/** Translates the FIRST segment of a locale-less path when it is a known
 *  static slug in any language ("/sonderangebote?x=1" + "it" →
 *  "/offerte-speciali?x=1"); other paths pass through untouched. */
export function localizeStaticPathSegment(path: string, locale: string | null | undefined): string {
  const match = path.match(/^\/([^/?#]+)([/?#].*)?$/);
  if (!match) return path;
  const canonical = getCanonicalStaticSlug(match[1]);
  if (!canonical) return path;
  return `/${getLocalizedStaticSlug(canonical, locale)}${match[2] || ""}`;
}
