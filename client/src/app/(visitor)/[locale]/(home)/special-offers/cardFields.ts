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
  // `reviews.url` and nothing more of the review: it is only read to decide
  // whether the card offers its video button, and the full review bodies would
  // dwarf everything else in this payload.
  "slug,heading,name,images,gallery,priceStartingFrom,videoLink,specialOfferDiscount,duration,tourLocation,subcategory,cardDescription,Description,reviews.url";
