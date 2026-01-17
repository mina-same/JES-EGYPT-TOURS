import { useState, useEffect } from "react";
import { tourAPI } from "@/lib/api/tour";
import tourDetailsOneData from "@/data/tourDetailsOneData";
import { TourDetailsOneData } from "./types";

export const useTourData = (id?: string) => {
  const [tourData, setTourData] = useState<TourDetailsOneData>({ 
    ...tourDetailsOneData, 
    map: "" 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTour = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await tourAPI.getById(id);
        
        if (response.success && response.data) {
          const tour = response.data;
          
          // Map API data to component structure
          const mappedData: TourDetailsOneData = {
            title: tour.heading || tour.name || "",
            titleTwo: tour.name || "",
            overview: tour.Description?.text || tour.overview || "",
            reviews: tour.reviews?.length || 0,
            location: tour.tourLocation || "",
            activitiesType: tour.tourType || "",
            traveler: 10,
            activateDay: tour.duration || "",
            price: tour.priceStartingFrom || 0,
            overviewTitle: tour.Description?.header || "Overview",
            topDestinations: "",
            sliderImages: tour.images?.map((img: any) => img.url) || [],
            highlightList: tour.tourHighlights || [],
            amenities: tour.inclusion || [],
            amenitiesTwo: tour.exclusion || [],
            relatedTours: tour.relatedTours?.map((t: any) => ({
              id: t._id,
              image: t.images?.[0]?.url || "https://placehold.co/600x400?text=No+Image",
              title: t.name || "Related Tour",
              link: `tours/${t._id}`,
              price: t.priceStartingFrom,
              rating: 5,
              reviews: 0,
              videoId: "",
              discount: "",
              meta: []
            })) || [],
            comments: tour.reviews?.map((r: any) => ({
              name: r.name || "Anonymous",
              date: new Date(r.createdAt).toLocaleDateString(),
              text: r.comment,
              avatar: r.avatar || "https://placehold.co/100x100?text=User"
            })) || [],
            images: tour.gallery?.map((img: any) => img.url) || [],
            faqs: tour.faqs?.map((f: any) => ({
              question: f.question,
              answer: typeof f.answer === 'string' ? f.answer : (f.answer?.html || f.answer?.text || "")
            })) || [],
            map: tour.tourMapIframe?.match(/src="([^"]+)"/)?.[1] || "",
            itinerary: {
              generalDescription: tour.itinerary?.generalDescription?.html || tour.itinerary?.generalDescription || "",
              days: tour.itinerary?.days?.map((d: any) => ({
                day: d.day,
                title: d.title.replace(/^Day\s*\d+[:\s-]*/i, ""),
                description: d.description?.html || d.description || "",
                activities: d.activities?.map((a: any) => ({
                  heading: a.heading,
                  description: a.description?.html || a.description || "",
                  image: a.image ? { url: a.image.url } : undefined
                })) || []
              })) || []
            },
            pricingPlans: tour.pricingPlans?.map((plan: any) => ({
              planName: plan.planName,
              seasons: plan.seasons?.map((season: any) => ({
                seasonName: season.seasonName,
                startDate: season.startDate,
                endDate: season.endDate,
                prices: season.prices,
                notes: season.notes
              })) || []
            })) || [],
            whatYouWillLoveHtml: tour.whatYouWillLoveHtml || "",
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

    fetchTour();
  }, [id]);

  return { tourData, loading, error };
};
