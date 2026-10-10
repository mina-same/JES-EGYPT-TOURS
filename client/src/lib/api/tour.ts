import { publicGet, type PublicGetOptions } from './publicGet';
import type { CurrencyCode } from '@/contexts/CurrencyContext';

const API_BASE = 'tours';

// ==================== TRANSPORT ====================

/**
 * The shared axios instance, loaded when a call needs it.
 *
 * Imported at the top of this file it put axios into the JavaScript of every
 * visitor page that reads a tour (the listings, special offers, search, the
 * wishlist), though a visitor only ever reads here. Every write below, and
 * every call made from an admin page, still goes through it.
 */
const loadAxios = () => import('./axios').then((module) => module.default);

/**
 * A read.
 *
 * In a visitor's browser it is a fetch (./publicGet.ts, which sends the
 * request axios sent and settles as axios settled). The endpoints read here
 * are public or `optionalProtect`, so the axios instance's 401 handling had
 * nothing to act on for a visitor.
 *
 * Under /admin, and during server rendering, it stays on the axios instance:
 * the admin pages rely on its response interceptor (session expiry, duplicate
 * link feedback) and read with `includeInactive` behind a token. "/admin" is
 * the test the instance's own request interceptor applies.
 */
async function get<T>(url: string, config?: PublicGetOptions): Promise<T> {
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/admin')) {
    return publicGet<T>(`/${url}`, config);
  }

  const axiosInstance = await loadAxios();
  const response = await axiosInstance.get<T>(url, config);
  return response.data;
}

// ==================== TYPES ====================

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  /**
   * ADMIN ONLY — include deactivated/scheduled tours. Public/visitor calls must
   * omit it: the API returns active tours only unless this is true.
   */
  includeInactive?: boolean;
  scheduled?: boolean;
  isFeatured?: boolean;
  isSpecialOffer?: boolean;
  sort?: string;
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  tourType?: string;
  tourStyles?: string;
  destinations?: string;
  destinationKeys?: string;
  durationRange?: string;
  currency?: CurrencyCode;
  fields?: string;
}

