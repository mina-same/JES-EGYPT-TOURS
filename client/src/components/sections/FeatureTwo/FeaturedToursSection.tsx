"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { tourAPI } from "@/lib/api/tour";
import { getLocalizedValue } from "@/lib/localize";
import { getStrictLocalizedSlug, type SupportedLocale } from "@/lib/url";
import { useTranslation } from "react-i18next";
import { type ICurrencyPrice } from "@/contexts/CurrencyContext";
import FeatureTwo from "./FeatureTwo";

interface FeaturePackageItem {
  id: string;
  image: string;
  images: string[];
  title: string;
  link: string;
  price: number | ICurrencyPrice;
  rating: number;
  reviews: number;
  videoId: string;
  discount: string;
  meta: { id: number; title: string; icon: string }[];
}

function getYouTubeId(url: string): string {
  const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return match ? match[1] : "";
}

function mapTour(tour: any, locale: string): FeaturePackageItem {
  // All of the tour's own image URLs — used to open a per-tour lightbox on
  // click. Just strings (no downloads until the gallery opens).
  const images: string[] = Array.isArray(tour.images)
    ? tour.images.map((img: any) => img?.url).filter(Boolean)
    : [];

  const image =
    images[0] ||
    tour.gallery?.[0]?.url ||
    "/assets/images/resources/tour-1-1.jpg";

  const slug = getStrictLocalizedSlug(tour.slug, locale as SupportedLocale) || "";
  const title =
    getLocalizedValue(tour.heading || tour.name, locale) ||
    tour.heading?.en ||
    tour.name?.en ||
    "";

  // Pass the full multi-currency object so the card shows the admin's real
  // per-currency prices (USD/EUR/GBP) via the currency context, instead of a
  // single USD amount that would only be rate-converted for EUR/GBP.
  const price: number | ICurrencyPrice =
    tour.priceStartingFrom?.USD != null
      ? tour.priceStartingFrom
      : (typeof tour.price === "number" ? tour.price : 0);

  // Server sends a single lightweight `videoUrl` (or none). Extract the
  // YouTube id; empty string means the tour has no video (button is hidden).
  const videoId = tour.videoUrl ? getYouTubeId(tour.videoUrl) : "";

  const duration = getLocalizedValue(tour.duration, locale) || "1 Day";
  const location =
    getLocalizedValue(tour.tourLocation, locale) || "Egypt";

  return {
    id: tour._id || tour.id || slug,
    image,
    images,
    title,
    link: `/${locale}/${slug}`,
    price,
    rating: tour.rating ?? 5,
    reviews: tour.reviewsCount ?? tour.reviews?.length ?? 0,
    videoId,
    discount: tour.specialOfferDiscount ? String(tour.specialOfferDiscount) : "",
    meta: [
      { id: 1, title: duration, icon: "icon-clock" },
      { id: 2, title: location, icon: "icon-pin1" },
    ],
  };
}

type FeaturedToursSectionProps = {
  initialTours?: any[];
};

// Upper bound for the featured-tours carousel (looping slider shows all of
// them, filtered to the active locale). Keep in sync with the homepage's
// server-side FEATURED_TOURS_LIMIT.
const FEATURED_TOURS_LIMIT = 24;

function mapToursForLocale(tours: any[], locale: string): FeaturePackageItem[] {
  return tours
    .filter((tour: any) => getStrictLocalizedSlug(tour.slug, locale as SupportedLocale))
    .map((tour: any) => mapTour(tour, locale));
}

const FeaturedToursSection: React.FC<FeaturedToursSectionProps> = ({ initialTours = [] }) => {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const initialMappedTours = mapToursForLocale(initialTours, locale);
  const [tours, setTours] = useState<FeaturePackageItem[]>(() => initialMappedTours);
  const [loading, setLoading] = useState(initialMappedTours.length === 0);
  const { t } = useTranslation("common");

  useEffect(() => {
    const mappedInitialTours = mapToursForLocale(initialTours, locale);

    if (mappedInitialTours.length > 0) {
      setTours(mappedInitialTours);
      setLoading(false);
      return;
    }

    tourAPI
      .getFeatured(FEATURED_TOURS_LIMIT)
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          // Only feature tours that have a real slug for the current locale, so
          // we never emit a fallback localized URL like /de/english-slug.
          setTours(mapToursForLocale(res.data, locale));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [locale, initialTours]);

  if (loading || tours.length === 0) return null;

  return (
    <FeatureTwo
      extraClass="section-space"
      id="featured-tours"
      rewind
      tours={tours as any}
      title={t("featuredTours.title")}
      titleSpan={t("featuredTours.titleSpan")}
      subtitle={t("featuredTours.tagline")}
    />
  );
};

export default FeaturedToursSection;
