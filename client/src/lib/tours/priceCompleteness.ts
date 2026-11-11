import { planLabelEn } from './planLabelsEn';
import { classifySeason, type SeasonKind } from './seasonKind';
import {
  PRICE_CURRENCIES,
  PRICE_TIERS,
  isUsableAmount,
  type CurrencyAmount,
  type PriceCurrency,
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

type PricedPlan = {
  planName?: string;
  seasons?: Array<{ seasonName?: string; prices?: TierPrices }>;
};

export interface PricedTour {
  priceStartingFrom?: CurrencyAmount | null;
  pricingPlans?: PricedPlan[] | null;
}

export interface PriceCompleteness {
  complete: boolean;
  /** One line per gap, in the order the pricing editor lists them. */
  missing: string[];
}

const unpricedCurrencies = (amounts: CurrencyAmount | null | undefined) =>
  PRICE_CURRENCIES.filter((currency) => !isUsableAmount(amounts?.[currency]));

/** A plan as staff read it: its display label ("AFFORDABLE" → Comfort), or its position. */
const planLabelOf = (plan: PricedPlan | null | undefined, planIndex: number) =>
  planLabelEn(plan?.planName?.trim()) || `Plan ${planIndex + 1}`;

/** A season as the editor's header names it, or its position when unrecognised. */
const seasonLabelOf = (seasonName: string | undefined, seasonIndex: number) => {
  const kind = classifySeason(seasonName);
  return kind ? SEASON_LABELS[kind] : `Season ${seasonIndex + 1}`;
};

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
    const planLabel = planLabelOf(plan, planIndex);
    const seasons = plan?.seasons || [];
    if (seasons.length === 0) missing.push(`${planLabel}: no seasons`);

    seasons.forEach((season, seasonIndex) => {
      const seasonLabel = seasonLabelOf(season?.seasonName, seasonIndex);
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

/** One price cell the save rule needs and the editor does not have. */
export interface MissingPriceCell {
  planIndex: number;
  seasonIndex: number;
  tier: PriceTier;
  currency: PriceCurrency;
  /** The form path of the cell, e.g. `pricingPlans.0.seasons.1.prices.pax_2_4.EUR`. */
  path: string;
  /** e.g. "Comfort / Low Season / 2-4 Pax: EUR price missing". */
  message: string;
}

/**
 * The save rule for a tour's price tables, applied per pricing plan:
 *
 * - a plan with no price at all is allowed (staff may publish before sales
 *   have priced it);
 * - otherwise USD is filled for every group size in every season;
 * - EUR and GBP are each either filled for every group size in every season,
 *   or left empty everywhere in that plan. A half-filled currency would show
 *   typed prices next to converted ones, so a "from" price and the rows could
 *   disagree.
 *
 * Every group size is always sold, so there is no "not available" cell, and a
 * 0 or empty cell counts as empty — the meaning the visitor pages give it.
 * Returns one entry per missing cell, plan by plan, season by season, in the
 * editor's group-size order, USD before EUR before GBP.
 */
export const getMissingPriceCells = (plans: PricedPlan[] | null | undefined): MissingPriceCell[] => {
  const missing: MissingPriceCell[] = [];

  (plans || []).forEach((plan, planIndex) => {
    const seasons = plan?.seasons || [];
    const isFilled = (amounts: CurrencyAmount | undefined, currency: PriceCurrency) =>
      isUsableAmount(amounts?.[currency]);
    const anyFilled = (currency: PriceCurrency) =>
      seasons.some((season) => PRICE_TIERS.some((tier) => isFilled(season?.prices?.[tier], currency)));

    // Which currencies this plan must have in every cell.
    const required = PRICE_CURRENCIES.filter((currency) => anyFilled(currency));
    if (required.length === 0) return; // no prices at all: allowed
    if (!required.includes('USD')) required.unshift('USD');

    const planLabel = planLabelOf(plan, planIndex);
    seasons.forEach((season, seasonIndex) => {
      const seasonLabel = seasonLabelOf(season?.seasonName, seasonIndex);
      for (const tier of PRICE_TIERS) {
        for (const currency of required) {
          if (isFilled(season?.prices?.[tier], currency)) continue;
          missing.push({
            planIndex,
            seasonIndex,
            tier,
            currency,
            path: `pricingPlans.${planIndex}.seasons.${seasonIndex}.prices.${tier}.${currency}`,
            message: `${planLabel} / ${seasonLabel} / ${TIER_LABELS[tier]}: ${currency} price missing`,
          });
        }
      }
    });
  });

  return missing;
};
