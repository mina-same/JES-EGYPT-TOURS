import mongoose, { Schema, Document, Types } from 'mongoose';
import { IFAQ, FAQSchema } from './shared/FaqSchema';
import { IImage, ImageSchema } from './shared/ImageSchema';
import {
  ILocalizedString,
  ILocalizedMixed,
  LocalizedStringSchema,
  OptionalLocalizedStringSchema,
  LocalizedMixedSchema,
  OptionalLocalizedMixedSchema,
} from './shared/LocalizedSchema';

// ==================== INTERFACES ====================

// Re-export IImage for convenience
export { IImage };

export interface IDescription {
  header?: ILocalizedString;
  text?: ILocalizedMixed; // Localized Mixed content
}

export interface INote {
  title: ILocalizedString;
  text: ILocalizedMixed;
}

export interface ICurrencyPrice {
  USD: number;
  EUR?: number;
  GBP?: number;
}

export interface IPrices {
  solo?: ICurrencyPrice;
  pax_2_4?: ICurrencyPrice;
  pax_5_8?: ICurrencyPrice;
  pax_9_16?: ICurrencyPrice;
}

export interface ISeason {
  seasonName: string;
  startDate: Date;
  endDate: Date;
  prices: IPrices;
  notes?: INote[];
}

export interface IPricingPlan {
  planName: string;
  seasons: ISeason[];
  notes?: INote[];
}

export interface IActivity {
  heading: ILocalizedString;
  description: ILocalizedMixed;
  image?: IImage;
}

export interface IItineraryDay {
  day: number;
  title: ILocalizedString;
  activities: IActivity[];
}

export interface IItinerary {
  generalDescription?: ILocalizedMixed;
  days: IItineraryDay[];
}

export interface IBlogReference {
  id: string;
  title: ILocalizedString;
}

export interface IRelatedTour {
  id: string;
  title: ILocalizedString;
}

export interface IReview {
  type: 'youtube' | 'text' | 'video';
  url?: string;
  title: ILocalizedString;
  content?: ILocalizedMixed;
}

export interface IGeoCoordinates {
  '@type': string;
  latitude: string;
  longitude: string;
}

export interface IPostalAddress {
  '@type': string;
  addressLocality: string;
  addressCountry: string;
}

export interface ITouristAttraction {
  '@type': string;
  position: number;
  name: string;
  description: any; // HTML content (Schema.Types.Mixed)
  geo: IGeoCoordinates;
  address: IPostalAddress;
}

export interface IMapSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  itemListOrder: string;
  itemListElement: ITouristAttraction[];
}



export interface ISEO {
  metaTitle?: ILocalizedString;
  metaDescription?: ILocalizedString;
  metaKeywords?: ILocalizedMixed;
  metaImage?: IImage;
  /**
   * Open Graph overrides, stored per language exactly as written. A language
   * left blank is resolved at render time against that language's own meta
   * field, so these are never back-filled here.
   */
  ogTitle?: ILocalizedString;
  ogDescription?: ILocalizedString;
  /** Plain URL fallback used when no metaImage subdocument is set. */
  ogImage?: string;
  mapSchema?: IMapSchema;
}

