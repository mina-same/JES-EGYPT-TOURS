import { tourAPI } from "@/lib/api/tour";
import { getLocalizedValue } from "@/lib/localize";
import { reviewsAPI } from "@/lib/api/reviews";
import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import TourListingOneDetails from "@/components/sections/TourListingDetailsOne/TourListingDetailsOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import { SlugManager } from "@/components/common/SlugManager";

interface PageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://jesegypttours.com";

function formatISO8601Duration(durationStr: string): string | undefined {
  if (!durationStr) return undefined;
  const lower = durationStr.toLowerCase();
  
  const daysMatch = lower.match(/(\d+)\s*(day|tag|giorno|día)/);
  const hoursMatch = lower.match(/(\d+)\s*(hour|stunde|ora|hora)/);
  
  if (daysMatch) return `P${daysMatch[1]}D`;
  if (hoursMatch) return `PT${hoursMatch[1]}H`;
  
  const justNumber = lower.match(/^(\d+)$/);
  if (justNumber) return `P${justNumber[1]}D`;

  return undefined;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  try {
    const res = await tourAPI.getBySlug(slug);
    if (!res?.success || !res?.data) {
      return { title: "Tour Not Found | JES Egypt Tours" };
    }

    const tour = res.data;
    const title = tour.metaTitle?.[locale as any] || tour.heading?.[locale as any] || tour.name || "Tour Details";
    const description = tour.metaDescription?.[locale as any] || tour.overview?.replace(/<[^>]*>/g, "").substring(0, 160);
    const image = tour.featuredImage?.url || tour.sliderImages?.[0];

    return {
      title: `${title} | JES Egypt Tours`,
      description,
      alternates: {
        canonical: `${baseUrl}/${locale}/tours/${slug}`,
        languages: {
          en: `${baseUrl}/en/tours/${tour.slug?.en || slug}`,
          de: `${baseUrl}/de/tours/${tour.slug?.de || slug}`,
          it: `${baseUrl}/it/tours/${tour.slug?.it || slug}`,
          es: `${baseUrl}/es/tours/${tour.slug?.es || slug}`,
        },
      },
      openGraph: {
        title,
        description,
        images: image ? [image] : [],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: image ? [image] : [],
      },
      robots: "noindex, nofollow",
    };
  } catch (error) {
    return { 
      title: "Tour Details | JES Egypt Tours",
      robots: "noindex, nofollow",
    };
  }
}

export default async function TourListingDetailsPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const res = await tourAPI.getBySlug(slug);

  if (!res?.success || !res?.data) {
    notFound();
  }

  const tour = res.data;
  
  // Seo Redirect
  const correctSlug = getLocalizedValue(tour.slug, locale);
  if (correctSlug && correctSlug !== slug && correctSlug !== '') {
    permanentRedirect(`/${locale}/tours/${correctSlug}`);
  }

  const tourId = tour._id;
  const name = tour.heading?.[locale as any] || tour.name || "Tour Details";

  // Fetch reviews on server for Schema
  let reviews: any[] = [];
  try {
    const reviewsRes = await reviewsAPI.getReviewsByTour(tourId);
    if (reviewsRes.success) {
      reviews = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];
    }
  } catch (e) {
    console.error("Failed to fetch reviews for schema:", e);
  }

  // Breadcrumbs logic
  const category = tour.category;
  const subcategory = tour.subcategory;
  const breadcrumbs: { label: string; href?: string }[] = [
    { label: "Destination", href: "/tours" },
  ];

  if (category?.name?.[locale as any] || category?.name) {
    breadcrumbs.push({
      label: (category.name?.[locale as any] || category.name) as string,
      href: category.slug ? `/tours/category/${getLocalizedValue(category.slug, locale)}` : undefined,
    });
  }

  if (subcategory?.name?.[locale as any] || subcategory?.name) {
    breadcrumbs.push({
      label: (subcategory.name?.[locale as any] || subcategory.name) as string,
      href: subcategory.slug ? `/tours/subcategory/${getLocalizedValue(subcategory.slug, locale)}` : undefined,
    });
  }
  breadcrumbs.push({ label: name as string });

  // Professional Tour Schema (JSON-LD)
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : "5.0";

  const durationStr = tour.duration?.[locale as any] || tour.duration?.en || "";
  const isoDuration = formatISO8601Duration(durationStr);

  const itinerarySteps = tour.itinerary?.days?.map((day: any) => ({
    "@type": "ItemList",
    "name": `Day ${day.day}: ${day.title?.[locale as any] || day.title?.en || ""}`,
    "description": day.description?.[locale as any] || day.description?.en || "",
    "itemListElement": day.activities?.map((act: any, idx: number) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": act.heading?.[locale as any] || act.heading?.en || "",
    }))
  })) || [];

  const mapUrl = tour.tourMapIframe?.match(/src="([^"]+)"/)?.[1];

  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": "Tour",
    "name": name,
    "description": (tour.overview?.[locale as any] || tour.overview?.en || tour.overview || "").replace(/<[^>]*>/g, ""),
    "image": [
      ...(tour.images?.map((img: any) => img.url) || []),
      ...(tour.gallery?.map((img: any) => img.url) || [])
    ].filter(Boolean),
    "tourDuration": isoDuration,
    "duration": isoDuration,
    "touristDestination": {
      "@type": "Place",
      "name": tour.tourLocation?.[locale as any] || tour.tourLocation?.en || ""
    },
    "touristType": tour.tourType?.[locale as any] || tour.tourType?.en || "",
    "itinerary": itinerarySteps,

    "offers": {
      "@type": "Offer",
      "price": tour.priceStartingFrom || tour.price,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": `${baseUrl}/${locale}/tours/${slug}`,
    },
    "provider": {
      "@type": "TravelAgency",
      "name": "JES Egypt Tours",
      "url": baseUrl,
      "@id": `${baseUrl}/#organization`
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${baseUrl}/${locale}/tours/${slug}`
    }
  };

  if (reviews.length > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": avgRating,
      "reviewCount": reviews.length,
      "bestRating": "5",
      "worstRating": "1"
    };
    jsonLd.review = reviews.slice(0, 5).map(r => ({
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": r.rating || 5
      },
      "author": {
        "@type": "Person",
        "name": r.name || "Anonymous"
      },
      "reviewBody": r.comment || ""
    }));
  }

  if (mapUrl) {
    jsonLd.hasMap = mapUrl;
  }

  return (
    <>
      <SlugManager slugs={tour.slug as any} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Layout>
        <TopbarOne />
        <HeaderOne linkTheme="light" />
        <HeaderOneCloned />
        <PageHeader
          title={name || "Tour Details"}
          breadcrumbs={breadcrumbs}
          bgImage={tour.featuredImage?.url || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwBz9RsGBZErQQOzYdoMyqX-6tjs_zUEuiJg&s"}
        />
        <TourListingOneDetails id={slug} />
        <FooterOne />
      </Layout>
    </>
  );
}



