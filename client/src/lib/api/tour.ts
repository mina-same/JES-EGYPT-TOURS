import axiosInstance from './axios';

const API_BASE = 'tours';

// ==================== TYPES ====================

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  sort?: string;
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  tourType?: string;
  tourStyle?: string;
  fields?: string;
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
    const response = await axiosInstance.get<ApiResponse<any[]>>(
      `${API_BASE}/categories`,
      { params }
    );
    return response.data;
  },

  /**
   * Get category by ID
   */
  getById: async (id: string) => {
    const response = await axiosInstance.get<ApiResponse<any>>(
      `${API_BASE}/categories/${id}`
    );
    return response.data;
  },

  /**
   * Get category by slug
   */
  getBySlug: async (slug: string) => {
    const response = await axiosInstance.get<ApiResponse<any>>(
      `${API_BASE}/categories/slug/${slug}`
    );
    return response.data;
  },

  /**
   * Create new category
   */
  create: async (data: any) => {
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
    const response = await axiosInstance.patch<ApiResponse<any>>(
      `${API_BASE}/categories/${id}/toggle-active`
    );
    return response.data;
  },

  /**
   * Delete category
   */
  delete: async (id: string) => {
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
    const response = await axiosInstance.get<ApiResponse<any[]>>(
      `${API_BASE}/subcategories`,
      { params }
    );
    return response.data;
  },

  /**
   * Get subcategories by category ID
   */
  getByCategory: async (categoryId: string, params?: QueryParams) => {
    const response = await axiosInstance.get<ApiResponse<any[]>>(
      `${API_BASE}/categories/${categoryId}/subcategories`,
      { params }
    );
    return response.data;
  },

  /**
   * Get subcategory by ID
   */
  getById: async (id: string) => {
    const response = await axiosInstance.get<ApiResponse<any>>(
      `${API_BASE}/subcategories/${id}`
    );
    return response.data;
  },

  /**
   * Get subcategory by slug
   */
  getBySlug: async (slug: string, categoryId?: string) => {
    const params = categoryId ? { category: categoryId } : undefined;
    const response = await axiosInstance.get<ApiResponse<any>>(
      `${API_BASE}/subcategories/slug/${slug}`,
      { params }
    );
    return response.data;
  },

  /**
   * Create new subcategory
   */
  create: async (data: any) => {
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
    const response = await axiosInstance.patch<ApiResponse<any>>(
      `${API_BASE}/subcategories/${id}/toggle-active`
    );
    return response.data;
  },

  /**
   * Delete subcategory
   */
  delete: async (id: string) => {
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
  getAll: async (params?: QueryParams) => {
    const response = await axiosInstance.get<ApiResponse<any[]>>(
      `${API_BASE}`,
      { params }
    );
    return response.data;
  },

  /**
   * Get featured tours
   */
  getFeatured: async (limit?: number) => {
    const response = await axiosInstance.get<ApiResponse<any[]>>(
      `${API_BASE}/featured`,
      { params: { limit } }
    );
    return response.data;
  },

  /**
   * Get popular tours
   */
  getPopular: async (limit?: number) => {
    const response = await axiosInstance.get<ApiResponse<any[]>>(
      `${API_BASE}/popular`,
      { params: { limit } }
    );
    return response.data;
  },

  /**
   * Get tours by subcategory
   */
  getBySubcategory: async (subcategoryId: string, params?: QueryParams) => {
    const response = await axiosInstance.get<ApiResponse<any[]>>(
      `${API_BASE}/subcategories/${subcategoryId}/tours`,
      { params }
    );
    return response.data;
  },

  /**
   * Get tour by ID
   */
  getById: async (id: string) => {
    const response = await axiosInstance.get<ApiResponse<any>>(
      `${API_BASE}/${id}`
    );
    return response.data;
  },

  /**
   * Get tour by slug
   */
  getBySlug: async (slug: string) => {
    const response = await axiosInstance.get<ApiResponse<any>>(
      `${API_BASE}/slug/${slug}`
    );
    return response.data;
  },

  /**
   * Get tour by external ID
   */
  getByExternalId: async (externalId: string) => {
    const response = await axiosInstance.get<ApiResponse<any>>(
      `${API_BASE}/external/${externalId}`
    );
    return response.data;
  },

  /**
   * Get related tours
   */
  getRelated: async (id: string, limit?: number) => {
    const response = await axiosInstance.get<ApiResponse<any[]>>(
      `${API_BASE}/${id}/related`,
      { params: { limit } }
    );
    return response.data;
  },

  /**
   * Create new tour
   */
  create: async (data: any) => {
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
    const response = await axiosInstance.patch<ApiResponse<any>>(
      `${API_BASE}/${id}/toggle-active`
    );
    return response.data;
  },

  /**
   * Toggle tour featured status
   */
  toggleFeatured: async (id: string) => {
    const response = await axiosInstance.patch<ApiResponse<any>>(
      `${API_BASE}/${id}/toggle-featured`
    );
    return response.data;
  },

  /**
   * Delete tour
   */
  delete: async (id: string) => {
    const response = await axiosInstance.delete<ApiResponse<any>>(
      `${API_BASE}/${id}`
    );
    return response.data;
  },

  /**
   * Get tour statistics
   */
  getStats: async () => {
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
