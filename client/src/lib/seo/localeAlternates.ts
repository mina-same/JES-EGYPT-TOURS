import type { Metadata } from "next";
import {
  DEFAULT_LOCALE,
  getCanonicalStaticSlug,
  getLocalizedStaticPath,
  getSeoBaseUrl,
  getStrictLocalizedSlug,
  localizeStaticPathSegment,
  normalizeLocale,
  SUPPORTED_LOCALES,
  type LocalizedSlugInput,
  type SupportedLocale,
} from "@/lib/url";

export { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/url";

export const SEO_BASE_URL = getSeoBaseUrl();

function normalizeStaticPath(path: string = ""): string {
  const trimmed = path.trim().replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}` : "";
}

function buildLocalizedUrl(
  baseUrl: string,
  locale: SupportedLocale,
  slugOrPath: string
): string {
  const normalizedBaseUrl = getSeoBaseUrl(baseUrl);
  const normalizedSlugOrPath = normalizeStaticPath(slugOrPath);

  return `${normalizedBaseUrl}/${locale}${normalizedSlugOrPath}`;
}

export function getStrictSlugLocaleAlternates({
  locale,
  currentSlug,
  slugs,
  baseUrl = SEO_BASE_URL,
}: {
  locale: string;
  currentSlug: string;
  slugs: LocalizedSlugInput;
  baseUrl?: string;
}): NonNullable<Metadata["alternates"]> {
  const currentLocale = normalizeLocale(locale);
  const normalizedCurrentSlug = normalizeStaticPath(currentSlug);
  const normalizedBaseUrl = getSeoBaseUrl(baseUrl);
  const languages: Record<string, string> = {};
  let canonical = buildLocalizedUrl(normalizedBaseUrl, currentLocale, normalizedCurrentSlug);

  if (typeof slugs === "string") {
    const englishSlug = getStrictLocalizedSlug(slugs, DEFAULT_LOCALE);
    if (englishSlug) {
      const englishUrl = buildLocalizedUrl(normalizedBaseUrl, DEFAULT_LOCALE, englishSlug);
      languages[DEFAULT_LOCALE] = englishUrl;
      languages["x-default"] = englishUrl;
      canonical = englishUrl;
    }
  } else {
    for (const supportedLocale of SUPPORTED_LOCALES) {
      const strictSlug = getStrictLocalizedSlug(slugs, supportedLocale);
      if (strictSlug) {
        languages[supportedLocale] = buildLocalizedUrl(
          normalizedBaseUrl,
          supportedLocale,
          strictSlug
        );
      }
    }

    const englishSlug = getStrictLocalizedSlug(slugs, DEFAULT_LOCALE);
    if (englishSlug) {
      languages["x-default"] = buildLocalizedUrl(normalizedBaseUrl, DEFAULT_LOCALE, englishSlug);
    }
  }

  return {
    canonical,
    languages,
  };
}

/**
 * @param onlyLocales restricts the alternates to the languages that actually
 *   serve this page. Pages whose content is per-language (the FAQ page 404s in
 *   a language that has no questions of its own) must pass it — hreflang that
 *   points at a 404 is worse than no hreflang at all.
 */
export function getStaticLocaleAlternates(
  locale: string,
  path: string = "",
  onlyLocales?: readonly string[]
): NonNullable<Metadata["alternates"]> {
  const normalizedPath = normalizeStaticPath(path);
  const currentLocale = normalizeLocale(locale);

  // Static pages may carry a per-locale slug (e.g. special-offers →
  // /de/sonderangebote): every alternate must point to the slug that locale
  // actually serves, not the English one.
  const canonicalStaticSlug = normalizedPath
    ? getCanonicalStaticSlug(normalizedPath.slice(1))
    : null;
  const localizedPathFor = (supportedLocale: SupportedLocale) =>
    normalizedPath ? localizeStaticPathSegment(normalizedPath, supportedLocale) : "";
  const publicPathFor = (supportedLocale: SupportedLocale) =>
    canonicalStaticSlug
      ? getLocalizedStaticPath(canonicalStaticSlug, supportedLocale)
      : `/${supportedLocale}${localizedPathFor(supportedLocale)}`;

  // Spread the readonly tuple into a plain array so both branches share one type.
  const servedLocales: SupportedLocale[] = onlyLocales
    ? SUPPORTED_LOCALES.filter((l) => onlyLocales.includes(l))
    : [...SUPPORTED_LOCALES];

  const languages = servedLocales.reduce<Record<string, string>>(
    (acc, supportedLocale) => {
      acc[supportedLocale] = `${SEO_BASE_URL}${publicPathFor(supportedLocale)}`;
      return acc;
    },
    {}
  );

  // x-default points at English only when English actually serves the page.
  if (servedLocales.includes(DEFAULT_LOCALE)) {
    languages["x-default"] = `${SEO_BASE_URL}${publicPathFor(DEFAULT_LOCALE)}`;
  }

  return {
    canonical: `${SEO_BASE_URL}${publicPathFor(currentLocale)}`,
    languages,
  };
}
