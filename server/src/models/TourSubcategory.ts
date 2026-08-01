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
import { ICuratedReview, CuratedReviewSchema } from './shared/CuratedReviewSchema';

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

export interface ITourSubcategory extends Document {
  category: Types.ObjectId;
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
  toursSectionSubTitle?: ILocalizedString; // New field
  gallerySectionTitle?: ILocalizedString;
  blogsSectionTitle?: ILocalizedString;
  faqsSectionTitle?: ILocalizedString;
  reviewsSectionTitle?: ILocalizedString;
  faqs?: IFAQ[];
  reviews?: ICuratedReview[];
  featuredBlogs?: Types.ObjectId[];
  destinationsSectionTitle?: ILocalizedString;
  featuredDestinations?: Types.ObjectId[];
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

const TourSubcategorySchema = new Schema<ITourSubcategory>(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: 'TourCategory',
      required: [true, 'Parent category is required'],
      index: true,
    },
    name: {
      type: LocalizedStringSchema,
      required: [true, 'Subcategory name is required'],
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
      // Rich text for page header display
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
    reviewsSectionTitle: {
      type: LocalizedStringSchema,
      required: false,
    },
    faqs: {
      type: [FAQSchema],
      required: false,
    },
    reviews: {
      type: [CuratedReviewSchema],
      required: false,
    },
    featuredBlogs: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Blog',
      },
    ],
    destinationsSectionTitle: {
      type: LocalizedStringSchema,
    },
    featuredDestinations: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Destination',
      },
    ],
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

// Compound indexes: slug must be unique within a category for each language
TourSubcategorySchema.index({ category: 1, 'slug.en': 1 }, { unique: true, sparse: true });
TourSubcategorySchema.index({ category: 1, 'slug.de': 1 }, { unique: true, sparse: true });
TourSubcategorySchema.index({ category: 1, 'slug.it': 1 }, { unique: true, sparse: true });
TourSubcategorySchema.index({ category: 1, 'slug.es': 1 }, { unique: true, sparse: true });
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
  if (!this.seo.metaTitle?.en && this.name?.en) {
    this.seo.metaTitle = { ...this.name };
  }

  // Auto-populate metaImage from first image if not provided
  if (!this.seo.metaImage && this.images && this.images.length > 0) {
    this.seo.metaImage = this.images[0];
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
