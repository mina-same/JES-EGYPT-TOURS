import { getDisplayName } from '@/lib/displayName';
import { getLocalizedValue } from '@/lib/localize';
import { TOUR_IMAGE_PLACEHOLDER } from '@/lib/images/placeholders';
import { getStrictLocalizedSlug, type SupportedLocale } from '@/lib/url';
import { getTourReviewVideoIds } from '@/lib/video/youtube';

interface TourCardFallbacks {
  location: string;
  duration: string;
}

/**
 * Convert the compact list API shape to the common TourCard shape. A string
 * slug is accepted here because list responses are locale-scoped; object
 * slugs still use the strict locale lookup to avoid cross-language links.
 */
export const mapApiTourToCard = (
  tour: any,
  locale: string,
  fallbacks: TourCardFallbacks
) => {
  const stringSlug = typeof tour?.slug === 'string' ? tour.slug.trim() : '';
  const tourSlug = stringSlug || getStrictLocalizedSlug(tour?.slug, locale as SupportedLocale);
  if (!tourSlug) return null;

  const galleryImages = [
    ...(tour.images || []).map((image: any) => image?.url),
    ...(tour.gallery || []).map((image: any) => image?.url),
  ].filter(Boolean) as string[];
  const uniqueImages = Array.from(new Set(galleryImages));

  return {
    id: tour._id,
    slug: tourSlug,
    image: uniqueImages[0] || TOUR_IMAGE_PLACEHOLDER,
    imageAlt: getLocalizedValue(tour.images?.[0]?.alt || tour.gallery?.[0]?.alt, locale),
    allImages: uniqueImages.length ? uniqueImages : [TOUR_IMAGE_PLACEHOLDER],
    title: getLocalizedValue(tour.heading, locale) || getLocalizedValue(tour.name, locale),
    link: `/${locale}/${tourSlug}`,
    price: tour.priceStartingFrom || { USD: 0 },
    videoId: tour.videoLink || '',
    videoIds: getTourReviewVideoIds(tour.reviews),
    discount: '',
    description:
      getLocalizedValue(tour.cardDescription, locale) ||
      getLocalizedValue(tour.Description?.text, locale) ||
      '',
    meta: [
      { id: 1, title: getLocalizedValue(tour.tourLocation, locale) || fallbacks.location, icon: 'icon-location' },
      { id: 2, title: getLocalizedValue(tour.duration, locale) || fallbacks.duration, icon: 'icon-clock' },
      ...(getDisplayName(tour.subcategory, locale)
        ? [{ id: 4, title: getDisplayName(tour.subcategory, locale), icon: 'icon-flag' }]
        : []),
    ],
  };
};