export interface TourFilterOptions {
  tourTypes: { id: string; label: string }[];
  tourStyles: { id: string; label: string }[];
  destinations: { id: string; label: string }[];
  priceRange: {
    min: number | null;
    max: number | null;
    currency: CurrencyCode;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
  total?: number;
  page?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

// ==================== TOUR CATEGORY API ====================

export const tourCategoryAPI = {
  /**
   * Get all tour categories
   */
  getAll: async (params?: QueryParams) => {
    return get<ApiResponse<any[]>>(
      `${API_BASE}/categories`,
      { params }
    );
  },

  /**
   * Get category by ID
   */
  getById: async (id: string) => {
    return get<ApiResponse<any>>(
      `${API_BASE}/categories/${id}`
    );
  },

  /**
   * Get category by slug
   */
  getBySlug: async (slug: string, locale?: string) => {
    return get<ApiResponse<any>>(
      `${API_BASE}/categories/slug/${slug}`,
      {
        headers: locale ? { 'X-Locale': locale } : undefined
      }
    );
  },

  /**
   * Create new category
   */
  create: async (data: any) => {
    const axiosInstance = await loadAxios();
    const response = await axiosInstance.post<ApiResponse<any>>(
      `${API_BASE}/categories`,
      data
    );
    return response.data;
  },

  /**
   * Update category
   */
  update: async (id: string, data: any) => {
    try {
      const axiosInstance = await loadAxios();
      const response = await axiosInstance.put<ApiResponse<any>>(
        `${API_BASE}/categories/${id}`,
        data
      );
      return response.data;
    } catch (err: any) {
      console.error('Category update API error:', err.response?.data || err.message);
      throw err;
    }
  },

  /**
   * Toggle category status
   */
  toggleStatus: async (id: string) => {
    const axiosInstance = await loadAxios();
    const response = await axiosInstance.patch<ApiResponse<any>>(
      `${API_BASE}/categories/${id}/toggle-active`
    );
    return response.data;
  },

  /**
   * Delete category
   */
  delete: async (id: string) => {
    const axiosInstance = await loadAxios();
    const response = await axiosInstance.delete<ApiResponse<any>>(
      `${API_BASE}/categories/${id}`
    );
    return response.data;
  },
};

// ==================== TOUR SUBCATEGORY API ====================

export const tourSubcategoryAPI = {
  /**
   * Get all subcategories
   */
  getAll: async (params?: QueryParams) => {
    return get<ApiResponse<any[]>>(
      `${API_BASE}/subcategories`,
      { params }
    );
  },

  /**
   * Get subcategories by category ID.
   *
   * `locale` reaches the API as the X-Locale header, exactly as it does in
   * `getBySlug` below and in every other localized call in this file.
   *
   * It is optional because the browser does not need it: the request
   * interceptor in ./axios.ts fills X-Locale in from i18n (or `bypass` on
   * admin pages). That interceptor returns early when `window` is undefined,
   * so a SERVER-side caller that omits the locale sends no header at all —
   * and the API's i18n middleware then falls back through Accept-Language,
   * which a server render never sends either, to 'en'. The result was every
   * locale receiving English subcategory names. Server callers must pass it.
   */
  getByCategory: async (categoryId: string, params?: QueryParams, locale?: string) => {
    return get<ApiResponse<any[]>>(
      `${API_BASE}/categories/${categoryId}/subcategories`,
      {
        params,
        headers: locale ? { 'X-Locale': locale } : undefined
      }
    );
  },

  /**
   * Get subcategory by ID
   */
  getById: async (id: string) => {
    return get<ApiResponse<any>>(
      `${API_BASE}/subcategories/${id}`
    );
  },

  /**
   * Get subcategory by slug
   */
  getBySlug: async (slug: string, categoryId?: string, locale?: string) => {
    const params = categoryId ? { category: categoryId } : undefined;
    return get<ApiResponse<any>>(
      `${API_BASE}/subcategories/slug/${slug}`,
      {
        params,
        headers: locale ? { 'X-Locale': locale } : undefined
      }
    );
  },

  /**
   * Create new subcategory
   */
  create: async (data: any) => {
    const axiosInstance = await loadAxios();
    const response = await axiosInstance.post<ApiResponse<any>>(
      `${API_BASE}/subcategories`,
      data
    );
    return response.data;
  },

  /**
   * Update subcategory
   */
  update: async (id: string, data: any) => {
    const axiosInstance = await loadAxios();
    const response = await axiosInstance.put<ApiResponse<any>>(
      `${API_BASE}/subcategories/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Toggle subcategory status
   */
  toggleStatus: async (id: string) => {
    const axiosInstance = await loadAxios();
    const response = await axiosInstance.patch<ApiResponse<any>>(
      `${API_BASE}/subcategories/${id}/toggle-active`
    );
    return response.data;
  },

  /**
   * Delete subcategory
   */
  delete: async (id: string) => {
    const axiosInstance = await loadAxios();
    const response = await axiosInstance.delete<ApiResponse<any>>(
      `${API_BASE}/subcategories/${id}`
    );
    return response.data;
  },
};

// ==================== TOUR API ====================

export const tourAPI = {
  /**
   * Get all tours with filtering
   */
  getAll: async (params?: QueryParams, locale?: string, signal?: AbortSignal) => {
    return get<ApiResponse<any[]>>(
      `${API_BASE}`,
      {
        params,
        headers: locale ? { 'X-Locale': locale } : undefined,
        signal,
      }
    );
  },

  /** Get all values available to the filters in a listing scope. */
  getFilterOptions: async (
    params?: Pick<QueryParams, 'category' | 'subcategory' | 'isFeatured' | 'isSpecialOffer' | 'currency'>,
    locale?: string,
    signal?: AbortSignal
  ) => {
    return get<ApiResponse<TourFilterOptions>>(
      `${API_BASE}/filter-options`,
      {
        params,
        headers: locale ? { 'X-Locale': locale } : undefined,
        signal,
      }
    );
  },

  /**
   * Get featured tours
   */
  getFeatured: async (limit?: number) => {
    return get<ApiResponse<any[]>>(
      `${API_BASE}/featured`,
      { params: { limit } }
    );
  },

  /**
   * Get tours by subcategory
   */
  getBySubcategory: async (subcategoryId: string, params?: QueryParams) => {
    return get<ApiResponse<any[]>>(
      `${API_BASE}/subcategories/${subcategoryId}/tours`,
      { params }
    );
  },

  /**
   * Get tour by ID
   */
  getById: async (id: string) => {
    return get<ApiResponse<any>>(
      `${API_BASE}/${id}`
    );
  },

  /**
   * Resolve several tours at once — card fields only.
   *
   * For the wishlist, which used to fire one getById per saved tour and pull a
   * whole document (itinerary, FAQs, pricing plans) to draw a card. A tour that
   * is currently deactivated comes back reduced to `{ _id, isActive: false }`
   * so it can be shown as unavailable without being dropped; a tour that no
   * longer exists is simply absent from the reply.
   */
  getByIds: async (ids: string[]) => {
    return get<ApiResponse<any[]>>(
      `${API_BASE}/by-ids`,
      { params: { ids: ids.join(',') } }
    );
  },

  /**
   * Get tour by slug
   */
  getBySlug: async (slug: string, locale?: string) => {
    return get<ApiResponse<any>>(
      `${API_BASE}/slug/${slug}`,
      {
        headers: locale ? { 'X-Locale': locale } : undefined
      }
    );
  },

  /**
   * Get tour by external ID
   */
  getByExternalId: async (externalId: string) => {
    return get<ApiResponse<any>>(
      `${API_BASE}/external/${externalId}`
    );
  },

  /**
   * Get related tours
   */
  getRelated: async (id: string, limit?: number) => {
    return get<ApiResponse<any[]>>(
      `${API_BASE}/${id}/related`,
      { params: { limit } }
    );
  },

  /**
   * Create new tour
   */
  create: async (data: any) => {
    const axiosInstance = await loadAxios();
    const response = await axiosInstance.post<ApiResponse<any>>(
      `${API_BASE}`,
      data
    );
    return response.data;
  },

  /**
   * Update tour
   */
  update: async (id: string, data: any) => {
    const axiosInstance = await loadAxios();
    const response = await axiosInstance.put<ApiResponse<any>>(
      `${API_BASE}/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Toggle tour active status
   */
  toggleStatus: async (id: string) => {
    const axiosInstance = await loadAxios();
    const response = await axiosInstance.patch<ApiResponse<any>>(
      `${API_BASE}/${id}/toggle-active`
    );
    return response.data;
  },

  /**
   * Toggle tour featured status
   */
  toggleFeatured: async (id: string) => {
    const axiosInstance = await loadAxios();
    const response = await axiosInstance.patch<ApiResponse<any>>(
      `${API_BASE}/${id}/toggle-featured`
    );
    return response.data;
  },

  /**
   * Delete tour
   */
  delete: async (id: string) => {
    const axiosInstance = await loadAxios();
    const response = await axiosInstance.delete<ApiResponse<any>>(
      `${API_BASE}/${id}`
    );
    return response.data;
  },

  /**
   * Get tour statistics
   */
  getStats: async () => {
    const axiosInstance = await loadAxios();
    const response = await axiosInstance.get<ApiResponse<any>>(
      `${API_BASE}/stats`
    );
    return response.data;
  },
};

export default {
  categories: tourCategoryAPI,
  subcategories: tourSubcategoryAPI,
  tours: tourAPI,
};
