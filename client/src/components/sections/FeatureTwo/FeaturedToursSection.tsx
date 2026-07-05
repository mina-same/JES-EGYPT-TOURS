"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { tourAPI } from "@/lib/api/tour";
import { getLocalizedValue } from "@/lib/localize";
import { useTranslation } from "react-i18next";
import FeatureTwo from "./FeatureTwo";

interface FeaturePackageItem {
  id: string;
  image: string;
  title: string;
  link: string;
  price: number;
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

// Strict localized slug: returns the slug ONLY when a real, non-empty string
// exists for the current locale. Never falls back to English or another locale.
function getStrictSlug(slug: any, locale: string): string {
  // Legacy plain-string slugs are only valid for English; for de/it/es a plain
  // string must NOT produce a link (would be a fake localized URL).
  if (typeof slug === "string") return locale === "en" ? slug.trim() : "";
  if (slug && typeof slug === "object") {
    const v = slug[locale];
    return typeof v === "string" ? v.trim() : "";
  }
  return "";
}

function mapTour(tour: any, locale: string): FeaturePackageItem {
  const image =
    tour.images?.[0]?.url ||
    tour.gallery?.[0]?.url ||
    "/assets/images/resources/tour-1-1.jpg";

  const slug = getStrictSlug(tour.slug, locale);
  const title =
    getLocalizedValue(tour.heading || tour.name, locale) ||
    tour.heading?.en ||
    tour.name?.en ||
    "";

  const price =
    tour.priceStartingFrom?.USD ??
    tour.priceStartingFrom?.EUR ??
    tour.price ??
    0;

  const videoId =
    Array.isArray(tour.reviews)
      ? getYouTubeId(
          tour.reviews.find((r: any) => typeof r?.url === "string")?.url || ""
        )
      : "";

  const duration = getLocalizedValue(tour.duration, locale) || "1 Day";
  const location =
    getLocalizedValue(tour.tourLocation, locale) || "Egypt";

  return {
    id: tour._id || tour.id || slug,
    image,
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

const FeaturedToursSection: React.FC = () => {
  const [tours, setTours] = useState<FeaturePackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const { t } = useTranslation("common");

  useEffect(() => {
    tourAPI
      .getFeatured(8)
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          // Only feature tours that have a real slug for the current locale, so
          // we never emit a fallback localized URL like /de/english-slug.
          setTours(
            res.data
              .filter((t: any) => getStrictSlug(t.slug, locale))
              .map((t: any) => mapTour(t, locale))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [locale]);

  if (loading || tours.length === 0) return null;

  return (
    <FeatureTwo
      extraClass="section-space"
      id="featured-tours"
      tours={tours as any}
      title={t("featuredTours.title")}
      titleSpan={t("featuredTours.titleSpan")}
      subtitle={t("featuredTours.tagline")}
    />
  );
};

export default FeaturedToursSection;
