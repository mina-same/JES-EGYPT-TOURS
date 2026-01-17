// ==================== SHARED INTERFACES ====================

export interface IImage {
  url: string;
  fileName: string;
  title?: string;
  alt?: string;
}

export interface ISEO {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  metaImage?: IImage;
  mapSchema?: any;
}

// ==================== TOUR CATEGORY ====================

export interface ITourCategory {
  _id: string;
  name: string;
  slug: string;
  description?: any; // HTML content
  image?: IImage;
  seo?: ISEO;
  isActive: boolean;
  subcategoriesCount?: number; // Virtual field
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ==================== TOUR SUBCATEGORY ====================

export interface ITourSubcategory {
  _id: string;
  category: string; // ObjectId as string
  name: string;
  slug: string;
  description?: any; // HTML content
  image?: IImage;
  seo?: ISEO;
  isActive: boolean;
  toursCount?: number; // Virtual field
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ==================== TOUR ====================

export interface ITour {
  _id: string;
  name: string;
  slug: string;
  description?: any; // HTML content
  subcategory: string | ITourSubcategory; // Can be populated or just ID
  heading?: string;
  images?: IImage[];
  price?: number;
  priceStartingFrom?: number;
  duration?: string;
  location?: string;
  tourType?: string;
  tourStyle?: string;
  isFeatured: boolean;
  isActive: boolean;
  seo?: ISEO;
  externalId?: string;
  viewCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ==================== FORM DATA TYPES ====================

export interface TourCategoryFormData {
  name: string;
  slug: string;
  description?: any;
  image?: IImage;
  seo?: ISEO;
  isActive: boolean;
}

export interface TourSubcategoryFormData {
  category: string;
  name: string;
  slug: string;
  description?: any;
  image?: IImage;
  seo?: ISEO;
  isActive: boolean;
}

// Pricing interfaces
export interface IPricingNote {
  title: string;
  text: any; // HTML content to match backend
}

export interface IPricingSeason {
  seasonName: string;
  startDate: string | Date; // Support both string (form input) and Date (backend)
  endDate: string | Date; // Support both string (form input) and Date (backend)
  prices: {
    solo: number;
    pax_2_4: number;
    pax_5_8: number;
    pax_9_16: number;
  };
  notes: IPricingNote[];
}

export interface IPricingPlan {
  planName: string;
  seasons: IPricingSeason[];
}

export interface IItineraryActivity {
  name: string;
  heading: string;
  description: string;
  image?: IImage;
}

export interface IItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: IItineraryActivity[];
}

export interface IItinerary {
  generalDescription: string;
  days: IItineraryDay[];
}

export interface IFAQ {
  question: string;
  answer: any; // HTML content
}

export interface ITourDescription {
  header: string;
  text: string;
}

export interface TourFormData {
  name: string;
  slug: string;
  description?: ITourDescription;
  subcategory: string;
  images?: IImage[];
  gallery?: IImage[];
  idExternal?: string;
  heading?: string;
  tourLocation?: string;
  tourAvailability?: string;
  pickupAndDropOff?: string;
  tourType?: string;
  tourStyle?: string;
  isFeatured: boolean;
  isActive: boolean;
  seo?: ISEO;
  // Comprehensive tour details
  tourHighlights?: string[];
  inclusion?: string[];
  exclusion?: string[];
  pricingPlans?: IPricingPlan[];
  notes?: IPricingNote[];
  whatToPack?: string[];
  tourMapIframe?: string;
  mapSchema?: any;
  whatYouWillLoveHtml?: string;
  itinerary?: IItinerary;
  faqs?: IFAQ[];
  blogReferences?: { id: string; title: string }[];
  relatedTours?: { id: string; title: string }[];
  reviews?: { type: string; url: string; title: string }[];
  // Additional tour details
  priceStartingFrom?: number;
  duration?: string;
  meetingPoint?: string;
  cancellationPolicy?: string;
  tags?: string[];
}
