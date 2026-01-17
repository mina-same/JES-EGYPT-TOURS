import mongoose, { Schema, Document } from 'mongoose';

export interface IBlogSubCategory extends Document {
  // Basic Info
  name: string;
  slug: string;
  description?: string;
  image?: string;
  category: mongoose.Types.ObjectId;
  
  // SEO Meta Tags
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  metaImage?: {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  
  // Open Graph (Facebook, LinkedIn)
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  
  // Indexing Control
  noIndex: boolean;
  noFollow: boolean;
  
  // Breadcrumbs
  breadcrumbs?: Array<{
    name: string;
    url: string;
  }>;
  
  // Status
  isActive: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const BlogSubCategorySchema: Schema = new Schema(
  {
    // === BASIC INFO ===
    name: {
      type: String,
      required: [true, 'SubCategory name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'BlogCategory',
      required: [true, 'Parent category is required'],
    },
    
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
      url: {
        type: String,
        trim: true,
      },
      alt: {
        type: String,
        trim: true,
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

// Compound index for category + slug uniqueness
BlogSubCategorySchema.index({ category: 1, slug: 1 }, { unique: true });
BlogSubCategorySchema.index({ category: 1, isActive: 1 });
BlogSubCategorySchema.index({ name: 'text', description: 'text' });

// Pre-save middleware to auto-populate SEO fields
BlogSubCategorySchema.pre<IBlogSubCategory>('save', function (next) {
  // Auto-populate metaTitle from name if not provided
  if (!this.metaTitle) {
    this.metaTitle = this.name;
  }
  
  // Auto-populate OG fields from meta fields if not provided
  if (!this.ogTitle) {
    this.ogTitle = this.metaTitle;
  }
  if (!this.ogDescription) {
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

export default mongoose.model<IBlogSubCategory>('BlogSubCategory', BlogSubCategorySchema);
