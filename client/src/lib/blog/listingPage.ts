/**
 * The URL contract of a Blog listing: a Blog category, a topic, and the
 * article section of a destination page.
 *
 * Their one functional query parameter is `page`, and it means what it means
 * on a Tour listing (lib/tours/publicListingUrl.ts) — so it is read with that
 * parser rather than with a second copy of its rules:
 *
 *   - the clean URL is page 1, and the only spelling of it;
 *   - `?page=N` names a page only as a plain positive integer. "02" is page 2
 *     written another way and is redirected; "1.5", "+2", "2e1", an empty
 *     value and a repeated parameter name no page at all;
 *   - tracking parameters ride along and never reach a canonical URL, and any
 *     other parameter is not part of the URL space.
 *
 * What a page that exists then IS depends on the role of the page it is on:
 *
 *   - `archive` (category, topic): the article list is the page. Page N is a
 *     page of its own — self-canonical, indexable, with its own alternates;
 *   - `landing` (destination): the list is one section of a landing page.
 *     Page N is a state of that page — it canonicalizes to it, is not indexed,
 *     and has no alternates.
 *
 * Server-side only: the Tour parser brings the filter catalog with it, so a
 * Client Component must not import this module.
 */
import type { Metadata } from 'next';
import { getStrictSlugLocaleAlternates } from '@/lib/seo/localeAlternates';
import { getListingRobotsMetadata } from '@/lib/seo/robots';
import {
  parsePublicListingQuery,
  PUBLIC_LISTING_KEYS,
  shouldRedirectPublicQuery,
} from '@/lib/tours/publicListingUrl';
import {
  DEFAULT_LOCALE,
  getStrictLocalizedSlug,
  SUPPORTED_LOCALES,
  type LocalizedSlugInput,
  type SupportedLocale,
} from '@/lib/url';

export type ListingQuery = Record<string, string | string[] | undefined>;
export type BlogListingRole = 'archive' | 'landing';

/** Cards per page on the three visitor listings. */
export const BLOG_LISTING_PAGE_SIZE = 9;

export type BlogListingRequest = {
  /** The page asked for; 1 when the URL carries no `page`. */
  page: number;
  /** What the canonical form of this URL carries: '' or '?page=N', then any tracking parameters. */
  search: string;
  /** False when the URL is another spelling of that form: `?page=1`, `?page=02`. */
  isCanonical: boolean;
};

/** A Tour filter is as unknown on a Blog listing as any other parameter. */
const TOUR_FILTER_KEYS = PUBLIC_LISTING_KEYS.filter((key) => key !== 'page');

/** The request a query string makes of a Blog listing, or null when it names no page. */
export function parseBlogListingQuery(query: ListingQuery): BlogListingRequest | null {
  if (TOUR_FILTER_KEYS.some((key) => query[key] !== undefined)) return null;
  const parsed = parsePublicListingQuery(query);
  if (parsed.error) return null;
  return {
    page: parsed.state.page,
    search: parsed.redirectSearch,
    isCanonical: !shouldRedirectPublicQuery(query, parsed),
  };
}

/** One page of a listing as the API returns it; only what the contract reads. */
export type BlogListingPage = {
  data?: readonly unknown[] | null;
  pagination?: { pages?: number } | null;
};

/** Whether `locale` can draw a card for at least one of these articles. */
const hasCardIn = (articles: readonly unknown[] | null | undefined, locale: string): boolean =>
  (articles ?? []).some((article) =>
    Boolean(getStrictLocalizedSlug((article as { slug?: unknown } | null)?.slug, locale as SupportedLocale))
  );

/**
 * Whether a listing serves `page` in `locale`.
 *
 * Page 1 is the entity's own landing page, and exists with nothing to list.
 * A later page exists when the listing has that many pages AND this language
 * can draw at least one of its cards: the API counts articles in every
 * language alike, so a page it calls valid may hold only articles this
 * language has no URL for.
 */
