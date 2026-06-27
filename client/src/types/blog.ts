import type { ILocalizedString, ILocalizedMixed, IImage } from './shared';
export type { ILocalizedString, ILocalizedMixed, IImage };

// ==================== SHARED INTERFACES ====================

export interface ISEO {
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
}

// ==================== BLOG CATEGORY ====================

export interface IBlogCategory {
  _id: string;
  name: ILocalizedString;
  slug: ILocalizedString;
  description?: ILocalizedString; // Localized content
  image?: IImage | string;
  seo?: ISEO;
  isActive: boolean;
  subcategoriesCount?: number; // Virtual field
  heroTitle?: ILocalizedString;
  heroDescription?: ILocalizedMixed;
  featuredBlogs?: any[];
  featuredBlogsSectionTitle?: ILocalizedString;
  blogsSectionTitle?: ILocalizedString;
  faqsSectionTitle?: ILocalizedString;
  faqs?: any[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ==================== BLOG SUBCATEGORY ====================

export interface IBlogSubcategory {
  _id: string;
  category: any; // ObjectId or populated object
  name: ILocalizedString;
  slug: ILocalizedString;
  description?: ILocalizedString; // Localized content
  image?: IImage | string;
  seo?: ISEO;
  isActive: boolean;
  postsCount?: number; // Virtual field
  heroTitle?: ILocalizedString;
  heroDescription?: ILocalizedMixed;
  featuredBlogs?: any[];
  featuredBlogsSectionTitle?: ILocalizedString;
  blogsSectionTitle?: ILocalizedString;
  faqsSectionTitle?: ILocalizedString;
  faqs?: any[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ==================== CONTENT BLOCKS ====================

export interface IContentBlock {
  type: 'html' | 'imageRow' | 'blockquote' | 'video' | 'image';
  content?: ILocalizedString;
  images?: IImage[];
  image?: IImage | string;
  url?: string;
  thumbnail?: string;
  alt?: ILocalizedString;
  caption?: ILocalizedString;
  aspectRatio?: '16:9' | '4:3' | '3:2' | '3:4' | 'auto';
  fit?: 'cover' | 'contain';
  focus?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'center-top' | 'center-bottom';
}

// ==================== BLOG POST ====================

export interface IBlogPost {
  _id: string;
  title: ILocalizedString;
  slug: ILocalizedString;
  subCategory: IBlogSubcategory | string;
  author: {
    _id: string;
    name: string;
    email: string;
  } | string;
  featuredImage: any;
  featuredImageAlt?: ILocalizedString;
  excerpt?: ILocalizedString;
  contentBlocks: IContentBlock[];
  tags: ILocalizedMixed;
  status: 'draft' | 'published' | 'scheduled';
  publishedAt?: Date | string;
  scheduledAt?: Date | string;
  commentsEnabled: boolean;
  comments?: IComment[];
  seo?: ISEO;
  breadcrumbs?: IBreadcrumb[];
  relatedPosts?: IBlogPost[] | string[];
  relatedTours?: any[] | string[];
  viewCount: number;
  shareCount?: number;
  readingTime?: number;
  averageTimeOnPage?: number;
  focusKeywordDensity?: number;
  lastModified: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ==================== SUPPORTING INTERFACES ====================

export interface IComment {
  _id: string;
  name: string;
  email: string;
  text: string;
  avatar?: string;
  isApproved: boolean;
  createdAt: Date | string;
}

export interface IBreadcrumb {
  name: ILocalizedString;
  url: string;
}

// ==================== FORM DATA TYPES ====================

export interface BlogCategoryFormData {
  name: ILocalizedString;
  slug: ILocalizedString;
  description?: ILocalizedString;
  image?: IImage | string;
  seo?: ISEO;
  isActive: boolean;
  heroTitle?: ILocalizedString;
  heroDescription?: ILocalizedMixed;
  featuredBlogs?: string[];
  featuredBlogsSectionTitle?: ILocalizedString;
  blogsSectionTitle?: ILocalizedString;
  faqsSectionTitle?: ILocalizedString;
  faqs?: any[];
}

export interface BlogSubcategoryFormData {
  category: string;
  name: ILocalizedString;
  slug: ILocalizedString;
  description?: ILocalizedString;
  image?: string;
  seo?: ISEO;
  isActive: boolean;
  heroTitle?: ILocalizedString;
  heroDescription?: ILocalizedMixed;
  featuredBlogs?: string[];
  featuredBlogsSectionTitle?: ILocalizedString;
  blogsSectionTitle?: ILocalizedString;
  faqsSectionTitle?: ILocalizedString;
  faqs?: any[];
}

export interface BlogFormData {
  title: ILocalizedString;
  slug: ILocalizedString;
  subCategory: string;
  author: string;
  featuredImage: any;
  featuredImageAlt?: ILocalizedString;
  excerpt?: ILocalizedString;
  contentBlocks: IContentBlock[];
  tags: ILocalizedMixed;
  status: 'draft' | 'published' | 'scheduled';
  publishedAt?: Date;
  scheduledAt?: Date;
  commentsEnabled: boolean;
  seo?: ISEO;
  breadcrumbs?: IBreadcrumb[];
  relatedPosts?: string[];
  relatedTours?: string[];
}
