import type { Metadata } from "next";

export const SUPPORTED_LOCALES = ["en", "de", "it", "es"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function normalizeBaseUrl(url: string | undefined): string {
  return (url || "https://jesegypttours.com").trim().replace(/\/+$/g, "");
}

export const SEO_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL);

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

function buildLocalizedUrl(
  baseUrl: string,
  locale: SupportedLocale,
  slugOrPath: string
): string {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const normalizedSlugOrPath = normalizeStaticPath(slugOrPath);

  return `${normalizedBaseUrl}/${locale}${normalizedSlugOrPath}`;
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
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const languages: Record<string, string> = {};
  let canonical = buildLocalizedUrl(normalizedBaseUrl, currentLocale, normalizedCurrentSlug);

  if (typeof slugs === "string") {
    const englishSlug = normalizeSlug(slugs);
    if (englishSlug) {
      const englishUrl = buildLocalizedUrl(normalizedBaseUrl, "en", englishSlug);
      languages.en = englishUrl;
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

    const englishSlug = getStrictLocalizedSlug(slugs, "en");
    if (englishSlug) {
      languages["x-default"] = buildLocalizedUrl(normalizedBaseUrl, "en", englishSlug);
    }
  }

  return {
    canonical,
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
