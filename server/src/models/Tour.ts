import mongoose, { Schema, Document, Types } from 'mongoose';
import { IFAQ, FAQSchema } from './shared/FaqSchema';
import { IImage, ImageSchema } from './shared/ImageSchema';
import { ILocalizedString, ILocalizedMixed, LocalizedStringSchema, LocalizedMixedSchema } from './shared/LocalizedSchema';

// ==================== INTERFACES ====================

// Re-export IImage for convenience
export { IImage };

export interface IDescription {
  header: ILocalizedString;
  text: ILocalizedMixed; // Localized Mixed content
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
  description: ILocalizedMixed;
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
  mapSchema?: IMapSchema;
}

export interface ITour extends Document {
  subcategory: Types.ObjectId;
  idExternal?: string;
  heading: ILocalizedString;
  headingDescription?: ILocalizedMixed;
  /**
   * Short teaser shown on the tour CARD only (two clamped lines). Kept separate
   * from `Description.text` so the listing copy can be written to sell the
   * click, independently of the long intro on the tour page.
   */
  cardDescription?: ILocalizedString;
  slug: ILocalizedString;
  Description: IDescription;
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
      type: LocalizedStringSchema,
      required: [true, 'Description header is required'],
    },
    text: {
      type: LocalizedMixedSchema,
      required: [true, 'Description text is required'],
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
    description: {
      type: LocalizedMixedSchema,
      required: [true, 'Day description is required'],
    },
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
      type: LocalizedMixedSchema,
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
      type: LocalizedMixedSchema,
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
      type: LocalizedStringSchema,
    },
    metaDescription: {
      type: LocalizedStringSchema,
    },
    metaKeywords: {
      type: LocalizedMixedSchema,
    },
    metaImage: ImageSchema,
    mapSchema: MapSchemaSchema,
  },
  { _id: false }
);

// FAQSchema is imported from shared/FaqSchema.ts

const TourSchema = new Schema<ITour>(
  {
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
      type: LocalizedStringSchema,
      required: [true, 'Tour heading is required'],
    },
    headingDescription: {
      type: LocalizedMixedSchema,
    },
    // Plain text (no rich text): it renders as two clamped lines on the card.
    cardDescription: {
      type: LocalizedStringSchema,
    },
    slug: {
      type: LocalizedStringSchema,
      required: [true, 'Slug is required'],
    },
    Description: {
      type: DescriptionSchema,
      required: [true, 'Description is required'],
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
      type: LocalizedStringSchema,
    },
    tourAvailability: {
      type: LocalizedStringSchema,
    },
    pickupAndDropOff: {
      type: LocalizedStringSchema,
    },
    tourType: {
      type: LocalizedStringSchema,
    },
    tourStyle: {
      type: LocalizedStringSchema,
    },
    tourHighlights: {
      type: LocalizedMixedSchema,
    },
    inclusion: {
      type: LocalizedMixedSchema,
    },
    exclusion: {
      type: LocalizedMixedSchema,
    },
    pricingPlans: {
      type: [PricingPlanSchema],
      required: [true, 'At least one pricing plan is required'],
      validate: {
        validator: function (plans: IPricingPlan[]) {
          return plans.length > 0;
        },
        message: 'At least one pricing plan must be provided',
      },
    },
    priceStartingFrom: {
      type: CurrencyPriceSchema,
    },
    duration: {
      type: LocalizedStringSchema,
    },
    meetingPoint: {
      type: LocalizedStringSchema,
    },
    cancellationPolicy: {
      type: LocalizedStringSchema,
    },
    tags: {
      type: [LocalizedMixedSchema],
      default: [],
    },
    notes: [NoteSchema],
    whatToPack: {
      type: LocalizedMixedSchema,
    },
    tourMapIframe: {
      type: String,
      trim: true,
    },
    mapSchema: MapSchemaSchema,
    whatYouWillLoveHtml: {
      type: LocalizedMixedSchema,
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

// ==================== MIDDLEWARE ====================

// Pre-save: Auto-populate SEO fields
TourSchema.pre<ITour>('save', function (next) {
  if (!this.seo) {
    this.seo = {};
  }

  // Auto-populate metaTitle from heading if not provided
  if (!this.seo.metaTitle || !this.seo.metaTitle.en) {
    this.seo.metaTitle = { 
      en: this.heading.en, 
      de: this.heading.de, 
      it: this.heading.it,
      es: this.heading.es
    };
  }

  if (!this.seo.metaDescription && this.Description && this.Description.text) {
    this.seo.metaDescription = {
      en: this.Description.text.en,
      de: this.Description.text.de,
      it: this.Description.text.it,
      es: this.Description.text.es,
    };
  }

  // Auto-populate metaImage from first image if not provided
  if (!this.seo.metaImage && this.images && this.images.length > 0) {
    this.seo.metaImage = this.images[0];
  }

  // Auto-populate mapSchema from root level if SEO doesn't have it
  if (!this.seo.mapSchema && this.mapSchema) {
    this.seo.mapSchema = this.mapSchema;
  }

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
