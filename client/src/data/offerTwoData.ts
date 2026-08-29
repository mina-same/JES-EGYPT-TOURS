import shapeImage1 from '@/assets/images/shapes/shape-2-1.png';
import planImage from '@/assets/images/shapes/plan.png';

/**
 * Non-translatable config only.
 *
 * Every display string used to live here as an English literal — the title,
 * subtitle, tagline, CTA label, the "off"/"up to" words — so the whole Special
 * Offers band rendered in English on the German, Italian and Spanish
 * homepages. They now live in i18n/locales/*\/common.json under
 * "specialOffer.*", matching what aboutOne.ts already does.
 *
 * Also dropped: `buttonLink` ('tour-listing-details-1', a demo route OfferTwo
 * never read — it builds its own localized link) and `image` (a path that did
 * not exist on disk; the component references a different, real file).
 */
export const offerTwoData = {
  /** Drives the CountUp and the "%" that follows it. */
  count: 30,
  shapes: {
    shape1: shapeImage1,
    planShape: planImage,
  },
};
