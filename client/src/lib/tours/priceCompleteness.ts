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

/**
 * A price the save rule needs and the editor does not have: one cell, or —
 * when another plan of the tour has a currency this plan has nowhere — that
 * currency for the whole plan (one entry, not one per empty cell).
 */
export type MissingPriceCell =
  | {
      scope: 'cell';
      planIndex: number;
      seasonIndex: number;
      tier: PriceTier;
      currency: PriceCurrency;
      /** e.g. `pricingPlans.0.seasons.1.prices.pax_2_4.EUR`. */
      path: string;
      /** e.g. "Comfort / Low Season / 2-4 Pax: EUR price missing". */
      message: string;
    }
  | {
      scope: 'plan';
      planIndex: number;
      currency: PriceCurrency;
      /** e.g. `pricingPlans.0.currencies.EUR` — the plan, for marks and scrolling. */
      path: string;
      /** e.g. "Comfort: EUR prices missing (Gold (5 Star Standard) has EUR prices, so every priced plan needs them)". */
      message: string;
      /** The priced plans that have this currency, by label. */
      requiredBy: string[];
    };

/** "A", "A and B", "A, B and C". */
const listLabels = (labels: string[]) =>
  labels.length < 2 ? labels.join('') : `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;

/**
 * The save rule for a tour's price tables. Plans with no price at all are
 * ignored (staff may publish before sales have priced them). For the priced
 * plans:
 *
 * - USD is filled for every group size in every season of every priced plan;
 * - per plan, EUR and GBP are each filled in every cell or in none — a
 *   half-filled currency would show typed prices next to converted ones, so a
 *   "from" price and the rows could disagree;
 * - per tour, EUR and GBP are each in every priced plan or in none of them:
 *   a currency typed in one plan and converted in another makes the plans'
 *   prices, and the tour's "from" price, rest on two different sources.
 *
 * Every group size is always sold, so there is no "not available" cell, and a
 * 0 or empty cell counts as empty — the meaning the visitor pages give it.
 * Returns, plan by plan: a single entry for a currency the plan lacks
 * entirely while another plan has it, then one entry per missing cell
 * (season by season, in the editor's group-size order, USD before EUR before
 * GBP).
 */
export const getMissingPriceCells = (plans: PricedPlan[] | null | undefined): MissingPriceCell[] => {
  const missing: MissingPriceCell[] = [];
  const list = plans || [];

  const isFilled = (amounts: CurrencyAmount | undefined, currency: PriceCurrency) =>
    isUsableAmount(amounts?.[currency]);
  const planHas = (plan: PricedPlan | null | undefined, currency: PriceCurrency) =>
    (plan?.seasons || []).some((season) => PRICE_TIERS.some((tier) => isFilled(season?.prices?.[tier], currency)));
  const isPriced = (plan: PricedPlan | null | undefined) =>
    PRICE_CURRENCIES.some((currency) => planHas(plan, currency));

  // Which plans of the tour have each currency (priced plans only).
  const plansWith = (currency: PriceCurrency) =>
    list.map((plan, planIndex) => ({ plan, planIndex }))
      .filter(({ plan }) => isPriced(plan) && planHas(plan, currency));

  list.forEach((plan, planIndex) => {
    if (!isPriced(plan)) return; // no prices at all: ignored

    // USD always; EUR and GBP when any priced plan of the tour has them.
    const required = PRICE_CURRENCIES.filter((currency) => currency === 'USD' || plansWith(currency).length > 0);
    const planLabel = planLabelOf(plan, planIndex);

    // A currency this plan has nowhere, while another priced plan has it:
    // one entry for the plan rather than one per empty cell.
    const absent = required.filter((currency) => currency !== 'USD' && !planHas(plan, currency));
    for (const currency of absent) {
      const requiredBy = plansWith(currency).map(({ plan: other, planIndex: i }) => planLabelOf(other, i));
      missing.push({
        scope: 'plan',
        planIndex,
        currency,
        path: `pricingPlans.${planIndex}.currencies.${currency}`,
        message: `${planLabel}: ${currency} prices missing (${listLabels(requiredBy)} ${requiredBy.length === 1 ? 'has' : 'have'} ${currency} prices, so every priced plan needs them)`,
        requiredBy,
      });
    }

    // Every other required currency must fill every cell of this plan.
    const perCell = required.filter((currency) => !absent.includes(currency));
    (plan?.seasons || []).forEach((season, seasonIndex) => {
      const seasonLabel = seasonLabelOf(season?.seasonName, seasonIndex);
      for (const tier of PRICE_TIERS) {
        for (const currency of perCell) {
          if (isFilled(season?.prices?.[tier], currency)) continue;
          missing.push({
            scope: 'cell',
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
