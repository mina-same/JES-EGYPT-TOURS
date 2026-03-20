import mongoose, { Schema, Document } from 'mongoose';
import { ILocalizedString, LocalizedStringSchema } from './shared/LocalizedSchema';

export interface IBlogCategory extends Document {
  // Basic Info
  name: ILocalizedString;
  slug: string;
  description?: ILocalizedString;
  image?: string;
  
  // SEO Meta Tags
  metaTitle?: ILocalizedString;
  metaDescription?: ILocalizedString;
  metaKeywords?: string[];
  metaImage?: {
    url: string;
    alt?: string;
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
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const BlogCategorySchema: Schema = new Schema(
  {
    // === BASIC INFO ===
    name: {
      type: LocalizedStringSchema,
      required: [true, 'Category name is required'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: LocalizedStringSchema,
    },
    image: {
      type: String,
      trim: true,
    },
    
    // === SEO META TAGS ===
    metaTitle: {
      type: LocalizedStringSchema,
    },
    metaDescription: {
      type: LocalizedStringSchema,
    },
    metaKeywords: [{
      type: String,
      trim: true,
    }],
    metaImage: {
      url: {
        type: String,
        trim: true,
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
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
BlogCategorySchema.index({ slug: 1 });
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
    this.ogImage = (this.metaImage as any)?.url || this.image;
  }
  
  // Auto-populate metaImage alt from name if not provided
  if (this.metaImage && (this.metaImage as any).url && !(this.metaImage as any).alt) {
    (this.metaImage as any).alt = this.name;
  }
  
  next();
});

export default mongoose.model<IBlogCategory>('BlogCategory', BlogCategorySchema);
