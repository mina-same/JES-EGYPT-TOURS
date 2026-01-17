import mongoose, { Schema, Document } from 'mongoose';
import { IImage, ImageSchema } from './shared/ImageSchema';

// Content Block Types
interface IImageBlock {
  url: string;
  alt: string;
  title?: string;
  caption?: string;
  width?: number;
  height?: number;
}

interface IContentBlock {
  type: 'html' | 'imageRow' | 'blockquote' | 'video' | 'image';
  content?: string;
  images?: IImageBlock[];
  image?: string;
  url?: string;
  thumbnail?: string;
  alt?: string;
  caption?: string;
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
  name: string;
  url: string;
}

export interface IBlog extends Document {
  // Basic Info
  title: string;
  slug: string;
  author: mongoose.Types.ObjectId | string;
  featuredImage: IImage;
  excerpt?: string;
  
  // Rich Content
  contentBlocks: IContentBlock[];
  
  // SEO Meta Tags
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  metaImage?: IImage;
  
  // Open Graph (Facebook, LinkedIn)
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  
  // Indexing Control
  noIndex: boolean;
  noFollow: boolean;
  
  // Focus Keyword & Readability
  focusKeyword?: string;
  focusKeywordDensity?: number;
  readingTime?: number;
  
  // Breadcrumbs
  breadcrumbs?: IBreadcrumb[];
  
  // Tags
  tags: string[];
  
  // Publishing
  status: 'draft' | 'published' | 'scheduled';
  isFeatured: boolean;
  publishedAt?: Date;
  scheduledAt?: Date;
  lastModified: Date;
  
  // Analytics
  viewCount: number;
  shareCount: number;
  averageTimeOnPage?: number;
  
  // Comments
  commentsEnabled: boolean;
  comments: IComment[];
  
  // Related Content
  relatedPosts?: mongoose.Types.ObjectId[];
  
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
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
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
      type: String,
      trim: true,
      maxlength: [300, 'Excerpt should not exceed 300 characters'],
    },
    
    // === RICH CONTENT ===
    contentBlocks: [{
      type: {
        type: String,
        enum: ['html', 'imageRow', 'blockquote', 'video', 'image'],
        required: true,
      },
      content: String,
      images: [{
        url: { type: String, required: true },
        alt: { type: String, required: true },
        title: String,
        caption: String,
        width: Number,
        height: Number,
      }],
      image: String,
      url: String,
      thumbnail: String,
      alt: String,
      caption: String,
    }],
    
    // === SEO META TAGS ===
    metaTitle: {
      type: String,
      trim: true,
      maxlength: [60, 'Meta title should not exceed 60 characters'],
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'Meta description should not exceed 160 characters'],
    },
    metaKeywords: [{
      type: String,
      trim: true,
    }],
    metaImage: {
      type: ImageSchema,
      required: false,
    },
    
    // === OPEN GRAPH (SOCIAL MEDIA) ===
    ogTitle: {
      type: String,
      trim: true,
    },
    ogDescription: {
      type: String,
      trim: true,
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
      type: String,
      trim: true,
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
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    }],
    
    // === TAGS ===
    tags: [{
      type: String,
      trim: true,
    }],
    
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
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
BlogSchema.index({ slug: 1 });
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
  if (!this.metaTitle) {
    this.metaTitle = this.title;
  }
  
  // Auto-populate featuredImage alt from title if not provided
  if (this.featuredImage && !this.featuredImage.alt) {
    this.featuredImage.alt = this.title;
  }
  
  // Ensure fileName is set if not provided (for backward compatibility)
  if (this.featuredImage && !this.featuredImage.fileName && this.featuredImage.url) {
    const urlParts = this.featuredImage.url.split('/');
    this.featuredImage.fileName = urlParts[urlParts.length - 1] || 'image.jpg';
  }
  
  // Auto-populate OG fields from meta fields if not provided
  if (!this.ogTitle) {
    this.ogTitle = this.metaTitle;
  }
  if (!this.ogDescription) {
    this.ogDescription = this.metaDescription;
  }
  if (!this.ogImage) {
    this.ogImage = this.metaImage?.url || this.featuredImage?.url || '';
  }
  
  // Auto-populate metaImage alt from title if not provided
  if (this.metaImage && this.metaImage.url && !this.metaImage.alt) {
    this.metaImage.alt = this.title;
  }
  
  // Ensure metaImage fileName is set if not provided
  if (this.metaImage && !this.metaImage.fileName && this.metaImage.url) {
    const urlParts = this.metaImage.url.split('/');
    this.metaImage.fileName = urlParts[urlParts.length - 1] || 'meta-image.jpg';
  }
  
  // Calculate reading time (average 200 words per minute)
  if (this.contentBlocks && this.contentBlocks.length > 0) {
    let totalWords = 0;
    this.contentBlocks.forEach(block => {
      if (block.type === 'html' && block.content) {
        // Strip HTML tags and count words
        const text = block.content.replace(/<[^>]*>/g, ' ');
        const words = text.trim().split(/\s+/).length;
        totalWords += words;
      }
      if (block.type === 'blockquote' && block.content) {
        const words = block.content.trim().split(/\s+/).length;
        totalWords += words;
      }
    });
    this.readingTime = Math.ceil(totalWords / 200);
  }
  
  // Calculate focus keyword density
  if (this.focusKeyword && this.contentBlocks && this.contentBlocks.length > 0) {
    let totalWords = 0;
    let keywordCount = 0;
    const keyword = this.focusKeyword.toLowerCase();
    
    this.contentBlocks.forEach(block => {
      if (block.type === 'html' && block.content) {
        const text = block.content.replace(/<[^>]*>/g, ' ').toLowerCase();
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
