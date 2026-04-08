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

export interface IPrices {
  solo?: number;
  pax_2_4?: number;
  pax_5_8?: number;
  pax_9_16?: number;
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
  slug: ILocalizedString;
  Description: IDescription;
  images: IImage[];
  gallery?: IImage[];
  tourLocation?: ILocalizedString;
  tourAvailability?: ILocalizedString;
  pickupAndDropOff?: ILocalizedString;
  tourType?: ILocalizedString;
  tourStyle?: ILocalizedString;
  tourHighlights?: ILocalizedMixed[];
  inclusion?: ILocalizedMixed[];
  exclusion?: ILocalizedMixed[];
  pricingPlans: IPricingPlan[];
  priceStartingFrom?: number;
  duration?: ILocalizedString;
  meetingPoint?: ILocalizedString;
  cancellationPolicy?: ILocalizedString;
  tags?: ILocalizedMixed;
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
  isFeatured: boolean;
  viewCount: number;
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

const PricesSchema = new Schema<IPrices>(
  {
    solo: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
    pax_2_4: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
    pax_5_8: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
    pax_9_16: {
      type: Number,
      min: [0, 'Price cannot be negative'],
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
          'From Oct 2025 to Dec 2025',
          'From Jan 2026 to Mar 2026',
          'From 15 Apr 2026 to 30 Sep 2026',
          'Peak (20 Dec 2025 - 5 Jan 2026) / (25 Mar - 15 Apr 2026)',
          'All Year'
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
        values: ['AFFORDABLE', 'GOLD (5 STAR STANDARD)', 'DIAMOND (5 STAR LUXURY)'],
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
      type: [LocalizedMixedSchema],
      default: [],
    },
    inclusion: {
      type: [LocalizedMixedSchema],
      validate: {
        validator: function (v: any[]) {
          // Check if it's an array and has at least one item with an English version
          if (!v || !Array.isArray(v)) return false;
          return v.length > 0 && v.every(item => item.en);
        },
        message: 'At least one inclusion with an English version is required',
      },
    },
    exclusion: {
      type: [LocalizedMixedSchema],
      validate: {
        validator: function (v: any[]) {
          if (!v || !Array.isArray(v)) return false;
          return v.length > 0 && v.every(item => item.en);
        },
        message: 'At least one exclusion with an English version is required',
      },
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
      type: Number,
      min: [0, 'Price cannot be negative'],
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
      type: LocalizedMixedSchema,
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
    isFeatured: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: [0, 'View count cannot be negative'],
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
TourSchema.index({ isFeatured: 1 });
TourSchema.index({ viewCount: -1 });
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
      en: typeof this.Description.text.en === 'string' && this.Description.text.en.length > 160 
          ? this.Description.text.en.substring(0, 157) + '...' 
          : this.Description.text.en,
      de: typeof this.Description.text.de === 'string' && this.Description.text.de.length > 160 
          ? this.Description.text.de.substring(0, 157) + '...' 
          : this.Description.text.de,
      it: typeof this.Description.text.it === 'string' && this.Description.text.it.length > 160 
          ? this.Description.text.it.substring(0, 157) + '...' 
          : this.Description.text.it,
      es: typeof this.Description.text.es === 'string' && this.Description.text.es.length > 160 
          ? this.Description.text.es.substring(0, 157) + '...' 
          : this.Description.text.es,
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

// Method to increment view count
TourSchema.methods.incrementViewCount = async function () {
  this.viewCount += 1;
  return this.save();
};

// ==================== EXPORT ====================

export default mongoose.model<ITour>('Tour', TourSchema);
