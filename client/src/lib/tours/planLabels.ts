import type { ALL_PLAN_NAMES } from "./tourKind";

/**
 * Pricing plans: stored key → display label.
 *
 * The database, the enums, the validators, the booking check and the seeders
 * all work with the stored key ("AFFORDABLE", "GOLD (5 STAR STANDARD)", …).
 * Nobody reads that key on screen. Visitors and staff see the label, and the
 * label text lives in tours.json under `tourDetails.pricing`, once per
 * language ("AFFORDABLE" shows as Comfort / Komfort / Comfort / Confort).
 *
 * This map is the one place that says which tours.json entry belongs to which
 * key. Renaming a plan for display means editing tours.json; the stored key
 * never changes.
 *
 * Visitor pages translate the entry with their own `t`. Admin is English only
 * and reads the English entry through planLabelsEn.ts.
 */
export const PLAN_LABEL_KEYS: Record<(typeof ALL_PLAN_NAMES)[number], string> = {
  AFFORDABLE: "tourDetails.pricing.affordable",
  "GOLD (5 STAR STANDARD)": "tourDetails.pricing.gold (5 star standard)",
  "DIAMOND (5 STAR LUXURY)": "tourDetails.pricing.diamond (5 star luxury)",
  "TOUR PRICES": "tourDetails.pricing.tour prices",
};

/**
 * The tours.json key holding a plan's display label.
 *
 * A name outside the map (an old record) follows the lower-case rule the pages
 * used before this map existed, so its label does not change.
 */
export function planLabelKey(planName: string): string {
  return (
    (PLAN_LABEL_KEYS as Record<string, string>)[planName] ??
    `tourDetails.pricing.${planName.trim().toLowerCase()}`
  );
}
