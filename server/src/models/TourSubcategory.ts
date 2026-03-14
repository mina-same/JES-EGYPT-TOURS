import mongoose, { Schema, Document, Types } from 'mongoose';
import { IImage, ImageSchema } from './shared/ImageSchema';

// ==================== INTERFACES ====================

export interface ISEO {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  metaImage?: IImage;
}

export interface ISectionHeaderButton {
  label?: string;
  href?: string;
  newTab?: boolean;
}

export interface ISectionHeader {
  isEnabled?: boolean;
  image?: IImage;
  images?: IImage[];
  title?: string;
  description?: any;
  button?: ISectionHeaderButton;
}

export interface ITourSubcategory extends Document {
  category: Types.ObjectId;
  name: string;
  slug: string;
  description?: any; // HTML content (Schema.Types.Mixed)
  image?: IImage;
  seo?: ISEO;
  sectionHeader?: ISectionHeader;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Re-export IImage for convenience
export { IImage };

const SEOSchema = new Schema<ISEO>(
  {
    metaTitle: {
      type: String,
      trim: true,
      maxlength: [70, 'Meta title should not exceed 70 characters'],
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'Meta description should not exceed 160 characters'],
    },
    metaKeywords: [
      {
        type: String,
        trim: true,
      },
    ],
    metaImage: {
      type: ImageSchema,
      required: false,
    },
  },
  { _id: false }
);

const SectionHeaderButtonSchema = new Schema<ISectionHeaderButton>(
  {
    label: {
      type: String,
      trim: true,
      maxlength: [100, 'Button label should not exceed 100 characters'],
    },
    href: {
      type: String,
      trim: true,
      maxlength: [500, 'Button link should not exceed 500 characters'],
    },
    newTab: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const SectionHeaderSchema = new Schema<ISectionHeader>(
  {
    isEnabled: {
      type: Boolean,
      default: true,
    },
    image: {
      type: ImageSchema,
      required: false,
    },
    images: {
      type: [ImageSchema],
      required: false,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [150, 'Section header title should not exceed 150 characters'],
    },
    description: {
      type: Schema.Types.Mixed,
    },
    button: {
      type: SectionHeaderButtonSchema,
      required: false,
    },
  },
  { _id: false }
);

const TourSubcategorySchema = new Schema<ITourSubcategory>(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: 'TourCategory',
      required: [true, 'Parent category is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Subcategory name is required'],
      trim: true,
      maxlength: [100, 'Subcategory name should not exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug must be URL-friendly (lowercase, hyphens only)',
      ],
    },
    description: {
      type: Schema.Types.Mixed,
      // HTML content - can be string or structured HTML
    },
    image: {
      type: ImageSchema,
      required: false,
    },
    seo: {
      type: SEOSchema,
      required: false,
    },
    sectionHeader: {
      type: SectionHeaderSchema,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==================== INDEXES ====================

// Compound index: slug must be unique within a category
TourSubcategorySchema.index({ category: 1, slug: 1 }, { unique: true });
// Note: slug index removed as it's covered by compound index above
TourSubcategorySchema.index({ isActive: 1 });
TourSubcategorySchema.index({ name: 'text', description: 'text' });
TourSubcategorySchema.index({ createdAt: -1 });

// ==================== VIRTUALS ====================

// Virtual for tours count
TourSubcategorySchema.virtual('toursCount', {
  ref: 'Tour',
  localField: '_id',
  foreignField: 'subcategory',
  count: true,
});

// ==================== MIDDLEWARE ====================

// Pre-save: Auto-populate SEO fields
TourSubcategorySchema.pre<ITourSubcategory>('save', function (next) {
  if (!this.seo) {
    this.seo = {};
  }

  // Auto-populate metaTitle from name if not provided
  if (!this.seo.metaTitle) {
    this.seo.metaTitle = this.name;
  }

  // Auto-populate metaImage from image if not provided
  if (!this.seo.metaImage && this.image) {
    this.seo.metaImage = this.image;
  }

  next();
});

// Pre-save: Validate category exists
TourSubcategorySchema.pre<ITourSubcategory>('save', async function (next) {
  if (this.isModified('category')) {
    const TourCategory = mongoose.model('TourCategory');
    const categoryExists = await TourCategory.findById(this.category);

    if (!categoryExists) {
      throw new Error('Invalid category reference');
    }
  }

  next();
});

// Pre-remove: Prevent deletion if tours exist
TourSubcategorySchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const Tour = mongoose.model('Tour');
  const toursCount = await Tour.countDocuments({
    subcategory: this._id,
  });

  if (toursCount > 0) {
    throw new Error(
      `Cannot delete subcategory. ${toursCount} tours are associated with it.`
    );
  }

  next();
});

// ==================== EXPORT ====================

export default mongoose.model<ITourSubcategory>('TourSubcategory', TourSubcategorySchema);
