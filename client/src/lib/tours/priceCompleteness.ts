import { classifySeason, type SeasonKind } from './seasonKind';
import {
  PRICE_CURRENCIES,
  PRICE_TIERS,
  isUsableAmount,
  type CurrencyAmount,
  type PriceTier,
  type TierPrices,
} from './startingPrice';

/** Tier and season names as the pricing editor shows them. */
const TIER_LABELS: Record<PriceTier, string> = {
  solo: 'Solo',
  pax_2_4: '2-4 Pax',
  pax_5_8: '5-8 Pax',
  pax_9_16: '9-16 Pax',
};

const SEASON_LABELS: Record<SeasonKind, string> = {
  low: 'Low Season',
  regular: 'Regular Season',
  peak: 'Peak Season',
};

export interface PricedTour {
  priceStartingFrom?: CurrencyAmount | null;
  pricingPlans?: Array<{
    planName?: string;
    seasons?: Array<{ seasonName?: string; prices?: TierPrices }>;
  }> | null;
}

export interface PriceCompleteness {
  complete: boolean;
  /** One line per gap, in the order the pricing editor lists them. */
  missing: string[];
}

const unpricedCurrencies = (amounts: CurrencyAmount | null | undefined) =>
  PRICE_CURRENCIES.filter((currency) => !isUsableAmount(amounts?.[currency]));

/**
 * Whether a tour's prices are filled in: the starting price, and every group
 * size in every season of every plan — each in USD, EUR and GBP. Nothing else
 * (plan notes, hotels, discounts) is looked at, and a 0 counts as unpriced.
 */
export const getPriceCompleteness = (tour: PricedTour | null | undefined): PriceCompleteness => {
  const missing: string[] = [];

  const startingGaps = unpricedCurrencies(tour?.priceStartingFrom);
  if (startingGaps.length) missing.push(`Starting price: ${startingGaps.join(', ')}`);

  const plans = tour?.pricingPlans || [];
  if (plans.length === 0) missing.push('No pricing plans');

  plans.forEach((plan, planIndex) => {
    const planLabel = plan?.planName?.trim() || `Plan ${planIndex + 1}`;
    const seasons = plan?.seasons || [];
    if (seasons.length === 0) missing.push(`${planLabel}: no seasons`);

    seasons.forEach((season, seasonIndex) => {
      const kind = classifySeason(season?.seasonName);
      const seasonLabel = kind ? SEASON_LABELS[kind] : `Season ${seasonIndex + 1}`;
      const gaps: string[] = [];
      let unpricedCells = 0;

      for (const tier of PRICE_TIERS) {
        const currencies = unpricedCurrencies(season?.prices?.[tier]);
        unpricedCells += currencies.length;
        if (currencies.length === PRICE_CURRENCIES.length) gaps.push(TIER_LABELS[tier]);
        else if (currencies.length) gaps.push(`${TIER_LABELS[tier]} (${currencies.join(', ')})`);
      }

      if (!gaps.length) return;
      const allUnpriced = unpricedCells === PRICE_TIERS.length * PRICE_CURRENCIES.length;
      missing.push(`${planLabel} · ${seasonLabel}: ${allUnpriced ? 'no prices' : gaps.join(', ')}`);
    });
  });

  return { complete: missing.length === 0, missing };
};
