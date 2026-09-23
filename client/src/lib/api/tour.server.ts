/**
 * Server-side catalog readers for the tour domain.
 *
 * ── Why this file exists ──
 * Everything in ./tour.ts goes through axios, which uses Node's `http` module.
 * Next's Data Cache only instruments `fetch`, so an axios call is structurally
 * invisible to it: no `revalidate`, no tags, no cache entry, ever. That single
 * fact — not `revalidate = 0`, not dynamic rendering — is why the shared
 * [slug] route spent ~750ms per request re-reading the same catalog data.
 *
 * These readers are the `fetch` half of that data layer, and are used ONLY by
 * Server Components. ./tour.ts keeps its axios exports untouched, because the
 * browser and the admin still need them: the axios request interceptor injects
 * auth tokens and X-Locale (or `bypass` on admin pages), neither of which a
 * server render has any use for.
 *
 * ── Cache identity ──
 * `locale` is written into the QUERY STRING as well as the X-Locale header.
 * The header is what the API reads; the query string is what makes the cache
 * key different per language. Relying on the header alone would give every
 * locale ONE shared entry and let German visitors be served English content —
 * the exact bug fixed in the previous task, re-introduced at the cache layer.
 * Verified against the API: the extra parameter is ignored, byte for byte.
 *
 * This mirrors the pattern already proven in ./blog.ts and in the header-menu
 * fetch in (home)/layout.tsx.
 */
import { API_URL } from '@/config/api';
import type { ApiResponse, QueryParams } from './tour';

/* ── Tags ──────────────────────────────────────────────────────────────────
 * These strings must match what the API emits byte-for-byte, or the Mongoose
 * post-hooks clear a tag that nothing is holding. Emitters:
 *   server/src/models/Tour.ts            -> ['tours']
 *   server/src/models/TourCategory.ts    -> ['tour-categories', 'tours']
 *   server/src/models/TourSubcategory.ts -> ['tour-subcategories', 'tours']
 */
export const TOUR_TAG = 'tours';
export const TOUR_CATEGORY_TAG = 'tour-categories';
export const TOUR_SUBCATEGORY_TAG = 'tour-subcategories';

/* ── TTLs ──────────────────────────────────────────────────────────────────
 * Tag invalidation is the PRIMARY freshness mechanism; these are the fallback
 * for a revalidation webhook that never arrived. Catalog content changes only
 * when an editor saves, so an hour is safe. The listing is shorter because a
 * tour publishing on a schedule (services/publishingScheduler.ts runs
 * Tour.updateMany) changes which tours appear, and that path is timer-driven
 * rather than editor-driven.
 */
export const CMS_TTL = 3600;
export const LISTING_TTL = 900;

/**
 * Builds the request URL with a stable, locale-qualified cache identity.
 * Parameters are sorted so two logically identical queries cannot produce two
 * different cache entries.
 */
function buildUrl(path: string, locale: string, params?: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      sp.set(key, String(value));
    }
  }
  sp.set('locale', locale);
  const sorted = new URLSearchParams([...sp.entries()].sort(([a], [b]) => a.localeCompare(b)));
  return `${API_URL}/${path}?${sorted.toString()}`;
}

type CachedGetOptions = {
  locale: string;
  tags: string[];
  revalidate: number;
  params?: Record<string, unknown>;
  /** Set false to bypass the Data Cache entirely (unbounded filter queries). */
  cache?: boolean;
};

/**
 * One GET, with the error semantics the resolver already depended on.
 *
 * `fetch` does not throw on 404 or 500 the way axios did, so the distinction
 * has to be drawn by hand. Both return null — the resolver's
 * `if (res?.success && res?.data)` checks then fall through to the next content
 * type exactly as before — but a 5xx or a network fault is genuinely different
 * from "this slug is not a tour", and only the former is worth logging.
 * Without that split the old failure mode stays invisible: every catch returns
 * empty, the page answers HTTP 200 with an empty shell, and nothing anywhere
 * records that the API was down.
 */
