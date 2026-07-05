import { DEFAULT_LOCALE, type SupportedLocale } from "./locales";

export type LocalizedSlugMap = Partial<Record<SupportedLocale, string | null | undefined>>;
export type LocalizedSlugInput = LocalizedSlugMap | string | null | undefined;

function normalizeSlug(slug: unknown): string | null {
  if (typeof slug !== "string") return null;

  const normalized = slug.trim().replace(/^\/+|\/+$/g, "");
  return normalized || null;
}

export function getStrictLocalizedSlug(
  slugValue: unknown,
  locale: SupportedLocale
): string | null {
  if (!slugValue) return null;

  if (typeof slugValue === "string") {
    return locale === DEFAULT_LOCALE ? normalizeSlug(slugValue) : null;
  }

  if (typeof slugValue !== "object") return null;

  return normalizeSlug((slugValue as Partial<Record<SupportedLocale, unknown>>)[locale]);
}
