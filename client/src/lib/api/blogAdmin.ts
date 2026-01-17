import axiosInstance from './axios';

const API_BASE = '/blog';

// ==================== TYPES ====================

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'draft' | 'published' | 'scheduled';
  subCategory?: string;
  author?: string;
  sort?: string;
  fields?: string;
  isActive?: boolean;
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

// Unified Image Interface (matches backend IImage)
export interface IImage {
  url: string;
  fileName: string;
  title?: string;
  alt?: string;
}

export interface BlogFormData {
  title: string;
  slug: string;
  author: string;
  featuredImage: IImage;
  excerpt?: string;
  contentBlocks: ContentBlock[];
  tags: string[];
  status: 'draft' | 'published' | 'scheduled';
  isFeatured: boolean;
  publishedAt?: Date;
  scheduledAt?: Date;
  commentsEnabled: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  metaImage?: IImage;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  noIndex: boolean;
  noFollow: boolean;
  focusKeyword?: string;
  breadcrumbs?: {
    name: string;
    url: string;
  }[];
  relatedPosts?: string[];
}

export interface ContentBlock {
  type: 'html' | 'imageRow' | 'blockquote' | 'video' | 'image';
  content?: string;
  images?: {
    url: string;
    alt: string;
    title?: string;
    caption?: string;
    width?: number;
    height?: number;
  }[];
  image?: string;
  url?: string;
  thumbnail?: string;
  alt?: string;
  caption?: string;
}

// ==================== BLOG CATEGORY API ====================

export const blogCategoryAPI = {
  /**
   * Get all blog categories
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
    const response = await axiosInstance.put<ApiResponse<any>>(
      `${API_BASE}/categories/${id}`,
      data
    );
    return response.data;
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

// ==================== BLOG SUBCATEGORY API ====================

export const blogSubcategoryAPI = {
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

// ==================== BLOG POST API ====================

export const blogAPI = {
  /**
   * Get all blog posts with filtering
   */
  getAll: async (params?: QueryParams) => {
    const response = await axiosInstance.get<ApiResponse<any[]>>(
      `${API_BASE}/posts`,
      { params }
    );
    return response.data;
  },

  getAllAdmin: async (params?: QueryParams) => {
    const response = await axiosInstance.get<ApiResponse<any[]>>(
      `${API_BASE}/posts/admin`,
      { params }
    );
    return response.data;
  },

  /**
   * Get published blog posts
   */
  getPublished: async (params?: QueryParams) => {
    const response = await axiosInstance.get<ApiResponse<any[]>>(
      `${API_BASE}/posts/published`,
      { params }
    );
    return response.data;
  },

  /**
   * Get draft blog posts
   */
  getDrafts: async (params?: QueryParams) => {
    const response = await axiosInstance.get<ApiResponse<any[]>>(
      `${API_BASE}/posts/drafts`,
      { params }
    );
    return response.data;
  },

  /**
   * Get blog posts by subcategory
   */
  getBySubcategory: async (subcategoryId: string, params?: QueryParams) => {
    const response = await axiosInstance.get<ApiResponse<any[]>>(
      `${API_BASE}/subcategories/${subcategoryId}/posts`,
      { params }
    );
    return response.data;
  },

  /**
   * Get blog post by ID
   */
  getById: async (id: string) => {
    const response = await axiosInstance.get<ApiResponse<any>>(
      `${API_BASE}/posts/${id}`
    );
    return response.data;
  },

  /**
   * Get blog post by slug
   */
  getBySlug: async (slug: string) => {
    const response = await axiosInstance.get<ApiResponse<any>>(
      `${API_BASE}/posts/slug/${slug}`
    );
    return response.data;
  },

  /**
   * Create new blog post
   */
  create: async (data: BlogFormData) => {
    const response = await axiosInstance.post<ApiResponse<any>>(
      `${API_BASE}/posts`,
      data
    );
    return response.data;
  },

  /**
   * Update blog post
   */
  update: async (id: string, data: BlogFormData) => {
    const response = await axiosInstance.put<ApiResponse<any>>(
      `${API_BASE}/posts/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Publish blog post
   */
  publish: async (id: string) => {
    const response = await axiosInstance.patch<ApiResponse<any>>(
      `${API_BASE}/posts/${id}/publish`
    );
    return response.data;
  },

  /**
   * Unpublish blog post (set to draft)
   */
  unpublish: async (id: string) => {
    const response = await axiosInstance.patch<ApiResponse<any>>(
      `${API_BASE}/posts/${id}/unpublish`
    );
    return response.data;
  },

  /**
   * Delete blog post
   */
  delete: async (id: string) => {
    const response = await axiosInstance.delete<ApiResponse<any>>(
      `${API_BASE}/posts/${id}`
    );
    return response.data;
  },

  /**
   * Get blog statistics
   */
  getStats: async () => {
    const response = await axiosInstance.get<ApiResponse<any>>(
      `${API_BASE}/posts/stats`
    );
    return response.data;
  },

  /**
   * Toggle comments for a blog post
   */
  toggleComments: async (id: string) => {
    const response = await axiosInstance.patch<ApiResponse<any>>(
      `${API_BASE}/posts/${id}/toggle-comments`
    );
    return response.data;
  },
};

export default {
  categories: blogCategoryAPI,
  subcategories: blogSubcategoryAPI,
  posts: blogAPI,
};
