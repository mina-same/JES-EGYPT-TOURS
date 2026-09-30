import { duplicateInternalLinksPlugin } from '../utils/duplicateInternalLinksPlugin';
import mongoose, { Schema, Document, PopulateOptions } from 'mongoose';
import { ILocalizedString, LocalizedStringSchema, OptionalLocalizedStringSchema, ILocalizedMixed, LocalizedMixedSchema, completeOgFromMeta } from './shared/LocalizedSchema';
import { IFAQ, FAQSchema } from './shared/FaqSchema';
import { sanitizeDocumentPaths, sanitizeUpdatePaths } from '../utils/sanitizeRichText';
import { revalidateTags } from '../services/revalidate';

export const DESTINATION_STATUSES = ['draft', 'published'] as const;
export type DestinationStatus = (typeof DESTINATION_STATUSES)[number];

export const isDestinationStatus = (value: unknown): value is DestinationStatus =>
  DESTINATION_STATUSES.includes(value as DestinationStatus);

/**
 * The one rule for "this destination has a public landing page": published,
 * and not switched off.
 *
 * It governs the page and only the page: the slug resolver, the public
 * destination reads, the sitemap, and the cards that link to the page. Tours
 * are deliberately outside it. A tour may reference a draft destination, keeps
 * showing it under Places Visited and keeps offering it as a filter, because
 * publishing a destination's page and classifying a tour are separate
 * concerns. Do not add this filter to a tour read.
 */
export const PUBLIC_DESTINATION_FILTER: Record<string, unknown> = Object.freeze({
  status: 'published',
  isActive: { $ne: false },
});

/** Populates a destination reference for a public page: landing pages only. */
export const publicDestinationPopulate = (path: string, select?: string): PopulateOptions => ({
  path,
  ...(select ? { select } : {}),
  match: { ...PUBLIC_DESTINATION_FILTER },
});

export interface IDestination extends Document {
  // Basic Info
  name: ILocalizedString;
  shortName?: ILocalizedString;
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

  // Publication of the landing page
  status: DestinationStatus;

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
    shortName: { type: OptionalLocalizedStringSchema },
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

    // === PUBLICATION ===
    // Draft until an editor publishes it, so a new destination has no public
    // page. See PUBLIC_DESTINATION_FILTER for what the status does and does
    // not control.
    status: { type: String, enum: [...DESTINATION_STATUSES], default: 'draft' },

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
DestinationSchema.plugin(duplicateInternalLinksPlugin);


/**
 * Destination content — read by the destination page through the shared
 * [slug] route, which now serves it from the Next Data Cache under the
 * `destinations` tag. Without this hook that cache would have no
 * invalidation path at all and an edit would wait out the full TTL.
 *
 * Mutation paths the admin controller actually uses:
 *   create   Destination.create()  -> save       (document)
 *   edit     doc.save()            -> save       (document)
 *   delete   doc.deleteOne()       -> deleteOne  (DOCUMENT)
 *
 * `deleteOne` is registered for document middleware explicitly: in Mongoose 8
 * a bare post('deleteOne') is QUERY middleware only and would never fire for
 * the `doc.deleteOne()` the delete endpoint calls. The query variant is
 * registered too for direct Model.deleteOne() callers, and findOneAndUpdate/
 * updateOne/updateMany are covered because the sanitize hooks above already
 * anticipate those paths being used.
 *
 * Fire-and-forget: revalidateTags never throws and is never awaited, so an
 * admin save cannot fail because the front end is unreachable.
 */
const revalidateDestinationCaches = () => revalidateTags(['destinations', 'tours']);

DestinationSchema.post('save', revalidateDestinationCaches);
DestinationSchema.post('findOneAndUpdate', revalidateDestinationCaches);
DestinationSchema.post('findOneAndDelete', revalidateDestinationCaches);
DestinationSchema.post('updateOne', revalidateDestinationCaches);
DestinationSchema.post('updateMany', revalidateDestinationCaches);
DestinationSchema.post('deleteOne', { document: true, query: false }, revalidateDestinationCaches);
DestinationSchema.post('deleteOne', { document: false, query: true }, revalidateDestinationCaches);

export default mongoose.model<IDestination>('Destination', DestinationSchema);
