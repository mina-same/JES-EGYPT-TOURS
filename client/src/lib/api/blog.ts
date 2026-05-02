import { API_URL } from '@/config/api';
import { ILocalizedString, ILocalizedMixed } from '@/types/shared';
import { ISEO } from '@/types/blog';
import { IFAQ } from '@/types/tour';


export interface BlogCategory {

  _id: string;
  name: ILocalizedString;
  slug: ILocalizedString;
  description?: ILocalizedString;
  image?: string | ImageObject;
  seo?: ISEO;
  isActive: boolean;
  subcategoriesCount?: number;
}

export interface BlogSubCategory {
  _id: string;
  name: ILocalizedString;
  slug: ILocalizedString;
  description?: ILocalizedString;
  image?: string | ImageObject;
  icon?: string; // Emoji or icon class name set by admin
  category: BlogCategory | string;
  seo?: ISEO;
  isActive: boolean;
  heroTitle?: ILocalizedString;
  heroDescription?: ILocalizedMixed;
  featuredBlogs?: BlogPost[];
  featuredBlogsSectionTitle?: ILocalizedString;
  blogsSectionTitle?: ILocalizedString;
  faqsSectionTitle?: ILocalizedString;
  faqs?: IFAQ[];
}

export interface ImageObject {
  url: string;
  fileName?: string;
  title?: string | ILocalizedString;
  alt?: string | ILocalizedString;
}

export interface BlogPost {
  _id: string;
  title: ILocalizedString;
  slug: ILocalizedString;
  subCategory: BlogSubCategory;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  featuredImage: string | ImageObject;
  excerpt?: string | ILocalizedString;
  contentBlocks: ContentBlock[];
  tags: ILocalizedMixed;

  status: 'draft' | 'published' | 'scheduled';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  readingTime?: number;
  comments: Comment[];
  commentsEnabled: boolean;
  relatedPosts?: BlogPost[];
  seo?: ISEO;
}

export interface ContentBlock {
  type: 'html' | 'imageRow' | 'blockquote' | 'video' | 'image';
  content?: string;
  images?: {
    url: string;
    alt: string;
    caption?: string;
    width?: number;
    height?: number;
  }[];
  image?: string;
  url?: string;
  alt?: string;
  caption?: string;
}

