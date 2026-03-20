import mongoose, { Schema, Document } from 'mongoose';
import { IImage, ImageSchema } from './shared/ImageSchema';
import { IFAQ, FAQSchema } from './shared/FaqSchema';
import { 
  ILocalizedString, 
  ILocalizedMixed, 
  LocalizedStringSchema, 
  LocalizedMixedSchema 
} from './shared/LocalizedSchema';

// ==================== INTERFACES ====================

export interface ISEO {
  metaTitle?: ILocalizedString;
  metaDescription?: ILocalizedString;
  metaKeywords?: ILocalizedString;
  metaImage?: IImage;
}

export interface ISectionHeaderButton {
  label?: ILocalizedString;
  href?: string;
  newTab?: boolean;
}

export interface ISectionHeader {
  isEnabled?: boolean;
  image?: IImage;
  images?: IImage[];
  title?: ILocalizedString;
  description?: ILocalizedMixed;
  button?: ISectionHeaderButton;
}

export interface ITourCategory extends Document {
  name: ILocalizedString;
  slug: string;
  description?: ILocalizedMixed; // Localized HTML content
  image?: IImage;
  seo?: ISEO;
  sectionHeader?: ISectionHeader;
  faqs?: IFAQ[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Re-export IImage for convenience
export { IImage };

const SEOSchema = new Schema<ISEO>(
  {
    metaTitle: {
      type: LocalizedStringSchema,
    },
    metaDescription: {
      type: LocalizedStringSchema,
    },
    metaKeywords: {
      type: LocalizedStringSchema,
    },
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
      type: LocalizedStringSchema,
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
      type: LocalizedStringSchema,
    },
    description: {
      type: LocalizedMixedSchema,
    },
    button: {
      type: SectionHeaderButtonSchema,
      required: false,
    },
  },
  { _id: false }
);

const TourCategorySchema = new Schema<ITourCategory>(
  {
    name: {
      type: LocalizedStringSchema,
      required: [true, 'Category name is required'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug must be URL-friendly (lowercase, hyphens only)',
      ],
    },
    description: {
      type: LocalizedMixedSchema,
      // Localized HTML content
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
    faqs: {
      type: [FAQSchema],
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

// Indexes for faster queries (slug already indexed via unique: true)
TourCategorySchema.index({ isActive: 1 });
TourCategorySchema.index({ name: 'text', description: 'text' });
TourCategorySchema.index({ createdAt: -1 });

// ==================== VIRTUALS ====================

// Virtual for subcategories count
TourCategorySchema.virtual('subcategoriesCount', {
  ref: 'TourSubcategory',
  localField: '_id',
  foreignField: 'category',
  count: true,
});

// ==================== MIDDLEWARE ====================

// Pre-save: Auto-populate SEO fields
TourCategorySchema.pre<ITourCategory>('save', function (next) {
  if (!this.seo) {
    this.seo = {};
  }

  // Auto-populate metaTitle from name if not provided
  if (!this.seo.metaTitle?.en && this.name?.en) {
    this.seo.metaTitle = { ...this.name };
  }

  // Auto-populate metaImage from image if not provided
  if (!this.seo.metaImage && this.image) {
    this.seo.metaImage = this.image;
  }

  next();
});

// Pre-remove: Prevent deletion if subcategories exist
TourCategorySchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const TourSubcategory = mongoose.model('TourSubcategory');
  const subcategoriesCount = await TourSubcategory.countDocuments({
    category: this._id,
  });

  if (subcategoriesCount > 0) {
    throw new Error(
      `Cannot delete category. ${subcategoriesCount} subcategories are associated with it.`
    );
  }

  next();
});

// ==================== EXPORT ====================

export default mongoose.model<ITourCategory>('TourCategory', TourCategorySchema);
