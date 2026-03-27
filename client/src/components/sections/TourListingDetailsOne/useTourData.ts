import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { tourAPI } from "@/lib/api/tour";
import { reviewsAPI } from "@/lib/api/reviews";
import tourDetailsOneData from "@/data/tourDetailsOneData";
import { TourDetailsOneData } from "./types";

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

export const useTourData = (id?: string) => {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || 'en') as 'en' | 'de' | 'it';

  const [tourData, setTourData] = useState<TourDetailsOneData>({ 
    ...tourDetailsOneData, 
    map: "" 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeArray = <T,>(value: any): T[] => (Array.isArray(value) ? value : []);
  
  const safeString = (value: any): string => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
      return value[currentLang] || value.en || '';
    }
    return '';
  };

  const safeHtmlString = (value: any): string => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
      // Handle LocalizedMixed or LocalizedString
      return value[currentLang] || value.en || '';
    }
    return '';
  };

  useEffect(() => {
    const fetchTourAndReviews = async () => {
      if (!id) return; // Note: 'id' variable here is actually the slug from params

      try {
        setLoading(true);
        // Fetch tour by slug
        const tourResponse = await tourAPI.getBySlug(id);
        
        if (tourResponse.success && tourResponse.data) {
          const tour = tourResponse.data;
          const tourId = tour._id; // Real ID for reviews and related tours

          const reviewsPromise = reviewsAPI.getReviewsByTour(tourId);
          const relatedToursPromise = tourAPI.getRelated(tourId, 6);
          
          const [reviewsResponse, relatedToursResponse] = await Promise.all([reviewsPromise, relatedToursPromise]);
          
          const fetchedReviews = reviewsResponse.success ? safeArray<any>(reviewsResponse.data) : [];
          const fetchedRelatedTours = relatedToursResponse.success ? safeArray<any>(relatedToursResponse.data) : [];
          const sliderImages = safeArray<any>(tour.images)
            .map((img: any) => ({ url: img?.url, alt: safeString(img?.alt) }))
            .filter((img: any) => !!img.url);

          const galleryImages = safeArray<any>(tour.gallery)
            .map((img: any) => ({ url: img?.url, alt: safeString(img?.alt) }))
            .filter((img: any) => !!img.url);

          const fallbackImage = 'https://placehold.co/600x400?text=No+Image';

          const reviewVideos = safeArray<any>(tour.reviews)
            .map((r: any) => {
              const url = typeof r?.url === 'string' ? r.url : '';
              const videoId = getYouTubeVideoId(url);
              return {
                title: safeString(r?.title) || 'Review',
                url,
                videoId,
              };
            })
            .filter((v: any) => v.url && v.videoId);

          // Map API data to component structure
          const mappedData: TourDetailsOneData = {
            id: tourId,
            title: safeString(tour.heading) || safeString(tour.name) || "",
            titleTwo: safeString(tour.name) || "",
            overview: safeHtmlString(tour.Description?.text) || safeHtmlString(tour.overview) || "",
            reviews: fetchedReviews.length,
            location: safeString(tour.tourLocation) || "",
            activitiesType: safeString(tour.tourType) || "",
            traveler: 10,
            activateDay: safeString(tour.duration) || "",
            price: typeof tour.priceStartingFrom === 'number' ? tour.priceStartingFrom : 0,
            overviewTitle: safeString(tour.Description?.header) || "Overview",
            topDestinations: "",
            sliderImages,
            highlightList: safeArray<any>(tour.tourHighlights).map(h => safeString(h)).filter(Boolean),
            amenities: safeArray<any>(tour.inclusion).map(i => safeString(i)).filter(Boolean),
            amenitiesTwo: safeArray<any>(tour.exclusion).map(e => safeString(e)).filter(Boolean),
            relatedTours: fetchedRelatedTours.map((t: any) => ({
              id: t._id,
              image: t?.images?.[0]?.url || fallbackImage,
              imageAlt: safeString(t?.images?.[0]?.alt) || safeString(t?.name),
              title: safeString(t?.name) || "Related Tour",
              link: `/${currentLang}/${safeString(t.slug)}`,
              price: t.priceStartingFrom,
              rating: 5,
              reviews: 0,
              videoId: "",
              discount: "",
              meta: []
            })),
            comments: safeArray<any>(fetchedReviews).map((r: any) => ({
              name: safeString(r?.name) || "Anonymous",
              date: r?.createdAt ? new Date(r.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
              text: safeString(r?.comment),
              rating: r.rating || 5, // Map rating
              avatar: safeString(r?.avatar) || "https://placehold.co/100x100?text=User"
            })),
            images: galleryImages,
            faqs: safeArray<any>(tour.faqs).map((f: any) => ({
              question: safeString(f?.question),
              answer: safeHtmlString(f?.answer)
            })).filter((f: any) => f.question || f.answer),
            map: safeString(tour.tourMapIframe)?.match(/src="([^"]+)"/)?.[1] || "",
            itinerary: {
              generalDescription: safeHtmlString(tour.itinerary?.generalDescription),
              days: safeArray<any>(tour.itinerary?.days).map((d: any) => ({
                day: typeof d?.day === 'number' ? d.day : 0,
                title: safeString(d?.title).replace(/^Day\s*\d+[:\s-]*/i, ""),
                description: safeHtmlString(d?.description),
                activities: safeArray<any>(d?.activities).map((a: any) => ({
                  heading: safeString(a?.heading),
                  description: safeHtmlString(a?.description),
                  image: a?.image?.url ? { url: a.image.url, alt: safeString(a.image.alt) } : undefined
                }))
              }))
            },
            pricingPlans: safeArray<any>(tour.pricingPlans).map((plan: any) => ({
              planName: safeString(plan?.planName),
              seasons: safeArray<any>(plan?.seasons).map((season: any) => ({
                seasonName: safeString(season?.seasonName),
                startDate: safeString(season?.startDate),
                endDate: safeString(season?.endDate),
                prices: season?.prices || {},
                notes: safeArray<any>(season?.notes).map((n: any) => ({
                  title: safeString(n?.title),
                  text: safeHtmlString(n?.text)
                }))
              }))
            })),
            whatYouWillLoveHtml: safeHtmlString(tour.whatYouWillLoveHtml),
            reviewVideos,
          };

          setTourData(mappedData);
        } else {
          setError("Failed to load tour details");
        }
      } catch (err) {
        console.error("Error fetching tour:", err);
        setError("An error occurred while loading tour details");
      } finally {
        setLoading(false);
      }
    };

    fetchTourAndReviews();
  }, [id, currentLang]);

  return { tourData, loading, error };
};
