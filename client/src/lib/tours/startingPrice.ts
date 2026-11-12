import { roundConvertedPrice } from '../currency/priceFormat';

/** The four group-size tiers a season can be priced for. */
export const PRICE_TIERS = ['solo', 'pax_2_4', 'pax_5_8', 'pax_9_16'] as const;
export type PriceTier = (typeof PRICE_TIERS)[number];

/** The currencies a price may be entered in. */
export const PRICE_CURRENCIES = ['USD', 'EUR', 'GBP'] as const;
export type PriceCurrency = (typeof PRICE_CURRENCIES)[number];

export type CurrencyAmount = Partial<Record<PriceCurrency, number>>;

/** The tier map as every caller actually holds it. Written as optional known
 *  keys rather than an index signature so the concrete `Prices` interface on
 *  the tour types satisfies it without a cast. */
export type TierPrices = Partial<Record<PriceTier, CurrencyAmount | undefined>>;

/** A real, quotable amount. Zero means "not priced yet", not "free": nothing on
 *  this site is given away, and a 0 in the data is always an unfilled field. */
export const isUsableAmount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

export const isPlausibleCurrencyAmount = (
  currency: PriceCurrency,
  value: number,
  amounts: CurrencyAmount
): boolean => {
  if (currency === 'USD' || !isUsableAmount(amounts.USD)) return true;
  const ratio = value / amounts.USD;
  return ratio >= 0.1 && ratio <= 10;
};

/**
 * The lowest quotable amount in a set of pricing plans, per currency.
 *
 * Each currency is minimised over its OWN entries rather than converting: the
 * admin types real per-currency prices, and picking the USD minimum and then
 * converting it would quote a number nobody set. A currency nobody priced is
 * left out entirely instead of defaulting to zero.
 *
 * This is what the "from" price on the tour card and the booking form should be
 * — derived, not typed a second time. Typing it separately is how a card came
 * to advertise $1200 while the table underneath it said $100.
 */
export const deriveStartingPrice = (
  pricingPlans: Array<{ seasons?: Array<{ prices?: TierPrices }> }> | null | undefined
): CurrencyAmount | undefined => {
  const lowest: CurrencyAmount = {};

  for (const plan of pricingPlans || []) {
    for (const season of plan?.seasons || []) {
      for (const tier of PRICE_TIERS) {
        const amounts = season?.prices?.[tier];
        if (!amounts || typeof amounts !== 'object') continue;

        for (const currency of PRICE_CURRENCIES) {
          const value = amounts[currency];
          if (!isUsableAmount(value)) continue;
          if (!isPlausibleCurrencyAmount(currency, value, amounts)) continue;
          const current = lowest[currency];
          if (current === undefined || value < current) lowest[currency] = value;
        }
      }
    }
  }

  return Object.keys(lowest).length > 0 ? lowest : undefined;
};

/** Whether a season has anything worth showing a visitor. */
export const seasonHasPrices = (season: { prices?: TierPrices } | null | undefined): boolean =>
  PRICE_TIERS.some((tier) => {
    const amounts = season?.prices?.[tier];
    return !!amounts && PRICE_CURRENCIES.some((c) => isUsableAmount(amounts[c]));
  });

/** Whether a plan has any priced season. An unpriced plan gets no tab. */
export const planHasPrices = (plan: { seasons?: Array<{ prices?: TierPrices }> } | null | undefined): boolean =>
  (plan?.seasons || []).some(seasonHasPrices);

/**
 * The amount one group-size tier is SHOWN at in `currency`: the price typed for
 * that currency exactly as entered, otherwise the USD price converted at
 * `usdRate` (units of `currency` per dollar) and rounded by the site's one
 * rule for converted prices (nearest 5, lib/currency/priceFormat.ts). 0 when
 * the tier is unpriced.
 *
 * The pricing table's rows, its plan and season "from" labels, the tour
 * page's starting price and the tour JSON-LD Offers all read this one
 * function, so a "from" price can never differ from the cheapest row and the
 * schema price is always the number on the page.
 */
export const tierDisplayAmount = (
  amounts: CurrencyAmount | null | undefined,
  currency: PriceCurrency,
  usdRate: number
): number => {
  if (!amounts || typeof amounts !== 'object') return 0;
  const typed = amounts[currency];
  if (isUsableAmount(typed) && isPlausibleCurrencyAmount(currency, typed, amounts)) return typed;
  if (currency === 'USD' || !isUsableAmount(amounts.USD)) return 0;
  return roundConvertedPrice(amounts.USD * usdRate);
};

/** The cheapest amount the pricing table shows in `currency` for these plans, or 0. */
export const lowestDisplayAmount = (
  pricingPlans: Array<{ seasons?: Array<{ prices?: TierPrices }> }> | null | undefined,
  currency: PriceCurrency,
  usdRate: number
): number => {
  let lowest = 0;
  for (const plan of pricingPlans || []) {
    for (const season of plan?.seasons || []) {
      for (const tier of PRICE_TIERS) {
        const value = tierDisplayAmount(season?.prices?.[tier], currency, usdRate);
        if (value > 0 && (lowest === 0 || value < lowest)) lowest = value;
      }
    }
  }
  return lowest;
};

/**
 * The tour page's starting price in every currency, taken from the rows the
 * pricing table shows (typed amounts as they are, missing ones converted from
 * USD). Undefined when nothing is priced, so the caller keeps the stored
 * `priceStartingFrom`.
 *
 * The stored value is the minimum of TYPED amounts only, so a tier priced in
 * USD alone could show a lower converted row than the stored EUR "from".
 */
export const displayStartingPrice = (
  pricingPlans: Array<{ seasons?: Array<{ prices?: TierPrices }> }> | null | undefined,
  rates: Record<PriceCurrency, number>
): Record<PriceCurrency, number> | undefined => {
  const lowest = {
    USD: lowestDisplayAmount(pricingPlans, 'USD', 1),
    EUR: lowestDisplayAmount(pricingPlans, 'EUR', rates.EUR),
    GBP: lowestDisplayAmount(pricingPlans, 'GBP', rates.GBP),
  };
  return lowest.USD > 0 || lowest.EUR > 0 || lowest.GBP > 0 ? lowest : undefined;
};
