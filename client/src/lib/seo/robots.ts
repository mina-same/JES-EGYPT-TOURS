import type { Metadata } from "next";

/**
 * The pre-launch master switch: the site may be indexed only when
 * NEXT_PUBLIC_SITE_INDEXABLE is exactly 'true'. Unset — the default, and the
 * state during development — keeps every page out of search indexes.
 *
 * Next inlines NEXT_PUBLIC_ values at build time, so this is decided when the
 * site is built. For server metadata only; robots.ts reads the same flag for
 * robots.txt.
 */
export const isSiteIndexable = (): boolean => process.env.NEXT_PUBLIC_SITE_INDEXABLE === "true";

/**
 * robots metadata for a visitor page: the site switch alone. While the site is
 * not indexable every page is noindex, nofollow; once it is, index, follow.
 *
 * There is no per-page override. Content that should not be found is not
 * published (a draft, or inactive), so it has no public page at all; a page
 * that exists is meant to be indexed. The [locale] layout applies this to
 * every visitor page.
 */
export function getRobotsMetadata(): NonNullable<Metadata["robots"]> {
  if (!isSiteIndexable()) return { index: false, follow: false };
  return { index: true, follow: true };
}

/** Utility listing/search URLs remain followable but are never SEO pages. */
export function getListingRobotsMetadata(isUtility: boolean): NonNullable<Metadata["robots"]> {
  if (!isSiteIndexable()) return { index: false, follow: false };
  return isUtility ? { index: false, follow: true } : { index: true, follow: true };
}

/**
 * robots metadata for a not-found (404) response: noindex, nofollow, before
 * and after launch alike. A URL that does not exist has nothing to index, so
 * neither the site switch nor any entity is consulted.
 *
 * Next adds a bare "noindex" to every 404 by itself. Without this value next
 * to it, a 404 carries the layout's site value, which is "index, follow" once
 * the site is launched, and the two contradict each other.
 */
export function getNotFoundRobotsMetadata(): NonNullable<Metadata["robots"]> {
  return { index: false, follow: false };
}
