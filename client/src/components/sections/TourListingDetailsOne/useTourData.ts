"use client";
import { formatTourDestinations } from '@/lib/tours/destinations';
import { tourTypeLabel, tourStyleLabels } from '@/lib/tours/catalog';
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { tourAPI } from "@/lib/api/tour";
import tourDetailsOneData from "@/data/tourDetailsOneData";
import { TourDetailsOneData } from "./types";
import {
  isEmptyAccommodation,
  resolveAccommodationIcon,
} from "@/lib/accommodationIcon";

function getYouTubeVideoId(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (shortMatch?.[1]) return shortMatch[1];
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (watchMatch?.[1]) return watchMatch[1];
  const embedMatch = trimmed.match(/\/embed\/([a-zA-Z0-9_-]{6,})/);
  if (embedMatch?.[1]) return embedMatch[1];
  const shortsMatch = trimmed.match(/\/shorts\/([a-zA-Z0-9_-]{6,})/);
  if (shortsMatch?.[1]) return shortsMatch[1];
  return '';
}

/**
 * Pulls the embed URL out of whatever the admin pasted into `tourMapIframe` and
 * pins the map's language to the page's.
 *
 * Two things this has to survive:
 *
 * 1. The stored value is a whole `<iframe …>` snippet copied from Google Maps.
 *    Matching only double quotes silently lost the map when someone pasted
 *    single-quoted markup or just the bare URL, so both are accepted.
 * 2. Google renders the embed in the VISITOR'S BROWSER language when no `hl` is
 *    given — an Italian browser got an Italian map on the English page, place
 *    names and number formats included. `tourMapIframe` is one shared string for
 *    all four locales, so the language cannot be baked into the stored value; it
 *    is forced here, per render, and overrides any `hl` already in the URL.
 */