async function cachedGet<T>(
  path: string,
  { locale, tags, revalidate, params, cache = true }: CachedGetOptions
): Promise<ApiResponse<T> | null> {
  const url = buildUrl(path, locale, params);
  try {
    const res = await fetch(url, {
      headers: { 'X-Locale': locale },
      ...(cache ? { next: { revalidate, tags } } : { cache: 'no-store' as const }),
    });

    if (!res.ok) {
      // 404 is ordinary here: the resolver probes several content types by slug
      // and most of those probes miss. Anything else is a real fault.
      if (res.status !== 404) {
        console.error(`[tour.server] ${res.status} from ${path} (locale=${locale})`);
      }
      return null;
    }

    return (await res.json()) as ApiResponse<T>;
  } catch (error) {
    console.error(`[tour.server] request failed for ${path} (locale=${locale}):`, error);
    return null;
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Entity reads
 * ──────────────────────────────────────────────────────────────────────────*/

export const tourServerAPI = {
  /**
   * Resolver probe #1, and the read behind every tour detail page.
   *
   * Tagged `tours`, which also settles what happens to a NEGATIVE result. Next
   * caches the 404 alongside the hits, so a slug that does not exist yet would
   * otherwise keep 404-ing for the whole TTL — bad for a page an editor just
   * published. But creating a tour fires Tour.ts's post('save') hook, which
   * clears the `tours` tag, which drops the cached 404 with it. The new page is
   * live on the very next request, and the TTL is only the backstop.
   */
  getBySlug: (slug: string, locale: string) =>
    cachedGet<any>(`tours/slug/${encodeURIComponent(slug)}`, {
      locale,
      tags: [TOUR_TAG],
      revalidate: CMS_TTL,
    }),

  /**
   * The tour listing.
   *
   * `cacheable` is decided by the caller through isCanonicalListing(): bounded
   * queries are cached, free-text search and arbitrary price ranges are not.
   * Currency rides in the query string and is therefore part of the cache key,
   * so a EUR listing can never be replayed to a GBP visitor.
   */
  getListing: (params: QueryParams, locale: string, cacheable: boolean) =>
    cachedGet<any[]>('tours', {
      locale,
      tags: [TOUR_TAG],
      revalidate: LISTING_TTL,
      params: params as Record<string, unknown>,
      cache: cacheable,
    }),
};

export const tourCategoryServerAPI = {
  getBySlug: (slug: string, locale: string) =>
    cachedGet<any>(`tours/categories/slug/${encodeURIComponent(slug)}`, {
      locale,
      tags: [TOUR_CATEGORY_TAG],
      revalidate: CMS_TTL,
    }),
};

export const tourSubcategoryServerAPI = {
  getBySlug: (slug: string, locale: string, categoryId?: string) =>
    cachedGet<any>(`tours/subcategories/slug/${encodeURIComponent(slug)}`, {
      locale,
      tags: [TOUR_SUBCATEGORY_TAG],
      revalidate: CMS_TTL,
      params: categoryId ? { category: categoryId } : undefined,
    }),

  /**
   * The subcategory rail under a category, and the sibling rail on a
   * subcategory page. Tagged with BOTH tags: the payload is subcategory data,
   * but each card's `toursCount` is derived from tours, so publishing a tour
   * changes this response without any subcategory having been edited.
   */
  getByCategory: (categoryId: string, locale: string) =>
    cachedGet<any[]>(`tours/categories/${encodeURIComponent(categoryId)}/subcategories`, {
      locale,
      tags: [TOUR_SUBCATEGORY_TAG, TOUR_TAG],
      revalidate: CMS_TTL,
    }),
};

/* ────────────────────────────────────────────────────────────────────────────
 * Listing cache policy
 * ──────────────────────────────────────────────────────────────────────────*/

/**
 * The sorts the listing UI can actually produce (CategoryView's select).
 * Anything else is hand-typed or hostile, and not worth a cache entry.
 */
const CACHEABLE_SORTS = new Set([
  '-createdAt',
  'createdAt',
  'priceStartingFrom',
  '-priceStartingFrom',
  'heading',
  'tourLocation',
]);

/** Deep pagination is neither crawled nor browsed; past this we stop caching. */
const MAX_CACHEABLE_PAGE = 20;

const OBJECT_ID = /^[0-9a-f]{24}$/i;

/**
 * Is this listing query bounded enough to deserve a cache entry?
 *
 * The cardinality trap in per-fetch caching is the listing, because `search` is
 * free text and the price bounds are arbitrary numbers — caching on the raw
 * query string would mint an unbounded number of entries. So only the shapes a
 * visitor can reach by clicking are cached:
 *
 *   scope (category or subcategory id) x locale x currency x page x sort
 *
 * which is about 7 scopes x 4 locales x 3 currencies x a few pages x 6 sorts —
 * hundreds of keys, not millions. Everything else runs uncached, which is
 * exactly how those URLs behave today, so nothing regresses.
 *
 * This costs less traffic than it appears to: the canonical, unfiltered URL is
 * what Google crawls and where most visitors land.
 */
export function isCanonicalListing(query: {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  tourType?: string;
  tourStyle?: string;
  sort?: string;
  page?: number;
  subcategory?: string;
}): boolean {
  if (query.search) return false;
  if (query.minPrice !== undefined) return false;
  if (query.maxPrice !== undefined) return false;
  if (query.tourType) return false;
  if (query.tourStyle) return false;

  if (query.sort && !CACHEABLE_SORTS.has(query.sort)) return false;
  if (query.page !== undefined && (query.page < 1 || query.page > MAX_CACHEABLE_PAGE)) return false;

  // A subcategory filter is a bounded set, but only when it looks like an id.
  if (query.subcategory && !OBJECT_ID.test(query.subcategory)) return false;

  return true;
}
