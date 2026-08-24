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
  sideImage?: ImageObject;
  icon?: string; // Emoji or icon class name set by admin
  category: BlogCategory | string;
  seo?: ISEO;
  isActive: boolean;
  heroTitle?: ILocalizedString;
  heroDescription?: ILocalizedMixed;
  features?: Array<{
    icon: string;
    title: ILocalizedString;
    description: ILocalizedString;
  }>;
  featuredBlogs?: BlogPost[];
  featuredBlogsSectionTitle?: ILocalizedString;
  blogsSectionTitle?: ILocalizedString;
  faqsSectionTitle?: ILocalizedString;
  faqs?: IFAQ[];
  createdAt?: string;
  updatedAt?: string;
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
  /** The card teaser. Empty means the card shows no description — no fallback. */
  cardDescription?: string | ILocalizedString;
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
  pageOrOptions:
    | number
    | { page?: number; limit?: number; search?: string; tags?: string; isFeatured?: boolean; locale?: string } = 1,
  limitArg: number = 9
): Promise<BlogResponse> {
  let page = 1;
  let limit = 9;
  let search = '';
  let tags: string | undefined = undefined;
  let isFeatured: boolean | undefined = undefined;
  let locale: string | undefined = undefined;

  if (typeof pageOrOptions === 'object') {
    page = pageOrOptions.page || 1;
    limit = pageOrOptions.limit || 9;
    search = pageOrOptions.search || '';
    tags = pageOrOptions.tags;
    isFeatured = pageOrOptions.isFeatured;
    locale = pageOrOptions.locale;
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

  // `locale` travels as the X-Locale header AND in the query string: the header
  // is what the API reads, the query parameter gives this cached fetch its own
  // entry per language so one locale's list is never replayed to another.
  const res = await fetch(
    `${API_URL}/blog/posts?${queryParams.toString()}${locale ? `&locale=${locale}` : ''}`,
    {
      next: { revalidate: 60 }, // Revalidate every minute
      ...(locale ? { headers: { 'X-Locale': locale } } : {}),
    }
  );
  
  if (!res.ok) {
    throw new Error('Failed to fetch blogs');
  }
  
  return res.json();
}

// Fetch featured blogs for homepage
export async function getFeaturedBlogs(limit: number = 6, locale?: string): Promise<BlogResponse> {
  // Locale in the header for the API, and in the URL so this cached fetch keeps
  // one entry per language.
  const res = await fetch(
    `${API_URL}/blog/posts/featured?limit=${limit}${locale ? `&locale=${locale}` : ''}`,
    {
      next: { revalidate: 60 },
      ...(locale ? { headers: { 'X-Locale': locale } } : {}),
    }
  );
  
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

export interface BlogTagCount {
  tag: string;
  /** How many published articles carry this tag in the requested language. */
  count: number;
}

/**
 * Every tag in use for a language, most-used first.
 *
 * Replaces the sidebar's old approach of fetching fifty posts and reducing
 * them in the browser: that shipped fifty article records to draw twenty
 * words, and a tag used only on an older post could never appear.
 */
export async function getBlogTags(
  limit: number = 20,
  locale?: string
): Promise<BlogTagCount[]> {
  const res = await fetch(`${API_URL}/blog/tags?limit=${limit}`, {
    next: { revalidate: 300 },
    headers: locale ? { 'X-Locale': locale } : undefined,
  });

  if (!res.ok) {
    throw new Error('Failed to fetch blog tags');
  }

  const json: { success: boolean; data: BlogTagCount[] } = await res.json();
  return json.data || [];
}

/**
 * A published post by id, in CARD shape — the tour page's curated "related
 * blogs" are its only caller.
 *
 * The locale has to travel with the request. Without it the API answered in
 * its default language, so a German tour page listed its related articles
 * under English titles and excerpts.
 */
export async function getBlogById(id: string, locale?: string): Promise<BlogPost> {
  const res = await fetch(`${API_URL}/blog/posts/id/${id}`, {
    next: { revalidate: 60 },
    headers: locale ? { 'X-Locale': locale } : undefined,
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch blog');
  }
  
  const json: SingleBlogResponse = await res.json();
  return json.data;
}

/**
 * Short month names per locale, spelled out instead of read from `Intl`.
 * `toLocaleDateString` resolves through whichever ICU build is present, and
 * Node's and the browser's can disagree on an abbreviation — which on a date
 * rendered during SSR shows up as a hydration mismatch. A fixed table renders
 * the same string on both sides, every time.
 */
const SHORT_MONTHS: Record<string, readonly string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  de: ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'],
  it: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'],
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
};

const FULL_MONTHS: Record<string, readonly string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  it: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
};

/**
 * How each language writes a full date. This one is read aloud (it is the
 * badge's accessible name), so "30 de junio de 2026" beats "30 junio 2026".
 */
const DATE_LABEL: Record<string, (day: string, month: string, year: number) => string> = {
  en: (d, m, y) => `${d} ${m} ${y}`,
  de: (d, m, y) => `${d}. ${m} ${y}`,
  it: (d, m, y) => `${d} ${m} ${y}`,
  es: (d, m, y) => `${d} de ${m} de ${y}`,
};

export interface BlogDateParts {
  day: string;
  month: string;
  /** ISO date for <time dateTime="…"> so the badge is machine-readable. */
  iso: string;
  /** Full date including the year — the badge itself only shows day + month. */
  label: string;
}

const EMPTY_DATE: BlogDateParts = { day: '', month: '', iso: '', label: '' };

// Helper function to format date. API data is runtime input, so validate it
// even though published/created dates are normally typed as strings.
export function formatBlogDate(dateValue: unknown, locale = 'en'): BlogDateParts {
  if (
    typeof dateValue !== 'string' &&
    typeof dateValue !== 'number' &&
    !(dateValue instanceof Date)
  ) {
    return EMPTY_DATE;
  }

  const date = dateValue instanceof Date
    ? new Date(dateValue.getTime())
    : new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return EMPTY_DATE;
  }

  // Read in UTC, deliberately. The badge used to take its day and month from
  // the local-time getters while the ISO attribute came from toISOString(), so
  // a post published near midnight rendered "30 Jul" above dateTime="…-07-29"
  // — the machine-readable date disagreeing with the visible one. Local time
  // is also the wrong clock for this: a publication date is a date, not a
  // moment, and reading it locally means the server renders one day during SSR
  // and the reader's browser another on hydration, which is a mismatch nobody
  // can reproduce without changing timezone.
  const monthIndex = date.getUTCMonth();
  const day = date.getUTCDate().toString();
  const short = SHORT_MONTHS[locale] || SHORT_MONTHS.en;
  const full = FULL_MONTHS[locale] || FULL_MONTHS.en;

  return {
    day,
    month: short[monthIndex],
    iso: date.toISOString().slice(0, 10),
    label: (DATE_LABEL[locale] || DATE_LABEL.en)(day, full[monthIndex], date.getUTCFullYear()),
  };
}
