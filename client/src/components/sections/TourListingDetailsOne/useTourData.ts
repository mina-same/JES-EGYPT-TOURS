"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { tourAPI } from "@/lib/api/tour";
import { getBlogById } from "@/lib/api/blog";
import axiosInstance from "@/lib/api/axios";
import tourDetailsOneData from "@/data/tourDetailsOneData";
import { TourDetailsOneData } from "./types";
import { getDisplayName } from "@/lib/displayName";
import { getStrictLocalizedSlug } from "@/lib/url";

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


  // Map a tour object (raw or localized) to FeatureTwo item
  const mapTourToItem = (t: any) => {
    if (!t) return null;
    
    const tourSlug = getStrictLocalizedSlug(t?.slug, currentLang);
    if (!tourSlug) return null;
    const tourTitle = getLocalizedValue(t?.heading) || t?.name || "";
    const fallback = 'https://placehold.co/600x400?text=No+Image';
    
    // Consolidate images for the gallery
    const rawImages = safeArray<any>(t?.images);
    const mainImage = rawImages[0] || {};
    const allImages = rawImages.map(img => img?.url).filter(Boolean);
    if (allImages.length === 0) allImages.push(fallback);

    // Build metadata for the card (Location first — it gets its own row).
    const meta = [];
    const loc = getLocalizedValue(t?.tourLocation);
    if (loc) {
      meta.push({ id: 1, title: loc, icon: "icon-location" });
    }
    const dur = getLocalizedValue(t?.duration);
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
      imageAlt: getLocalizedValue(mainImage?.alt) || tourTitle,
      allImages: allImages,
      title: tourTitle || "Tour",
      link: `/${currentLang}/${tourSlug}`,
      price: t.priceStartingFrom || t.price || 0,
      videoId: t.videoLink || "",
      discount: t.discount || "",
      description: getLocalizedValue(t?.cardDescription) || getLocalizedValue(t?.Description?.text) || "",
      meta: meta,
    };
  };

  const mapRawTourData = (tour: any, fetchedRelatedTours: any[] = []): TourDetailsOneData => {
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
      location: getLocalizedValue(tour.tourLocation) || "",
      activitiesType: getLocalizedValue(tour.tourType) || "",
      activateDay: getLocalizedValue(tour.duration) || "",
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
      relatedTours: fetchedRelatedTours.map(mapTourToItem).filter(Boolean) as any[],
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
          activities: safeArray(d?.activities).map((a: any) => ({
            heading: getLocalizedValue(a?.heading),
            description: getLocalizedValue(a?.description),
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moreTours, setMoreTours] = useState<any[]>([]);
  const [relatedBlogs, setRelatedBlogs] = useState<any[]>([]);
  /**
   * Whether a real tour is available to render. True from the first render when
   * the server supplied one. The page uses this to decide whether a failure is
   * fatal: with content already on screen it never is.
   */
  const [hasTourContent, setHasTourContent] = useState<boolean>(Boolean(initialRawTour));

  useEffect(() => {
    const fetchAll = async () => {
      if (!id && !initialRawTour) return;
      try {
        // Only show the skeleton when there is genuinely nothing to show. The
        // server-rendered tour is already painted, so flipping `loading` here
        // used to tear the whole page down and rebuild it on every visit — a
        // visible flash, wasted SSR, and a fresh DOM that invalidated refs.
        if (!initialRawTour) setLoading(true);

        // 1. Use the server-fetched tour when available (avoids a redundant
        //    client getBySlug); otherwise fetch the main tour by slug (raw data).
        let tour: any;
        if (initialRawTour) {
          tour = initialRawTour;
        } else {
          if (!id) {
            setError("Failed to load tour details");
            return;
          }
          const tourRes = await tourAPI.getBySlug(id);
          if (!tourRes.success || !tourRes.data) {
            setError("Failed to load tour details");
            return;
          }
          tour = tourRes.data;
        }

        const tourId = tour._id;
        const getTourId = (value: any): string => {
          if (typeof value === 'string') return value;
          const valueId = value?.id ?? value?._id;
          return valueId == null ? '' : String(valueId);
        };
        const curatedRelatedTourIds = new Set(
          safeArray<any>(tour.relatedTours).map(getTourId).filter(Boolean)
        );
        const excludedMoreTourIds = new Set([
          ...(tourId ? [String(tourId)] : []),
          ...curatedRelatedTourIds,
        ]);
        const isEligibleMoreTour = (candidate: any) => {
          const candidateId = getTourId(candidate);
          return Boolean(candidateId) && !excludedMoreTourIds.has(candidateId);
        };

        // Ensure subcategory ID and Category ID
        const subId = typeof tour.subcategory === 'object'
          ? tour.subcategory?._id || tour.subcategory
          : tour.subcategory;

        // The subcategory object often contains the category ID
        const catId = typeof tour.subcategory === 'object' && tour.subcategory?.category
          ? (typeof tour.subcategory.category === 'object' ? tour.subcategory.category._id : tour.subcategory.category)
          : undefined;

        // 2. Curated Content Promises
        const commonDataPromises = [
          // Resolve every curated tour in one request. Rebuild the array in the
          // admin-selected order because MongoDB's `$in` query does not preserve it.
          (async () => {
            const selectedIds = Array.from(curatedRelatedTourIds);
            if (selectedIds.length === 0) return [];

            try {
              const res = await tourAPI.getByIds(selectedIds);
              if (!res?.success || !res?.data) return [];

              const toursById = new Map(
                safeArray<any>(res.data)
                  .filter((relatedTour) => relatedTour?.isActive !== false)
                  .map((relatedTour) => [getTourId(relatedTour), relatedTour])
              );

              return selectedIds
                .map((selectedId) => toursById.get(selectedId))
                .filter(Boolean);
            } catch {
              return [];
            }
          })(),
          // Curated blog references (max 3)
          Promise.all(safeArray(tour.blogReferences).slice(0, 3).map(async (ref: any) => {
            try {
              return await getBlogById(ref.id);
            } catch { return null; }
          })),
        ];

        // 3. Fallback "More Tours" (try subcategory, then category, then anything)
        //
        // Own try/catch on purpose. These three lookups feed ONE decorative
        // carousel, yet an unhandled rejection here used to jump straight to the
        // fatal catch below and blank a page whose real content had already
        // rendered. A failure now just leaves the section empty, and whatever was
        // collected before the throw is still used.
        const fetchedMoreToursRaw: any[] = [];
        try {
          const mergeUnique = (candidates: any[]) => {
            const existingIds = new Set(fetchedMoreToursRaw.map(getTourId).filter(Boolean));
            candidates.filter(isEligibleMoreTour).forEach((candidate) => {
              const candidateId = getTourId(candidate);
              if (candidateId && !existingIds.has(candidateId)) {
                fetchedMoreToursRaw.push(candidate);
                existingIds.add(candidateId);
              }
            });
          };

          const moreToursRes = subId
            ? await tourAPI.getBySubcategory(String(subId), { limit: 12, isActive: true })
            : { success: false, data: [] };
          if (moreToursRes.success) mergeUnique(safeArray<any>(moreToursRes.data));

          // If subcategory count is low (< 9), try category fallback
          if (fetchedMoreToursRaw.length < 9 && catId) {
            const catMoreRes = await tourAPI.getAll({
              category: String(catId),
              limit: 15,
              isActive: true
            });
            if (catMoreRes.success) mergeUnique(safeArray<any>(catMoreRes.data));
          }

          // Final fallback: if still < 9, show any other tours
          if (fetchedMoreToursRaw.length < 9) {
            const allMoreRes = await tourAPI.getAll({
              limit: 15,
              isActive: true
            });
            if (allMoreRes.success) mergeUnique(safeArray<any>(allMoreRes.data));
          }
        } catch (moreToursError) {
          console.warn('useTourData: "more tours" lookup failed; hiding that section only', moreToursError);
        }

        const [relatedToursData, blogDataRaw] = await Promise.all(commonDataPromises);
        
        // Final fallback for blogs: if no curated blogs, fetch featured blogs
        let fetchedRelatedBlogs = safeArray<any>(blogDataRaw).filter(Boolean);
        if (fetchedRelatedBlogs.length === 0) {
          try {
             const res = await axiosInstance.get('/blog/posts/featured?limit=3');
             if (res.data?.success) {
               fetchedRelatedBlogs = safeArray(res.data.data);
             }
          } catch { /* ignore */ }
        }

        const fetchedRelatedTours = safeArray(relatedToursData).filter(Boolean);

        // ── Consolidate mappings ──
        const mappedData = mapRawTourData(tour, fetchedRelatedTours);

        const mappedBlogs = fetchedRelatedBlogs.map((b: any) => {
          const blogSlug = getStrictLocalizedSlug(b?.slug, currentLang);
          if (!blogSlug) return null;
          const blogTitle = getLocalizedValue(b?.title);
          const blogImageObj = (typeof b?.featuredImage === 'object' && b?.featuredImage !== null) ? b.featuredImage : {};

          return {
            id: b._id,
            title: blogTitle,
            slug: blogSlug,
            excerpt: getLocalizedValue(b?.excerpt),
            image: typeof b?.featuredImage === 'string' ? b.featuredImage : (b?.featuredImage?.url || 'https://placehold.co/600x400?text=No+Image'),
            imageAlt: getLocalizedValue(blogImageObj?.alt) || blogTitle,
            imageTitle: getLocalizedValue(blogImageObj?.title) || "",
            date: b?.publishedAt || b?.createdAt || new Date().toISOString(),
            link: `/${currentLang}/${blogSlug}`,
            author: (b?.author as any)?.name || "Admin",
            category: getLocalizedValue(b?.category?.name) || "",
          };
        }).filter(Boolean);

        setRelatedBlogs(mappedBlogs);
        setMoreTours(fetchedMoreToursRaw.map(mapTourToItem).filter(Boolean));
        setTourData(mappedData);
        setHasTourContent(true);
      } catch (err) {
        console.error("useTourData error:", err);
        // Fatal ONLY when nothing is renderable. The tour itself comes from the
        // server, so a failure in this effect must not replace a page that
        // already displays correct content with an error screen — which is what
        // happened when any secondary request was blocked or timed out.
        if (!initialRawTour) setError("Failed to load tour details");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, currentLang]);

  return { tourData, loading, error, moreTours, relatedBlogs, hasTourContent };
};
