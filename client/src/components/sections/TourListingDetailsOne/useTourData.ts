"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { tourAPI } from "@/lib/api/tour";
import { reviewsAPI } from "@/lib/api/reviews";
import { getBlogById } from "@/lib/api/blog";
import axiosInstance from "@/lib/api/axios";
import tourDetailsOneData from "@/data/tourDetailsOneData";
import { TourDetailsOneData } from "./types";
import { getLocalizedList } from "@/lib/localize";

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
    
    const tourSlug = getLocalizedValue(t?.slug);
    const tourTitle = getLocalizedValue(t?.heading) || t?.name || "";
    const fallback = 'https://placehold.co/600x400?text=No+Image';
    
    // Consolidate images for the gallery
    const rawImages = safeArray<any>(t?.images);
    const mainImage = rawImages[0] || {};
    const allImages = rawImages.map(img => img?.url).filter(Boolean);
    if (allImages.length === 0) allImages.push(fallback);

    // Build metadata for the card (Duration, Location, etc.)
    const meta = [];
    const dur = getLocalizedValue(t?.duration);
    if (dur) {
      meta.push({ id: 1, title: dur, icon: "icon-clock" });
    }
    const loc = getLocalizedValue(t?.tourLocation);
    if (loc) {
      meta.push({ id: 2, title: loc, icon: "icon-location" });
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
      rating: 5,
      reviews: t.reviewsCount || t.reviews?.length || 0,
      videoId: t.videoLink || "",
      discount: t.discount || "",
      meta: meta,
    };
  };

  const mapRawTourData = (tour: any, fetchedReviews: any[] = [], fetchedRelatedTours: any[] = []): TourDetailsOneData => {
    const tourId = tour._id;
    const sliderImages = safeArray<any>(tour.images)
      .map((img: any) => ({ 
        url: img?.url, 
        alt: getLocalizedValue(img?.alt),
        title: getLocalizedValue(img?.title) 
      }))
      .filter((img: any) => !!img.url);

    const galleryImages = safeArray<any>(tour.gallery)
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
      reviews: tour.reviewsCount || fetchedReviews.length,
      location: getLocalizedValue(tour.tourLocation) || "",
      activitiesType: getLocalizedValue(tour.tourType) || "",
      traveler: 10,
      activateDay: getLocalizedValue(tour.duration) || "",
      price: tour.priceStartingFrom || tour.price || 0,
      overviewTitle: getLocalizedValue(tour.Description?.header) || "Overview",
      topDestinations: "",
      sliderImages,
      highlightList: getLocalizedList(tour.tourHighlights, currentLang, "tourHighlights"),
      amenities: getLocalizedValue(tour.inclusion),
      amenitiesTwo: getLocalizedValue(tour.exclusion),
      whatToPack: getLocalizedList(tour.whatToPack, currentLang, "whatToPack"),
      notes: safeArray(tour.notes).map((n: any) => ({
        title: getLocalizedValue(n?.title),
        text: getLocalizedValue(n?.text),
      })),
      relatedTours: fetchedRelatedTours.map(mapTourToItem).filter(Boolean) as any[],
      comments: fetchedReviews.map((r: any) => ({
        name: r?.name || "Anonymous",
        date: r?.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        text: r?.comment || "",
        rating: r.rating || 5,
        avatar: r?.avatar || "https://placehold.co/100x100?text=User",
      })),
      images: galleryImages,
      // Strict locale lookup — no fallback to English.
      // Only include rows where the active locale has both question and answer.
      faqs: safeArray(tour.faqs)
        .map((f: any) => ({
          question: f?.question?.[currentLang] || '',
          answer:   f?.answer?.[currentLang]   || '',
        }))
        .filter(f => f.question && f.answer),
      map: tour.tourMapIframe?.match(/src="([^"]+)"/)?.[1] || "",
      itinerary: {
        generalDescription: getLocalizedValue(tour.itinerary?.generalDescription),
        days: safeArray(tour.itinerary?.days).map((d: any) => ({
          day: d?.day || 0,
          title: getLocalizedValue(d?.title),
          description: getLocalizedValue(d?.description),
          activities: safeArray(d?.activities).map((a: any) => ({
            heading: getLocalizedValue(a?.heading),
            description: getLocalizedValue(a?.description),
            image: a?.image?.url ? { 
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

  useEffect(() => {
    const fetchAll = async () => {
      if (!id && !initialRawTour) return;
      try {
        setLoading(true);

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
          reviewsAPI.getReviewsByTour(tourId),
          // Curated related tours (max 3)
          Promise.all(safeArray(tour.relatedTours).slice(0, 3).map(async (ref: any) => {
            try {
              const res = await tourAPI.getById(ref.id);
              return res?.success && res?.data ? res.data : null;
            } catch { return null; }
          })),
          // Curated blog references (max 3)
          Promise.all(safeArray(tour.blogReferences).slice(0, 3).map(async (ref: any) => {
            try {
              return await getBlogById(ref.id);
            } catch { return null; }
          })),
        ];

        // 3. Fallback "More Tours" Promise (try subcategory first)
        const moreToursRes = subId
          ? await tourAPI.getBySubcategory(String(subId), { limit: 12, isActive: true })
          : { success: false, data: [] };

        let fetchedMoreToursRaw = moreToursRes.success
          ? safeArray<any>(moreToursRes.data).filter((t: any) => t._id !== tourId)
          : [];

        // If subcategory count is low (< 9), try category fallback
        if (fetchedMoreToursRaw.length < 9 && catId) {
          const catMoreRes = await tourAPI.getAll({ 
            category: String(catId), 
            limit: 15, 
            isActive: true 
          });
          if (catMoreRes.success) {
            // Merge but unique by _id
            const catTours = safeArray<any>(catMoreRes.data).filter((t: any) => t._id !== tourId);
            const existingIds = new Set(fetchedMoreToursRaw.map(t => t._id));
            catTours.forEach(t => {
              if (!existingIds.has(t._id)) {
                fetchedMoreToursRaw.push(t);
              }
            });
          }
        }

        // Final fallback: if still < 9, show any other tours
        if (fetchedMoreToursRaw.length < 9) {
          const allMoreRes = await tourAPI.getAll({ 
            limit: 15, 
            isActive: true 
          });
          if (allMoreRes.success) {
            const allTours = safeArray<any>(allMoreRes.data).filter((t: any) => t._id !== tourId);
            const existingIds = new Set(fetchedMoreToursRaw.map(t => t._id));
            allTours.forEach(t => {
              if (!existingIds.has(t._id)) {
                fetchedMoreToursRaw.push(t);
              }
            });
          }
        }

        const [reviewsRes, relatedToursData, blogDataRaw] = await Promise.all(commonDataPromises);
        
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

        const fetchedReviews = reviewsRes.success ? safeArray<any>(reviewsRes.data) : [];
        const fetchedRelatedTours = safeArray(relatedToursData).filter(Boolean);

        // ── Consolidate mappings ──
        const mappedData = mapRawTourData(tour, fetchedReviews, fetchedRelatedTours);

        const mappedBlogs = fetchedRelatedBlogs.map((b: any) => {
          const blogTitle = getLocalizedValue(b?.title);
          const blogImageObj = (typeof b?.featuredImage === 'object' && b?.featuredImage !== null) ? b.featuredImage : {};

          return {
            id: b._id,
            title: blogTitle,
            slug: getLocalizedValue(b?.slug),
            excerpt: getLocalizedValue(b?.excerpt),
            image: typeof b?.featuredImage === 'string' ? b.featuredImage : (b?.featuredImage?.url || 'https://placehold.co/600x400?text=No+Image'),
            imageAlt: getLocalizedValue(blogImageObj?.alt) || blogTitle,
            imageTitle: getLocalizedValue(blogImageObj?.title) || "",
            date: b?.publishedAt || b?.createdAt || new Date().toISOString(),
            link: `/${currentLang}/${getLocalizedValue(b?.slug)}`,
            author: (b?.author as any)?.name || "Admin",
            category: getLocalizedValue(b?.category?.name) || "",
          };
        });

        setRelatedBlogs(mappedBlogs);
        setMoreTours(fetchedMoreToursRaw.map(mapTourToItem).filter(Boolean));
        setTourData(mappedData);
      } catch (err) {
        console.error("useTourData error:", err);
        setError("Failed to load tour details");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, currentLang]);

  return { tourData, loading, error, moreTours, relatedBlogs };
};
