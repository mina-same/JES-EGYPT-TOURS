import enTours from "../../i18n/locales/en/tours.json" with { type: "json" };
import { planLabelKey } from "./planLabels";

/**
 * A pricing plan's English display label, for Admin (English only): the same
 * words an English visitor sees, read from en/tours.json through the shared
 * key map in planLabels.ts. "AFFORDABLE" → "Comfort".
 *
 * Admin code only. It imports the English tours.json, which visitor pages must
 * not bundle (their translations arrive with the page, per language).
 *
 * Falls back to the stored name when no label exists, so nothing shows blank.
 */
export function planLabelEn(planName: string | null | undefined): string {
  if (!planName) return "";
  const label = planLabelKey(planName)
    .split(".")
    .reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], enTours);
  return typeof label === "string" && label.trim() ? label : planName;
}
