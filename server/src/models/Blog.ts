import mongoose, { Schema, Document } from 'mongoose';
import { IImage, ImageSchema } from './shared/ImageSchema';
import { ILocalizedString, LocalizedStringSchema, ILocalizedMixed, LocalizedMixedSchema } from './shared/LocalizedSchema';
import { IFAQ, FAQSchema } from './shared/FaqSchema';

// Content Block Types
interface IImageBlock {
  url: string;
  alt: ILocalizedString;
  title?: ILocalizedString;
  caption?: ILocalizedString;
  width?: number;
  height?: number;
}

interface IContentBlock {
  type: 'html' | 'imageRow' | 'blockquote' | 'video' | 'image';
  content?: ILocalizedString;
  images?: IImageBlock[];
  image?: string;
  url?: string;
  thumbnail?: string;
  alt?: ILocalizedString;
  caption?: ILocalizedString;
}

interface IComment {
  name: string;
  email: string;
  text: string;
  avatar?: string;
  isApproved: boolean;
  createdAt: Date;
}

interface IBreadcrumb {
  name: ILocalizedString;
  url: string;
}

export interface IBlog extends Document {
  // Basic Info
  title: ILocalizedString;
  slug: ILocalizedString;
  author: mongoose.Types.ObjectId | string;
  featuredImage: IImage;
  excerpt?: ILocalizedString;
  
  // Rich Content
  contentBlocks: IContentBlock[];
  
  // SEO Meta Tags
  metaTitle?: ILocalizedString;
  metaDescription?: ILocalizedString;
  metaKeywords?: ILocalizedMixed; // Array of localized strings or single object? Usually tags/keywords are simpler. I'll use ILocalizedMixed for consistency if they need translation.
  metaImage?: IImage;
  
  // Open Graph (Facebook, LinkedIn)
  ogTitle?: ILocalizedString;
  ogDescription?: ILocalizedString;
  ogImage?: string;
  ogType?: string;
  
  // Indexing Control
  noIndex: boolean;
  noFollow: boolean;
  
  // Focus Keyword & Readability
  focusKeyword?: ILocalizedString;
  focusKeywordDensity?: number;
  readingTime?: number;
  
  // Breadcrumbs
  breadcrumbs?: IBreadcrumb[];
  
  // Tags
  tags: ILocalizedMixed; // Localized tags array
  
  // Publishing
  status: 'draft' | 'published' | 'scheduled';
  isFeatured: boolean;
  publishedAt?: Date;
  scheduledAt?: Date;
  lastModified: Date;
  editVersion: number;

  // Analytics
  viewCount: number;
  shareCount: number;
  averageTimeOnPage?: number;
  
  // Comments
  commentsEnabled: boolean;
  comments: IComment[];
  
