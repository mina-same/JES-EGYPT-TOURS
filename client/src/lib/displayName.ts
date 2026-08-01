import { getLocalizedValue } from "@/lib/localize";

/**
 * Short label for a category / sub-category in compact UI (cards, chips,
 * filters, breadcrumbs, admin lists).
 *
 * `name` is deliberately a long, keyword-rich string because it doubles as the
 * page H1 — great for SEO, unusable as a label. This resolves, in order:
 *
 *   1. `shortName` for the locale, when an editor has filled it in;
 *   2. otherwise `name` cut at its first separator ("Egypt Classic Tours —
 *      Private Trips to Cairo…" → "Egypt Classic Tours");
 *   3. otherwise the full `name`.
 *
 * Step 2 means every existing record reads better immediately, with no data
 * entry, and step 1 gives editors exact control whenever they want it.
 * The H1 itself must keep using `name` — never this helper.
 */

/** Dash/pipe/colon separators used in the long SEO names, incl. en/em dashes. */
const SEPARATORS = /\s+[—–\-|:]\s+/;

export function shortenLabel(value: string | null | undefined): string {
  const text = String(value ?? "").trim();
  if (!text) return "";

  const [head] = text.split(SEPARATORS);
  const candidate = head?.trim();

  // Ignore a split that leaves almost nothing (e.g. a name starting with a dash).
  return candidate && candidate.length >= 3 ? candidate : text;
}

/**
 * @param entity  Any object carrying localized `name` / `shortName`.
 * @param locale  Active locale; omit to use the default resolution.
 */
export function getDisplayName(
  entity: { name?: unknown; shortName?: unknown } | null | undefined,
  locale?: string
): string {
  if (!entity) return "";

  const short = String(getLocalizedValue(entity.shortName as any, locale) ?? "").trim();
  if (short) return short;

  return shortenLabel(getLocalizedValue(entity.name as any, locale));
}