export interface ITour extends Document {
  name: string;
  subcategory: Types.ObjectId;
  idExternal?: string;
  heading?: ILocalizedString;
  headingDescription?: ILocalizedMixed;
  /**
   * Short teaser shown on the tour CARD only (two clamped lines). Kept separate
   * from `Description.text` so the listing copy can be written to sell the
   * click, independently of the long intro on the tour page.
   */
  cardDescription?: ILocalizedString;
  slug: ILocalizedString;
  Description?: IDescription;
  images: IImage[];
  gallery?: IImage[];
  tourLocation?: ILocalizedString;
  tourAvailability?: ILocalizedString;
  pickupAndDropOff?: ILocalizedString;
  tourType?: ILocalizedString;
  tourStyle?: ILocalizedString;
  tourHighlights?: ILocalizedMixed;
  inclusion?: ILocalizedMixed;
  exclusion?: ILocalizedMixed;
  pricingPlans: IPricingPlan[];
  priceStartingFrom?: ICurrencyPrice;
  duration?: ILocalizedString;
  meetingPoint?: ILocalizedString;
  cancellationPolicy?: ILocalizedString;
  tags?: ILocalizedMixed[];
  notes?: INote[];
  whatToPack?: ILocalizedMixed;
  tourMapIframe?: string;
  mapSchema?: IMapSchema;
  whatYouWillLoveHtml?: ILocalizedMixed;
  itinerary?: IItinerary;
  faqs?: IFAQ[];
  blogReferences?: IBlogReference[];
  relatedTours?: IRelatedTour[];
  reviews?: IReview[];
  seo?: ISEO;
  isActive: boolean;
  scheduledAt?: Date;
  publishedAt?: Date;
  isFeatured: boolean;
  isSpecialOffer: boolean;
  specialOfferDiscount: number;
  editVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== SCHEMAS ====================
// ImageSchema is imported from shared/ImageSchema.ts

const DescriptionSchema = new Schema<IDescription>(
  {
    header: {
      type: OptionalLocalizedStringSchema,
    },
    text: {
      type: OptionalLocalizedMixedSchema,
    },
  },
  { _id: false }
);

const NoteSchema = new Schema<INote>(
  {
    title: {
      type: LocalizedStringSchema,
      required: [true, 'Note title is required'],
    },
    text: {
      type: LocalizedMixedSchema,
      required: [true, 'Note text is required'],
    },
  },
  { _id: false }
);

const CurrencyPriceSchema = new Schema<ICurrencyPrice>(
  {
    USD: {
      type: Number,
      required: [true, 'USD price is required'],
      min: [0, 'Price cannot be negative'],
    },
    EUR: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
    GBP: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
  },
  { _id: false }
);

const PricesSchema = new Schema<IPrices>(
  {
    solo: {
      type: CurrencyPriceSchema,
    },
    pax_2_4: {
      type: CurrencyPriceSchema,
    },
    pax_5_8: {
      type: CurrencyPriceSchema,
    },
    pax_9_16: {
      type: CurrencyPriceSchema,
    },
  },
  { _id: false }
);

const SeasonSchema = new Schema<ISeason>(
  {
    seasonName: {
      type: String,
      required: [true, 'Season name is required'],
      trim: true,
      enum: {
        values: [
          '1 May 2026 – 31 August 2026',
          '1 September 2026 – 19 December 2026 / 6 January 2027 – 24 March 2027',
          '20 December 2026 – 5 January 2027 / 25 March 2027 – 15 April 2027'
        ],
        message: '{VALUE} is not a valid season name'
      }
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    prices: {
      type: PricesSchema,
      required: [true, 'Prices are required'],
    },
    notes: [NoteSchema],
  },
  { _id: false }
);

const PricingPlanSchema = new Schema<IPricingPlan>(
  {
    planName: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
      enum: {
        values: ['AFFORDABLE', 'GOLD (5 STAR STANDARD)', 'DIAMOND (5 STAR LUXURY)', 'TOUR PRICES'],
        message: '{VALUE} is not a valid plan name',
      },
    },
    seasons: {
      type: [SeasonSchema],
      required: [true, 'At least one season is required'],
      validate: {
        validator: function (seasons: ISeason[]) {
          return seasons.length > 0;
        },
        message: 'At least one season must be provided',
      },
    },
    notes: { type: [NoteSchema], default: [] },
  },
  { _id: false }
);

const ActivitySchema = new Schema<IActivity>(
  {
    heading: {
      type: LocalizedStringSchema,
      required: [true, 'Activity heading is required'],
    },
    description: {
      type: LocalizedMixedSchema,
      required: [true, 'Activity description is required'],
    },
    image: ImageSchema,
  },
  { _id: false }
);

const ItineraryDaySchema = new Schema<IItineraryDay>(
  {
    day: {
      type: Number,
      required: [true, 'Day number is required'],
      min: [1, 'Day number must be at least 1'],
    },
    title: {
      type: LocalizedStringSchema,
      required: [true, 'Day title is required'],
    },
    // Descriptive content belongs to each activity. Keeping a second description
    // on the day made the API require a field that the admin form retired.
    activities: {
      type: [ActivitySchema],
      default: [],
    },
  },
  { _id: false }
);

const ItinerarySchema = new Schema<IItinerary>(
  {
    generalDescription: {
      type: OptionalLocalizedMixedSchema,
    },
    days: {
      type: [ItineraryDaySchema],
      default: [],
    },
  },
  { _id: false }
);

const BlogReferenceSchema = new Schema<IBlogReference>(
  {
    id: {
      type: String,
      required: [true, 'Blog reference ID is required'],
      trim: true,
    },
    title: {
      type: LocalizedStringSchema,
      required: [true, 'Blog reference title is required'],
    },
  },
  { _id: false }
);

const RelatedTourSchema = new Schema<IRelatedTour>(
  {
    id: {
      type: String,
      required: [true, 'Related tour ID is required'],
      trim: true,
    },
    title: {
      type: LocalizedStringSchema,
      required: [true, 'Related tour title is required'],
    },
  },
  { _id: false }
);

const ReviewSchema = new Schema<IReview>(
  {
    type: {
      type: String,
      required: [true, 'Review type is required'],
      enum: {
        values: ['youtube', 'text', 'video'],
        message: '{VALUE} is not a valid review type',
      },
    },
    url: {
      type: String,
      trim: true,
    },
    title: {
      type: LocalizedStringSchema,
      required: [true, 'Review title is required'],
    },
    content: {
      type: OptionalLocalizedMixedSchema,
    },
  },
  { _id: false }
);

const GeoCoordinatesSchema = new Schema<IGeoCoordinates>(
  {
    '@type': {
      type: String,
      default: 'GeoCoordinates',
    },
    latitude: {
      type: String,
      required: true,
    },
    longitude: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const PostalAddressSchema = new Schema<IPostalAddress>(
  {
    '@type': {
      type: String,
      default: 'PostalAddress',
    },
    addressLocality: {
      type: String,
      required: true,
    },
    addressCountry: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const TouristAttractionSchema = new Schema<ITouristAttraction>(
  {
    '@type': {
      type: String,
      default: 'TouristAttraction',
    },
    position: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: Schema.Types.Mixed,
      required: true,
      // HTML content - can be string or structured HTML
    },
    geo: {
      type: GeoCoordinatesSchema,
      required: true,
    },
    address: {
      type: PostalAddressSchema,
      required: true,
    },
  },
  { _id: false }
);

const MapSchemaSchema = new Schema<IMapSchema>(
  {
    '@context': {
      type: String,
      default: 'https://schema.org',
    },
    '@type': {
      type: String,
      default: 'ItemList',
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    itemListOrder: {
      type: String,
      default: 'Sequential',
    },
    itemListElement: {
      type: [TouristAttractionSchema],
      default: [],
    },
  },
  { _id: false }
);

const SEOSchema = new Schema<ISEO>(
  {
    metaTitle: {
      type: OptionalLocalizedStringSchema,
    },
    metaDescription: {
      type: OptionalLocalizedStringSchema,
    },
    metaKeywords: {
      type: OptionalLocalizedMixedSchema,
    },
    metaImage: ImageSchema,
    ogTitle: {
      type: OptionalLocalizedStringSchema,
    },
    ogDescription: {
      type: OptionalLocalizedStringSchema,
    },
    ogImage: {
      type: String,
      trim: true,
    },
    mapSchema: MapSchemaSchema,
  },
  { _id: false }
);

// FAQSchema is imported from shared/FaqSchema.ts

const TourSchema = new Schema<ITour>(
  {
    name: {
      type: String,
      required: [true, 'System name is required'],
      trim: true,
    },
    subcategory: {
      type: Schema.Types.ObjectId,
      ref: 'TourSubcategory',
      required: [true, 'Subcategory is required'],
      index: true,
    },
    idExternal: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    heading: {
      type: OptionalLocalizedStringSchema,
    },
    headingDescription: {
      type: OptionalLocalizedMixedSchema,
    },
    // Plain text (no rich text): it renders as two clamped lines on the card.
    cardDescription: {
      type: OptionalLocalizedStringSchema,
    },
    slug: {
      type: LocalizedStringSchema,
      required: [true, 'Slug is required'],
    },
    Description: {
      type: DescriptionSchema,
    },
    images: {
      type: [ImageSchema],
      required: [true, 'At least one image is required'],
      validate: {
        validator: function (images: IImage[]) {
          return images.length > 0;
        },
        message: 'At least one image must be provided',
      },
    },
    gallery: {
      type: [ImageSchema],
      default: [],
    },
    tourLocation: {
      type: OptionalLocalizedStringSchema,
    },
    tourAvailability: {
      type: OptionalLocalizedStringSchema,
    },
    pickupAndDropOff: {
      type: OptionalLocalizedStringSchema,
    },
    tourType: {
      type: OptionalLocalizedStringSchema,
    },
    tourStyle: {
      type: OptionalLocalizedStringSchema,
    },
    tourHighlights: {
      type: OptionalLocalizedMixedSchema,
    },
    inclusion: {
      type: OptionalLocalizedMixedSchema,
    },
    exclusion: {
      type: OptionalLocalizedMixedSchema,
    },
    pricingPlans: {
      type: [PricingPlanSchema],
      default: [],
    },
    priceStartingFrom: {
      type: CurrencyPriceSchema,
    },
    duration: {
      type: OptionalLocalizedStringSchema,
    },
    meetingPoint: {
      type: OptionalLocalizedStringSchema,
    },
    cancellationPolicy: {
      type: OptionalLocalizedStringSchema,
    },
    tags: {
      type: [LocalizedMixedSchema],
      default: [],
    },
    notes: [NoteSchema],
    whatToPack: {
      type: OptionalLocalizedMixedSchema,
    },
    tourMapIframe: {
      type: String,
      trim: true,
    },
    mapSchema: MapSchemaSchema,
    whatYouWillLoveHtml: {
      type: OptionalLocalizedMixedSchema,
    },
    itinerary: ItinerarySchema,
    faqs: [FAQSchema],
    blogReferences: [BlogReferenceSchema],
    relatedTours: [RelatedTourSchema],
    reviews: [ReviewSchema],
    seo: SEOSchema,
    isActive: {
      type: Boolean,
      default: true,
    },
    scheduledAt: {
      type: Date,
      validate: {
        validator: (value?: Date) => !value || value.getTime() > Date.now(),
        message: 'Scheduled date must be in the future',
      },
    },
    publishedAt: {
      type: Date,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isSpecialOffer: {
      type: Boolean,
      default: false,
    },
    specialOfferDiscount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100'],
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

// Localized slug indexes
TourSchema.index({ 'slug.en': 1 }, { unique: true, sparse: true });
TourSchema.index({ 'slug.de': 1 }, { unique: true, sparse: true });
TourSchema.index({ 'slug.it': 1 }, { unique: true, sparse: true });
TourSchema.index({ 'slug.es': 1 }, { unique: true, sparse: true });

// Note: idExternal already indexed via unique: true
// Note: subcategory already indexed via index: true in field definition
TourSchema.index({ isActive: 1 });
TourSchema.index({ isActive: 1, scheduledAt: 1 });
TourSchema.index({ isFeatured: 1 });
TourSchema.index({ isSpecialOffer: 1 });
TourSchema.index({ createdAt: -1 });
TourSchema.index({ heading: 'text', 'Description.text': 'text' });

// Compound indexes for common queries
TourSchema.index({ subcategory: 1, isActive: 1 });
TourSchema.index({ isActive: 1, isFeatured: 1 });

// ==================== VIRTUALS ====================

// Virtual to populate subcategory details
TourSchema.virtual('subcategoryDetails', {
  ref: 'TourSubcategory',
  localField: 'subcategory',
  foreignField: '_id',
  justOne: true,
});

// ==================== SEO COMPLETION ====================

/** Mongoose subdocuments don't spread into plain data — `{...subdoc}` yields the
 *  internal `$__`/`_doc` machinery instead of the fields. */
const toPlain = (value: any): any =>
  value && typeof value.toObject === 'function' ? value.toObject() : value;

export interface TourSeoSource {
  seo?: ISEO | null;
  heading?: ILocalizedString;
  name?: string;
  Description?: IDescription;
  mapSchema?: IMapSchema;
}

/** True when a localized string has no actual text in ANY language — the admin
 *  form ships `{ en: '', de: '', it: '', es: '' }` rather than omitting a field. */
const isLocalizedBlank = (value: any): boolean =>
  !value ||
  typeof value !== 'object' ||
  !Object.values(value).some((entry) => typeof entry === 'string' && entry.trim());

/**
 * Fills every SEO field the admin form is allowed to leave blank.
 *
 * Exported on purpose: `pre('save')` runs on create only, because tour updates
 * go through `findByIdAndUpdate`, which skips document middleware entirely. The
 * update path in tourController calls this with the same inputs so an edited
 * tour ends up with exactly the SEO a freshly created one would have.
 */
export const completeTourSeo = (source: TourSeoSource): ISEO => {
  const seo: any = { ...(toPlain(source.seo) || {}) };
  const heading: any = toPlain(source.heading) || undefined;
  const descriptionText: any = toPlain(toPlain(source.Description)?.text) || undefined;

  // Auto-populate metaTitle from the optional heading, then the required
  // internal system name when no public heading was supplied.
  if (!seo.metaTitle || !seo.metaTitle.en) {
    const fallbackTitle = heading?.en || source.name;
    if (fallbackTitle) {
      seo.metaTitle = {
        en: fallbackTitle,
        de: heading?.de,
        it: heading?.it,
        es: heading?.es,
      };
    }
  }

  if (!seo.metaDescription?.en && descriptionText?.en) {
    seo.metaDescription = {
      en: descriptionText.en,
      de: descriptionText.de,
      it: descriptionText.it,
      es: descriptionText.es,
    };
  }

  // metaImage stays an explicit OVERRIDE — it is deliberately NOT seeded from
  // images[0]. Copying the first photo in here used to leave a frozen duplicate
  // that kept pointing at the old picture after the gallery changed; the tour
  // page falls back to the CURRENT first image instead, so an empty value is
  // both correct and clearable.
  seo.metaImage = toPlain(seo.metaImage);

  if (seo.metaImage?.url) {
    // ImageSchema requires fileName, but the admin's "Image URL" box only ever
    // sets `url` — a pasted link would fail validation without this.
    if (!String(seo.metaImage.fileName || '').trim()) {
      const urlParts = String(seo.metaImage.url).split('/');
      seo.metaImage.fileName = urlParts[urlParts.length - 1] || 'meta-image.jpg';
    }
    // An untouched alt arrives as four empty strings, so blankness — not
    // absence — is what decides whether the meta title stands in for it.
    if (isLocalizedBlank(seo.metaImage.alt) && !isLocalizedBlank(seo.metaTitle)) {
      seo.metaImage.alt = { ...seo.metaTitle };
    }
  } else {
    delete seo.metaImage;
  }

  // The OG fields are stored EXACTLY as written and are never back-filled from
  // the meta fields. Copying the meta text in would freeze it: a later edit to
  // the meta title would leave the social card showing the old wording forever.
  // generateMetadata does the fallback per language at render time instead, so
  // a language the editor left blank always tracks its current meta value.
  if (isLocalizedBlank(seo.ogTitle)) delete seo.ogTitle;
  if (isLocalizedBlank(seo.ogDescription)) delete seo.ogDescription;
  // Blank for the same reason as metaImage: the page resolves
  // metaImage -> ogImage -> images[0] at render time, against the current gallery.
  if (!String(seo.ogImage || '').trim()) {
    delete seo.ogImage;
  }

  // Auto-populate mapSchema from root level if SEO doesn't have it
  if (!seo.mapSchema && source.mapSchema) {
    seo.mapSchema = toPlain(source.mapSchema);
  }

  return seo;
};

// ==================== MIDDLEWARE ====================

// Pre-save: Auto-populate SEO fields
TourSchema.pre<ITour>('save', function (next) {
  this.seo = completeTourSeo({
    seo: this.seo,
    heading: this.heading,
    name: this.name,
    Description: this.Description,
    mapSchema: this.mapSchema,
  });

  next();
});

// Pre-save: Validate subcategory exists
TourSchema.pre<ITour>('save', async function (next) {
  if (this.isModified('subcategory')) {
    const TourSubcategory = mongoose.model('TourSubcategory');
    const subcategoryExists = await TourSubcategory.findById(this.subcategory);

    if (!subcategoryExists) {
      throw new Error('Invalid subcategory reference');
    }
  }

  next();
});

// Pre-save: Validate season date ranges
TourSchema.pre<ITour>('save', function (next) {
  if (this.pricingPlans && this.pricingPlans.length > 0) {
    for (const plan of this.pricingPlans) {
      for (const season of plan.seasons) {
        if (season.startDate && season.endDate && season.startDate >= season.endDate) {
          throw new Error(
            `Invalid date range in season "${season.seasonName}": start date must be before end date`
          );
        }
      }
    }
  }

  next();
});

// ==================== EXPORT ====================

export default mongoose.model<ITour>('Tour', TourSchema);
