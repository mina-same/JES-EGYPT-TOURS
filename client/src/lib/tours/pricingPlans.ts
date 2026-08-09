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

/**
 * A blank plan: every season present, no amounts.
 *
 * Deliberately NOT seeded with zeros. Content and sales work at different
 * speeds — a tour is often written and published before anyone has priced it —
 * and a pre-filled 0 is indistinguishable from a real price once saved. It
 * reached visitors as "$0.00" and made a finished page look broken. An absent
 * amount is honest: the row simply does not render until someone fills it in.
 *
 * Shared so the "Add Plan" button and the automatic day-tour plan produce the
 * same shape — a second hand-written copy would drift the moment a season is
 * added.
 */
export const createEmptyPricingPlan = (planName = ''): IPricingPlan => ({
  planName,
  seasons: SEASON_OPTIONS.map((seasonName) => ({
    seasonName,
    prices: {},
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
