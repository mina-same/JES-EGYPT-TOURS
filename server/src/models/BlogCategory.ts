import mongoose, { Schema, Document } from 'mongoose';
import { ILocalizedString, LocalizedStringSchema, ILocalizedMixed, LocalizedMixedSchema, completeOgFromMeta } from './shared/LocalizedSchema';
import { FAQSchema, IFAQ } from './shared/FaqSchema';
import { IImage } from './shared/ImageSchema';
import { sanitizeDocumentPaths, sanitizeUpdatePaths } from '../utils/sanitizeRichText';
import { revalidateTags } from '../services/revalidate';

export interface IBlogCategory extends Document {
  // Basic Info
  name: ILocalizedString;
  slug: ILocalizedString;
  description?: ILocalizedString;
  image?: IImage | string;
  
  // SEO Meta Tags
  metaTitle?: ILocalizedString;
  metaDescription?: ILocalizedString;
  metaKeywords?: ILocalizedMixed;
  metaImage?: {
    url: string;
    fileName?: string;
    title?: ILocalizedString;
    alt?: ILocalizedString;
    width?: number;
    height?: number;
  };
  
  // Open Graph (Facebook, LinkedIn)
  ogTitle?: ILocalizedString;
  ogDescription?: ILocalizedString;
  ogImage?: string;
  ogType?: string;
  
  // Indexing Control
  noIndex: boolean;
  noFollow: boolean;
  
  // Status
  isActive: boolean;
  editVersion: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Content Sections
  heroTitle?: ILocalizedString;
  heroDescription?: ILocalizedString;
  sideImage?: {
    url: string;
    fileName: string;
    title?: ILocalizedString;
    alt?: ILocalizedString;
  };
  features?: Array<{
    icon: string;
    title: ILocalizedString;
    description: ILocalizedString;
  }>;
  featuredBlogs?: mongoose.Types.ObjectId[];
  featuredBlogsSectionTitle?: ILocalizedString;
  blogsSectionTitle?: ILocalizedString;
  faqsSectionTitle?: ILocalizedString;
  destinationsSectionTitle?: ILocalizedString;
  featuredDestinations?: mongoose.Types.ObjectId[];
  faqs?: IFAQ[];
}

