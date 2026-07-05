export const SUPPORTED_LOCALES = ["en", "de", "it", "es"] as const;

export const DEFAULT_LOCALE = "en";

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === "string" && SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

export function normalizeLocale(
  value: unknown,
  fallback: SupportedLocale = DEFAULT_LOCALE
): SupportedLocale {
  return isSupportedLocale(value) ? value : fallback;
}

export function getLocaleFromPath(
  pathname: string | null | undefined,
  fallback: SupportedLocale = DEFAULT_LOCALE
): SupportedLocale {
  const locale = (pathname || "/").split("/")[1];
  return normalizeLocale(locale, fallback);
}
