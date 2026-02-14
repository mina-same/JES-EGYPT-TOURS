import React from 'react';

interface TourStructuredDataProps {
  tour: {
    name: string;
    description: string;
    images: string[];
    priceStartingFrom: number;
    location: string;
    duration: string;
    tourType: string;
  };
  reviews: {
    averageRating: number;
    totalReviews: number;
  };
}

/**
 * Component that generates JSON-LD structured data for SEO
 * Implements schema.org TouristTrip and AggregateRating schemas
 */
export const TourStructuredData: React.FC<TourStructuredDataProps> = ({ tour, reviews }) => {
  // Strip HTML tags for structured data description
  const cleanDescription = tour.description.replace(/<[^>]*>?/gm, '').substring(0, 200);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "name": tour.name,
    "description": cleanDescription,
    "image": tour.images.filter(Boolean).slice(0, 5), // Max 5 images
    "touristType": tour.tourType,
    "itinerary": {
      "@type": "ItemList",
      "name": `${tour.name} Itinerary`,
      "description": `Detailed itinerary for ${tour.name}`
    },
    // ... rest of the logic remains the same
    "offers": {
      "@type": "Offer",
      "price": tour.priceStartingFrom,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "validFrom": new Date().toISOString(),
      "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
    },
    "provider": {
      "@type": "TravelAgency",
      "name": "JES Egypt Tours",
      "url": "https://jesegypttours.com"
    },
    "location": {
      "@type": "Place",
      "name": tour.location,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "EG"
      }
    },
    "duration": tour.duration,
    ...(reviews.totalReviews > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": reviews.averageRating.toFixed(1),
        "reviewCount": reviews.totalReviews,
        "bestRating": "5",
        "worstRating": "1"
      }
    })
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};
