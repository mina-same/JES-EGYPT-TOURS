import type { Metadata } from "next";

export const SUPPORTED_LOCALES = ["en", "de", "it", "es"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const SEO_BASE_URL = "https://jesegypttours.com";

function normalizeStaticPath(path: string = ""): string {
  const trimmed = path.trim().replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}` : "";
}

type LocalizedSlugMap = Partial<Record<SupportedLocale, string | null | undefined>>;
type LocalizedSlugInput = LocalizedSlugMap | string | null | undefined;

function normalizeSlug(slug: unknown): string | null {
  if (typeof slug !== "string") return null;

  const normalized = slug.trim().replace(/^\/+|\/+$/g, "");
  return normalized || null;
}

function getStrictLocalizedSlug(
  slugs: LocalizedSlugInput,
  locale: SupportedLocale
): string | null {
  if (!slugs || typeof slugs !== "object") return null;

  return normalizeSlug(slugs[locale]);
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
  const currentLocale = SUPPORTED_LOCALES.includes(locale as SupportedLocale)
    ? (locale as SupportedLocale)
    : "en";
  const normalizedCurrentSlug = normalizeStaticPath(currentSlug);
  const languages: Record<string, string> = {};

  if (typeof slugs === "string") {
    const strictCurrentSlug = normalizeSlug(slugs) || normalizeSlug(currentSlug);
    if (strictCurrentSlug) {
      languages[currentLocale] = `${baseUrl}/${currentLocale}/${strictCurrentSlug}`;
      if (currentLocale === "en") {
        languages["x-default"] = `${baseUrl}/en/${strictCurrentSlug}`;
      }
    }
  } else {
    for (const supportedLocale of SUPPORTED_LOCALES) {
      const strictSlug = getStrictLocalizedSlug(slugs, supportedLocale);
      if (strictSlug) {
        languages[supportedLocale] = `${baseUrl}/${supportedLocale}/${strictSlug}`;
      }
    }

    const englishSlug = getStrictLocalizedSlug(slugs, "en");
    if (englishSlug) {
      languages["x-default"] = `${baseUrl}/en/${englishSlug}`;
    }
  }

  return {
    canonical: `${baseUrl}/${currentLocale}${normalizedCurrentSlug}`,
    languages,
  };
}

export function getStaticLocaleAlternates(
  locale: string,
  path: string = ""
): NonNullable<Metadata["alternates"]> {
  const normalizedPath = normalizeStaticPath(path);
  const currentLocale = SUPPORTED_LOCALES.includes(locale as SupportedLocale)
    ? (locale as SupportedLocale)
    : "en";

  const languages = SUPPORTED_LOCALES.reduce<Record<string, string>>(
    (acc, supportedLocale) => {
      acc[supportedLocale] = `${SEO_BASE_URL}/${supportedLocale}${normalizedPath}`;
      return acc;
    },
    {}
  );

  languages["x-default"] = `${SEO_BASE_URL}/en${normalizedPath}`;

  return {
    canonical: `${SEO_BASE_URL}/${currentLocale}${normalizedPath}`,
    languages,
  };
}
