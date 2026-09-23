import shape from "@/assets/images/shapes/love-1-2.png";

/**
 * Default heading, span and decorative shape for the FeatureTwo carousel.
 *
 * The `items` array is gone: it was four demo tours with string prices
 * ("$59.00", which parseFloat turned into NaN), invented ratings, and links
 * to `tour-listing-details-2`, a route that does not exist. FeatureTwo used
 * it only when `tours` was omitted, and `tours` is required now.
 */
export const featurePackageData = {
  title: "Most Popular",
  title2: "Feature",
  titleSpan: "Tours",
  titleSpan2: "Packages",
  subtitle: "Popular tours",
  shape: shape,
};
