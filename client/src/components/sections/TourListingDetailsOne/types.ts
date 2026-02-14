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
  rating: number;
  reviews: number;
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
}

export interface Activity {
  heading: string;
  description: string;
  image?: { url: string };
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
  reviews: number;
  location: string;
  activitiesType: string;
  traveler: number;
  activateDay: string;
  price: number;
  overviewTitle: string;
  topDestinations: string;
  sliderImages: (StaticImageData | string)[];
  highlightList: string[];
  amenities: string[];
  amenitiesTwo: string[];
  relatedTours: Item[];
  comments: Comment[];
  images: (StaticImageData | string)[];
  faqs: { question: string; answer: string }[];
  map: string;
  itinerary?: Itinerary;
  pricingPlans?: PricingPlan[];
  whatYouWillLoveHtml?: string;
  reviewVideos?: ReviewVideo[];
}

export interface TourListingOneDetailsProps {
  id?: string;
}