  // Related Content
  relatedPosts?: mongoose.Types.ObjectId[];
  relatedTours?: mongoose.Types.ObjectId[];
  category?: mongoose.Types.ObjectId;
  subCategory?: mongoose.Types.ObjectId;
  destination?: mongoose.Types.ObjectId;
  summary?: ILocalizedMixed;
  keyTakeaways?: ILocalizedMixed;
  faqs?: IFAQ[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  incrementViewCount(): Promise<this>;
  incrementShareCount(): Promise<this>;
}

const BlogSchema: Schema = new Schema(
  {
    // === BASIC INFO ===
    title: {
      type: LocalizedStringSchema,
      required: [true, 'Blog title is required'],
    },
    slug: {
      type: LocalizedStringSchema,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    featuredImage: {
      type: ImageSchema,
      required: [true, 'Featured image is required'],
    },
    excerpt: {
      type: LocalizedStringSchema,
    },
    
    // === RICH CONTENT ===
    contentBlocks: [{
      type: {
        type: String,
        enum: ['html', 'imageRow', 'blockquote', 'video', 'image'],
        required: true,
      },
      title: LocalizedStringSchema,
      content: LocalizedStringSchema,
      images: [{
        url: { type: String, required: true },
        alt: { type: LocalizedStringSchema, required: true },
        title: LocalizedStringSchema,
        caption: LocalizedStringSchema,
        width: Number,
        height: Number,
      }],
      image: String,
      url: String,
      thumbnail: String,
      alt: LocalizedStringSchema,
      caption: LocalizedStringSchema,
      aspectRatio: { type: String, enum: ['16:9', '4:3', '3:2', '3:4', 'auto'] },
      fit: { type: String, enum: ['cover', 'contain'] },
      focus: { type: String, enum: ['center', 'top', 'bottom', 'left', 'right', 'center-top', 'center-bottom'] },
    }],

    // === SEO META TAGS ===
    metaTitle: {
      type: LocalizedStringSchema,
    },
    metaDescription: {
      type: LocalizedStringSchema,
    },
    metaKeywords: {
      type: LocalizedMixedSchema,
    },
    metaImage: {
      type: ImageSchema,
      required: false,
    },
    
    // === OPEN GRAPH (SOCIAL MEDIA) ===
    ogTitle: {
      type: LocalizedStringSchema,
    },
    ogDescription: {
      type: LocalizedStringSchema,
    },
    ogImage: {
      type: String,
      trim: true,
    },
    ogType: {
      type: String,
      default: 'article',
    },
    
    // === INDEXING CONTROL ===
    noIndex: {
      type: Boolean,
      default: false,
    },
    noFollow: {
      type: Boolean,
      default: false,
    },
    
    // === FOCUS KEYWORD & READABILITY ===
    focusKeyword: {
      type: LocalizedStringSchema,
    },
    focusKeywordDensity: {
      type: Number,
      min: 0,
      max: 100,
    },
    readingTime: {
      type: Number,
      min: 0,
    },
    
    // === BREADCRUMBS ===
    breadcrumbs: [{
      name: {
        type: LocalizedStringSchema,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    }],
    
    // === TAGS ===
    tags: {
      type: LocalizedMixedSchema,
    },
    
    // === PUBLISHING ===
    status: {
      type: String,
      enum: ['draft', 'published', 'scheduled'],
      default: 'draft',
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedAt: {
      type: Date,
    },
    scheduledAt: {
      type: Date,
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
    editVersion: {
      type: Number,
      default: 0,
    },

    // === ANALYTICS ===
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shareCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageTimeOnPage: {
      type: Number,
      min: 0,
    },
    
    // === COMMENTS ===
    commentsEnabled: {
      type: Boolean,
      default: true,
    },
    comments: [{
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      text: {
        type: String,
        required: true,
        trim: true,
      },
      avatar: {
        type: String,
        trim: true,
      },
      isApproved: {
        type: Boolean,
        default: false,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    
    // === RELATED CONTENT ===
    relatedPosts: [{
      type: Schema.Types.ObjectId,
      ref: 'Blog',
    }],
    relatedTours: [{
      type: Schema.Types.ObjectId,
      ref: 'Tour',
    }],
    category: {
      type: Schema.Types.ObjectId,
      ref: 'BlogCategory',
    },
    subCategory: {
      type: Schema.Types.ObjectId,
      ref: 'BlogSubCategory',
    },
    destination: {
      type: Schema.Types.ObjectId,
      ref: 'Destination',
      default: null,
    },
    summary: {
      type: LocalizedMixedSchema,
    },
    keyTakeaways: {
      type: LocalizedMixedSchema,
    },
    faqs: [FAQSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
BlogSchema.index({ 'slug.en': 1 }, { sparse: true, unique: true });
BlogSchema.index({ 'slug.de': 1 }, { sparse: true, unique: true });
BlogSchema.index({ 'slug.it': 1 }, { sparse: true, unique: true });
BlogSchema.index({ 'slug.es': 1 }, { sparse: true, unique: true });
BlogSchema.index({ status: 1, publishedAt: -1 });
BlogSchema.index({ isFeatured: 1, status: 1 });
BlogSchema.index({ author: 1, status: 1 });
BlogSchema.index({ tags: 1 });
BlogSchema.index({ status: 1, isFeatured: 1, publishedAt: -1 });
BlogSchema.index({ title: 'text', excerpt: 'text' });
BlogSchema.index({ createdAt: -1 });
BlogSchema.index({ viewCount: -1 });

// Pre-save middleware to auto-populate SEO fields and calculate metrics
BlogSchema.pre<IBlog>('save', function (next) {
  // Update lastModified
  this.lastModified = new Date();
  
  // Auto-populate metaTitle from title if not provided
  if (!this.metaTitle || (!this.metaTitle.en && !this.metaTitle.de && !this.metaTitle.it)) {
    this.metaTitle = this.title;
  }
  
  // Auto-populate featuredImage alt from title if not provided
  if (this.featuredImage && !this.featuredImage.alt) {
    this.featuredImage.alt = this.title as any;
  }
  
  // Ensure fileName is set if not provided (for backward compatibility)
  if (this.featuredImage && !this.featuredImage.url && (this.featuredImage as any).url) {
    // This part looks like it was handling legacy strings, but featuredImage is IImage
  }

  if (this.featuredImage && !this.featuredImage.fileName && this.featuredImage.url) {
    const urlParts = this.featuredImage.url.split('/');
    this.featuredImage.fileName = urlParts[urlParts.length - 1] || 'image.jpg';
  }
  
  // Auto-populate OG fields from meta fields if not provided
  if (!this.ogTitle || (!this.ogTitle.en && !this.ogTitle.de && !this.ogTitle.it)) {
    this.ogTitle = this.metaTitle;
  }
  if (!this.ogDescription || (!this.ogDescription.en && !this.ogDescription.de && !this.ogDescription.it)) {
    this.ogDescription = this.metaDescription;
  }
  if (!this.ogImage) {
    this.ogImage = this.metaImage?.url || this.featuredImage?.url || '';
  }
  
  // Auto-populate metaImage alt from title if not provided
  if (this.metaImage && this.metaImage.url && !this.metaImage.alt) {
    this.metaImage.alt = this.title as any;
  }
  
  // Ensure metaImage fileName is set if not provided
  if (this.metaImage && !this.metaImage.fileName && this.metaImage.url) {
    const urlParts = this.metaImage.url.split('/');
    this.metaImage.fileName = urlParts[urlParts.length - 1] || 'meta-image.jpg';
  }
  
  // Calculate reading time (average 200 words per minute) - using English as base
  if (this.contentBlocks && this.contentBlocks.length > 0) {
    let totalWords = 0;
    this.contentBlocks.forEach(block => {
      const content = (block.content as any)?.en || (typeof block.content === 'string' ? block.content : '');
      if (block.type === 'html' && content) {
        // Strip HTML tags and count words
        const text = content.replace(/<[^>]*>/g, ' ');
        const words = text.trim().split(/\s+/).length;
        totalWords += words;
      }
      if (block.type === 'blockquote' && content) {
        const words = content.trim().split(/\s+/).length;
        totalWords += words;
      }
    });
    this.readingTime = Math.ceil(totalWords / 200);
  }
  
  // Calculate focus keyword density - using English
  const focusKeywordEn = (this.focusKeyword as any)?.en || (typeof this.focusKeyword === 'string' ? this.focusKeyword : '');
  if (focusKeywordEn && this.contentBlocks && this.contentBlocks.length > 0) {
    let totalWords = 0;
    let keywordCount = 0;
    const keyword = focusKeywordEn.toLowerCase();
    
    this.contentBlocks.forEach(block => {
      const content = (block.content as any)?.en || (typeof block.content === 'string' ? block.content : '');
      if (block.type === 'html' && content) {
        const text = content.replace(/<[^>]*>/g, ' ').toLowerCase();
        const words = text.trim().split(/\s+/);
        totalWords += words.length;
        keywordCount += text.split(keyword).length - 1;
      }
    });
    
    if (totalWords > 0) {
      this.focusKeywordDensity = parseFloat(((keywordCount / totalWords) * 100).toFixed(2));
    }
  }
  
  // Set publishedAt when status changes to published
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Method to increment view count
BlogSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Method to increment share count
BlogSchema.methods.incrementShareCount = function() {
  this.shareCount += 1;
  return this.save();
};

export default mongoose.model<IBlog>('Blog', BlogSchema);
