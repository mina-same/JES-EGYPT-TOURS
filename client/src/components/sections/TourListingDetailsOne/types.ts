import { StaticImageData } from "next/image";
import type { ICurrencyPrice } from "@/contexts/CurrencyContext";

export interface ContactFormField {
  name: string;
  label: string;
  placeholder: string;
  type: "text" | "email" | "textarea";
}


export interface Metadata {
  id: number;
  title: string;
  icon: string;
}

export interface Item {
  id: number | string;
  image: StaticImageData | string;
  title: string;
  link: string;
  price: string | number;
  videoId: string;
  discount: string;
  meta: Metadata[];
}

/** Each tier is a per-currency object, not a bare number — the API stores real
 *  amounts in USD/EUR/GBP rather than one figure to convert. This was typed as
 *  `number`, which was simply wrong about the data: it only ever "worked"
 *  because `formatPrice` accepts both shapes. The same mistyping elsewhere once
 *  hid the price on every tour on the site. */
export interface Prices {
  solo?: TierAmount;
  pax_2_4?: TierAmount;
  pax_5_8?: TierAmount;
  pax_9_16?: TierAmount;
}

/** Re-exported rather than redeclared: this is the same per-currency shape the
 *  currency context formats, and CurrencyPriceSchema makes USD mandatory
 *  whenever a tier exists at all. */
export type TierAmount = ICurrencyPrice;

export interface Note {
  title: string;
  text: string;
}

export interface Season {
  seasonName: string;
  startDate: string;
  endDate: string;
  prices: Prices;
  notes?: Note[];
}

/** Localized by the API before it arrives — plain strings here. */
export interface Accommodation {
  location: string;
  icon: string;
  hotels: string;
}

export interface PricingPlan {
  planName: string;
  seasons: Season[];
  notes?: Note[];
  accommodations?: Accommodation[];
}

export interface ImageObject {
  url: string;
  alt?: string;
  title?: string;
}

export interface Activity {
  heading: string;
  description: string;
  image?: ImageObject;
}

export interface ItineraryDay {
  day: number;
  title: string;
  activities: Activity[];
}

export interface Itinerary {
  generalDescription?: string;
  days: ItineraryDay[];
}

export interface Comment {
  name: string;
  date: string;
  text: string;
  rating?: number;
  avatar: StaticImageData | string;
}

export interface ReviewVideo {
  title: string;
  url: string;
  videoId: string;
}

export interface TourDetailsOneData {
  id: string;
  title: string;
  titleTwo: string;
  overview: string;
  location: string;
  pickupAndDropOff: string;
  activitiesType: string;
  activateDay: string;
  availability: string;
  price: number | ICurrencyPrice;
  overviewTitle: string;
  topDestinations: string;
  sliderImages: (StaticImageData | string | ImageObject)[];
  highlightList: string[] | string;
  amenities: string;
  amenitiesTwo: string;
  relatedTours: Item[];
  images: (StaticImageData | string | ImageObject)[];
  faqs: { question: string; answer: string }[];
  map: string;
  itinerary?: Itinerary;
  pricingPlans?: PricingPlan[];
  whatYouWillLoveHtml?: string;
  whatToPack?: string[] | string;
  notes?: Note[];
  reviewVideos?: ReviewVideo[];
  subcategoryId?: string; // for fetching more tours by category
  firstImageUrl?: string; // first main image URL for page header bg
}

export interface TourListingOneDetailsProps {
  id?: string;
  initialRawTour?: any;
}
