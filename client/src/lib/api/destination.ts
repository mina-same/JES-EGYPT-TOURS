import { reportDuplicateLinkResponse } from '@/lib/duplicateLinkFeedback';
import { API_URL } from '@/config/api';
import { ILocalizedString, ILocalizedMixed } from '@/types/shared';
import { IFAQ } from '@/types/tour';
import { BlogListItem, BlogPost, PaginationData } from './blog';

export interface DestinationCoverImage {
  url: string;
  fileName?: string;
  title?: ILocalizedString;
  alt?: ILocalizedString;
}

export interface Destination {
  _id: string;
  name: ILocalizedString;
  shortName?: ILocalizedString;
  slug: ILocalizedString;
  subheader?: ILocalizedString;
  description?: ILocalizedString;
  region?: ILocalizedString;
  coverImage?: DestinationCoverImage;

  // Hero Section
  heroTitle?: ILocalizedString;
  heroDescription?: ILocalizedMixed;

  // At a Glance
  bestFor?: ILocalizedString;
  combinesWith?: ILocalizedString;
  timeNeeded?: ILocalizedString;
  bestSeason?: ILocalizedString;

  // Content
  featuredBlogs?: BlogPost[];
  featuredBlogsSectionTitle?: ILocalizedString;
  faqsSectionTitle?: ILocalizedString;
  faqs?: IFAQ[];

  // SEO
  metaTitle?: ILocalizedString;
  metaDescription?: ILocalizedString;
  metaKeywords?: ILocalizedMixed;
  metaImage?: {
    url: string;
    alt?: ILocalizedString;
    width?: number;
    height?: number;
  };
  ogTitle?: ILocalizedString;
  ogDescription?: ILocalizedString;
  ogImage?: string;
  ogType?: string;
  noIndex: boolean;
  noFollow: boolean;

  relatedDestinations?: Partial<Destination>[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DestinationBlogsResponse {
  success: boolean;
  /** Article cards: the blog listings' field set, localized, slugs kept whole. */
  data: BlogListItem[];
  pagination: PaginationData;
}

export interface DestinationsListResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  totalPages: number;
  data: Destination[];
}

/**
 * Get all destinations (used in SSR and admin)
 */
export async function getAllDestinations(params?: {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<DestinationsListResponse> {
  const query = new URLSearchParams();
  if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const res = await fetch(`${API_URL}/destinations?${query.toString()}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error('Failed to fetch destinations');
  return res.json();
}

/**
 * Get a destination by its slug (any locale), for the [slug] route's resolver
 * flow on the server.
 *
 * `locale` reaches the API as the X-Locale header. Without it the server falls
 * back to Accept-Language — absent on server-side renders, present in a browser —
 * so the same page could render in two different languages.
 *
 * Null means one thing only: the API answered 404, the destination does not
 * exist. Any other failure — a 5xx, an unreachable API — throws, as resolveSlug
 * does. Returning null for an outage would make the route call notFound() and
 * answer 404 for a live page, which tells crawlers to drop it.
 */
export async function getDestinationBySlug(slug: string, locale?: string): Promise<Destination | null> {
  let res: Response;
  try {
    res = await fetch(
      `${API_URL}/destinations/slug/${slug}${locale ? `?locale=${locale}` : ''}`,
      {
        next: { revalidate: 3600, tags: ['destinations'] },
        ...(locale ? { headers: { 'X-Locale': locale } } : {}),
      }
    );
  } catch (error) {
    console.error(`[destination] request failed reading "${slug}" (locale=${locale}):`, error);
    throw error;
  }

  if (res.status === 404) return null;

  if (!res.ok) {
    // The status only: an upstream error body may be HTML, empty, or carry
    // detail that does not belong in a log.
    console.error(`[destination] ${res.status} reading "${slug}" (locale=${locale})`);
    throw new Error(`Destination read failed with ${res.status}`);
  }

  const json = (await res.json()) as { success?: boolean; data?: Destination };
  return json.success && json.data ? json.data : null;
}

/**
 * Get a destination by ID
 */
export async function getDestinationById(id: string): Promise<Destination | null> {
  try {
    const res = await fetch(`${API_URL}/destinations/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

/**
 * One page of a destination's article cards.
 *
 * Read on the server for every render of the destination page, so it is
 * cached like the blog category and subcategory listings: 60 seconds, enough
 * that a newly published article appears within a minute. The cache entry is
 * bounded by destination, page, limit and locale.
 *
 * `locale` reaches the API as the X-Locale header AND as a query parameter.
 * The header is what the API reads; the query parameter gives each language
 * its own cache entry, so one locale's cards are never replayed to another.
 * The API ignores the extra parameter.
 */
export async function getBlogsByDestination(
  id: string,
  page = 1,
  limit = 9,
  locale?: string
): Promise<DestinationBlogsResponse> {
  const res = await fetch(
    `${API_URL}/destinations/${id}/blogs?page=${page}&limit=${limit}${locale ? `&locale=${locale}` : ''}`,
    {
      next: { revalidate: 60 },
      ...(locale ? { headers: { 'X-Locale': locale } } : {}),
    }
  );
  if (!res.ok) throw new Error('Failed to fetch destination blogs');
  return res.json();
}

/**
 * Admin: Create a destination
 */
export async function createDestination(
  data: Partial<Destination>,
  token: string
): Promise<{ success: boolean; data: Destination; message?: string }> {
  const res = await fetch(`${API_URL}/destinations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  return reportDuplicateLinkResponse(await res.json());
}

/**
 * Admin: Update a destination
 */
export async function updateDestination(
  id: string,
  data: Partial<Destination>,
  token: string
): Promise<{ success: boolean; data: Destination; message?: string }> {
  const res = await fetch(`${API_URL}/destinations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  return reportDuplicateLinkResponse(await res.json());
}

/**
 * Admin: Delete a destination
 */
export async function deleteDestination(
  id: string,
  token: string
): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${API_URL}/destinations/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return reportDuplicateLinkResponse(await res.json());
}

/**
 * Admin: Toggle active status
 */
export async function toggleDestinationStatus(
  id: string,
  token: string
): Promise<{ success: boolean; data: Destination; message?: string }> {
  const res = await fetch(`${API_URL}/destinations/${id}/toggle-active`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  return reportDuplicateLinkResponse(await res.json());
}