export function servesBlogListingPage(listing: BlogListingPage, page: number, locale: string): boolean {
  if (page === 1) return true;
  return page <= (Number(listing.pagination?.pages) || 0) && hasCardIn(listing.data, locale);
}

export type BlogListingOutcome<T> =
  | { status: 404 }
  | { status: 308; location: string }
  | { status: 200; page: number; listing: T };

/**
 * What a request for a Blog listing URL comes to, decided in a fixed order:
 * a query that names no page is a 404 before anything is read; then the page
 * is read and must exist; only then is another spelling of the URL — an alias
 * of the slug, `?page=02` — redirected to the canonical one. A redirect never
 * points at a page that is not there, and a malformed page is not rescued by
 * an alias.
 *
 * `slug` is the one in the URL, `canonicalSlug` the entity's own in this
 * language; `read` fetches one page of its articles.
 */
export async function resolveBlogListingRequest<T extends BlogListingPage>({
  query,
  locale,
  slug,
  canonicalSlug,
  read,
}: {
  query: ListingQuery;
  locale: string;
  slug: string;
  canonicalSlug: string;
  read: (page: number) => Promise<T>;
}): Promise<BlogListingOutcome<T>> {
  const request = parseBlogListingQuery(query);
  if (!request) return { status: 404 };

  const location = `/${locale}/${canonicalSlug}${request.search}`;
  const moved = slug !== canonicalSlug || !request.isCanonical;
  // Page 1 always exists, so another spelling of it is sent on unread.
  if (request.page === 1 && moved) return { status: 308, location };

  const listing = await read(request.page);
  if (!servesBlogListingPage(listing, request.page, locale)) return { status: 404 };
  return moved ? { status: 308, location } : { status: 200, page: request.page, listing };
}

/**
 * Canonical and hreflang for a listing page that exists.
 *
 * An archive's page N is its own page, so it canonicalizes to itself and its
 * alternates are the same page N — in the languages that serve it, by the
 * rule servesBlogListingPage applies. Every language gets the same articles
 * on a page (the API does not filter by language), so `articles`, this page's
 * own, answers that for all of them.
 */
export function getBlogListingAlternates({
  role,
  page,
  locale,
  slug,
  slugs,
  baseUrl,
  articles,
}: {
  role: BlogListingRole;
  page: number;
  locale: string;
  slug: string;
  slugs: LocalizedSlugInput;
  baseUrl: string;
  articles?: readonly unknown[] | null;
}): NonNullable<Metadata['alternates']> {
  const base = getStrictSlugLocaleAlternates({ locale, currentSlug: slug, slugs, baseUrl });
  if (page === 1) return base;
  if (role === 'landing') return { canonical: base.canonical };

  const baseLanguages = (base.languages || {}) as Record<string, string | undefined>;
  const languages: Record<string, string> = {};
  for (const language of SUPPORTED_LOCALES) {
    const url = baseLanguages[language];
    if (url && hasCardIn(articles, language)) languages[language] = `${url}?page=${page}`;
  }
  if (languages[DEFAULT_LOCALE]) languages['x-default'] = languages[DEFAULT_LOCALE];
  return { canonical: `${base.canonical}?page=${page}`, languages };
}

/**
 * robots for a listing page that exists. Only a landing page's later pages
 * are kept out of the index; the site switch still overrides everything.
 */
export function getBlogListingRobots(role: BlogListingRole, page: number): NonNullable<Metadata['robots']> {
  return getListingRobotsMetadata(role === 'landing' && page > 1);
}

/**
 * The editorial title with the page after it: "Egypt Travel Blog – Page 2".
 * `pagePattern` is the localized "Page {{page}}" (common:pagination.page).
 */
export function withPageNumber(title: string, page: number, pagePattern: string): string {
  if (page === 1) return title;
  const label = pagePattern.includes('{{page}}') ? pagePattern.replace('{{page}}', String(page)) : String(page);
  return `${title} – ${label}`;
}
