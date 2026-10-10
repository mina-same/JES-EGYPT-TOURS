import type { SupportedLocale } from "@/lib/url";

/**
 * The blog's hub, the Egypt Blog category page, in each language.
 *
 * The slugs are CMS data (the BlogCategory "Egypt Blog"), but the footer and
 * the homepage's blog section are static, so they link to the hub through this
 * one map, the way destinationCarouselTwoData links its destination pages.
 * Every language has its own slug: the English path under /de, /it or /es
 * answers with a redirect, not the page.
 *
 * If an editor renames the category's slug, update it here too.
 * tests/blog-hub-links.test.ts checks the shape of this map and, with
 * BLOG_HUB_TEST_ORIGIN set, that every URL answers 200.
 */
export const BLOG_HUB_HREF_BY_LOCALE: Readonly<Record<SupportedLocale, string>> = {
  en: "/en/egypt-blog",
  de: "/de/aegypten-blog",
  it: "/it/blog-egitto",
  es: "/es/blog-de-egipto",
};
