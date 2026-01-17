// ==================== SHARED INTERFACES ====================

export interface IImage {
  url: string;
  fileName?: string;
  title?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface ISEO {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  metaImage?: IImage;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  focusKeyword?: string;
}

// ==================== BLOG CATEGORY ====================

export interface IBlogCategory {
  _id: string;
  name: string;
  slug: string;
  description?: any; // HTML content
  image?: IImage;
  seo?: ISEO;
  isActive: boolean;
  subcategoriesCount?: number; // Virtual field
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ==================== BLOG SUBCATEGORY ====================

export interface IBlogSubcategory {
  _id: string;
  category: string; // ObjectId as string
  name: string;
  slug: string;
  description?: any; // HTML content
  image?: IImage;
  seo?: ISEO;
  isActive: boolean;
  postsCount?: number; // Virtual field
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ==================== CONTENT BLOCKS ====================

export interface IContentBlock {
  type: 'html' | 'imageRow' | 'blockquote' | 'video' | 'image';
  content?: string;
  images?: IImage[];
  image?: string;
  url?: string;
  thumbnail?: string;
  alt?: string;
  caption?: string;
}

// ==================== BLOG POST ====================

export interface IBlogPost {
  _id: string;
  title: string;
  slug: string;
  subCategory: IBlogSubcategory | string;
  author: {
    _id: string;
    name: string;
    email: string;
  } | string;
  featuredImage: string;
  featuredImageAlt?: string;
  excerpt?: string;
  contentBlocks: IContentBlock[];
  tags: string[];
  status: 'draft' | 'published' | 'scheduled';
  publishedAt?: Date | string;
  scheduledAt?: Date | string;
  commentsEnabled: boolean;
  comments?: IComment[];
  seo?: ISEO;
  breadcrumbs?: IBreadcrumb[];
  relatedPosts?: IBlogPost[] | string[];
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
  name: string;
  url: string;
}

// ==================== FORM DATA TYPES ====================

export interface BlogCategoryFormData {
  name: string;
  slug: string;
  description?: any;
  image?: IImage;
  seo?: ISEO;
  isActive: boolean;
}

export interface BlogSubcategoryFormData {
  category: string;
  name: string;
  slug: string;
  description?: any;
  image?: IImage;
  seo?: ISEO;
  isActive: boolean;
}

export interface BlogFormData {
  title: string;
  slug: string;
  subCategory: string;
  author: string;
  featuredImage: string;
  featuredImageAlt?: string;
  excerpt?: string;
  contentBlocks: IContentBlock[];
  tags: string[];
  status: 'draft' | 'published' | 'scheduled';
  publishedAt?: Date;
  scheduledAt?: Date;
  commentsEnabled: boolean;
  seo?: ISEO;
  breadcrumbs?: IBreadcrumb[];
  relatedPosts?: string[];
}
