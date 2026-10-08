import { getDisplayName } from "@/lib/displayName";
import { getStrictLocalizedSlug, type SupportedLocale } from "@/lib/url";

export type TourBreadcrumb = {
  label: string;
  /** Omitted for the tour itself, which is the current page. */
  href?: string;
};

/**
 * The trail of a tour page: its category, its sub-category, then the tour.
 *
 * Home is NOT included — the visible Breadcrumb and the tour JSON-LD each put
 * their own localized Home in front. Both read this one array, so the trail a
 * visitor sees and the one in the schema cannot disagree.
 *
 * A parent is left out, rather than linked, when its link would be broken:
 *   - it has no slug in this language (getStrictLocalizedSlug does not fall
 *     back to English, which would send a German reader to an English page);
 *   - it is switched off (`isActive: false`) — its own page answers 404 then.
 * The two parents are checked separately: a sub-category's page stays live
 * when its category is switched off, so it keeps its crumb.
 */
export function buildTourBreadcrumbs(
  tour: { subcategory?: unknown } | null | undefined,
  locale: string,
  currentLabel: string
): TourBreadcrumb[] {
  // `subcategory` is an id string when the API did not populate it.
  const subcategory = typeof tour?.subcategory === "object" ? (tour.subcategory as any) : null;
  const category = typeof subcategory?.category === "object" ? subcategory.category : null;

  const trail: TourBreadcrumb[] = [];
  for (const parent of [category, subcategory]) {
    if (!parent || parent.isActive === false) continue;
    const slug = getStrictLocalizedSlug(parent.slug, locale as SupportedLocale);
    if (!slug || !(parent.name || parent.shortName)) continue;
    trail.push({ label: getDisplayName(parent, locale), href: `/${locale}/${slug}` });
  }

  trail.push({ label: currentLabel });
  return trail;
}
