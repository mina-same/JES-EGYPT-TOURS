import mongoose, { Schema, Document, Types } from 'mongoose';
import { IImage, ImageSchema } from './shared/ImageSchema';
import { IFAQ, FAQSchema } from './shared/FaqSchema';
import { 
  ILocalizedString, 
  ILocalizedMixed, 
  LocalizedStringSchema, 
  OptionalLocalizedStringSchema,
  LocalizedMixedSchema 
} from './shared/LocalizedSchema';

// ==================== INTERFACES ====================

export interface ISEO {
  metaTitle?: ILocalizedString;
  metaDescription?: ILocalizedString;
  metaKeywords?: ILocalizedMixed;
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
  image1?: IImage;
  image2?: IImage;
  images?: IImage[];
  title?: ILocalizedString;
  description?: ILocalizedMixed;
  button?: ISectionHeaderButton;
}

export interface ITourCategory extends Document {
  name: ILocalizedString;
  /** Short label for compact UI; falls back to `name` when empty. */
  shortName?: ILocalizedString;
  slug: ILocalizedString;
  description?: ILocalizedMixed; // Rich text for page header
  images: IImage[];
  seo?: ISEO;
  sectionHeader?: ISectionHeader;
  gallery?: IImage[];
  subcategorySectionTitle?: ILocalizedString; // New field
  toursSectionTitle?: ILocalizedString; // New field
  gallerySectionTitle?: ILocalizedString; // New field
  toursSectionSubTitle?: ILocalizedString; // New field
  blogsSectionTitle?: ILocalizedString; // New field
  faqsSectionTitle?: ILocalizedString; // New field
  faqs?: IFAQ[];
  featuredBlogs?: Types.ObjectId[];
  featuredDestinations?: Types.ObjectId[];
  destinationsSectionTitle?: ILocalizedString;
  bottomSection?: ISectionHeader;
  isActive: boolean;
  editVersion: number;
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
      type: LocalizedMixedSchema,
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
    image1: {
      type: ImageSchema,
      required: false,
    },
    image2: {
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
    /**
     * Optional short label for compact UI (cards, chips, filters, breadcrumbs).
     * `name` stays the long, keyword-rich page H1; leaving this empty falls back
     * to `name` shortened at its first separator, so nothing breaks unfilled.
     */
    shortName: {
      type: OptionalLocalizedStringSchema,
    },
    slug: {
      type: LocalizedStringSchema,
      required: [true, 'Slug is required'],
    },
    description: {
      type: LocalizedMixedSchema,
    },
    images: {
      type: [ImageSchema],
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
    gallery: {
      type: [ImageSchema],
      required: false,
    },
    subcategorySectionTitle: {
      type: LocalizedStringSchema,
      required: false,
    },
    toursSectionTitle: {
      type: LocalizedStringSchema,
      required: false,
    },
    toursSectionSubTitle: {
      type: LocalizedStringSchema,
      required: false,
    },
    gallerySectionTitle: {
      type: LocalizedStringSchema,
      required: false,
    },
    blogsSectionTitle: {
      type: LocalizedStringSchema,
      required: false,
    },
    faqsSectionTitle: {
      type: LocalizedStringSchema,
      required: false,
    },
    faqs: {
      type: [FAQSchema],
      required: false,
    },
    featuredBlogs: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Blog',
      },
    ],
    featuredDestinations: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Destination',
      },
    ],
    destinationsSectionTitle: {
      type: LocalizedStringSchema,
      required: false,
    },
    bottomSection: {
      type: SectionHeaderSchema,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    editVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==================== INDEXES ====================
TourCategorySchema.index({ 'slug.en': 1 }, { unique: true, sparse: true });
TourCategorySchema.index({ 'slug.de': 1 }, { unique: true, sparse: true });
TourCategorySchema.index({ 'slug.it': 1 }, { unique: true, sparse: true });
TourCategorySchema.index({ 'slug.es': 1 }, { unique: true, sparse: true });

// Indexes for faster queries
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

  // Auto-populate metaImage from first image if not provided
  if (!this.seo.metaImage && this.images && this.images.length > 0) {
    this.seo.metaImage = this.images[0];
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
