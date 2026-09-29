/**
 * The Blog family's Data Cache policy, in one place.
 *
 * Every server-side read of Blog data — articles, categories, subcategories,
 * their listings, a destination's articles, the author page — takes its TTL,
 * its tags and its page bound from here:
 *
 *   Data                                          TTL    Tags
 *   Article, category, subcategory                3600   blog
 *   Homepage featured strip                       3600   blog
 *   Category directory, topic and sibling lists   3600   blog
 *   Category, subcategory, destination and          60   blog
 *     all-articles listings, pages 1–20
 *   Author page (profile + one page), pages 1–20  3600   author:<slug>, blog
 *   Listing page above 20, tag or search query    not stored
 *
 * ── Invalidation ──
 * `blog` is the one tag the API emits for this whole family. Blog,
 * BlogCategory and BlogSubCategory clear it on every write — create, edit,
 * publish, the scheduler's updateMany, delete — and EditorialAuthor clears it
 * together with `author:<slug>` (server/src/models, services/revalidate.ts).
 * The front end's /api/revalidate expires tagged entries at once, so an edit
 * is live on the next request and a TTL is only the backstop for a webhook
 * that never arrived.
 *
 * ── Bounded ──
 * Each URL here is built from an id or slug the resolver already matched, a
 * fixed page size, one of four locales and a page number — and the page
 * number is the one part a visitor can mint freely (?page=999999). Pages are
 * therefore normalized before they reach a URL, and only pages 1–20 are
 * stored: the tour listing's bound, and well beyond any Blog listing today.
 * Free-text queries (a tag, a search) are never stored.
 */

/** Emitted by the API for every write to an article, category, subcategory or author. */
export const BLOG_TAG = 'blog';

/**
 * Documents and directories: they change when an editor saves, and every save
 * clears the tag.
 */
export const BLOG_ENTITY_TTL = 3600;

/** Article listings: short, so even a missed invalidation heals within a minute. */
export const BLOG_LISTING_TTL = 60;

/** The highest listing page that gets a Data Cache entry. */
export const MAX_CACHEABLE_BLOG_PAGE = 20;

/**
 * A `page` value as the page the listing will actually show: its whole-number
 * part when that is at least 1, and page 1 for anything else ("abc", 0, -1,
 * 0.5). Equivalent inputs — "2", "02", "2.7" — then share one URL and one
 * cache entry, and no page below 1 reaches the API, which answers a negative
 * skip with a 500.
 */
export function normalizeBlogPage(page: unknown): number {
  const value = typeof page === 'number' ? page : Number(page);
  return Number.isFinite(value) && value >= 1 ? Math.floor(value) : 1;
}

type BlogCacheOptions = Pick<RequestInit, 'cache' | 'next'>;

/**
 * The fetch options that keep a read in the Data Cache under `tags` for
 * `revalidate` seconds — or, with `store` false, keep it out.
 *
 * In the browser there is no Data Cache: `next` would do nothing there, and
 * `no-store` would only switch off the browser's own HTTP cache, so a read
 * running in the browser gets no cache options at all.
 */
export function blogCacheOptions(revalidate: number, tags: string[], store = true): BlogCacheOptions {
  if (typeof window !== 'undefined') return {};
  return store ? { next: { revalidate, tags } } : { cache: 'no-store' };
}

/**
 * A listing page's options: stored under `blog` for BLOG_LISTING_TTL when it
 * is a canonical query within the page bound, and never stored otherwise.
 * `page` must already be normalized.
 */
export function blogListingCacheOptions(page: number, canonical = true): BlogCacheOptions {
  return blogCacheOptions(BLOG_LISTING_TTL, [BLOG_TAG], canonical && page <= MAX_CACHEABLE_BLOG_PAGE);
}
