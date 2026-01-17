import mongoose, { Schema, Document, Types } from 'mongoose';
import { IImage, ImageSchema } from './shared/ImageSchema';

// ==================== INTERFACES ====================

// Re-export IImage for convenience
export { IImage };

export interface IDescription {
  header: string;
  text: any; // HTML content (Schema.Types.Mixed)
}

export interface INote {
  title: string;
  text: any; // HTML content (Schema.Types.Mixed)
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
  heading: string;
  description: any; // HTML content (Schema.Types.Mixed)
  image?: IImage;
}

export interface IItineraryDay {
  day: number;
  title: string;
  description: any; // HTML content (Schema.Types.Mixed)
  activities: IActivity[];
}

export interface IItinerary {
  generalDescription?: any; // HTML content (Schema.Types.Mixed)
  days: IItineraryDay[];
}

export interface IBlogReference {
  id: string;
  title: string;
}

export interface IRelatedTour {
  id: string;
  title: string;
}

export interface IReview {
  type: 'youtube' | 'text' | 'video';
  url?: string;
  title: string;
  content?: any; // HTML content (Schema.Types.Mixed)
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

export interface IFAQ {
  question: string;
  answer: any; // HTML content (Schema.Types.Mixed)
}

export interface ISEO {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  metaImage?: IImage;
  mapSchema?: IMapSchema;
}

export interface ITour extends Document {
  subcategory: Types.ObjectId;
  idExternal?: string;
  heading: string;
  slug: string;
  Description: IDescription;
  images: IImage[];
  gallery?: IImage[];
  tourLocation?: string;
  tourAvailability?: string;
  pickupAndDropOff?: string;
  tourType?: string;
  tourStyle?: string;
  tourHighlights?: string[];
  inclusion?: string[];
  exclusion?: string[];
  pricingPlans: IPricingPlan[];
  priceStartingFrom?: number;
  duration?: string;
  meetingPoint?: string;
  cancellationPolicy?: string;
  tags?: string[];
  notes?: INote[];
  whatToPack?: string[];
  tourMapIframe?: string;
  mapSchema?: IMapSchema;
  whatYouWillLoveHtml?: string;
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
      type: String,
      required: [true, 'Description header is required'],
      trim: true,
      maxlength: [200, 'Description header should not exceed 200 characters'],
    },
    text: {
      type: Schema.Types.Mixed,
      required: [true, 'Description text is required'],
      // HTML content - can be string or structured HTML
    },
  },
  { _id: false }
);

const NoteSchema = new Schema<INote>(
  {
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
    },
    text: {
      type: Schema.Types.Mixed,
      required: [true, 'Note text is required'],
      // HTML content - can be string or structured HTML
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
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
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
      type: String,
      required: [true, 'Activity heading is required'],
      trim: true,
    },
    description: {
      type: Schema.Types.Mixed,
      required: [true, 'Activity description is required'],
      // HTML content - can be string or structured HTML
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
      type: String,
      required: [true, 'Day title is required'],
      trim: true,
    },
    description: {
      type: Schema.Types.Mixed,
      required: [true, 'Day description is required'],
      // HTML content - can be string or structured HTML
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
      type: Schema.Types.Mixed,
      // HTML content - can be string or structured HTML
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
      type: String,
      required: [true, 'Blog reference title is required'],
      trim: true,
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
      type: String,
      required: [true, 'Related tour title is required'],
      trim: true,
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
      type: String,
      required: [true, 'Review title is required'],
      trim: true,
    },
    content: {
      type: Schema.Types.Mixed,
      // HTML content - can be string or structured HTML
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
    metaImage: ImageSchema,
    mapSchema: MapSchemaSchema,
  },
  { _id: false }
);

const FAQSchema = new Schema<IFAQ>(
  {
    question: {
      type: String,
      required: [true, 'FAQ question is required'],
      trim: true,
    },
    answer: {
      type: Schema.Types.Mixed,
      required: [true, 'FAQ answer is required'],
      // HTML content - can be string or structured HTML
    },
  },
  { _id: false }
);

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
      type: String,
      required: [true, 'Tour heading is required'],
      trim: true,
      maxlength: [200, 'Heading should not exceed 200 characters'],
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
      type: String,
      trim: true,
    },
    tourAvailability: {
      type: String,
      trim: true,
    },
    pickupAndDropOff: {
      type: String,
      trim: true,
    },
    tourType: {
      type: String,
      trim: true,
    },
    tourStyle: {
      type: String,
      trim: true,
    },
    tourHighlights: [
      {
        type: String,
        trim: true,
      },
    ],
    inclusion: {
      type: [String],
      validate: {
        validator: function (v: string[]) {
          return v && v.length > 0;
        },
        message: 'At least one inclusion is required',
      },
    },
    exclusion: {
      type: [String],
      validate: {
        validator: function (v: string[]) {
          return v && v.length > 0;
        },
        message: 'At least one exclusion is required',
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
      type: String,
      trim: true,
    },
    meetingPoint: {
      type: String,
      trim: true,
    },
    cancellationPolicy: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    notes: [NoteSchema],
    whatToPack: [
      {
        type: String,
        trim: true,
      },
    ],
    tourMapIframe: {
      type: String,
      trim: true,
    },
    mapSchema: MapSchemaSchema,
    whatYouWillLoveHtml: {
      type: String,
      trim: true,
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

// Note: slug and idExternal already indexed via unique: true
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
  if (!this.seo.metaTitle) {
    this.seo.metaTitle = this.heading;
  }

  // Auto-populate metaDescription from Description if not provided
  if (!this.seo.metaDescription && this.Description) {
    const maxLength = 160;
    const description = this.Description.text;
    this.seo.metaDescription =
      description.length > maxLength
        ? description.substring(0, maxLength - 3) + '...'
        : description;
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
        if (season.startDate >= season.endDate) {
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
