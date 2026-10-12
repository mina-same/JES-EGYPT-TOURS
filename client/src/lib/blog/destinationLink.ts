import { getLocalizedValue } from "@/lib/localize";
import { getStrictLocalizedSlug, type SupportedLocale } from "@/lib/url";

export type ArticleDestinationLink = {
  /** The destination's name in this language. */
  name: string;
  /** Its page in this language. */
  href: string;
};

/**
 * Where an article's destination leads and what the link says — or null when
 * there is nothing to link to.
 *
 * `destination` arrives populated from the article endpoint, which sends only
 * a destination that has a public page; as a bare id from the responses that
 * do not populate it; or as null. A destination with no slug in this language
 * has no page here, so it gets no link rather than one into another language.
 *
 * The short name comes first, as on the tour cards (lib/tours/destinations.ts):
 * a destination's full name can be a page title rather than a place name.
 */
export function getArticleDestinationLink(destination: unknown, locale: string): ArticleDestinationLink | null {
  if (!destination || typeof destination !== "object") return null;

  const { name, shortName, slug } = destination as { name?: unknown; shortName?: unknown; slug?: unknown };
  const destinationSlug = getStrictLocalizedSlug(slug, locale as SupportedLocale);
  if (!destinationSlug) return null;

  const short = typeof shortName === "string" ? shortName : (shortName as Record<string, unknown> | undefined)?.[locale];
  const label =
    (typeof short === "string" && short.trim()) ||
    getLocalizedValue(name as Parameters<typeof getLocalizedValue>[0], locale);
  if (typeof label !== "string" || !label.trim()) return null;

  return { name: label.trim(), href: `/${locale}/${destinationSlug}` };
}
