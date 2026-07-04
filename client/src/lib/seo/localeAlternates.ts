import type { Metadata } from "next";

export const SUPPORTED_LOCALES = ["en", "de", "it", "es"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const SEO_BASE_URL = "https://jesegypttours.com";

function normalizeStaticPath(path: string = ""): string {
  const trimmed = path.trim().replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}` : "";
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
