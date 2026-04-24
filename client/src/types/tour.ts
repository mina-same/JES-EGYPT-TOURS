import { ILocalizedString, ILocalizedMixed, IImage } from './shared';
export type { ILocalizedString, ILocalizedMixed, IImage };

export interface ISEO {
  metaTitle?: ILocalizedString;
  metaDescription?: ILocalizedString;
  metaKeywords?: ILocalizedMixed;
  metaImage?: IImage;
  mapSchema?: any;
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

// ==================== TOUR CATEGORY ====================

export interface ITourCategory {
  _id: string;
  name: ILocalizedString;
  slug: ILocalizedString;
  description?: ILocalizedMixed; // Plain text or HTML for page header
  images: IImage[];
  gallery?: IImage[];
  seo?: ISEO;
  sectionHeader?: ISectionHeader;
  subcategorySectionTitle?: ILocalizedString;
  toursSectionTitle?: ILocalizedString;
  toursSectionSubTitle?: ILocalizedString;
  gallerySectionTitle?: ILocalizedString;
  blogsSectionTitle?: ILocalizedString;
  faqsSectionTitle?: ILocalizedString;
  reviewsSectionTitle?: ILocalizedString;
  faqs?: IFAQ[];
  reviews?: ICuratedReview[];
  featuredBlogs?: string[];
  bottomSection?: ISectionHeader;
  isActive: boolean;
  subcategoriesCount?: number; // Virtual field
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ==================== TOUR SUBCATEGORY ====================

export interface ITourSubcategory {
  _id: string;
  category: string; // ObjectId as string
  name: ILocalizedString;
  slug: ILocalizedString;
  description?: ILocalizedMixed; // Plain text or HTML for page header
  images: IImage[];
  gallery?: IImage[];
  seo?: ISEO;
  sectionHeader?: ISectionHeader;
  subcategorySectionTitle?: ILocalizedString;
  toursSectionTitle?: ILocalizedString;
  toursSectionSubTitle?: ILocalizedString;
  gallerySectionTitle?: ILocalizedString;
  blogsSectionTitle?: ILocalizedString;
  faqsSectionTitle?: ILocalizedString;
  reviewsSectionTitle?: ILocalizedString;
  faqs?: IFAQ[];
  reviews?: ICuratedReview[];
  featuredBlogs?: string[];
  bottomSection?: ISectionHeader;
  isActive: boolean;
  toursCount?: number; // Virtual field
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ==================== TOUR ====================

export interface ITour {
  _id: string;
  name: string;
  slug: ILocalizedString;
  Description?: ITourDescription;
  subcategory: string | ITourSubcategory; // Can be populated or just ID
  heading: ILocalizedString;
  headingDescription?: ILocalizedMixed;
  images: IImage[];
  gallery?: IImage[];
  price?: number;
  priceStartingFrom?: ICurrencyPrice;
  duration?: ILocalizedString;
  tourLocation?: ILocalizedString;
  tourAvailability?: ILocalizedString;
  pickupAndDropOff?: ILocalizedString;
  tourType?: ILocalizedString;
  tourStyle?: ILocalizedString;
  isFeatured: boolean;
  isActive: boolean;
  seo?: ISEO;
  idExternal?: string;
  viewCount?: number;
  reviewsCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ==================== FORM DATA TYPES ====================

export interface TourCategoryFormData {
  name: ILocalizedString;
  slug: ILocalizedString;
  description?: ILocalizedMixed;
  images: IImage[];
  gallery?: IImage[];
  seo?: ISEO;
  sectionHeader?: ISectionHeader;
  subcategorySectionTitle?: ILocalizedString;
  toursSectionTitle?: ILocalizedString;
  toursSectionSubTitle?: ILocalizedString;
  gallerySectionTitle?: ILocalizedString;
  blogsSectionTitle?: ILocalizedString;
  faqsSectionTitle?: ILocalizedString;
  reviewsSectionTitle?: ILocalizedString;
  faqs?: IFAQ[];
  reviews?: ICuratedReview[];
  featuredBlogs?: string[];
  bottomSection?: ISectionHeader;
  isActive: boolean;
}

export interface TourSubcategoryFormData {
  category: string;
  name: ILocalizedString;
  slug: ILocalizedString;
  description?: ILocalizedMixed;
  images: IImage[];
  gallery?: IImage[];
  seo?: ISEO;
  sectionHeader?: ISectionHeader;
  subcategorySectionTitle?: ILocalizedString;
  toursSectionTitle?: ILocalizedString;
  toursSectionSubTitle?: ILocalizedString;
  gallerySectionTitle?: ILocalizedString;
  blogsSectionTitle?: ILocalizedString;
  faqsSectionTitle?: ILocalizedString;
  reviewsSectionTitle?: ILocalizedString;
  faqs?: IFAQ[];
  reviews?: ICuratedReview[];
  featuredBlogs?: string[];
  bottomSection?: ISectionHeader;
  isActive: boolean;
}

export interface ICurrencyPrice {
  USD: number;
  EUR?: number;
  GBP?: number;
}

// Pricing interfaces
export interface IPricingNote {
  title: ILocalizedString;
  text: ILocalizedMixed;
}

export interface IPricingSeason {
  seasonName: string;
  startDate?: string | Date; // Optional: start date of season
  endDate?: string | Date; // Optional: end date of season
  prices: {
    solo: ICurrencyPrice;
    pax_2_4: ICurrencyPrice;
    pax_5_8: ICurrencyPrice;
    pax_9_16: ICurrencyPrice;
  };
  notes: IPricingNote[];
}

export interface IPricingPlan {
  planName: string;
  seasons: IPricingSeason[];
  notes?: IPricingNote[];
}

export interface IItineraryActivity {
  name: string;
  heading: ILocalizedString;
  description: ILocalizedMixed;
  image?: IImage;
}

export interface IItineraryDay {
  day: number;
  title: ILocalizedString;
  description: ILocalizedMixed;
  activities: IItineraryActivity[];
}

export interface IItinerary {
  generalDescription: ILocalizedMixed;
  days: IItineraryDay[];
}

export interface IFAQ {
  question: ILocalizedString;
  answer: ILocalizedMixed;
  isActive?: boolean;
  order?: number;
}

export interface ICuratedReview {
  name: ILocalizedString;
  avatar?: string;
  rating: number;
  comment: ILocalizedString;
  status?: string;
}

export interface ITourDescription {
  header: ILocalizedString;
  text: ILocalizedMixed;
}

export interface TourFormData {
  name: string;
  slug: ILocalizedString;
  description?: ITourDescription;
  subcategory: string;
  images?: IImage[];
  gallery?: IImage[];
  idExternal?: string;
  heading?: ILocalizedString;
  headingDescription?: ILocalizedMixed;
  tourLocation?: ILocalizedString;
  tourAvailability?: ILocalizedString;
  pickupAndDropOff?: ILocalizedString;
  tourType?: ILocalizedString;
  tourStyle?: ILocalizedString;
  isFeatured: boolean;
  isActive: boolean;
  seo?: ISEO;
  // Comprehensive tour details
  tourHighlights?: ILocalizedMixed;
  inclusion?: ILocalizedMixed;
  exclusion?: ILocalizedMixed;
  pricingPlans?: IPricingPlan[];
  notes?: IPricingNote[];
  whatToPack?: ILocalizedMixed;
  tourMapIframe?: string;
  mapSchema?: any;
  whatYouWillLoveHtml?: ILocalizedMixed;
  itinerary?: IItinerary;
  faqs?: IFAQ[];
  blogReferences?: { id: string; title: string }[];
  relatedTours?: { id: string; title: string }[];
  reviews?: { type: string; url?: string; title: ILocalizedString; content?: ILocalizedMixed }[];
  reviewsCount?: number;
  // Additional tour details
  priceStartingFrom?: ICurrencyPrice;
  duration?: ILocalizedString;
  meetingPoint?: ILocalizedString;
  cancellationPolicy?: ILocalizedString;
  tags?: ILocalizedMixed;
}