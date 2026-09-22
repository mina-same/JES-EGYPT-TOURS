import { DEFAULT_LOCALE, type SupportedLocale } from "./locales";

export type LocalizedSlugMap = Partial<Record<SupportedLocale, string | null | undefined>>;
export type LocalizedSlugInput = LocalizedSlugMap | string | null | undefined;

/**
 * The one shape a localized slug may take: lowercase a-z/0-9 words joined by
 * single hyphens. No uppercase, accents, underscores, spaces, slashes, query
 * characters or doubled hyphens — so a stored value like "3", "Giza-Pyramids",
 * "pirámides-de-giza" or a whole URL can never become a link.
 *
 * Kept deliberately in sync with the server's own rule in
 * server/src/models/Blog.ts, which rejects the same shapes on save. This copy
 * is the defensive half: the database is the only place a malformed slug can
 * come from, and a record written before that rule existed — or edited around
 * it — must degrade to "this language has no page" rather than to a link that
 * 404s. All 215 slugs in the current data set satisfy it.
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Shorter than this is a placeholder, not a slug. */
const MIN_SLUG_LENGTH = 3;

function normalizeSlug(slug: unknown): string | null {
  if (typeof slug !== "string") return null;

  // Trimmed, never repaired: a malformed slug is reported as absent rather
  // than lower-cased, stripped of accents or otherwise rewritten into a URL
  // the database does not actually hold.
  const normalized = slug.trim();
  if (normalized.length < MIN_SLUG_LENGTH) return null;

  return SLUG_PATTERN.test(normalized) ? normalized : null;
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
