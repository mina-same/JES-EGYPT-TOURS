import type { IPricingPlan } from '@/types/tour';
import { DAY_TOUR_PLAN_NAMES } from './tourKind';

/** Mirrors the `seasonName` enum in server/src/models/Tour.ts. A plan is only
 *  valid with at least one season, so every new plan is scaffolded with all
 *  three and the admin fills in the amounts. */
export const SEASON_OPTIONS = [
  '1 May 2026 – 31 August 2026',
  '1 September 2026 – 19 December 2026 / 6 January 2027 – 24 March 2027',
  '20 December 2026 – 5 January 2027 / 25 March 2027 – 15 April 2027',
] as const;

/** A blank plan with every season present and priced at zero. Shared so the
 *  "Add Plan" button and the automatic day-tour plan produce the same shape —
 *  a second hand-written copy would drift the moment a season is added. */
export const createEmptyPricingPlan = (planName = ''): IPricingPlan => ({
  planName,
  seasons: SEASON_OPTIONS.map((seasonName) => ({
    seasonName,
    prices: {
      solo: { USD: 0 },
      pax_2_4: { USD: 0 },
      pax_5_8: { USD: 0 },
      pax_9_16: { USD: 0 },
    },
    notes: [],
  })),
});

/**
 * The plans a day tour should hold: exactly one, named TOUR PRICES.
 *
 * A day tour has a single price and only one legal plan name, so asking the
 * admin to add a plan and then pick its only option is two clicks that can
 * only ever have one outcome. Existing seasons and amounts are preserved —
 * this renames or creates, it never wipes prices that are already entered.
 */
export const ensureDayTourPlan = (plans: IPricingPlan[] | null | undefined): IPricingPlan[] => {
  const [onlyName] = DAY_TOUR_PLAN_NAMES;
  const existing = (plans || [])[0];

  if (!existing) return [createEmptyPricingPlan(onlyName)];
  if (existing.planName === onlyName) return [existing];
  return [{ ...existing, planName: onlyName }];
};