export const buildLocalizedMapSrc = (rawIframe?: string, locale: string = 'en'): string => {
  if (!rawIframe) return '';
  const raw = String(rawIframe).trim();

  const quoted = raw.match(/src\s*=\s*["']([^"']+)["']/i);
  const src = quoted?.[1] ?? (/^https?:\/\//i.test(raw) ? raw : '');
  if (!src) return '';

  try {
    const url = new URL(src, 'https://www.google.com');
    url.searchParams.set('hl', locale);
    return url.toString();
  } catch {
    // Unparseable src: fall back to appending, still better than the wrong language.
    const separator = src.includes('?') ? '&' : '?';
    return /[?&]hl=/i.test(src) ? src : `${src}${separator}hl=${encodeURIComponent(locale)}`;
  }
};

export const useTourData = (id?: string, initialRawTour?: any) => {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || 'en') as 'en' | 'de' | 'it' | 'es';

  const safeArray = <T,>(value: any): T[] => (Array.isArray(value) ? value : []);

  // Extract locale-specific value (handle raw object or pre-localized string)
  const getLocalizedValue = (v: any) => {
    if (!v) return '';
    if (typeof v === 'string') return v;
    return v[currentLang] || v.en || '';
  };

  const mapRawTourData = (tour: any): TourDetailsOneData => {
    const tourId = tour._id;
    // Per-image language visibility: absent/empty languages = all locales.
    // Must run BEFORE mapping — the map drops every field except url/alt/title.
    const imgAllows = (img: any) =>
      !Array.isArray(img?.languages) || img.languages.length === 0 || img.languages.includes(currentLang);

    const sliderImages = safeArray<any>(tour.images)
      .filter(imgAllows)
      .map((img: any) => ({
        url: img?.url,
        alt: getLocalizedValue(img?.alt),
        title: getLocalizedValue(img?.title)
      }))
      .filter((img: any) => !!img.url);

    const galleryImages = safeArray<any>(tour.gallery)
      .filter(imgAllows)
      .map((img: any) => ({
        url: img?.url,
        alt: getLocalizedValue(img?.alt),
        title: getLocalizedValue(img?.title)
      }))
      .filter((img: any) => !!img.url);

    const reviewVideos = safeArray<any>(tour.reviews)
      .map((r: any) => ({
        title: getLocalizedValue(r?.title) || 'Review',
        url: typeof r?.url === 'string' ? r.url : '',
        videoId: getYouTubeVideoId(r?.url)
      }))
      .filter(v => v.url && v.videoId);
    
    const subId = typeof tour.subcategory === 'object'
      ? tour.subcategory?._id || tour.subcategory
      : tour.subcategory;

    return {
      id: tourId,
      title: getLocalizedValue(tour.heading) || tour.name || "",
      titleTwo: tour.name || "",
      overview: getLocalizedValue(tour.Description?.text) || getLocalizedValue(tour.overview) || "",
      location: formatTourDestinations(tour.destinations, currentLang),
      pickupAndDropOff: getLocalizedValue(tour.pickupAndDropOff) || "",
      activitiesType: tourTypeLabel(tour.tourType, currentLang) || "",
      stylesLabel: tourStyleLabels(tour.tourStyles, currentLang).join(', '),
      activateDay: getLocalizedValue(tour.duration) || "",
      availability: getLocalizedValue(tour.tourAvailability) || "",
      price: tour.priceStartingFrom || tour.price || 0,
      overviewTitle: getLocalizedValue(tour.Description?.header) || "Overview",
      topDestinations: "",
      sliderImages,
      // New format: localized HTML string. Legacy format: array of localized items.
      highlightList: Array.isArray(tour.tourHighlights)
        ? safeArray(tour.tourHighlights).map(getLocalizedValue).filter(Boolean)
        : getLocalizedValue(tour.tourHighlights),
      amenities: getLocalizedValue(tour.inclusion),
      amenitiesTwo: getLocalizedValue(tour.exclusion),
      // New format: localized HTML string. Legacy format: array of localized items.
      whatToPack: Array.isArray(tour.whatToPack)
        ? safeArray(tour.whatToPack).map(getLocalizedValue).filter(Boolean)
        : getLocalizedValue(tour.whatToPack),
      notes: safeArray(tour.notes).map((n: any) => ({
        title: getLocalizedValue(n?.title),
        text: getLocalizedValue(n?.text),
      })),
      // The curated related tours are loaded and rendered by
      // TourRelatedContent, so they never have to replace the tour itself.
      relatedTours: [],
      images: galleryImages,
      // Strict locale lookup — no fallback to English.
      // Only include rows where the active locale has both question and answer.
      faqs: safeArray(tour.faqs)
        .map((f: any) => ({
          question: f?.question?.[currentLang] || '',
          answer:   f?.answer?.[currentLang]   || '',
        }))
        .filter(f => f.question && f.answer),
      map: buildLocalizedMapSrc(tour.tourMapIframe, currentLang),
      itinerary: {
        generalDescription: getLocalizedValue(tour.itinerary?.generalDescription),
        // No `description` here on purpose: the day description was retired, so
        // carrying it through the view model would ship dead text to the client.
        days: safeArray(tour.itinerary?.days).map((d: any) => ({
          day: d?.day || 0,
          title: getLocalizedValue(d?.title),
          // Optional per-day logistics. Absent on most days; the section that
          // renders them drops any that come back empty.
          flight: typeof d?.flight === 'string' ? d.flight : '',
          meals: safeArray<string>(d?.meals).filter(Boolean),
          accommodation: typeof d?.accommodation === 'string' ? d.accommodation : '',
          activities: safeArray(d?.activities).map((a: any) => ({
            heading: getLocalizedValue(a?.heading),
            description: getLocalizedValue(a?.description),
            isOptional: !!a?.isOptional,
            image: a?.image?.url && imgAllows(a.image) ? {
              url: a.image.url,
              alt: getLocalizedValue(a.image.alt),
              title: getLocalizedValue(a.image.title)
            } : undefined,
          })),
        })),
      },
      pricingPlans: safeArray(tour.pricingPlans).map((p: any) => ({
        planName: p?.planName || "",
        seasons: safeArray(p?.seasons).map((s: any) => ({
          seasonName: s?.seasonName || "",
          startDate: s?.startDate || "",
          endDate: s?.endDate || "",
          prices: s?.prices || {},
          notes: safeArray(s?.notes).map((n: any) => ({
            title: getLocalizedValue(n?.title),
            text: getLocalizedValue(n?.text),
          })),
        })),
        notes: safeArray(p?.notes).map((n: any) => ({
          title: getLocalizedValue(n?.title),
          text: getLocalizedValue(n?.text),
        })),
        // getLocalizedValue is a no-op on the already-flat strings the API
        // sends, and resolves the object shape when raw data slips through.
        //
        // Rows with neither a place nor a hotel are dropped: they used to reach
        // the page as an icon with two blank lines beside it. The icon goes
        // through the shared resolver so a legacy or oddly-cased value lands on
        // the same glyph the renderer would have picked anyway.
        accommodations: safeArray(p?.accommodations)
          .map((a: any) => ({
            location: getLocalizedValue(a?.location),
            icon: resolveAccommodationIcon(a?.icon),
            hotels: getLocalizedValue(a?.hotels),
          }))
          .filter((a) => !isEmptyAccommodation(a)),
      })),
      whatYouWillLoveHtml: getLocalizedValue(tour.whatYouWillLoveHtml),
      reviewVideos,
      subcategoryId: subId ? String(subId) : undefined,
      firstImageUrl: sliderImages[0]?.url || undefined,
    };
  };

  const [tourData, setTourData] = useState<TourDetailsOneData>(() => {
    if (initialRawTour) return mapRawTourData(initialRawTour);
    return { ...tourDetailsOneData, map: "" };
  });

  /**
   * The raw tour and language `tourData` was last mapped from. Mapping the same
   * tour in the same language again yields an equal copy, and storing that copy
   * re-rendered the whole page - which used to happen on every visit, once the
   * related content had loaded.
   */
  const mappedFrom = useRef<{ tour: any; lang: string } | null>(
    initialRawTour ? { tour: initialRawTour, lang: currentLang } : null
  );
  /** Only for the no-seed path; the tour page always supplies initialRawTour. */
  const [fetchedTour, setFetchedTour] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * Whether a real tour is available to render. True from the first render when
   * the server supplied one. The page uses this to decide whether a failure is
   * fatal: with content already on screen it never is.
   */
  const [hasTourContent, setHasTourContent] = useState<boolean>(Boolean(initialRawTour));

  useEffect(() => {
    // Server-supplied tour: re-map only when the tour or the language changed.
    if (initialRawTour) {
      const from = mappedFrom.current;
      if (from && from.tour === initialRawTour && from.lang === currentLang) return;
      mappedFrom.current = { tour: initialRawTour, lang: currentLang };
      setTourData(mapRawTourData(initialRawTour));
      return;
    }
    if (!id) return;

    const fetchTour = async () => {
      try {
        // Only show the skeleton when there is genuinely nothing to show. The
        // server-rendered tour is already painted, so flipping `loading` for it
        // used to tear the whole page down and rebuild it on every visit — a
        // visible flash, wasted SSR, and a fresh DOM that invalidated refs.
        setLoading(true);
        const tourRes = await tourAPI.getBySlug(id);
        if (!tourRes.success || !tourRes.data) {
          setError("Failed to load tour details");
          return;
        }
        mappedFrom.current = { tour: tourRes.data, lang: currentLang };
        setFetchedTour(tourRes.data);
        setTourData(mapRawTourData(tourRes.data));
        setHasTourContent(true);
      } catch (err) {
        console.error("useTourData error:", err);
        setError("Failed to load tour details");
      } finally {
        setLoading(false);
      }
    };
    fetchTour();
  }, [id, currentLang]);

  // The related content (curated tours, "More Tours", articles) is loaded by
  // TourRelatedContent from this raw tour.
  return { tourData, loading, error, hasTourContent, rawTour: initialRawTour || fetchedTour };
};
