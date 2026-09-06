"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { tourAPI } from "@/lib/api/tour";
import { getLocalizedValue } from "@/lib/localize";
import { getDisplayName } from "@/lib/displayName";
import { getStrictLocalizedSlug, type SupportedLocale } from "@/lib/url";
import { useTranslation } from "react-i18next";
import { type ICurrencyPrice } from "@/contexts/CurrencyContext";
import FeatureTwo from "./FeatureTwo";
import type { FeatureTwoItem } from "./types";
import { TOUR_IMAGE_PLACEHOLDER } from "@/lib/images/placeholders";

/* The card shape is FeatureTwoItem — one definition, in ./types.ts. */

function getYouTubeId(url: string): string {
  const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return match ? match[1] : "";
}

function mapTour(tour: any, locale: string): FeatureTwoItem {
  // All of the tour's own image URLs — used to open a per-tour lightbox on
  // click. Just strings (no downloads until the gallery opens).
  const images: string[] = Array.isArray(tour.images)
    ? tour.images.map((img: any) => img?.url).filter(Boolean)
    : [];

  const image =
    images[0] ||
    tour.gallery?.[0]?.url ||
    TOUR_IMAGE_PLACEHOLDER;

  const slug = getStrictLocalizedSlug(tour.slug, locale as SupportedLocale) || "";
  const title =
    getLocalizedValue(tour.heading, locale) ||
    getLocalizedValue(tour.name, locale) ||
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

  // Server sends `videoUrls` (all of the tour's review videos) and keeps
  // `videoUrl` for the first. Both are absent when the tour has no video, and
  // an empty `videoIds` is what hides the button.
  const videoIds: string[] = (Array.isArray(tour.videoUrls) ? tour.videoUrls : [tour.videoUrl])
    .map((url: unknown) => (typeof url === "string" ? getYouTubeId(url) : ""))
    .filter(Boolean);
  const videoId = videoIds[0] || "";

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
    videoId,
    videoIds,
    discount: tour.specialOfferDiscount ? String(tour.specialOfferDiscount) : "",
    description:
      getLocalizedValue(tour.cardDescription, locale) ||
      getLocalizedValue(tour.Description?.text, locale) ||
      "",
    meta: [
      { id: 1, title: location, icon: "icon-pin1" },
      { id: 2, title: duration, icon: "icon-clock" },
      ...(getDisplayName(tour.subcategory, locale)
        ? [{ id: 3, title: getDisplayName(tour.subcategory, locale), icon: "icon-flag" }]
        : []),
    ],
  };
}

type FeaturedToursSectionProps = {
  initialTours?: any[];
};

/** The prop's own element type, so this follows it if it is ever narrowed. */
type RawTourList = NonNullable<FeaturedToursSectionProps["initialTours"]>;

/**
 * The empty default, hoisted to module scope.
 *
 * `({ initialTours = [] })` builds a NEW array on every render when the prop
 * is omitted, which would make the `source` identity check below false every
 * time — and since setting the fallback re-renders, that is an endless fetch
 * loop. A module constant is one stable reference for the life of the module.
 */
const NO_TOURS: never[] = [];

/**
 * The client fallback, keyed to the data it was fetched for.
 *
 * Keying on the LOCALE alone would let the previous language's tours render
 * for one frame after a language switch, before the effect replaced them —
 * with their links already built as /en/... Keying on the server payload too
 * preserves what the current `[locale, initialTours]` dependency does: a new
 * RSC payload (router.refresh, navigation) re-runs the fallback instead of
 * reusing a result fetched against the payload before it.
 */
type FallbackState = {
  locale: string;
  /** The `initialTours` reference that led to this fetch. */
  source: RawTourList;
  tours: FeatureTwoItem[];
} | null;

// Upper bound for the featured-tours carousel (looping slider shows all of
// them, filtered to the active locale). Keep in sync with the homepage's
// server-side FEATURED_TOURS_LIMIT.
const FEATURED_TOURS_LIMIT = 24;

function mapToursForLocale(tours: any[], locale: string): FeatureTwoItem[] {
  return tours
    .filter((tour: any) => getStrictLocalizedSlug(tour.slug, locale as SupportedLocale))
    .map((tour: any) => mapTour(tour, locale));
}

const FeaturedToursSection: React.FC<FeaturedToursSectionProps> = ({
  initialTours = NO_TOURS,
}) => {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const { t } = useTranslation("common");

  // Mapped once per payload/locale. This used to run in the render body on
  // EVERY render and again inside the effect, for a value the state already
  // held — roughly 240 wasted calls per render across 24 tours.
  const initialMappedTours = useMemo(
    () => mapToursForLocale(initialTours, locale),
    [initialTours, locale]
  );

  // The only state here. `tours` and `loading` are derived below, so there is
  // one source of truth rather than a state variable synchronised to a prop.
  const [fallback, setFallback] = useState<FallbackState>(null);

  // Kept from the previous implementation deliberately: the decision is made
  // on the MAPPED length, so a payload that maps to zero — no tour carries a
  // slug for this locale — still triggers the fallback.
  const needsFallback = initialMappedTours.length === 0;

  const fallbackReady =
    fallback !== null &&
    fallback.locale === locale &&
    fallback.source === initialTours;

  const tours = needsFallback
    ? fallbackReady
      ? fallback.tours
      : []
    : initialMappedTours;

  // Derived, not stored: "the fallback is needed and is not here yet".
  const loading = needsFallback && !fallbackReady;

  useEffect(() => {
    if (!needsFallback) return; // server data is enough
    if (fallbackReady) return; // already fetched for this locale and payload

    let alive = true;

    tourAPI
      .getFeatured(FEATURED_TOURS_LIMIT)
      .then((res) => {
        if (!alive) return;
        // An empty result is a RESULT. The old `res.data.length > 0` guard
        // left "the API returned nothing" indistinguishable from "nothing
        // came back at all", which with a derived `loading` would hang.
        const data = res.success && Array.isArray(res.data) ? res.data : [];
        // Only tours with a real slug for this locale, so we never emit a
        // fallback localized URL like /de/english-slug.
        setFallback({
          locale,
          source: initialTours,
          tours: mapToursForLocale(data, locale),
        });
      })
      .catch(() => {
        // Recorded as an attempt for the same reason: `loading` is derived
        // from whether a fallback exists, so a failure has to leave one.
        if (alive) setFallback({ locale, source: initialTours, tours: [] });
      });

    // Runs on unmount AND before the effect re-runs for a new locale or
    // payload, so a slow response can neither overwrite newer state nor
    // touch a component that is gone.
    return () => {
      alive = false;
    };
  }, [needsFallback, fallbackReady, locale, initialTours]);

  if (loading || tours.length === 0) return null;

  return (
    <FeatureTwo
      extraClass="section-space"
      id="featured-tours"
      rewind
      tours={tours}
      title={`${t("featuredTours.title")} ${t("featuredTours.titleSpan")}`}
      titleSpan=""
      subtitle={t("featuredTours.tagline")}
    />
  );
};

export default FeaturedToursSection;
