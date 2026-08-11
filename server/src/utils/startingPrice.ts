const PRICE_TIERS = ['solo', 'pax_2_4', 'pax_5_8', 'pax_9_16'] as const;
const PRICE_CURRENCIES = ['USD', 'EUR', 'GBP'] as const;

type PriceCurrency = (typeof PRICE_CURRENCIES)[number];
type CurrencyAmount = Partial<Record<PriceCurrency, number>>;

/** Zero means "not priced yet", never "free". */
const isUsableAmount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

/**
 * The lowest quotable amount across a tour's pricing plans, per currency.
 *
 * Authoritative: the client sends whatever it likes, and this recomputes the
 * "from" price on every write so the headline number can never contradict the
 * table it is supposed to summarise. A tour was advertising $1200 on its card
 * while its own pricing plans said $100, because the two were typed
 * independently.
 *
 * Each currency is minimised over its own entries — converting a USD minimum
 * into EUR would quote a figure nobody set. A currency nobody priced is simply
 * absent rather than zero.
 *
 * Mirrored for live preview in client/src/lib/tours/startingPrice.ts. THIS is
 * the version that decides what gets stored.
 */
export const deriveStartingPrice = (
  pricingPlans: unknown
): CurrencyAmount | undefined => {
  if (!Array.isArray(pricingPlans)) return undefined;

  const lowest: CurrencyAmount = {};

  for (const plan of pricingPlans) {
    const seasons = (plan as { seasons?: unknown })?.seasons;
    if (!Array.isArray(seasons)) continue;

    for (const season of seasons) {
      const prices = (season as { prices?: Record<string, unknown> })?.prices;
      if (!prices || typeof prices !== 'object') continue;

      for (const tier of PRICE_TIERS) {
        const amounts = prices[tier] as CurrencyAmount | undefined;
        if (!amounts || typeof amounts !== 'object') continue;

        for (const currency of PRICE_CURRENCIES) {
          const value = amounts[currency];
          if (!isUsableAmount(value)) continue;
          const current = lowest[currency];
          if (current === undefined || value < current) lowest[currency] = value;
        }
      }
    }
  }

  return Object.keys(lowest).length > 0 ? lowest : undefined;
};
