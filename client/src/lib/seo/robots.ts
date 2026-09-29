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
 * robots metadata for a visitor page, in two layers:
 *
 *   1. The site switch. While the site is not indexable, every page is
 *      noindex, nofollow — whatever the page or its editor says.
 *   2. The editor's "No Index" on the page's own entity (articles, blog
 *      categories and topics, destinations): noindex, follow. The page stays
 *      live and its links are still followed; it just is not listed — the
 *      same entities the sitemap leaves out.
 *
 * Otherwise index, follow.
 *
 * A page that sets `robots` replaces the layout's value outright rather than
 * merging with it, which is why layer 1 is applied here as well: no page can
 * reopen indexing that the site switch has closed.
 */
export function getRobotsMetadata(entityNoIndex?: boolean | null): NonNullable<Metadata["robots"]> {
  if (!isSiteIndexable()) return { index: false, follow: false };
  if (entityNoIndex === true) return { index: false, follow: true };
  return { index: true, follow: true };
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
