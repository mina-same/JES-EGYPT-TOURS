import { StaticImageData } from "next/image";

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

export interface Prices {
  solo?: number;
  pax_2_4?: number;
  pax_5_8?: number;
  pax_9_16?: number;
}

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

export interface PricingPlan {
  planName: string;
  seasons: Season[];
  notes?: Note[];
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
  description: string;
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
  activitiesType: string;
  traveler: number;
  activateDay: string;
  price: number;
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