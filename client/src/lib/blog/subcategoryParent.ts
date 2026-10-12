import { getLocalizedValue } from "@/lib/localize";
import { getStrictLocalizedSlug, type SupportedLocale } from "@/lib/url";

export type SubcategoryParent = {
  /** The parent category's name in this language. */
  name: string;
  /** Its page in this language; absent when it has no slug here. */
  href?: string;
};

/**
 * A sub-category page's parent category: its name, for the breadcrumb and the
 * CTA, and its link when it has a page in this language.
 *
 * `category` arrives populated (an object), as a bare id when the API did not
 * populate it, or as null when the parent no longer exists: deleting a
 * category leaves its sub-categories pointing at nothing, and the populate
 * then yields null. `typeof null` is "object", so the page used to read
 * `.name` of null and answer 500. Anything that is not a populated parent
 * with a name now means "no parent", and the page renders without that step.
 */
export function getSubcategoryParent(category: unknown, locale: string): SubcategoryParent | null {
  if (!category || typeof category !== "object") return null;

  const parent = category as { name?: unknown; slug?: unknown };
  const name = getLocalizedValue(parent.name as Parameters<typeof getLocalizedValue>[0], locale);
  if (!name) return null;

  const slug = getStrictLocalizedSlug(parent.slug, locale as SupportedLocale);
  return slug ? { name, href: `/${locale}/${slug}` } : { name };
}
