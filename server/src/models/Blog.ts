import { revalidateTags } from '../services/revalidate';
import mongoose, { Schema, Document } from 'mongoose';
import { IImage, ImageSchema } from './shared/ImageSchema';
import { ILocalizedString, LocalizedStringSchema, OptionalLocalizedStringSchema, ILocalizedMixed, LocalizedMixedSchema, completeOgFromMeta } from './shared/LocalizedSchema';
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
  languages?: string[];
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
  editorialAuthor?: mongoose.Types.ObjectId | string;
  featuredImage: IImage;
  excerpt?: ILocalizedString;
  /**
   * Short teaser shown on the article CARD only. Kept separate from `excerpt`
   * because `excerpt` was doing three incompatible jobs at once: the card
   * teaser, the sub-title in the article page header, and the fallback for the
   * meta description. Copy that sells a click is not copy that introduces an
   * article, and neither is copy written for a search result.
   *
   * There is NO fallback. An article with no card description shows no
   * description on its card — deliberately, so an editor sees the gap and
   * writes for it rather than having the card silently borrow prose written
   * for somewhere else.
   */
  cardDescription?: ILocalizedString;
  
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
  incrementShareCount(): Promise<this>;
}

// Localized text for content blocks where EVERY language is optional —
// per-language article bodies are independent (own keyword maps), so a
// block may exist in one language only. LocalizedStringSchema (en required)
// would reject such blocks.
const BlockLocalizedStringSchema = new Schema(
  {
    en: { type: String, trim: true },
    de: { type: String, trim: true },
    it: { type: String, trim: true },
    es: { type: String, trim: true },
  },
  { _id: false }
);

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
    editorialAuthor: {
      type: Schema.Types.ObjectId,
      ref: 'EditorialAuthor',
    },
    featuredImage: {
      type: ImageSchema,
      // Drafts may exist without an image (e.g. JSON-imported articles whose
      // image is added by hand during review). Publishing without one is
      // blocked BOTH here (create/save paths) and by an explicit guard in
      // updateBlog (findByIdAndUpdate skips conditional validators for
      // fields absent from the update).
      required: [
        function (this: any) {
          return this.status === 'published' || this.status === 'scheduled';
        },
        'Featured image is required before publishing',
      ],
    },
    excerpt: {
      type: LocalizedStringSchema,
    },
    // Plain text (no rich text): it renders as clamped lines on the card.
    cardDescription: {
      type: OptionalLocalizedStringSchema,
    },
    
    // === RICH CONTENT ===
    // NOTE: block title/content use the ALL-OPTIONAL localized schema below
    // (not LocalizedStringSchema, whose `en` is required). Each language's
    // article body is authored independently against its own keyword map, so
    // a block may intentionally exist in ONE language only (e.g. a
    // Spanish-exclusive section). The visitor page renders each language's
    // own blocks strictly.
    contentBlocks: [{
      type: {
        type: String,
        enum: ['html', 'imageRow', 'blockquote', 'video', 'image'],
        required: true,
      },
      title: BlockLocalizedStringSchema,
      content: BlockLocalizedStringSchema,
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
      // Locales a non-text block (image/imageRow/video) renders for; absent/empty
      // = all languages. Text blocks derive visibility from their own content.
      // default: undefined stops mongoose from stamping [] on every block.
      languages: { type: [{ type: String, enum: ['en', 'de', 'it', 'es'] }], default: undefined },
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
      required: [
        function (this: any) {
          return this.status === 'scheduled';
        },
        'A scheduled date is required',
      ],
      validate: {
        validator: function (this: any, value?: Date) {
          return this.status !== 'scheduled' || (!!value && value.getTime() > Date.now());
        },
        message: 'Scheduled date must be in the future',
      },
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
    // Plain Mixed (not LocalizedMixedSchema): these fields may exist in ONE
    // language only, and the shared subschema requires `en`. Values are
    // localized objects whose per-language value is an HTML string (new
    // rich-text editor) or a legacy array of bullet strings.
    summary: {
      type: Schema.Types.Mixed,
    },
    keyTakeaways: {
      type: Schema.Types.Mixed,
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
BlogSchema.index({ status: 1, scheduledAt: 1 });
BlogSchema.index({ isFeatured: 1, status: 1 });
BlogSchema.index({ author: 1, status: 1 });
BlogSchema.index({ tags: 1 });
BlogSchema.index({ status: 1, isFeatured: 1, publishedAt: -1 });
BlogSchema.index({ title: 'text', excerpt: 'text' });
BlogSchema.index({ createdAt: -1 });

// Re-exported so existing imports from '../models/Blog' keep working.
export { completeOgFromMeta } from './shared/LocalizedSchema';

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
  
  // Auto-populate OG fields from meta fields, language by language
  this.ogTitle = completeOgFromMeta(this.ogTitle, this.metaTitle) as any;
  this.ogDescription = completeOgFromMeta(this.ogDescription, this.metaDescription) as any;
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

  if (this.status === 'scheduled') {
    this.publishedAt = undefined;
  } else {
    this.scheduledAt = undefined;
  }
  
  next();
});

// Method to increment share count
BlogSchema.methods.incrementShareCount = function() {
  this.shareCount += 1;
  return this.save();
};

/*
 * Clear the front end's cache whenever an article changes.
 *
 * On the MODEL rather than in the controllers on purpose: articles are written
 * from create, update, publish, delete, the importer and a couple of
 * migrations, and a hook per write path is a hook someone forgets on the next
 * one. Every path ends up here.
 *
 * The tag is coarse — `blog`, not this article's own id — because a single
 * article changing affects the listings, the category pages, the related-post
 * strips and its author's page. Invalidating them together is both correct and
 * cheaper to reason about than a graph of per-entity tags.
 */
const revalidateBlogCaches = () => revalidateTags(['blog']);

BlogSchema.post('save', revalidateBlogCaches);
BlogSchema.post('findOneAndUpdate', revalidateBlogCaches);
BlogSchema.post('findOneAndDelete', revalidateBlogCaches);
BlogSchema.post('deleteOne', revalidateBlogCaches);
BlogSchema.post('updateOne', revalidateBlogCaches);
BlogSchema.post('updateMany', revalidateBlogCaches);

export default mongoose.model<IBlog>('Blog', BlogSchema);
