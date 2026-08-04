import re

with open('src/components/sections/TourListingDetailsOne/useTourData.ts', 'r') as f:
    content = f.read()

# Replace signature
content = content.replace("export const useTourData = (id?: string) => {", "export const useTourData = (id?: string, initialRawTour?: any) => {")

# Move safeArray up
content = content.replace("  const safeArray = <T,>(value: any): T[] => (Array.isArray(value) ? value : []);\n\n", "")
content = content.replace("  // Extract locale-specific value (handle raw object or pre-localized string)", "  const safeArray = <T,>(value: any): T[] => (Array.isArray(value) ? value : []);\n\n  // Extract locale-specific value (handle raw object or pre-localized string)")

# Extract mapRawTourData
map_raw_func = """
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
    
    const getLocalizedArray = (obj: any): any[] => {
      if (!obj) return [];
      if (Array.isArray(obj)) return obj.map(item => item[currentLang] || item.en || '').filter(Boolean);
      const current = safeArray(obj[currentLang]);
      if (current.length > 0) return current;
      return safeArray(obj.en);
    };

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
      activateDay: getLocalizedValue(tour.duration) || "",
      price: tour.priceStartingFrom || tour.price || 0,
      overviewTitle: getLocalizedValue(tour.Description?.header) || "Overview",
      topDestinations: "",
      sliderImages,
      highlightList: getLocalizedArray(tour.tourHighlights).map(h => String(h)).filter(Boolean),
      amenities: getLocalizedArray(tour.inclusion).map(i => String(i)).filter(Boolean),
      amenitiesTwo: getLocalizedArray(tour.exclusion).map(e => String(e)).filter(Boolean),
      whatToPack: getLocalizedArray(tour.whatToPack).map(w => String(w)).filter(Boolean),
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
      faqs: safeArray(tour.faqs).map((f: any) => ({
        question: getLocalizedValue(f?.question),
        answer: getLocalizedValue(f?.answer),
      })).filter(f => f.question || f.answer),
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
"""

# Replace useState
state_regex = r"  const \[tourData, setTourData\] = useState<TourDetailsOneData>\(\{\n    \.\.\.tourDetailsOneData,\n    map: \"\",\n  \}\);"
content = re.sub(state_regex, map_raw_func, content)

# Remove the old mapping logic and replace with mapRawTourData call
# Find the start of consolidation
start_idx = content.find("        // ── Consolidate mappings ──")
end_idx = content.find("        const mappedBlogs = fetchedRelatedBlogs.map((b: any) => {")

if start_idx != -1 and end_idx != -1:
    new_mapping = "        // ── Consolidate mappings ──\n        const mappedData = mapRawTourData(tour, fetchedReviews, fetchedRelatedTours);\n\n"
    content = content[:start_idx] + new_mapping + content[end_idx:]

with open('src/components/sections/TourListingDetailsOne/useTourData.ts', 'w') as f:
    f.write(content)

