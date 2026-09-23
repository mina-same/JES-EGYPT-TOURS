import type { ICurrencyPrice } from "@/contexts/CurrencyContext";
import type { TourCardMeta } from "@/components/common/TourCard/TourCard";

/**
 * One card in a FeatureTwo carousel — the single definition of the contract
 * every caller of that component satisfies.
 *
 * ── What it replaced ──
 * THREE interfaces described this same shape and disagreed with each other:
 * `FeaturePackageItem` in FeatureTwo.tsx, another of the same name in
 * FeaturedToursSection.tsx, and `Item` in TourListingDetailsOne/types.ts. They
 * differed on `id` (`string` against `number | string`), on `image` (`string`
 * against `StaticImageData | string`), on which fields were optional, and most
 * importantly on `price` — `number | ICurrencyPrice` in one, `string | number`
 * in the other two. The mismatch was bridged with `tours as any`, which
 * switched off type checking across the boundary entirely, and with an
 * `as any[]` where relatedTours was built.
 *
 * ── Why these types ──
 * `price` is what CurrencyContext.getPriceValue actually accepts: a number or
 * a per-currency object, never a string. The `string` member existed only for
 * demo fixtures holding values like "$59.00", which `parseFloat` turned into
 * NaN — no live caller ever produced one.
 *
 * Optional fields are optional because real callers omit them: the wishlist
 * page sends no `images`/`videoIds`/`description`, and the tour detail page
 * sends `allImages`/`slug`/`imageAlt` instead. All of those reach TourCard
 * through FeatureTwo's spread, so they belong in the declared shape rather
 * than travelling undeclared.
 *
 * It lives in its own module because four files consume it — including
 * TourListingDetailsOne/types.ts, and a pure type module importing from a
 * .tsx component would invert the dependency.
 */
export interface FeatureTwoItem {
  id: string;
  image: string;
  title: string;
  link: string;
  /** Never a string — see the note above. */
  price: number | ICurrencyPrice;
  /** Empty string when the tour has no video; that is what hides the button. */
  videoId: string;
  meta: TourCardMeta[];
  /** Gallery images — `allImages` on listing pages, `images` in carousels. */
  images?: string[];
  allImages?: string[];
  videoIds?: string[];
  discount?: string;
  description?: string;
  slug?: string;
  imageAlt?: string;
}
