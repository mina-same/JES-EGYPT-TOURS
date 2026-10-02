import { API_URL } from '@/config/api';
import { BLOG_TAG } from '@/lib/api/blogCachePolicy';
import { TOUR_TAG } from '@/lib/api/tour.server';

/**
 * The sitemap's one data read: GET /api/sitemap
 * (server/src/controllers/sitemapController.ts) — every visible entity's
 * per-locale slugs, last-write date and indexing flags, and nothing else.
 *
 * ── Cache policy ──
 * Tagged with every tag whose producer can add, remove or rename a sitemap URL:
 *   blog  — Blog, BlogCategory, BlogSubCategory and EditorialAuthor writes
 *   tours — Tour, TourCategory, TourSubcategory and Destination writes
 *           (all four emit it, alongside their own narrower tags)
 *   faq   — Faq writes: /faq is listed only in languages that have questions
 * so a publish, unpublish, slug change or delete reaches the sitemap on the
 * next request.
 *
 * The hour is the backstop, and it is doing real work: Next keeps tag
 * invalidations in memory only, so a restart forgets them while the cached
 * response survives on disk (.next/cache/fetch-cache survives rebuilds too).
 * Whatever a lost webhook or a restart leaves behind is at most an hour old.
 * This replaces reads that carried no cache options at all, which `next build`
 * stored for a year with no tag — a rebuild then reused them.
 */
export const SITEMAP_TTL = 3600;

/** Emitted by server/src/models/Faq.ts. */
export const FAQ_TAG = 'faq';

export const SITEMAP_TAGS = [BLOG_TAG, TOUR_TAG, FAQ_TAG];

export type SitemapLocale = 'en' | 'de' | 'it' | 'es';

export interface SitemapEntity {
  /** Raw per-locale slugs, as stored. */
  slug: Partial<Record<SitemapLocale, string>>;
  /** ISO timestamp of the entity's last write, when it has one. */
  updatedAt?: string;
  /** Articles only: the languages the article has text of its own in. */
  locales?: SitemapLocale[];
  /** Existing unfiltered listing pages, including page one. */
  pageCounts?: Partial<Record<SitemapLocale, number>>;
}

export interface SitemapData {
  tours: SitemapEntity[];
  tourCategories: SitemapEntity[];
  tourSubcategories: SitemapEntity[];
  blogCategories: SitemapEntity[];
  blogSubcategories: SitemapEntity[];
  blogs: SitemapEntity[];
  destinations: SitemapEntity[];
  authors: { slug: string; locales: SitemapLocale[] }[];
  faqLocales: SitemapLocale[];
}

export const SITEMAP_FAMILIES = [
  'tours',
  'tourCategories',
  'tourSubcategories',
  'blogCategories',
  'blogSubcategories',
  'blogs',
  'destinations',
] as const;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Enough of a shape check that a truncated or foreign body cannot become a sitemap. */
export function isSitemapData(value: unknown): value is SitemapData {
  if (!isObject(value)) return false;
  const families = SITEMAP_FAMILIES.every(
    (family) => Array.isArray(value[family]) && (value[family] as unknown[]).every((e) => isObject(e) && isObject(e.slug))
  );
  return (
    families &&
    Array.isArray(value.authors) &&
    (value.authors as unknown[]).every((a) => isObject(a) && typeof a.slug === 'string' && Array.isArray(a.locales)) &&
    Array.isArray(value.faqLocales)
  );
}

/**
 * Throws on every failure — an unreachable API, a non-200, a body that is not
 * sitemap data. There is no empty fallback: a sitemap built from nothing tells
 * search engines the site has no pages, where a failed request tells them to
 * come back later. Once a response is cached, an outage keeps serving it: Next
 * serves the stale entry and refreshes it in the background, and a refresh
 * that fails leaves the entry in place.
 */
export async function getSitemapData(): Promise<SitemapData> {
  const res = await fetch(`${API_URL}/sitemap`, {
    next: { revalidate: SITEMAP_TTL, tags: SITEMAP_TAGS },
  });
  if (!res.ok) {
    throw new Error(`Sitemap data read failed with ${res.status}`);
  }
  const json = (await res.json()) as { success?: boolean; data?: unknown };
  if (!json?.success || !isSitemapData(json.data)) {
    throw new Error('Sitemap data response was not sitemap data');
  }
  return json.data;
}
