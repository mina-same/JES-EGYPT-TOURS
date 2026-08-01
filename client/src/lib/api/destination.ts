import { API_URL } from '@/config/api';
import { ILocalizedString, ILocalizedMixed } from '@/types/shared';
import { IFAQ } from '@/types/tour';
import { BlogPost, PaginationData } from './blog';

export interface DestinationCoverImage {
  url: string;
  fileName?: string;
  title?: ILocalizedString;
  alt?: ILocalizedString;
}

export interface Destination {
  _id: string;
  name: ILocalizedString;
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
  data: BlogPost[];
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
 * Get a destination by its slug (any locale)
 * Used in SSR slug router
 */
/**
 * `locale` reaches the API as the X-Locale header. Without it the server falls
 * back to Accept-Language — absent on server-side renders, present in a browser —
 * so the same page could render in two different languages.
 */
export async function getDestinationBySlug(slug: string, locale?: string): Promise<Destination | null> {
  try {
    const res = await fetch(`${API_URL}/destinations/slug/${slug}`, {
      cache: 'no-store',
      ...(locale ? { headers: { 'X-Locale': locale } } : {}),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
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
 * Get paginated blogs tagged with this destination
 */
/**
 * `locale` reaches the API as the X-Locale header. Without it the server falls
 * back to Accept-Language — absent on server-side renders, present in a browser —
 * so the same page could render in two different languages.
 */
export async function getBlogsByDestination(
  id: string,
  page = 1,
  limit = 9,
  locale?: string
): Promise<DestinationBlogsResponse> {
  const res = await fetch(
    `${API_URL}/destinations/${id}/blogs?page=${page}&limit=${limit}`,
    { cache: 'no-store', ...(locale ? { headers: { 'X-Locale': locale } } : {}) }
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
  return res.json();
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
  return res.json();
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
  return res.json();
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
  return res.json();
}