const BlogCategorySchema: Schema = new Schema(
  {
    // === BASIC INFO ===
    name: {
      type: LocalizedStringSchema,
      required: [true, 'Category name is required'],
    },
    slug: {
      type: LocalizedStringSchema,
      required: true,
    },
    description: {
      type: LocalizedStringSchema,
    },
    image: {
      type: Schema.Types.Mixed,
      required: false,
    },
    
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
      url: {
        type: String,
        trim: true,
      },
      fileName: {
        type: String,
        trim: true,
      },
      title: {
        type: LocalizedStringSchema,
      },
      alt: {
        type: LocalizedStringSchema,
      },
      width: {
        type: Number,
        min: 0,
      },
      height: {
        type: Number,
        min: 0,
      },
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
      default: 'website',
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
    
    // === STATUS ===
    isActive: {
      type: Boolean,
      default: true,
    },
    editVersion: {
      type: Number,
      default: 0,
    },
    
    // === CONTENT SECTIONS ===
    heroTitle: {
      type: LocalizedStringSchema,
    },
    heroDescription: {
      type: LocalizedStringSchema,
    },
    sideImage: {
      url: { type: String, trim: true },
      fileName: { type: String, trim: true },
      title: LocalizedStringSchema,
      alt: LocalizedStringSchema,
    },
    features: [{
      icon: { type: String, trim: true },
      title: LocalizedStringSchema,
      description: LocalizedStringSchema,
    }],
    featuredBlogs: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Blog',
      },
    ],
    featuredBlogsSectionTitle: {
      type: LocalizedStringSchema,
    },
    blogsSectionTitle: {
      type: LocalizedStringSchema,
    },
    faqsSectionTitle: {
      type: LocalizedStringSchema,
    },
    destinationsSectionTitle: {
      type: LocalizedStringSchema,
    },
    featuredDestinations: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Destination',
      },
    ],
    faqs: [FAQSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
BlogCategorySchema.index({ 'slug.en': 1 }, { sparse: true, unique: true });
BlogCategorySchema.index({ 'slug.de': 1 }, { sparse: true, unique: true });
BlogCategorySchema.index({ 'slug.it': 1 }, { sparse: true, unique: true });
BlogCategorySchema.index({ 'slug.es': 1 }, { sparse: true, unique: true });
BlogCategorySchema.index({ isActive: 1 });
BlogCategorySchema.index({ name: 'text', description: 'text' });

// Virtual for subcategories count
BlogCategorySchema.virtual('subcategoriesCount', {
  ref: 'BlogSubCategory',
  localField: '_id',
  foreignField: 'category',
  count: true,
});

// Ensure virtuals are included in JSON
BlogCategorySchema.set('toJSON', { virtuals: true });
BlogCategorySchema.set('toObject', { virtuals: true });

// Pre-save middleware to auto-populate SEO fields if not provided
BlogCategorySchema.pre<IBlogCategory>('save', function (next) {
  // Auto-populate metaTitle from name if not provided
  if (!this.metaTitle || (!this.metaTitle.en && !this.metaTitle.de && !this.metaTitle.it)) {
    this.metaTitle = this.name;
  }
  
  // Complete OG from meta, language by language (EN←EN, DE←DE, …)
  this.ogTitle = completeOgFromMeta(this.ogTitle, this.metaTitle) as any;
  this.ogDescription = completeOgFromMeta(this.ogDescription, this.metaDescription) as any;
  if (!this.ogImage) {
    this.ogImage = (this.metaImage as any)?.url || (typeof this.image === 'string' ? this.image : (this.image as any)?.url);
  }
  
  // Auto-populate metaImage alt from name if not provided
  if (this.metaImage && (this.metaImage as any).url && !(this.metaImage as any).alt) {
    (this.metaImage as any).alt = this.name;
  }
  
  next();
});


/**
 * Editor HTML is cleaned on the way IN, so the database never holds a payload
 * and the ~30 dangerouslySetInnerHTML call sites on the visitor pages are
 * rendering content that was already sanitized. See utils/sanitizeRichText.ts.
 *
 * Both hooks are needed: document hooks never run for findOneAndUpdate and
 * friends, which the admin uses for edits.
 */
const RICH_TEXT_PATHS = ['description', 'heroDescription'] as const;

BlogCategorySchema.pre('validate', sanitizeDocumentPaths(RICH_TEXT_PATHS));
BlogCategorySchema.pre('findOneAndUpdate', sanitizeUpdatePaths(RICH_TEXT_PATHS));
BlogCategorySchema.pre('updateOne', sanitizeUpdatePaths(RICH_TEXT_PATHS));
BlogCategorySchema.pre('updateMany', sanitizeUpdatePaths(RICH_TEXT_PATHS));


/**
 * Blog category content — read by the shared [slug] route and the blog hub.
 *
 * Mirrors Blog.ts: the visitor fetch is tagged and served from cache until an
 * editor changes something, at which point the tag is cleared and the change
 * is live immediately.
 *
 * ── Why `blog` and nothing else ──
 * The tag has to match what a cached read actually holds, and the reads that
 * carry blog category data today are tagged `blog`:
 *   getCategoryBySlug in client/src/lib/api/blog.ts.
 * A dedicated `blog-categories` tag would be tidier to read but nothing
 * consumes it, and an emitted tag with no consumer invalidates nothing while
 * looking like it does. If those reads are ever split onto their own tag,
 * this line moves with them.
 *
 * ── Hooks follow the operations the admin controller ACTUALLY uses ──
 *   create         Model.create()        -> save             (document)
 *   edit           findByIdAndUpdate()   -> findOneAndUpdate (query)
 *   toggle active  doc.save()            -> save             (document)
 *   delete         doc.deleteOne()       -> deleteOne        (DOCUMENT)
 *
 * That last row is why `deleteOne` is registered twice. In Mongoose 8 a bare
 * post('deleteOne') is QUERY middleware only (helpers/model/applyHooks.js:
 * `return !!hook['document']`), so it would never fire for the
 * `doc.deleteOne()` the delete endpoint calls — the tag would quietly survive
 * a deletion. The query variant is kept for direct Model.deleteOne() callers.
 *
 * Fire-and-forget: revalidateTags never throws and is never awaited, so an
 * admin save cannot fail because the front end is unreachable.
 */
const revalidateBlogCategoryCaches = () => revalidateTags(['blog']);

BlogCategorySchema.post('save', revalidateBlogCategoryCaches);
BlogCategorySchema.post('findOneAndUpdate', revalidateBlogCategoryCaches);
BlogCategorySchema.post('findOneAndDelete', revalidateBlogCategoryCaches);
BlogCategorySchema.post('updateOne', revalidateBlogCategoryCaches);
BlogCategorySchema.post('updateMany', revalidateBlogCategoryCaches);
BlogCategorySchema.post('deleteOne', { document: true, query: false }, revalidateBlogCategoryCaches);
BlogCategorySchema.post('deleteOne', { document: false, query: true }, revalidateBlogCategoryCaches);

export default mongoose.model<IBlogCategory>('BlogCategory', BlogCategorySchema);
