/**
 * Exact projection the offer cards need. Shared by the server-side first-page
 * fetch (page.tsx) and the client pagination/sort fetch (SpecialOffersView) so
 * the two can never drift — a field missing from one of them would silently
 * blank out card data after the first interaction.
 *
 * Keeps the list payload far smaller than full tour documents (the API accepts
 * a comma-separated field projection).
 */
export const CARD_FIELDS =
  "slug,heading,name,images,gallery,priceStartingFrom,reviewsCount,videoLink,specialOfferDiscount,duration,minAge,tourLocation";
