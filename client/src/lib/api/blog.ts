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
  editorialAuthor?: {
    _id: string;
    name: string;
    slug: string;
    role: ILocalizedString;
    bio: ILocalizedString;
    image: { url: string; alt: ILocalizedString };
  };
  featuredImage: string | ImageObject;
  excerpt?: string | ILocalizedString;
  contentBlocks: ContentBlock[];
  tags: ILocalizedMixed;

  status: 'draft' | 'published' | 'scheduled';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  readingTime?: number;
  comments: Comment[];
  commentsEnabled: boolean;
  relatedPosts?: BlogPost[];
  relatedTours?: any[];
  summary?: ILocalizedString;
  keyTakeaways?: ILocalizedMixed;
  faqs?: IFAQ[];
  seo?: ISEO;
}

export interface ContentBlock {
  type: 'html' | 'imageRow' | 'blockquote' | 'video' | 'image';
  content?: string;
  images?: {
    url: string;
    alt: string;
    title?: string | ILocalizedString;
    caption?: string;
    width?: number;
    height?: number;
  }[];
  image?: string;
  url?: string;
  alt?: string;
  caption?: string;
  title?: ILocalizedString;
  /** Non-text blocks only: locales the block renders for; absent/empty = all. */
  languages?: string[];
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
/**
 * `locale` reaches the API as the X-Locale header. Without it the server falls
 * back to Accept-Language — absent on server-side renders, present in a browser —
 * so the same page could render in two different languages.
 */
export async function getCategoryBySlug(slug: string, locale?: string): Promise<BlogCategory> {
  const res = await fetch(`${API_URL}/blog/categories/slug/${slug}`, {
    cache: 'no-store',
    ...(locale ? { headers: { 'X-Locale': locale } } : {}),
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch category');
  }
  
  const json = await res.json();
  return json.data;
}

// Fetch subcategories by category ID
/**
 * `locale` reaches the API as the X-Locale header AND as a query parameter.
 * The header is what the API reads; the query parameter is there so this cached
 * fetch gets a separate cache entry per language, otherwise one locale's response
 * could be replayed to another. The API ignores the extra parameter.
 */
export async function getSubCategoriesByCategory(categoryId: string, locale?: string): Promise<BlogSubCategory[]> {
  const res = await fetch(
    `${API_URL}/blog/subcategories/category/${categoryId}${locale ? `?locale=${locale}` : ''}`,
    {
      next: { revalidate: 3600 },
      ...(locale ? { headers: { 'X-Locale': locale } } : {}),
    }
  );
  
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
/**
 * `locale` reaches the API as the X-Locale header. Without it the server falls
 * back to Accept-Language — absent on server-side renders, present in a browser —
 * so the same page could render in two different languages.
 */
export async function getSubCategoryBySlug(slug: string, locale?: string): Promise<BlogSubCategory> {
  const res = await fetch(`${API_URL}/blog/subcategories/slug/${slug}`, {
    cache: 'no-store',
    ...(locale ? { headers: { 'X-Locale': locale } } : {}),
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
/**
 * `locale` reaches the API as the X-Locale header AND as a query parameter.
 * The header is what the API reads; the query parameter is there so this cached
 * fetch gets a separate cache entry per language, otherwise one locale's response
 * could be replayed to another. The API ignores the extra parameter.
 */
export async function getBlogsByCategory(categorySlug: string, page: number = 1, limit: number = 9, locale?: string): Promise<BlogResponse> {
  const res = await fetch(
    `${API_URL}/blog/categories/${categorySlug}/posts?page=${page}&limit=${limit}${locale ? `&locale=${locale}` : ''}`,
    {
      next: { revalidate: 60 },
      ...(locale ? { headers: { 'X-Locale': locale } } : {}),
    }
  );
  
  if (!res.ok) {
    throw new Error('Failed to fetch blogs by category');
  }
  
  return res.json();
}

// Fetch blogs by subcategory
/**
 * `locale` reaches the API as the X-Locale header AND as a query parameter.
 * The header is what the API reads; the query parameter is there so this cached
 * fetch gets a separate cache entry per language, otherwise one locale's response
 * could be replayed to another. The API ignores the extra parameter.
 */
export async function getBlogsBySubCategory(subCategorySlug: string, page: number = 1, limit: number = 9, locale?: string): Promise<BlogResponse> {
  const res = await fetch(
    `${API_URL}/blog/subcategories/${subCategorySlug}/posts?page=${page}&limit=${limit}${locale ? `&locale=${locale}` : ''}`,
    {
      next: { revalidate: 60 },
      ...(locale ? { headers: { 'X-Locale': locale } } : {}),
    }
  );
  
  if (!res.ok) {
    throw new Error('Failed to fetch blogs by subcategory');
  }
  
  return res.json();
}

// Fetch single blog by slug
/**
 * `locale` is required in practice: the API narrows an article's content blocks
 * to the requested language, and without the header it defaults to English —
 * which then looks like "this article has nothing in German" and 404s the page.
 */
export async function getBlogBySlug(slug: string, locale?: string): Promise<BlogPost> {
  const res = await fetch(`${API_URL}/blog/posts/slug/${slug}`, {
    cache: 'no-store',
    headers: locale ? { 'X-Locale': locale } : undefined,
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

// Helper function to format date. API data is runtime input, so validate it
// even though published/created dates are normally typed as strings.
export function formatBlogDate(dateValue: unknown): { day: string; month: string } {
  if (
    typeof dateValue !== 'string' &&
    typeof dateValue !== 'number' &&
    !(dateValue instanceof Date)
  ) {
    return { day: '', month: '' };
  }

  const date = dateValue instanceof Date
    ? new Date(dateValue.getTime())
    : new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return { day: '', month: '' };
  }

  return {
    day: date.getDate().toString(),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
  };
}
