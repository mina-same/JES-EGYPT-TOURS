import { getLocalizedValue } from "@/lib/localize";
import { getStrictLocalizedSlug, type SupportedLocale } from "@/lib/url";

export type BlogBreadcrumb = {
  label: string;
  /** Omitted for the article itself, and for a parent with no page in this language. */
  href?: string;
};

/**
 * The trail of an article page: its category, its sub-category, then the
 * article.
 *
 * Home is NOT included — the Breadcrumb component puts its own localized Home
 * in front, and emits the BreadcrumbList from the same items, so the trail a
 * reader sees and the one in the schema cannot disagree.
 *
 * The category is the sub-category's OWN parent, the one the sub-category page
 * shows in its trail, so the two pages describe the same hierarchy. The
 * article's separate `category` field is only a fallback: for an article with
 * no sub-category, or a response cached before the API populated the parent.
 *
 * A switched-off parent (`isActive: false`) is left out — its page answers
 * 404. A parent with no slug in this language keeps its name but loses its
 * link, as on the sub-category page: it is a real step, it just has no page
 * in this language to send the reader to.
 */
export function buildBlogBreadcrumbs(
  blog: { category?: unknown; subCategory?: unknown } | null | undefined,
  locale: string,
  currentLabel: string
): BlogBreadcrumb[] {
  // Either field is an id string when the API did not populate it.
  const asObject = (value: unknown) => (value && typeof value === "object" ? (value as any) : null);
  const subCategory = asObject(blog?.subCategory);
  const category = asObject(subCategory?.category) ?? asObject(blog?.category);

  const trail: BlogBreadcrumb[] = [];
  for (const parent of [category, subCategory]) {
    if (!parent || parent.isActive === false) continue;
    const label = getLocalizedValue(parent.name, locale);
    if (!label) continue;
    const slug = getStrictLocalizedSlug(parent.slug, locale as SupportedLocale);
    trail.push(slug ? { label, href: `/${locale}/${slug}` } : { label });
  }

  trail.push({ label: currentLabel });
  return trail;
}
