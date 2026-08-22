import axiosInstance from './axios';

const API_BASE = 'blog';

// ==================== TYPES ====================

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'draft' | 'published' | 'scheduled';
  category?: string;
  subCategory?: string;
  author?: string;
  sort?: string;
  fields?: string;
  isActive?: boolean;
  /**
   * Comma-separated post ids, for resolving a known set rather than searching.
   * The tour form's "Related Blogs" picker uses it to show live titles for the
   * articles a tour already links to — a reference stores only an id and a
   * title frozen when it was picked. Server-side, ids that are not ObjectIds
   * are dropped, and a filter that matches nothing returns nothing.
   */
  ids?: string;
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

import { ILocalizedString, ILocalizedMixed, IImage } from '@/types/shared';
import { IFAQ } from '@/types/tour';
// We'll keep the local interfaces but update them to use localized types where needed
// or just import from @/types/blog if possible. 
// For now, let's just update the ones here to be safe and consistent.

export interface BlogFormData {
  _editVersion?: number;
  title: ILocalizedString;
  slug: string;
  author: string;
  editorialAuthor?: string;
  featuredImage: IImage;
  excerpt?: ILocalizedString;
  cardDescription?: ILocalizedString;
  contentBlocks: ContentBlock[];
  tags: ILocalizedMixed;
  status: 'draft' | 'published' | 'scheduled';
  isFeatured: boolean;
  publishedAt?: Date;
  scheduledAt?: Date;
  metaTitle?: ILocalizedString;
  metaDescription?: ILocalizedString;
  metaKeywords?: ILocalizedMixed;
  metaImage?: IImage;
  ogTitle?: ILocalizedString;
  ogDescription?: ILocalizedString;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  focusKeyword?: ILocalizedString;
  breadcrumbs?: {
    name: ILocalizedString;
    url: string;
  }[];
  relatedPosts?: string[];
  relatedTours?: string[];
  category?: string;
  subCategory?: string;
  destination?: string;
  summary?: ILocalizedString;
  keyTakeaways?: ILocalizedMixed;
  faqs?: IFAQ[];
}

export interface ContentBlock {
  id?: string;
  type: 'html' | 'imageRow' | 'blockquote' | 'video' | 'image';
  content?: ILocalizedString;
  title?: ILocalizedString;
  images?: {
    url: string;
    alt: ILocalizedString;
    title?: ILocalizedString;
    caption?: ILocalizedString;
    fileName?: string;
    width?: number;
    height?: number;
  }[];
  image?: string;
  url?: string;
  thumbnail?: string;
  alt?: ILocalizedString;
  caption?: ILocalizedString;
  aspectRatio?: '16:9' | '4:3' | '3:2' | '3:4' | 'auto';
  fit?: 'cover' | 'contain';
  focus?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'center-top' | 'center-bottom';
  /** Non-text blocks only: locales the block renders for; absent/empty = all. */
  languages?: ('en' | 'de' | 'it' | 'es')[];
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
      `${API_BASE}/subcategories/category/${categoryId}`,
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
  getEditorialAuthors: async () => {
    const response = await axiosInstance.get<ApiResponse<any[]>>(`${API_BASE}/authors`);
    return response.data;
  },
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

// ==================== DESTINATION API ====================

export const destinationAPI = {
  getAll: async (params?: QueryParams) => {
    const response = await axiosInstance.get<ApiResponse<any[]>>('destinations', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await axiosInstance.get<ApiResponse<any>>(`destinations/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await axiosInstance.post<ApiResponse<any>>('destinations', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await axiosInstance.put<ApiResponse<any>>(`destinations/${id}`, data);
    return response.data;
  },
  toggleStatus: async (id: string) => {
    const response = await axiosInstance.patch<ApiResponse<any>>(`destinations/${id}/toggle-active`);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await axiosInstance.delete<ApiResponse<any>>(`destinations/${id}`);
    return response.data;
  },
};
