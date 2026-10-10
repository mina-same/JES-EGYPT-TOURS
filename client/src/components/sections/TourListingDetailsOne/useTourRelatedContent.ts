"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatTourDestinations } from "@/lib/tours/destinations";
import { tourAPI } from "@/lib/api/tour";
import { getBlogsByIds } from "@/lib/api/blog";
import { publicGet } from "@/lib/api/publicGet";
import { RELATED_BLOGS_FALLBACK_LIMIT } from "@/lib/tour/relatedBlogs";
import { loadTourRelatedContent, type TourRelatedContentApi } from "@/lib/tour/relatedContent";
import { getDisplayName } from "@/lib/displayName";
import { getStrictLocalizedSlug } from "@/lib/url";
import { TOUR_IMAGE_PLACEHOLDER } from "@/lib/images/placeholders";
import type { FeatureTwoItem } from "../FeatureTwo/types";

const safeArray = <T,>(value: any): T[] => (Array.isArray(value) ? value : []);

// Extract locale-specific value (handle raw object or pre-localized string)
const getLocalizedValue = (v: any, lang: string) => {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return v[lang] || v.en || '';
};

// Map a tour object (raw or localized) to FeatureTwo item
export const mapTourToItem = (t: any, currentLang: 'en' | 'de' | 'it' | 'es'): FeatureTwoItem | null => {
  if (!t) return null;

  const tourSlug = getStrictLocalizedSlug(t?.slug, currentLang);
  if (!tourSlug) return null;
  const tourTitle = getLocalizedValue(t?.heading, currentLang) || t?.name || "";
  // The site's own stand-in, not a third-party placeholder service.
  const fallback = TOUR_IMAGE_PLACEHOLDER;

  // Consolidate images for the gallery
  const rawImages = safeArray<any>(t?.images);
  const mainImage = rawImages[0] || {};
  const allImages = rawImages.map(img => img?.url).filter(Boolean);
  if (allImages.length === 0) allImages.push(fallback);

  // Build metadata for the card (Location first — it gets its own row).
  const meta = [];
  const loc = formatTourDestinations(t?.destinations, currentLang);
  if (loc) {
    meta.push({ id: 1, title: loc, icon: "icon-location" });
  }
  const dur = getLocalizedValue(t?.duration, currentLang);
  if (dur) {
    meta.push({ id: 2, title: dur, icon: "icon-clock" });
  }
  const subName = getDisplayName(t?.subcategory);
  if (subName) {
    meta.push({ id: 3, title: subName, icon: "icon-flag" });
  }

  return {
    id: t._id || t.id,
    slug: tourSlug,
    image: mainImage?.url || fallback,
    imageAlt: getLocalizedValue(mainImage?.alt, currentLang) || tourTitle,
    allImages: allImages,
    title: tourTitle || "Tour",
    link: `/${currentLang}/${tourSlug}`,
    price: t.priceStartingFrom || t.price || 0,
    videoId: t.videoLink || "",
    discount: t.discount || "",
    description: getLocalizedValue(t?.cardDescription, currentLang) || getLocalizedValue(t?.Description?.text, currentLang) || "",
    meta: meta,
  };
};

const mapTours = (tours: any[], lang: 'en' | 'de' | 'it' | 'es') =>
  tours
    .map((t) => mapTourToItem(t, lang))
    .filter((item): item is FeatureTwoItem => item !== null);

const api: TourRelatedContentApi = {
  getToursByIds: (ids) => tourAPI.getByIds(ids),
  getBlogsByIds: (ids, locale) => getBlogsByIds(ids, locale),
  getToursBySubcategory: (subcategoryId, params) => tourAPI.getBySubcategory(subcategoryId, params),
  getTours: (params) => tourAPI.getAll(params),
  getFeaturedBlogs: (limit) => publicGet(`/blog/posts/featured?limit=${limit}`),
};

/**
 * The tour page's related content - curated related tours, "More Tours" and
 * related articles - loaded after hydration.
 *
 * This state lives in the component that renders those sections, NOT in the
 * page: when it arrived as page state, every visit re-rendered the whole tour
 * (and re-set every rich-text block's HTML) just to append three carousels.
 *
 * @param id    the URL slug; a change re-runs the lookups, as it always has
 * @param tour  the raw tour (the server-supplied one, or the client-fetched one)
 */
export const useTourRelatedContent = (id: string | undefined, tour: any) => {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || 'en') as 'en' | 'de' | 'it' | 'es';

  const [relatedTours, setRelatedTours] = useState<FeatureTwoItem[]>([]);
  const [moreTours, setMoreTours] = useState<FeatureTwoItem[]>([]);
  const [relatedBlogs, setRelatedBlogs] = useState<any[]>([]);

  // Keyed on the tour's id rather than the object: a refreshed server payload
  // for the same tour must not repeat the lookups.
  const tourKey = tour ? String(tour._id ?? '') : null;

  useEffect(() => {
    if (!tour) return;
    loadTourRelatedContent(tour, currentLang, api, RELATED_BLOGS_FALLBACK_LIMIT)
      .then((content) => {
        // Posts are stored raw and shaped into cards by buildBlogCardViewModels
        // at render time, so the tour page uses the same mapping as every
        // other blog card.
        setRelatedBlogs(content.relatedBlogs);
        setMoreTours(mapTours(content.moreTours, currentLang));
        setRelatedTours(mapTours(content.relatedTours, currentLang));
      })
      .catch((err) => {
        console.error("useTourData error:", err);
      });
    // `tour` is read through tourKey on purpose (see above).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentLang, tourKey]);

  return { relatedTours, moreTours, relatedBlogs };
};
