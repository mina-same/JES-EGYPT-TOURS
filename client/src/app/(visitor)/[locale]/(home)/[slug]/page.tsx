/*
 * The mobile filter drawer's layout CSS, imported HERE rather than from the
 * view that renders it.
 *
 * The drawer's markup is server-rendered, but CategoryView and SubcategoryView
 * reach the browser through next/dynamic, so a stylesheet imported by them
 * ships in the view's ASYNC chunk — it arrives after the first paint, and the
 * server-rendered drawer spends that frame as a static block in normal flow,
 * ~632px tall, pushing the whole page down. Measured: CLS 0.7483 at 390px.
 *
 * This file is the route's own module and is never deferred, so importing the
 * stylesheet here puts it in the route CSS that <head> links, where
 * `position: fixed` applies to the very first painted frame.
 */
import "./_views/mobileFilterDrawer.css";
/*
 * Catalog reads go through the SERVER readers, which use native fetch and so
 * participate in the Next Data Cache. ./tour.ts (axios) is untouched and is
 * still what the browser and the admin use — it just has no place in a
 * Server Component, because Next cannot cache an axios call.
 */
import {
  isCanonicalListing,
  getPublicDestinationKeys,
  tourCategoryServerAPI,
  tourServerAPI,
  tourSubcategoryServerAPI,
} from "@/lib/api/tour.server";
import { resolveSlug } from "@/lib/api/resolve.server";
import {
  type BlogCategory,
  type BlogSubCategory,
  getBlogsByCategory,
  getBlogsBySubCategory,
  getCategoryBySlug as getBlogCategoryBySlug,
  getSubCategoriesByCategory as getBlogSubCategoriesByCategory,
  getSubCategoryBySlug as getBlogSubCategoryBySlug,
  getBlogBySlug,
} from "@/lib/api/blog";
import {
  getBlogsByDestination,
  getDestinationBySlug,
  type Destination,
} from "@/lib/api/destination";
import { getLocalizedValue } from "@/lib/localize";
import { buildTourBreadcrumbs } from "@/lib/tour/breadcrumbs";
import { getServerTranslation } from "@/lib/i18n-server";
import { getStrictSlugLocaleAlternates } from "@/lib/seo/localeAlternates";
import { getListingRobotsMetadata, getNotFoundRobotsMetadata } from "@/lib/seo/robots";
import { parsePublicListingQuery, PUBLIC_SORT_TO_API, shouldRedirectPublicQuery, type PublicListingParse } from '@/lib/tours/publicListingUrl';
import {
  BLOG_LISTING_PAGE_SIZE,
  getBlogListingAlternates,
  getBlogListingRobots,
  resolveBlogListingRequest,
  withPageNumber,
  type BlogListingPage,
  type ListingQuery,
} from "@/lib/blog/listingPage";
import { generateTourJsonLd } from "@/lib/seo/tourJsonLd";
import { serializeJsonLd } from "@/lib/seo/serializeJsonLd";
import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import TourListingOneDetails from "@/components/sections/TourListingDetailsOne/TourListingDetailsOneLazy";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import { SlugManager } from "@/components/common/SlugManager";
// Each view is imported through its *Lazy wrapper, which holds the async
// import() that gives it its own chunk. Importing any of them directly here
// would put it back in the route's shared client chunk group and ship it to
// all seven content types — see the wrappers for the measurement.
import CategoryView from "./_views/CategoryViewLazy";
import SubcategoryView from "./_views/SubcategoryViewLazy";
import BlogCategoryView from "./_views/BlogCategoryViewLazy";
import BlogSubcategoryView from "./_views/BlogSubcategoryViewLazy";
import BlogDetailView from "./_views/BlogDetailViewLazy";
import DestinationView from "./_views/DestinationViewLazy";
import { ogSiteDefaults } from "@/lib/ogDefaults";
import {
  EDITORIAL_AUTHOR_SLUG,
  getPublicAuthorName,
  isEditorialAuthor,
} from "@/lib/blog/author";
import { TOUR_IMAGE_PLACEHOLDER } from "@/lib/images/placeholders";
import { cookies } from "next/headers";
import { CURRENCY_COOKIE, parseCurrencyCookie } from "@/lib/currency/currencyCookie";


function ensureTourMapSchema(tour: any) {
  if (!tour || typeof tour !== "object") return tour;

  const mapSchema = tour.mapSchema || tour.seo?.mapSchema;
  if (!Array.isArray(mapSchema?.itemListElement) || mapSchema.itemListElement.length === 0) {
    return tour;
  }

  return {
    ...tour,
    mapSchema: tour.mapSchema || mapSchema,
    seo: {
      ...(tour.seo || {}),
      mapSchema: tour.seo?.mapSchema || mapSchema,
    },
  };
}

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.jesegypttours.com";

export const revalidate = 0;

// formatISO8601Duration has been moved to @/lib/seo/tourJsonLd

function stripHtml(value: string): string {
  return value ? value.replace(/<[^>]*>?/gm, '') : "";
}

function getImageUrl(image: any): string | undefined {
  if (!image) return undefined;
  if (typeof image === 'string') return image;
  return image.url || undefined;
}

function getAbsoluteImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${normalizedPath}`;
}

function getSeoImage(
  primaryImage: any,
  fallbackImage: any,
  locale: string,
  fallbackAlt?: string
) {
  const image = primaryImage || fallbackImage;
  const url = getAbsoluteImageUrl(getImageUrl(image));
  if (!url) return undefined;

  if (typeof image === 'string') {
    return { url, alt: fallbackAlt || "JES Egypt Tours" };
  }

  return {
    url,
    alt: getLocalizedValue(image.alt, locale) || getLocalizedValue(image.title, locale) || fallbackAlt || "JES Egypt Tours",
    width: image.width,
    height: image.height,
  };
}

function urlsMatch(firstUrl: string | undefined, secondUrl: string | undefined): boolean {
  const firstAbsoluteUrl = getAbsoluteImageUrl(firstUrl);
  const secondAbsoluteUrl = getAbsoluteImageUrl(secondUrl);
  return !!firstAbsoluteUrl && firstAbsoluteUrl === secondAbsoluteUrl;
}

function getLocalizedImageText(image: any, locale: string): string {
  if (!image || typeof image === 'string') return "";
  return getLocalizedValue(image.alt, locale) || getLocalizedValue(image.title, locale) || "";
}

// OG must resolve per language: this locale's OG text, else this locale's
// meta — never another language's OG value.
function ownLocaleValue(value: any, locale: string): string {
  const v = value?.[locale];
  return typeof v === "string" && v.trim() ? v : "";
}

function getBlogSeoImage(
  metaImage: any,
  ogImage: any,
  featuredImage: any,
  locale: string,
  fallbackAlt?: string
) {
  const selectedImage = getImageUrl(metaImage) ? metaImage : ogImage || featuredImage;
  const selectedImageUrl = getImageUrl(selectedImage);
  const url = getAbsoluteImageUrl(selectedImageUrl);
  if (!url) return undefined;

  let alt = getLocalizedImageText(selectedImage, locale);

  if (!alt && typeof selectedImage === 'string') {
    if (urlsMatch(selectedImage, getImageUrl(metaImage))) {
      alt = getLocalizedImageText(metaImage, locale);
    }
    if (!alt && urlsMatch(selectedImage, getImageUrl(featuredImage))) {
      alt = getLocalizedImageText(featuredImage, locale);
    }
  }

  alt = alt || getLocalizedImageText(featuredImage, locale) || fallbackAlt || "JES Egypt Tours";

  return {
    url,
    alt,
    width: typeof selectedImage === 'object' ? selectedImage.width : undefined,
    height: typeof selectedImage === 'object' ? selectedImage.height : undefined,
  };
}

/** An article's slugs, kept only for the languages it is public in. */
function slugsInLocales(slugs: unknown, locales: readonly string[] | undefined): Record<string, string> {
  if (!slugs || typeof slugs !== "object" || !Array.isArray(locales)) return {};
  return Object.fromEntries(
    Object.entries(slugs as Record<string, unknown>).filter(
      (entry): entry is [string, string] => locales.includes(entry[0]) && typeof entry[1] === "string"
    )
  );
}

function withImageSource(image?: { url: string }) {
  return image?.url ? { image_src: image.url } : undefined;
}

type SlugContentType =
  | "category"
  | "subcategory"
  | "blogCategory"
  | "blogSubcategory"
  | "blog"
  | "destination"
  | "tour";

type ResolvedSlugContent = {
  type: SlugContentType;
  data: any;
  correctSlug: string;
};

/*
 * Slug -> content, in one resolution plus one entity read.
 *
 * This used to ask seven endpoints in turn until one answered 200. Next
 * never caches a non-OK response, so every miss ahead of the real type hit
 * the API on EVERY request, warm cache or not — six wasted round trips for a
 * destination, five for an article. /api/resolve answers the same question
 * once, from seven parallel indexed lookups, and that answer IS cacheable.
 *
 * The signature and return shape are unchanged on purpose: generateMetadata,
 * every render branch, the redirects and notFound() all consume this exactly
 * as before.
 *
 * Precedence now lives in the API (resolveController CANDIDATES), in the same
 * order this chain used. A database audit found zero cross-type slug
 * collisions, so nothing observable depends on it today, but it is preserved
 * rather than rationalised.
 *
 * React cache() still wraps it, so metadata and the page share one call.
 */
const resolveSlugContent = cache(async (slug: string, locale: string): Promise<ResolvedSlugContent | null> => {
  /*
   * Deliberately NOT wrapped in try/catch. A missing slug comes back as null
   * and becomes a 404; a 500 or an unreachable API throws, and must keep
   * throwing. Turning an outage into notFound() would answer "this page does
   * not exist" to a crawler about a page that does.
   */
  const resolution = await resolveSlug(slug, locale);
  if (!resolution) return null;

  // The canonical slug for THIS locale — always present, because the API only
  // resolves an entity that has one. Reading the entity by it rather than by
  // whatever alias was typed also keeps one cache entry per locale.
  const correctSlug = resolution.canonicalSlug;

  switch (resolution.type) {
    case "tour": {
      const res = await tourServerAPI.getBySlug(correctSlug, locale);
      if (res?.success && res?.data) return { type: "tour", data: res.data, correctSlug };
      return null;
    }
    case "tour-category": {
      const res = await tourCategoryServerAPI.getBySlug(correctSlug, locale);
      if (res?.success && res?.data) return { type: "category", data: res.data, correctSlug };
      return null;
    }
    case "tour-subcategory": {
      const res = await tourSubcategoryServerAPI.getBySlug(correctSlug, locale);
      if (res?.success && res?.data) return { type: "subcategory", data: res.data, correctSlug };
      return null;
    }
    case "blog-category": {
      const category = await getBlogCategoryBySlug(correctSlug, locale);
      if (category) return { type: "blogCategory", data: category, correctSlug };
      return null;
    }
    case "blog-subcategory": {
      const subcategory = await getBlogSubCategoryBySlug(correctSlug, locale);
      if (subcategory) return { type: "blogSubcategory", data: subcategory, correctSlug };
      return null;
    }
    case "blog": {
      const blog = await getBlogBySlug(correctSlug, locale);
      if (!blog) return null;
      /*
       * A slug alone is not enough: the article exists in this language only
       * when it is public in it — a strict slug, a title and a body of its own
       * (server/src/utils/blogAvailability.ts). The API answers 404 otherwise
       * and says where the article IS public; that answer is the one checked
       * here, rather than a second copy of the rule.
       */
      if (!blog.availableLocales?.includes(locale)) return null;
      return { type: "blog", data: blog, correctSlug };
    }
    case "destination": {
      const destination = await getDestinationBySlug(correctSlug, locale);
      if (destination) return { type: "destination", data: destination, correctSlug };
      return null;
    }
    default:
      return null;
  }
});

async function parseRouteListingQuery(query: Record<string, string | string[] | undefined>): Promise<PublicListingParse> {
  const destinationKeys = query.destinations ? await getPublicDestinationKeys() : undefined;
  const parsed = parsePublicListingQuery(query, { destinationKeys });
  if (parsed.error) notFound();
  return parsed;
}

/**
 * A Blog listing request, settled before anything is rendered: the page it
 * asks for and that page's articles, or null when there is no such page. A
 * redirect is thrown from here. The rules and their order are
 * resolveBlogListingRequest's (lib/blog/listingPage.ts).
 *
 * generateMetadata and the page both come through here with the same
 * arguments, so they reach the same answer, and the listing both need is one
 * fetch: Next serves the second identical request from the first.
 *
 * A listing that cannot be read throws. The article list is what these pages
 * are for, and rendering without it would answer a 200 with nothing to index —
 * a 500 is retried by a crawler; an empty 200 is indexed as thin.
 */
async function settleBlogListing<T extends BlogListingPage>(
  resolved: ResolvedSlugContent,
  slug: string,
  locale: string,
  query: ListingQuery,
  read: (page: number) => Promise<T>,
) {
  const outcome = await resolveBlogListingRequest({ query, locale, slug, canonicalSlug: resolved.correctSlug, read });
  if (outcome.status === 308) permanentRedirect(outcome.location);
  return outcome.status === 404 ? null : outcome;
}

/** The same, for the page: no such page is its 404. */
async function readBlogListingPage<T extends BlogListingPage>(...request: Parameters<typeof settleBlogListing<T>>) {
  const settled = await settleBlogListing(...request);
  if (!settled) notFound();
  return settled;
}

/*
 * What generateMetadata answers for a URL the page answers 404 to. It never
 * reaches the 404's server HTML; that head comes from (home)/not-found.tsx.
 * It is not dead, though: the 404 is sent as Next's error shell, and the
 * browser renders the page from the RSC payload that carries THIS metadata.
 * It is the title and robots the visitor's document ends up with.
 */
const notFoundMetadata = (): Metadata => ({ title: "Not Found | JES Egypt Tours", robots: getNotFoundRobotsMetadata() });

/*
 * One page of the articles each kind of Blog listing lists.
 *
 * A category's and a topic's are keyed by the English slug: the endpoint
 * matches any language's slug, and one spelling keeps one cache entry per page
 * and locale. A destination's are keyed by its id.
 */
const englishSlugOf = (entity: { slug?: unknown }, fallback: string): string => {
  const english = typeof entity.slug === "object" ? (entity.slug as { en?: unknown } | null)?.en : entity.slug;
  return (typeof english === "string" && english) || fallback;
};
const readCategoryArticles = (category: BlogCategory, canonicalSlug: string, locale: string) => (page: number) =>
  getBlogsByCategory(englishSlugOf(category, canonicalSlug), page, BLOG_LISTING_PAGE_SIZE, locale);
const readTopicArticles = (topic: BlogSubCategory, canonicalSlug: string, locale: string) => (page: number) =>
  getBlogsBySubCategory(englishSlugOf(topic, canonicalSlug), page, BLOG_LISTING_PAGE_SIZE, locale);
const readDestinationArticles = (destination: Destination, locale: string) => (page: number) =>
  getBlogsByDestination(destination._id, page, BLOG_LISTING_PAGE_SIZE, locale);

/** A listing's title with its page after it, from page 2 on: "… – Page 2". */
async function withListingPage(title: string, page: number, locale: string): Promise<string> {
  if (page === 1) return title;
  const { t } = await getServerTranslation(locale, "common");
  return withPageNumber(title, page, t("pagination.page"));
}

async function getTourListingAlternates(
  locale: string, slug: string, data: any, type: 'category' | 'subcategory', parsed: PublicListingParse,
): Promise<NonNullable<Metadata['alternates']>> {
  const base = getStrictSlugLocaleAlternates({ locale, currentSlug: slug, slugs: data.slug, baseUrl });
  if (parsed.isUtility) return { canonical: base.canonical };
  if (parsed.state.page === 1) return base;
  const page = parsed.state.page;
  const baseLanguages = base.languages || {};
  const languages: Record<string, string> = {};
  // A Tour enters only languages where slug.<locale> exists. Check each
  // translated listing independently before emitting a page-N alternate.
  const checks = await Promise.all(['en', 'de', 'it', 'es'].map(async (language) => {
    const baseLanguageUrl = (baseLanguages as Record<string, string | URL | undefined>)[language];
    if (!baseLanguageUrl) return { language, baseLanguageUrl: '', exists: false };
    const listing = await tourServerAPI.getListing({
      page: 1, limit: 9, sort: 'recommended',
      ...(type === 'category' ? { category: data._id } : { subcategory: data._id }),
    }, language, true);
    if (!listing?.success) throw new Error('Category pagination count unavailable');
    return { language, baseLanguageUrl: String(baseLanguageUrl), exists: (listing.totalPages || 1) >= page };
  }));
  if (!checks.some(check => check.language === locale && check.exists)) notFound();
  for (const check of checks) {
    if (check.exists) languages[check.language] = `${check.baseLanguageUrl}?page=${page}`;
  }
  if (languages.en) languages['x-default'] = languages.en;
  return { canonical: `${base.canonical}?page=${page}`, languages };
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const resolved = await resolveSlugContent(slug, locale);

  if (resolved?.type === "category") {
    const parsed = await parseRouteListingQuery(await searchParams);
    const data = resolved.data;
    const seoTitle = getLocalizedValue(data.seo?.metaTitle, locale);
    const seoDescription = getLocalizedValue(data.seo?.metaDescription, locale);
    const description = stripHtml(seoDescription || "");
    const keywords = getLocalizedValue(data.seo?.metaKeywords, locale);
    const image = getSeoImage(data.seo?.metaImage, data.image, locale, seoTitle || getLocalizedValue(data.name, locale));

    const alternates = await getTourListingAlternates(locale, slug, data, 'category', parsed);
    return {
      title: seoTitle ? seoTitle : "JES Egypt Tours",
      description,
      keywords: keywords || undefined,
      alternates,
      robots: getListingRobotsMetadata(parsed.isUtility),
      openGraph: {
        ...ogSiteDefaults(locale),
        title: seoTitle || "JES Egypt Tours",
        description,
        type: "website",
        images: image ? [image] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: seoTitle || "JES Egypt Tours",
        description,
        images: image ? [image] : undefined,
      },
      other: withImageSource(image),
    };
  }

  if (resolved?.type === "subcategory") {
    const parsed = await parseRouteListingQuery(await searchParams);
    const data = resolved.data;
    const seoTitle = getLocalizedValue(data.seo?.metaTitle, locale);
    const seoDescription = getLocalizedValue(data.seo?.metaDescription, locale);
    const description = stripHtml(seoDescription || "");
    const keywords = getLocalizedValue(data.seo?.metaKeywords, locale);
    const image = getSeoImage(data.seo?.metaImage, data.image, locale, seoTitle || getLocalizedValue(data.name, locale));

    const alternates = await getTourListingAlternates(locale, slug, data, 'subcategory', parsed);
    return {
      title: seoTitle ? seoTitle : "JES Egypt Tours",
      description,
      keywords: keywords || undefined,
      alternates,
      robots: getListingRobotsMetadata(parsed.isUtility),
      openGraph: {
        ...ogSiteDefaults(locale),
        title: seoTitle || "JES Egypt Tours",
        description,
        type: "website",
        images: image ? [image] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: seoTitle || "JES Egypt Tours",
        description,
        images: image ? [image] : undefined,
      },
      other: withImageSource(image),
    };
  }

  if (resolved?.type === "blogCategory") {
    const category = resolved.data;
    const cAny = category as any;
    const settled = await settleBlogListing(
      resolved, slug, locale, await searchParams, readCategoryArticles(category, resolved.correctSlug, locale),
    );
    if (!settled) return notFoundMetadata();
    const { page, listing } = settled;
    const seoTitle = getLocalizedValue(cAny.metaTitle, locale);
    const seoDescription = getLocalizedValue(cAny.metaDescription, locale);
    const description = stripHtml(seoDescription || "");
    const keywords = getLocalizedValue(cAny.metaKeywords, locale);
    const image = getSeoImage(cAny.metaImage, cAny.ogImage || cAny.image, locale, seoTitle || getLocalizedValue(cAny.name, locale));
    const ogTitle = ownLocaleValue(cAny.ogTitle, locale) || seoTitle || "JES Egypt Tours";
    const ogDescription = stripHtml(ownLocaleValue(cAny.ogDescription, locale)) || description;

    const alternates = getBlogListingAlternates({
      role: "archive", page, locale, slug, slugs: category.slug, baseUrl, articles: listing.data,
      pagesByLocale: listing.pagination?.pagesByLocale,
    });
    return {
      title: await withListingPage(seoTitle ? seoTitle : "JES Egypt Tours", page, locale),
      description,
      keywords: keywords || undefined,
      alternates,
      robots: getBlogListingRobots("archive", page),
      openGraph: {
        ...ogSiteDefaults(locale),
        title: ogTitle,
        description: ogDescription,
        type: "website",
        images: image ? [image] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: ogTitle,
        description: ogDescription,
        images: image ? [image] : undefined,
      },
      other: withImageSource(image),
    };
  }

  if (resolved?.type === "blogSubcategory") {
    const subcategory = resolved.data;
    const sAny = subcategory as any;
    const settled = await settleBlogListing(
      resolved, slug, locale, await searchParams, readTopicArticles(subcategory, resolved.correctSlug, locale),
    );
    if (!settled) return notFoundMetadata();
    const { page, listing } = settled;
    const seoTitle = getLocalizedValue(sAny.metaTitle, locale);
    const seoDescription = getLocalizedValue(sAny.metaDescription, locale);
    const description = stripHtml(seoDescription || "");
    const keywords = getLocalizedValue(sAny.metaKeywords, locale);
    const image = getSeoImage(sAny.metaImage, sAny.ogImage || sAny.image, locale, seoTitle || getLocalizedValue(sAny.name, locale));
    const ogTitle = ownLocaleValue(sAny.ogTitle, locale) || seoTitle || "JES Egypt Tours";
    const ogDescription = stripHtml(ownLocaleValue(sAny.ogDescription, locale)) || description;

    const alternates = getBlogListingAlternates({
      role: "archive", page, locale, slug, slugs: subcategory.slug, baseUrl, articles: listing.data,
      pagesByLocale: listing.pagination?.pagesByLocale,
    });
    return {
      title: await withListingPage(seoTitle ? seoTitle : "JES Egypt Tours", page, locale),
      description,
      keywords: keywords || undefined,
      alternates,
      robots: getBlogListingRobots("archive", page),
      openGraph: {
        ...ogSiteDefaults(locale),
        title: ogTitle,
        description: ogDescription,
        type: "website",
        images: image ? [image] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: ogTitle,
        description: ogDescription,
        images: image ? [image] : undefined,
      },
      other: withImageSource(image),
    };
  }

  if (resolved?.type === "blog") {
    const blog = resolved.data;
    const bAny = blog as any;
    const seoTitle = getLocalizedValue(bAny.metaTitle, locale);
    const seoDescription = getLocalizedValue(bAny.metaDescription, locale);
    const blogTitle = getLocalizedValue(bAny.title, locale);
    const pageTitle = seoTitle || blogTitle || "JES Egypt Tours";
    const description = stripHtml(seoDescription || getLocalizedValue(bAny.excerpt, locale) || "");
    const ogTitle = ownLocaleValue(bAny.ogTitle, locale) || pageTitle;
    const ogDescription = stripHtml(ownLocaleValue(bAny.ogDescription, locale)) || description;
    const keywords = getLocalizedValue(bAny.metaKeywords, locale);
    const image = getBlogSeoImage(bAny.metaImage, bAny.ogImage, bAny.featuredImage, locale, blogTitle || pageTitle);
    const publicAuthorName = bAny.editorialAuthor?.name || getPublicAuthorName(bAny.author?.name);
    const publicAuthorSlug = bAny.editorialAuthor?.slug || (isEditorialAuthor(publicAuthorName) ? EDITORIAL_AUTHOR_SLUG : undefined);
    const publicAuthorUrl = publicAuthorSlug ? `${baseUrl}/${locale}/authors/${publicAuthorSlug}` : undefined;

    // Alternates only for the languages the article is public in — never a
    // language whose slug exists but whose page answers 404.
    const availableSlugs = slugsInLocales(blog.slug, blog.availableLocales);
    const alternates = getStrictSlugLocaleAlternates({ locale, currentSlug: slug, slugs: availableSlugs, baseUrl });
    return {
      title: pageTitle,
      description,
      keywords: keywords || undefined,
      authors: [{ name: publicAuthorName, ...(publicAuthorUrl ? { url: publicAuthorUrl } : {}) }],
      alternates,
      openGraph: {
        ...ogSiteDefaults(locale),
        title: ogTitle,
        description: ogDescription,
        images: image ? [image] : undefined,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: ogTitle,
        description: ogDescription,
        images: image ? [image] : undefined,
      },
      other: withImageSource(image),
    };
  }

  if (resolved?.type === "destination") {
    const destination = resolved.data;
    const seoTitle = getLocalizedValue(destination.metaTitle, locale);
    const seoDescription = getLocalizedValue(destination.metaDescription, locale);
    const description = stripHtml(seoDescription || "");
    const keywords = getLocalizedValue(destination.metaKeywords, locale);
    const image = getSeoImage(destination.metaImage, destination.ogImage || destination.coverImage, locale, seoTitle || getLocalizedValue(destination.name, locale));
    // Only the article section pages. A later page is a state of this landing
    // page, not a page of its own: it points at the clean URL and stays out of
    // the index, so the title and the rest describe the destination as before.
    const settled = await settleBlogListing(
      resolved, slug, locale, await searchParams, readDestinationArticles(destination, locale),
    );
    if (!settled) return notFoundMetadata();
    const { page } = settled;
    const alternates = getBlogListingAlternates({
      role: "landing", page, locale, slug, slugs: destination.slug, baseUrl,
    });
    return {
      title: seoTitle || `${getLocalizedValue(destination.name, locale)} | JES Egypt Tours`,
      description,
      keywords: keywords || undefined,
      alternates,
      robots: getBlogListingRobots("landing", page),
      openGraph: {
        ...ogSiteDefaults(locale),
        title: seoTitle || getLocalizedValue(destination.name, locale),
        description,
        type: "website",
        images: image ? [image] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: seoTitle || getLocalizedValue(destination.name, locale),
        description,
        images: image ? [image] : undefined,
      },
      other: withImageSource(image),
    };
  }

  if (resolved?.type === "tour") {
    const tour = resolved.data;
    const seoTitle = getLocalizedValue(tour.seo?.metaTitle, locale);
    const seoDescription = getLocalizedValue(tour.seo?.metaDescription, locale);
    const description = stripHtml(seoDescription || "");
    const keywords = getLocalizedValue(tour.seo?.metaKeywords, locale);
    const tourHeading = getLocalizedValue(tour.heading, locale);
    const pageTitle = seoTitle || tourHeading || "JES Egypt Tours";
    const ogTitle = ownLocaleValue(tour.seo?.ogTitle, locale) || pageTitle;
    const ogDescription = stripHtml(ownLocaleValue(tour.seo?.ogDescription, locale)) || description;
    // A metaImage row can exist with an empty url (alt/title typed first), so it
    // only wins when it actually carries one — otherwise fall through to ogImage
    // and then the tour's own first image.
    const metaImage = getImageUrl(tour.seo?.metaImage) ? tour.seo?.metaImage : undefined;
    const image = getSeoImage(metaImage, tour.seo?.ogImage || tour.images?.[0], locale, pageTitle);
    const alternates = getStrictSlugLocaleAlternates({ locale, currentSlug: slug, slugs: tour.slug, baseUrl });
    return {
      title: seoTitle ? seoTitle : "JES Egypt Tours",
      description,
      keywords: keywords || undefined,
      alternates,
      openGraph: {
        ...ogSiteDefaults(locale),
        title: ogTitle,
        description: ogDescription,
        images: image ? [image] : [],
        type: "website"
      },
      twitter: {
        card: "summary_large_image",
        title: ogTitle,
        description: ogDescription,
        images: image ? [image] : []
      },
      other: withImageSource(image),
    };
  }

  // Nothing resolved, so the page below calls notFound().
  return notFoundMetadata();
}

export default async function SlugPage({ params, searchParams }: PageProps) {
  const { slug, locale } = await params;
  const query = await searchParams;
  const resolved = await resolveSlugContent(slug, locale);
  const listingParsed = resolved?.type === 'category' || resolved?.type === 'subcategory'
    ? await parseRouteListingQuery(query)
    : null;
  if (listingParsed && shouldRedirectPublicQuery(query, listingParsed)) {
    permanentRedirect(`/${locale}/${resolved!.correctSlug}${listingParsed.redirectSearch}`);
  }
  const currency = parseCurrencyCookie(
    (await cookies()).get(CURRENCY_COOKIE)?.value
  ) || 'USD';
  const state = listingParsed?.state;
  const listingQuery = state ? {
    page: state.page,
    limit: 9,
    sort: PUBLIC_SORT_TO_API[state.sort],
    search: state.q || undefined,
    minPrice: state.minPrice ? Number(state.minPrice) : undefined,
    maxPrice: state.maxPrice ? Number(state.maxPrice) : undefined,
    tourType: state.tourType || undefined,
    tourStyles: state.tourStyles || undefined,
    destinationKeys: state.destinations || undefined,
    durationRange: state.duration || undefined,
    currency,
  } : null;
  /*
   * Whether this listing query is bounded enough to cache.
   *
   * Free-text search and arbitrary price ranges would mint an unbounded
   * number of cache entries, so those requests bypass the Data Cache and run
   * exactly as they do today. Only the shapes a visitor can reach by clicking
   * — scope, locale, currency, page, whitelisted sort — are cached.
   */
  const listingCacheable = !!listingQuery && !listingParsed?.isUtility && isCanonicalListing(listingQuery);

  // ── 1. Category ──────────────────────────────────────────────────────────
  {
    let redirectTarget: string | null = null;
    let renderCategory = false;
    let categoryData: any = null;
    let initialSubcategories: any[] = [];
    let initialTours: any = undefined;
    try {
      if (resolved?.type === "category") {
        if (resolved.correctSlug !== slug) {
          redirectTarget = `/${locale}/${resolved.correctSlug}${listingParsed?.redirectSearch || ''}`;
        } else {
          categoryData = resolved.data;
          renderCategory = true;
          /*
           * Both reads need only the category id and neither needs the other
           * result; they were simply awaited in sequence. Running them together
           * removes a full round trip from every cold-cache render.
           *
           * No try/catch: the server readers already return null for a miss or
           * a failure, so there is nothing left here to throw.
           */
          const [subRes, toursRes] = await Promise.all([
            tourSubcategoryServerAPI.getByCategory(categoryData._id, locale),
            listingQuery
              ? tourServerAPI.getListing(
                  {
                    ...listingQuery,
                    category: categoryData._id,
                  },
                  locale,
                  listingCacheable
                )
              : Promise.resolve(null),
          ]);
          if (subRes?.success && subRes.data) initialSubcategories = subRes.data;
          initialTours = toursRes ?? undefined;
        }
      }
    } catch { /* API error — fall through to next lookup */ }
    // Call permanentRedirect OUTSIDE the try-catch so Next.js can throw NEXT_REDIRECT
    if (redirectTarget) permanentRedirect(redirectTarget);
    if (renderCategory) {
      if (!initialTours?.success) throw new Error('Category listing unavailable');
      if (state!.page > (initialTours.totalPages || 1)) notFound();
      return <CategoryView slug={slug} locale={locale} initialCategory={categoryData} initialSubcategories={initialSubcategories} initialTours={initialTours} />;
    }
  }

  // ── 2. Subcategory ────────────────────────────────────────────────────────
  {
    let redirectTarget: string | null = null;
    let renderSubcategory = false;
    let subcategoryData: any = null;
    let initialSiblings: any[] = [];
    let initialTours: any = undefined;
    try {
      if (resolved?.type === "subcategory") {
        if (resolved.correctSlug !== slug) {
          redirectTarget = `/${locale}/${resolved.correctSlug}${listingParsed?.redirectSearch || ''}`;
        } else {
          subcategoryData = resolved.data;
          renderSubcategory = true;
          // Fetch siblings for SEO
          const categoryId = typeof subcategoryData.category === "string" ? subcategoryData.category : subcategoryData.category?._id;
          /* Same independence as the category branch: the sibling rail and the
             listing share nothing beyond ids already in hand. */
          const [siblingsRes, toursRes] = await Promise.all([
            categoryId
              ? tourSubcategoryServerAPI.getByCategory(categoryId, locale)
              : Promise.resolve(null),
            listingQuery
              ? tourServerAPI.getListing(
                  { ...listingQuery, subcategory: subcategoryData._id },
                  locale,
                  listingCacheable
                )
              : Promise.resolve(null),
          ]);
          if (siblingsRes?.success && siblingsRes.data) initialSiblings = siblingsRes.data;
          initialTours = toursRes ?? undefined;
        }
      }
    } catch { /* API error — fall through to next lookup */ }
    // Call permanentRedirect OUTSIDE the try-catch
    if (redirectTarget) permanentRedirect(redirectTarget);
    if (renderSubcategory) {
      if (!initialTours?.success) throw new Error('Subcategory listing unavailable');
      if (state!.page > (initialTours.totalPages || 1)) notFound();
      return <SubcategoryView slug={slug} locale={locale} initialSubcategory={subcategoryData} initialSiblings={initialSiblings} initialTours={initialTours} />;
    }
  }

  // ── 3. Blog Category ───────────────────────────────────────────────────────
  if (resolved?.type === "blogCategory") {
    const categoryData = resolved.data as BlogCategory;
    /*
     * The two reads BlogCategoryView used to make in the browser after
     * hydration, made here instead — so the HTML carries the heading, the
     * topic cards and the article cards rather than a spinner. Both need only
     * what the resolver already returned, so they run together.
     *
     * The article list IS the page, so its request is what decides the
     * response: a 404, a redirect, or the page of cards a crawler following
     * the pager's <a href="?page=2"> gets in the HTML (readBlogListingPage).
     * The topic cards are secondary: without them the page still has its
     * heading, copy and articles, so a failure drops just that section.
     */
    const [initialSubcategories, { listing }] = await Promise.all([
      getBlogSubCategoriesByCategory(categoryData._id, locale).then(
        (subcategories) => (Array.isArray(subcategories) ? subcategories : []),
        () => [] as BlogSubCategory[],
      ),
      readBlogListingPage(
        resolved, slug, locale, query, readCategoryArticles(categoryData, resolved.correctSlug, locale),
      ),
    ]);
    return (
      <BlogCategoryView
        slug={slug}
        locale={locale}
        category={categoryData}
        subcategories={initialSubcategories}
        blogsData={listing}
      />
    );
  }

  // ── 4. Blog Subcategory ────────────────────────────────────────────────────
  if (resolved?.type === "blogSubcategory") {
    const subcategoryData = resolved.data as BlogSubCategory;
    const categoryId = typeof subcategoryData.category === "object"
      ? subcategoryData.category?._id
      : subcategoryData.category;
    // As for the category: the sibling rail is secondary, the article list is
    // the page.
    const [initialSiblingSubcategories, { listing }] = await Promise.all([
      categoryId
        ? getBlogSubCategoriesByCategory(categoryId, locale).catch(() => [] as BlogSubCategory[])
        : Promise.resolve([] as BlogSubCategory[]),
      readBlogListingPage(
        resolved, slug, locale, query, readTopicArticles(subcategoryData, resolved.correctSlug, locale),
      ),
    ]);
    return (
      <BlogSubcategoryView
        slug={slug}
        locale={locale}
        subcategory={subcategoryData}
        blogsData={listing}
        siblingSubcategories={initialSiblingSubcategories}
      />
    );
  }

  // ── 5. Blog Post ───────────────────────────────────────────────────────────
  {
    let redirectTarget: string | null = null;
    let blogData: any = null;
    try {
      if (resolved?.type === "blog") {
        if (resolved.correctSlug !== slug) {
          redirectTarget = `/${locale}/${resolved.correctSlug}`;
        } else {
          blogData = resolved.data;
        }
      }
    } catch { /* API error — fall through */ }
    if (redirectTarget) permanentRedirect(redirectTarget);

    if (blogData) {
      const blogTitle = getLocalizedValue(blogData.title, locale);
      const blogDescription = (getLocalizedValue(blogData.excerpt, locale) || getLocalizedValue(blogData.metaDescription, locale) || "").replace(/<[^>]*>/g, "");
      const blogFeaturedImageUrl = getAbsoluteImageUrl(typeof blogData.featuredImage === "string" ? blogData.featuredImage : blogData.featuredImage?.url);
      const publicAuthorName = blogData.editorialAuthor?.name || getPublicAuthorName(blogData.author?.name);
      const publicAuthorSlug = blogData.editorialAuthor?.slug || (isEditorialAuthor(publicAuthorName) ? EDITORIAL_AUTHOR_SLUG : undefined);
      const publicAuthorUrl = publicAuthorSlug ? `${baseUrl}/${locale}/authors/${publicAuthorSlug}` : undefined;

      const blogJsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": blogTitle,
        ...(blogFeaturedImageUrl ? { "image": [blogFeaturedImageUrl] } : {}),
        // `@id` matches the Person the author page publishes, so every article
        // by the same byline resolves to ONE person in the graph instead of a
        // fresh anonymous Person per article. Only emitted when there IS an
        // author page — an id pointing at nothing is worse than no id.
        "author": {
          "@type": "Person",
          "name": publicAuthorName,
          ...(publicAuthorUrl ? { "@id": `${publicAuthorUrl}#person`, "url": publicAuthorUrl } : {}),
        },
        ...(blogDescription ? { "description": blogDescription } : {}),
        "datePublished": blogData.publishedAt || blogData.createdAt,
        ...(blogData.updatedAt ? { "dateModified": blogData.updatedAt } : {}),
        "publisher": {
          "@type": "Organization",
          "name": "JES Egypt Tours",
          "logo": {
            "@type": "ImageObject",
            "url": `${baseUrl}/images/logo-dark.png`,
            "width": 632,
            "height": 180,
          },
          "@id": `${baseUrl}/#travelagency`,
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `${baseUrl}/${locale}/${slug}`,
        },
      };

      // The BreadcrumbList is published by the trail in BlogHero, from the
      // items it draws — not written out here a second time.
      return (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(blogJsonLd) }}
          />
          <BlogDetailView slug={slug} locale={locale} initialBlog={blogData} />
        </>
      );
    }
  }

  // ── 5.5. Destination ──────────────────────────────────────────────────
  if (resolved?.type === "destination") {
    /*
     * DestinationView used to read the destination and its article list in
     * the browser after hydration, so the HTML carried a spinner. The
     * destination is the entity the resolver already read; only the article
     * list is fetched here, for the page this URL asks for, so a crawler
     * following the pager's <a href="?page=2"> gets page 2's cards in the
     * HTML. The same URL contract as the blog listings applies: a page the
     * destination does not have is a 404, not the landing page without its
     * article section.
     */
    const destinationData = resolved.data as Destination;
    const { listing } = await readBlogListingPage(
      resolved, slug, locale, query, readDestinationArticles(destinationData, locale),
    );
    return (
      <DestinationView
        slug={slug}
        locale={locale}
        destination={destinationData}
        blogsData={listing}
      />
    );
  }

  // ── 6. Tour ───────────────────────────────────────────────────────────────
  {
    let tourRedirectTarget: string | null = null;
    let tourData: any = null;
    try {
      if (resolved?.type === "tour") {
        const tour = ensureTourMapSchema(resolved.data);
        if (resolved.correctSlug !== slug) {
          tourRedirectTarget = `/${locale}/${resolved.correctSlug}`;
        } else {
          tourData = tour;
        }
      }
    } catch { /* API error — fall through to notFound */ }
    // Call permanentRedirect OUTSIDE the try-catch
    if (tourRedirectTarget) permanentRedirect(tourRedirectTarget);

    if (tourData) {
      const tour = tourData;
      const name = getLocalizedValue(tour.heading, locale) || getLocalizedValue(tour.name, locale) || "Tour Details";

      // ── Breadcrumbs — flat URLs for category and subcategory ────────────────
      // One array feeds both the visible trail and the BreadcrumbList below.
      const breadcrumbs = buildTourBreadcrumbs(tour, locale, name as string);
      // The visible trail stops at the tour's parents. Its last entry is the
      // tour's own name, which the <h1> prints directly underneath — as a
      // crumb it was the same long sentence twice in a row. The schema keeps
      // the full trail: a BreadcrumbList ends with the page it is on.
      const visibleBreadcrumbs = breadcrumbs.slice(0, -1);
      const { t: tCommon } = await getServerTranslation(locale, "common");

      // ── JSON-LD @graph — fully dynamic, no fake reviews/ratings ────────────
      // Currency defaults to USD at SSR time (localStorage unavailable server-side).
      // Prices, itinerary, FAQs, and attractions update automatically when
      // the tour data changes in the CMS/database.
      const canonicalUrl = `${baseUrl}/${locale}/${slug}`;
      const jsonLd = generateTourJsonLd({
        tour,
        locale: locale as "en" | "de" | "it" | "es",
        currency: "USD",
        canonicalUrl,
        siteUrl: baseUrl,
        organization: {
          name: "JES Egypt Tours",
          url: baseUrl,
          // logoUrl: add absolute logo URL here when available
          // telephone: add real telephone in E.164 format when available
          // email: add real contact email when available
        },
        breadcrumbs,
        // The same word the visible trail prints ("Startseite", "Inicio"…).
        homeLabel: tCommon("home"),
      });

      return (
        <>
          <SlugManager slugs={tour.slug as any} />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
          />
          <Layout>
            <TopbarOne />
            <HeaderOne linkTheme="light" />
            <PageHeader
              title={name || "Tour Details"}
              subTitle={getLocalizedValue(tour.headingDescription, locale)}
              breadcrumbs={visibleBreadcrumbs}
              // The @graph above already carries this trail's BreadcrumbList,
              // and its WebPage points at it by @id. A second list from the
              // header would give the page two competing trails.
              breadcrumbJsonLd={false}
              bgImage={
                // The site's own stand-in, not a hotlinked Google Images
                // thumbnail. That URL sat here as the fallback: it leaked a
                // referrer to Google on every tour with no picture of its own,
                // depended on a third party staying up, and — once the image
                // optimizer stopped accepting arbitrary hosts — threw, turning
                // the whole page into a 500.
                tour.images?.[0]?.url ||
                tour.featuredImage?.url ||
                TOUR_IMAGE_PLACEHOLDER
              }
              alt={getLocalizedValue(tour.images?.[0]?.alt || tour.featuredImage?.alt, locale) || name}
            />
            <TourListingOneDetails id={slug} initialRawTour={tourData} />
            <FooterOne />
          </Layout>
        </>
      );
    }  // end if (tourData)
  }  // end tour scoped block

  // Nothing matched → proper 404
  notFound();
}
