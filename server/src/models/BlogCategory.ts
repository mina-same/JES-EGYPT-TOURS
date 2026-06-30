import mongoose, { Schema, Document } from 'mongoose';
import { ILocalizedString, LocalizedStringSchema, ILocalizedMixed, LocalizedMixedSchema } from './shared/LocalizedSchema';
import { FAQSchema, IFAQ } from './shared/FaqSchema';
import { IImage } from './shared/ImageSchema';

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
  
  // Auto-populate OG fields from meta fields if not provided
  if (!this.ogTitle || (!this.ogTitle.en && !this.ogTitle.de && !this.ogTitle.it)) {
    this.ogTitle = this.metaTitle;
  }
  if (!this.ogDescription || (!this.ogDescription.en && !this.ogDescription.de && !this.ogDescription.it)) {
    this.ogDescription = this.metaDescription;
  }
  if (!this.ogImage) {
    this.ogImage = (this.metaImage as any)?.url || (typeof this.image === 'string' ? this.image : (this.image as any)?.url);
  }
  
  // Auto-populate metaImage alt from name if not provided
  if (this.metaImage && (this.metaImage as any).url && !(this.metaImage as any).alt) {
    (this.metaImage as any).alt = this.name;
  }
  
  next();
});

export default mongoose.model<IBlogCategory>('BlogCategory', BlogCategorySchema);
