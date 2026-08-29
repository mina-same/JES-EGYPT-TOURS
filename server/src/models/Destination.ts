import mongoose, { Schema, Document } from 'mongoose';
import { ILocalizedString, LocalizedStringSchema, ILocalizedMixed, LocalizedMixedSchema, completeOgFromMeta } from './shared/LocalizedSchema';
import { IFAQ, FAQSchema } from './shared/FaqSchema';
import { sanitizeDocumentPaths, sanitizeUpdatePaths } from '../utils/sanitizeRichText';

export interface IDestination extends Document {
  // Basic Info
  name: ILocalizedString;
  slug: ILocalizedString;
  subheader?: ILocalizedString;
  description?: ILocalizedString;
  region?: ILocalizedString;

  // Cover Image
  coverImage?: {
    url: string;
    fileName?: string;
    title?: ILocalizedString;
    alt?: ILocalizedString;
  };

  // Hero Section (below PageHeader)
  heroTitle?: ILocalizedString;
  heroDescription?: ILocalizedMixed;

  // At a Glance
  bestFor?: ILocalizedString;
  combinesWith?: ILocalizedString;
  timeNeeded?: ILocalizedString;
  bestSeason?: ILocalizedString;

  // Content Sections
  featuredBlogs?: mongoose.Types.ObjectId[];
  featuredBlogsSectionTitle?: ILocalizedString;
  faqsSectionTitle?: ILocalizedString;
  faqs?: IFAQ[];

  // Relations
  relatedDestinations?: mongoose.Types.ObjectId[];

  // SEO Meta Tags
  metaTitle?: ILocalizedString;
  metaDescription?: ILocalizedString;
  metaKeywords?: ILocalizedMixed;
  metaImage?: {
    url: string;
    alt?: ILocalizedString;
    width?: number;
    height?: number;
  };

  // Open Graph
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

const DestinationSchema: Schema = new Schema(
  {
    // === BASIC INFO ===
    name: {
      type: LocalizedStringSchema,
      required: [true, 'Destination name is required'],
    },
    slug: {
      type: LocalizedStringSchema,
      required: true,
    },
    subheader: {
      type: LocalizedStringSchema,
    },
    description: {
      type: LocalizedStringSchema,
    },
    region: {
      type: LocalizedStringSchema,
    },

    // === COVER IMAGE ===
    coverImage: {
      url: { type: String, trim: true },
      fileName: { type: String, trim: true },
      title: LocalizedStringSchema,
      alt: LocalizedStringSchema,
    },

    // === HERO SECTION ===
    heroTitle: {
      type: LocalizedStringSchema,
    },
    heroDescription: {
      type: LocalizedMixedSchema,
    },

    // === AT A GLANCE ===
    bestFor: {
      type: LocalizedStringSchema,
    },
    combinesWith: {
      type: LocalizedStringSchema,
    },
    timeNeeded: {
      type: LocalizedStringSchema,
    },
    bestSeason: {
      type: LocalizedStringSchema,
    },

    // === CONTENT SECTIONS ===
    featuredBlogs: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Blog',
      },
    ],
    featuredBlogsSectionTitle: {
      type: LocalizedStringSchema,
    },
    faqsSectionTitle: {
      type: LocalizedStringSchema,
    },
    faqs: {
      type: [FAQSchema],
      default: undefined,
    },

    // === RELATIONS ===
    relatedDestinations: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Destination',
      },
    ],

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
      url: { type: String, trim: true },
      alt: LocalizedStringSchema,
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
    },

    // === OPEN GRAPH ===
    ogTitle: { type: LocalizedStringSchema },
    ogDescription: { type: LocalizedStringSchema },
    ogImage: { type: String, trim: true },
    ogType: { type: String, default: 'website' },

    // === INDEXING CONTROL ===
    noIndex: { type: Boolean, default: false },
    noFollow: { type: Boolean, default: false },

    // === STATUS ===
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Slug uniqueness indexes per language
DestinationSchema.index({ 'slug.en': 1 }, { unique: true, sparse: true });
DestinationSchema.index({ 'slug.de': 1 }, { unique: true, sparse: true });
DestinationSchema.index({ 'slug.it': 1 }, { unique: true, sparse: true });
DestinationSchema.index({ 'slug.es': 1 }, { unique: true, sparse: true });
DestinationSchema.index({ isActive: 1 });
DestinationSchema.index({ name: 'text', description: 'text' });

// Pre-save: auto-populate SEO fields
DestinationSchema.pre<IDestination>('save', function (next) {
  if (!this.metaTitle || !this.metaTitle.en) {
    this.metaTitle = this.name;
  }
  // Complete OG from meta, language by language (EN←EN, DE←DE, …)
  this.ogTitle = completeOgFromMeta(this.ogTitle, this.metaTitle) as any;
  this.ogDescription = completeOgFromMeta(this.ogDescription, this.metaDescription) as any;
  if (!this.ogImage) {
    this.ogImage = (this.metaImage as any)?.url || this.coverImage?.url;
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

DestinationSchema.pre('validate', sanitizeDocumentPaths(RICH_TEXT_PATHS));
DestinationSchema.pre('findOneAndUpdate', sanitizeUpdatePaths(RICH_TEXT_PATHS));
DestinationSchema.pre('updateOne', sanitizeUpdatePaths(RICH_TEXT_PATHS));
DestinationSchema.pre('updateMany', sanitizeUpdatePaths(RICH_TEXT_PATHS));

export default mongoose.model<IDestination>('Destination', DestinationSchema);