export interface Comment {
  _id: string;
  name: string;
  email: string;
  text: string;
  avatar?: string;
  isApproved: boolean;
  createdAt: string;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface BlogResponse {
  success: boolean;
  count: number;
  data: BlogPost[];
  pagination: PaginationData;
}

export interface SingleBlogResponse {
  success: boolean;
  data: BlogPost;
}

export interface CategoriesResponse {
  success: boolean;
  count: number;
  data: BlogCategory[];
}

export interface SubCategoriesResponse {
  success: boolean;
  count: number;
  data: BlogSubCategory[];
}

// Fetch all categories
export async function getCategories(): Promise<BlogCategory[]> {
  const res = await fetch(`${API_URL}/blog/categories`, {
    next: { revalidate: 3600 }, // Revalidate every hour
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch categories');
  }
  
  const json: CategoriesResponse = await res.json();
  return json.data;
}

// Fetch category by slug
export async function getCategoryBySlug(slug: string): Promise<BlogCategory> {
  const res = await fetch(`${API_URL}/blog/categories/slug/${slug}`, {
    next: { revalidate: 3600 },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch category');
  }
  
  const json = await res.json();
  return json.data;
}

// Fetch subcategories by category ID
export async function getSubCategoriesByCategory(categoryId: string): Promise<BlogSubCategory[]> {
  const res = await fetch(`${API_URL}/blog/subcategories/category/${categoryId}`, {
    next: { revalidate: 3600 },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch subcategories by category');
  }
  
  const json: SubCategoriesResponse = await res.json();
  return json.data;
}

// Fetch all subcategories
export async function getAllSubCategories(): Promise<BlogSubCategory[]> {
  const res = await fetch(`${API_URL}/blog/subcategories`, {
    next: { revalidate: 3600 },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch subcategories');
  }
  
  const json: SubCategoriesResponse = await res.json();
  return json.data;
}

// Fetch subcategory by slug
export async function getSubCategoryBySlug(slug: string): Promise<BlogSubCategory> {
  const res = await fetch(`${API_URL}/blog/subcategories/slug/${slug}`, {
    next: { revalidate: 3600 },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch subcategory');
  }
  
  const json = await res.json();
  return json.data;
}

// Fetch all blogs with pagination
export async function getAllBlogs(
  pageOrOptions: number | { page?: number; limit?: number; search?: string; tags?: string; isFeatured?: boolean } = 1,
  limitArg: number = 9
): Promise<BlogResponse> {
  let page = 1;
  let limit = 9;
  let search = '';
  let tags: string | undefined = undefined;
  let isFeatured: boolean | undefined = undefined;

  if (typeof pageOrOptions === 'object') {
    page = pageOrOptions.page || 1;
    limit = pageOrOptions.limit || 9;
    search = pageOrOptions.search || '';
    tags = pageOrOptions.tags;
    isFeatured = pageOrOptions.isFeatured;
  } else {
    page = pageOrOptions;
    limit = limitArg;
  }

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) {
    queryParams.append('search', search);
  }

  if (tags) {
    queryParams.append('tags', tags);
  }

  if (isFeatured !== undefined) {
    queryParams.append('isFeatured', isFeatured.toString());
  }

  const res = await fetch(`${API_URL}/blog/posts?${queryParams.toString()}`, {
    next: { revalidate: 60 }, // Revalidate every minute
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch blogs');
  }
  
  return res.json();
}

// Fetch featured blogs for homepage
export async function getFeaturedBlogs(limit: number = 6): Promise<BlogResponse> {
  const res = await fetch(`${API_URL}/blog/posts/featured?limit=${limit}`, {
    next: { revalidate: 60 },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch featured blogs');
  }
  
  return res.json();
}

// Fetch blogs by category
export async function getBlogsByCategory(categorySlug: string, page: number = 1, limit: number = 9): Promise<BlogResponse> {
  const res = await fetch(`${API_URL}/blog/categories/${categorySlug}/posts?page=${page}&limit=${limit}`, {
    next: { revalidate: 60 },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch blogs by category');
  }
  
  return res.json();
}

// Fetch blogs by subcategory
export async function getBlogsBySubCategory(subCategorySlug: string, page: number = 1, limit: number = 9): Promise<BlogResponse> {
  const res = await fetch(`${API_URL}/blog/subcategories/${subCategorySlug}/posts?page=${page}&limit=${limit}`, {
    next: { revalidate: 60 },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch blogs by subcategory');
  }
  
  return res.json();
}

// Fetch single blog by slug
export async function getBlogBySlug(slug: string): Promise<BlogPost> {
  const res = await fetch(`${API_URL}/blog/posts/slug/${slug}`, {
    next: { revalidate: 60 },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch blog');
  }
  
  const json: SingleBlogResponse = await res.json();
  return json.data;
}

// Fetch single blog by ID (public - only published blogs)
export async function getBlogById(id: string): Promise<BlogPost> {
  const res = await fetch(`${API_URL}/blog/posts/id/${id}`, {
    next: { revalidate: 60 },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch blog');
  }
  
  const json: SingleBlogResponse = await res.json();
  return json.data;
}

// Fetch popular blogs
export async function getPopularBlogs(): Promise<BlogPost[]> {
  const res = await fetch(`${API_URL}/blog/posts/popular`, {
    next: { revalidate: 300 }, // Revalidate every 5 minutes
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch popular blogs');
  }
  
  const json = await res.json();
  return json.data;
}

// Helper function to format date
export function formatBlogDate(dateString: string): { day: string; month: string } {
  const date = new Date(dateString);
  return {
    day: date.getDate().toString(),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
  };
}
