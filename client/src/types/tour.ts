import type { ILocalizedString, ILocalizedMixed, IImage } from './shared';
export type { ILocalizedString, ILocalizedMixed, IImage };

// FAQ-specific localized type — all locales are optional so each language
// can have its own independent set of FAQs without requiring English.
export interface IFAQLocalizedString {
  en?: string;
  de?: string;
  it?: string;
  es?: string;
  [key: string]: string | undefined;
}

export interface ISEO {
  metaTitle?: ILocalizedString;
  metaDescription?: ILocalizedString;
  metaKeywords?: ILocalizedMixed;
  metaImage?: IImage;
  /** Social-card overrides; blank falls back to the same language's meta field. */
  ogTitle?: ILocalizedString;
  ogDescription?: ILocalizedString;
  /** Plain URL fallback used when no metaImage is set. */
  ogImage?: string;
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
  /** Short label for cards/menus/filters; empty falls back to a shortened name. */
  shortName?: ILocalizedString;
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
  faqs?: IFAQ[];
  featuredBlogs?: string[];
  featuredDestinations?: string[];
  destinationsSectionTitle?: ILocalizedString;
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
  /** Short label for cards/menus/filters; empty falls back to a shortened name. */
  shortName?: ILocalizedString;
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
  faqs?: IFAQ[];
  featuredBlogs?: string[];
  featuredDestinations?: string[];
  destinationsSectionTitle?: ILocalizedString;
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
  /** Short teaser for the tour card (two clamped lines). */
  cardDescription?: ILocalizedString;
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
  /** Day tour or package — decides which pricing plans are allowed and
   *  whether the booking form asks the visitor to choose one. */
  tourKind?: 'DAY_TOUR' | 'PACKAGE';
  isFeatured: boolean;
  isActive: boolean;
  scheduledAt?: Date | string | null;
  publishedAt?: Date | string;
  seo?: ISEO;
  idExternal?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ==================== FORM DATA TYPES ====================

export interface TourCategoryFormData {
  name: ILocalizedString;
  /** Short label for cards/menus/filters; empty falls back to a shortened name. */
  shortName?: ILocalizedString;
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
  faqs?: IFAQ[];
  featuredBlogs?: string[];
  featuredDestinations?: string[];
  destinationsSectionTitle?: ILocalizedString;
  bottomSection?: ISectionHeader;
  isActive: boolean;
}

export interface TourSubcategoryFormData {
  category: string;
  name: ILocalizedString;
  /** Short label for cards/menus/filters; empty falls back to a shortened name. */
  shortName?: ILocalizedString;
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
  faqs?: IFAQ[];
  featuredBlogs?: string[];
  featuredDestinations?: string[];
  destinationsSectionTitle?: ILocalizedString;
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
  /** Every tier is optional, matching PricesSchema on the server. A tour is
   *  often published before sales have priced it, and an absent tier is how
   *  "not priced yet" is expressed — the previous non-optional type forced
   *  callers to invent a 0, which then reached visitors as "$0.00". */
  prices: {
    solo?: ICurrencyPrice;
    pax_2_4?: ICurrencyPrice;
    pax_5_8?: ICurrencyPrice;
    pax_9_16?: ICurrencyPrice;
  };
  notes: IPricingNote[];
}

/**
 * The icon shown beside an accommodation stop.
 *
 * An icon names the DESTINATION, not the kind of building or landmark: it sits
 * next to a place name and its job is to let a reader tell one stop from
 * another at a glance. So every "Aswan" row on the site draws the same glyph,
 * whichever hotel the tier books.
 *
 * MUST stay in step with `ACCOMMODATION_ICONS` in `server/src/models/Tour.ts`,
 * which is the enum the write path validates against. There is no shared
 * package between client and server; `scripts/checkIconParity.mjs` compares the
 * two files and fails if they drift.
 */
export const ACCOMMODATION_ICONS = [
  'pyramids',
  'temple',
  'city',
  'cruise',
  'sea',
  'desert',
  'colonnade',
  'hotel',
] as const;
export type AccommodationIcon = (typeof ACCOMMODATION_ICONS)[number];

/**
 * Values written under earlier, coarser versions of the list above, each mapped
 * to the artwork that replaced it.
 *
 * A map rather than a list, because the mapping is the whole point — knowing
 * that `nubian` exists says nothing about which glyph should be drawn for it.
 * The server keeps the same key set (as a plain list) so it can keep accepting
 * these on write; the parity script checks both directions.
 */
export const LEGACY_ACCOMMODATION_ICONS = {
  beach: 'sea',
  resort: 'hotel',
  nubian: 'colonnade',
} as const satisfies Record<string, AccommodationIcon>;

export type LegacyAccommodationIcon = keyof typeof LEGACY_ACCOMMODATION_ICONS;

/** What a row loaded from the API may actually hold. The admin form ingests
 *  server rows directly, and the server's enum still accepts legacy names, so
 *  narrowing this to `AccommodationIcon` would have been a lie. Resolve with
 *  `resolveAccommodationIcon` before drawing or comparing. */
export type StoredAccommodationIcon = AccommodationIcon | LegacyAccommodationIcon;

/** The one value used when nothing better is known. `hotel` is the honest
 *  unknown — it says "somewhere to sleep" and claims nothing about where. */
export const DEFAULT_ACCOMMODATION_ICON: AccommodationIcon = 'hotel';

/** One accommodation stop on a package tier — where guests sleep and which
 *  hotels that tier books. Mirrors AccommodationSchema on the server. */
export interface IAccommodation {
  location: ILocalizedString;
  icon: StoredAccommodationIcon;
  hotels: ILocalizedString;
}

export interface IPricingPlan {
  planName: string;
  seasons: IPricingSeason[];
  notes?: IPricingNote[];
  accommodations?: IAccommodation[];
}

export interface IItineraryActivity {
  name: string;
  heading: ILocalizedString;
  description: ILocalizedMixed;
  image?: IImage;
  /** An add-on the traveller may take or skip; marked as such on the tour page. */
  isOptional?: boolean;
}

export interface IItineraryDay {
  day: number;
  title: ILocalizedString;
  activities: IItineraryActivity[];
  /** Optional day logistics — each shown on the tour page only when filled. */
  /** A key from DAY_FLIGHT_OPTIONS, or absent. */
  flight?: string;
  /** Meal keys — 'breakfast' | 'lunch' | 'dinner', or the lone entry 'none'. */
  meals?: string[];
  /** A key from DAY_ACCOMMODATION_OPTIONS, or absent. */
  accommodation?: string;
}

export interface IItinerary {
  generalDescription: ILocalizedMixed;
  days: IItineraryDay[];
}

export interface IFAQ {
  question: IFAQLocalizedString;
  answer:   { en?: any; de?: any; it?: any; es?: any };
  isActive?: boolean;
  order?: number;
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
  /** Short teaser for the tour card (two clamped lines). */
  cardDescription?: ILocalizedString;
  tourLocation?: ILocalizedString;
  tourAvailability?: ILocalizedString;
  pickupAndDropOff?: ILocalizedString;
  tourType?: ILocalizedString;
  tourStyle?: ILocalizedString;
  /** Day tour or package — decides which pricing plans are allowed and
   *  whether the booking form asks the visitor to choose one. */
  tourKind?: 'DAY_TOUR' | 'PACKAGE';
  isFeatured: boolean;
  isActive: boolean;
  scheduledAt?: Date | string | null;
  publishedAt?: Date | string;
  isSpecialOffer?: boolean;
  specialOfferDiscount?: number;
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
  // Additional tour details
  priceStartingFrom?: ICurrencyPrice;
  duration?: ILocalizedString;
  meetingPoint?: ILocalizedString;
  cancellationPolicy?: ILocalizedString;
  tags?: ILocalizedMixed;
}
