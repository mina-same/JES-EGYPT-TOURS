import { useState, useEffect } from "react";
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
  const [tourData, setTourData] = useState<TourDetailsOneData>({ 
    ...tourDetailsOneData, 
    map: "" 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeArray = <T,>(value: any): T[] => (Array.isArray(value) ? value : []);
  const safeString = (value: any): string => (typeof value === 'string' ? value : '');
  const safeHtmlString = (value: any): string => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
      return safeString(value.html || value.text);
    }
    return '';
  };

  useEffect(() => {
    const fetchTourAndReviews = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const tourPromise = tourAPI.getById(id);
        const reviewsPromise = reviewsAPI.getReviewsByTour(id);
        
        const [tourResponse, reviewsResponse] = await Promise.all([tourPromise, reviewsPromise]);
        
        if (tourResponse.success && tourResponse.data) {
          const tour = tourResponse.data;
          const fetchedReviews = reviewsResponse.success ? safeArray<any>(reviewsResponse.data) : [];
          const sliderImages = safeArray<any>(tour.images)
            .map((img: any) => safeString(img?.url))
            .filter(Boolean);

          const galleryImages = safeArray<any>(tour.gallery)
            .map((img: any) => safeString(img?.url))
            .filter(Boolean);

          const fallbackImage = 'https://placehold.co/600x400?text=No+Image';

          const reviewVideos = safeArray<any>(tour.reviews)
            .map((r: any) => {
              const url = safeString(r?.url);
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
            highlightList: safeArray<string>(tour.tourHighlights),
            amenities: safeArray<string>(tour.inclusion),
            amenitiesTwo: safeArray<string>(tour.exclusion),
            relatedTours: safeArray<any>(tour.relatedTours).map((t: any) => ({
              id: t._id,
              image: safeString(t?.images?.[0]?.url) || fallbackImage,
              title: safeString(t?.name) || "Related Tour",
              link: `tours/${t._id}`,
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
                  image: safeString(a?.image?.url) ? { url: safeString(a?.image?.url) } : undefined
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
                  text: safeString(n?.text)
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
  }, [id]);

  return { tourData, loading, error };
};
