import { tourAPI, tourCategoryAPI, tourSubcategoryAPI } from "@/lib/api/tour";
import { getCategoryBySlug as getBlogCategoryBySlug, getSubCategoryBySlug as getBlogSubCategoryBySlug, getBlogBySlug } from "@/lib/api/blog";
import { getDestinationBySlug } from "@/lib/api/destination";
import { getLocalizedValue } from "@/lib/localize";
import { getStrictLocalizedSlug, type SupportedLocale } from "@/lib/url";
import { getStrictSlugLocaleAlternates } from "@/lib/seo/localeAlternates";
import { generateTourJsonLd } from "@/lib/seo/tourJsonLd";
import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import TourListingOneDetails from "@/components/sections/TourListingDetailsOne/TourListingDetailsOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import { SlugManager } from "@/components/common/SlugManager";
import CategoryView from "./_views/CategoryView";
import SubcategoryView from "./_views/SubcategoryView";
import BlogCategoryView from "./_views/BlogCategoryView";
import BlogSubcategoryView from "./_views/BlogSubcategoryView";
import BlogDetailView from "./_views/BlogDetailView";
import DestinationView from "./_views/DestinationView";
import { ogSiteDefaults } from "@/lib/ogDefaults";
import { hasNoContentForLocale } from "@/lib/blogBlocks";

/**
 * Get the slug for a specific locale WITHOUT the deep fallback chain.
 * Returns null if the slug doesn't exist for the specific locale (forcing a 404).
 */
function getLocaleSlug(slugObj: any, locale: string): string | null {
  if (!slugObj || typeof slugObj !== 'object') return slugObj || null;
  return slugObj[locale] || null;
}

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
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.jesegypttours.com";
const EDITORIAL_AUTHOR_NAME = "Madonna Roshdey";
const EDITORIAL_AUTHOR_SLUG = "madonna-roshdey";

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

function getPublicAuthorName(authorName?: string | null): string {
  const trimmed = authorName?.trim();
  if (trimmed && trimmed.toLowerCase() !== "admin") {
    return trimmed;
  }
  return EDITORIAL_AUTHOR_NAME;
}

function isEditorialAuthor(authorName: string): boolean {
  return authorName === EDITORIAL_AUTHOR_NAME;
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

const resolveSlugContent = cache(async (slug: string, locale: string): Promise<ResolvedSlugContent | null> => {
  // 1. Try tour (checked first: most common content type, and confirmed via
  //    DB audit to have zero slug collisions with any other content type)
  try {
    const tourRes = await tourAPI.getBySlug(slug, locale);
    if (tourRes?.success && tourRes?.data) {
      const correctSlug = getLocaleSlug(tourRes.data.slug, locale);
      if (correctSlug) return { type: "tour", data: tourRes.data, correctSlug };
    }
  } catch {}

  // 2. Try category
  try {
    const catRes = await tourCategoryAPI.getBySlug(slug, locale);
    if (catRes?.success && catRes?.data) {
      const correctSlug = getLocaleSlug(catRes.data.slug, locale);
      if (correctSlug) return { type: "category", data: catRes.data, correctSlug };
    }
  } catch {}

  // 3. Try subcategory
  try {
    const subRes = await tourSubcategoryAPI.getBySlug(slug, undefined, locale);
    if (subRes?.success && subRes?.data) {
      const correctSlug = getLocaleSlug(subRes.data.slug, locale);
      if (correctSlug) return { type: "subcategory", data: subRes.data, correctSlug };
    }
  } catch {}

  // 4. Try Blog Category
  try {
    const category = await getBlogCategoryBySlug(slug, locale);
    if (category) {
      const correctSlug = getLocaleSlug(category.slug, locale);
      if (correctSlug) return { type: "blogCategory", data: category, correctSlug };
    }
  } catch {}

  // 5. Try Blog Subcategory
  try {
    const subcategory = await getBlogSubCategoryBySlug(slug, locale);
    if (subcategory) {
      const correctSlug = getLocaleSlug(subcategory.slug, locale);
      if (correctSlug) return { type: "blogSubcategory", data: subcategory, correctSlug };
    }
  } catch {}

  // 6. Try Blog Post
  try {
    const blog = await getBlogBySlug(slug, locale);
    if (blog) {
      const correctSlug = getLocaleSlug(blog.slug, locale);
      // A slug alone is not enough: if none of the article's blocks belong to
      // this language there is nothing to render, and falling back to another
      // language would republish content the editor scoped elsewhere. Returning
      // nothing here makes the page 404 and keeps it out of generateMetadata.
      if (correctSlug && !hasNoContentForLocale(blog.contentBlocks, locale)) {
        return { type: "blog", data: blog, correctSlug };
      }
    }
  } catch {}

  // 7. Try Destination
  try {
    const destination = await getDestinationBySlug(slug, locale);
    if (destination) {
      const correctSlug = getLocaleSlug(destination.slug, locale);
      if (correctSlug) return { type: "destination", data: destination, correctSlug };
    }
  } catch {}

  return null;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const resolved = await resolveSlugContent(slug, locale);

  if (resolved?.type === "category") {
    const data = resolved.data;
    const seoTitle = getLocalizedValue(data.seo?.metaTitle, locale);
    const seoDescription = getLocalizedValue(data.seo?.metaDescription, locale);
    const description = stripHtml(seoDescription || "");
    const keywords = getLocalizedValue(data.seo?.metaKeywords, locale);
    const image = getSeoImage(data.seo?.metaImage, data.image, locale, seoTitle || getLocalizedValue(data.name, locale));

    const alternates = getStrictSlugLocaleAlternates({ locale, currentSlug: slug, slugs: data.slug, baseUrl });
    return {
      title: seoTitle ? seoTitle : "JES Egypt Tours",
      description,
      keywords: keywords || undefined,
      alternates,
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
    const data = resolved.data;
    const seoTitle = getLocalizedValue(data.seo?.metaTitle, locale);
    const seoDescription = getLocalizedValue(data.seo?.metaDescription, locale);
    const description = stripHtml(seoDescription || "");
    const keywords = getLocalizedValue(data.seo?.metaKeywords, locale);
    const image = getSeoImage(data.seo?.metaImage, data.image, locale, seoTitle || getLocalizedValue(data.name, locale));

    const alternates = getStrictSlugLocaleAlternates({ locale, currentSlug: slug, slugs: data.slug, baseUrl });
    return {
      title: seoTitle ? seoTitle : "JES Egypt Tours",
      description,
      keywords: keywords || undefined,
      alternates,
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
    const seoTitle = getLocalizedValue(cAny.metaTitle, locale);
    const seoDescription = getLocalizedValue(cAny.metaDescription, locale);
    const description = stripHtml(seoDescription || "");
    const keywords = getLocalizedValue(cAny.metaKeywords, locale);
    const image = getSeoImage(cAny.metaImage, cAny.ogImage || cAny.image, locale, seoTitle || getLocalizedValue(cAny.name, locale));
    const ogTitle = ownLocaleValue(cAny.ogTitle, locale) || seoTitle || "JES Egypt Tours";
    const ogDescription = stripHtml(ownLocaleValue(cAny.ogDescription, locale)) || description;

    const alternates = getStrictSlugLocaleAlternates({ locale, currentSlug: slug, slugs: category.slug, baseUrl });
    return {
      title: seoTitle ? seoTitle : "JES Egypt Tours",
      description,
      keywords: keywords || undefined,
      alternates,
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
    const seoTitle = getLocalizedValue(sAny.metaTitle, locale);
    const seoDescription = getLocalizedValue(sAny.metaDescription, locale);
    const description = stripHtml(seoDescription || "");
    const keywords = getLocalizedValue(sAny.metaKeywords, locale);
    const image = getSeoImage(sAny.metaImage, sAny.ogImage || sAny.image, locale, seoTitle || getLocalizedValue(sAny.name, locale));
    const ogTitle = ownLocaleValue(sAny.ogTitle, locale) || seoTitle || "JES Egypt Tours";
    const ogDescription = stripHtml(ownLocaleValue(sAny.ogDescription, locale)) || description;

    const alternates = getStrictSlugLocaleAlternates({ locale, currentSlug: slug, slugs: subcategory.slug, baseUrl });
    return {
      title: seoTitle ? seoTitle : "JES Egypt Tours",
      description,
      keywords: keywords || undefined,
      alternates,
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

    const alternates = getStrictSlugLocaleAlternates({ locale, currentSlug: slug, slugs: blog.slug, baseUrl });
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
    const alternates = getStrictSlugLocaleAlternates({ locale, currentSlug: slug, slugs: destination.slug, baseUrl });
    return {
      title: seoTitle || `${getLocalizedValue(destination.name, locale)} | JES Egypt Tours`,
      description,
      keywords: keywords || undefined,
      alternates,
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
    const image = getSeoImage(tour.seo?.metaImage, tour.featuredImage || tour.sliderImages?.[0], locale, seoTitle || getLocalizedValue(tour.title, locale));
    const alternates = getStrictSlugLocaleAlternates({ locale, currentSlug: slug, slugs: tour.slug, baseUrl });
    return {
      title: seoTitle ? seoTitle : "JES Egypt Tours",
      description,
      keywords: keywords || undefined,
      alternates,
      openGraph: {
        ...ogSiteDefaults(locale),
        title: seoTitle || "JES Egypt Tours",
        description,
        images: image ? [image] : [],
        type: "website"
      },
      twitter: {
        card: "summary_large_image",
        title: seoTitle || "JES Egypt Tours",
        description,
        images: image ? [image] : []
      },
      other: withImageSource(image),
    };
  }

  return { title: "Not Found | JES Egypt Tours", robots: "noindex" };
}

export default async function SlugPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const resolved = await resolveSlugContent(slug, locale);

  // ── 1. Category ──────────────────────────────────────────────────────────
  {
    let redirectTarget: string | null = null;
    let renderCategory = false;
    let categoryData: any = null;
    let initialSubcategories: any[] = [];
    try {
      if (resolved?.type === "category") {
        if (resolved.correctSlug !== slug) {
          redirectTarget = `/${locale}/${resolved.correctSlug}`;
        } else {
          categoryData = resolved.data;
          renderCategory = true;
          // Optionally fetch subcategories here if needed for full SEO
          try {
            const subRes = await tourSubcategoryAPI.getByCategory(categoryData._id);
            if (subRes.success && subRes.data) initialSubcategories = subRes.data;
          } catch {}
        }
      }
    } catch { /* API error — fall through to next lookup */ }
    // Call permanentRedirect OUTSIDE the try-catch so Next.js can throw NEXT_REDIRECT
    if (redirectTarget) permanentRedirect(redirectTarget);
    if (renderCategory) return <CategoryView slug={slug} locale={locale} initialCategory={categoryData} initialSubcategories={initialSubcategories} />;
  }

  // ── 2. Subcategory ────────────────────────────────────────────────────────
  {
    let redirectTarget: string | null = null;
    let renderSubcategory = false;
    let subcategoryData: any = null;
    let initialSiblings: any[] = [];
    try {
      if (resolved?.type === "subcategory") {
        if (resolved.correctSlug !== slug) {
          redirectTarget = `/${locale}/${resolved.correctSlug}`;
        } else {
          subcategoryData = resolved.data;
          renderSubcategory = true;
          // Fetch siblings for SEO
          const categoryId = typeof subcategoryData.category === "string" ? subcategoryData.category : subcategoryData.category?._id;
          if (categoryId) {
            try {
              const siblingsRes = await tourSubcategoryAPI.getByCategory(categoryId);
              if (siblingsRes.success && siblingsRes.data) initialSiblings = siblingsRes.data;
            } catch {}
          }
        }
      }
    } catch { /* API error — fall through to next lookup */ }
    // Call permanentRedirect OUTSIDE the try-catch
    if (redirectTarget) permanentRedirect(redirectTarget);
    if (renderSubcategory) return <SubcategoryView slug={slug} locale={locale} initialSubcategory={subcategoryData} initialSiblings={initialSiblings} />;
  }

  // ── 3. Blog Category ───────────────────────────────────────────────────────
  {
    let redirectTarget: string | null = null;
    let renderBlogCategory = false;
    try {
      if (resolved?.type === "blogCategory") {
        if (resolved.correctSlug !== slug) {
          redirectTarget = `/${locale}/${resolved.correctSlug}`;
        } else {
          renderBlogCategory = true;
        }
      }
    } catch { /* API error — fall through */ }
    if (redirectTarget) permanentRedirect(redirectTarget);
    if (renderBlogCategory) return <BlogCategoryView slug={slug} locale={locale} />;
  }

  // ── 4. Blog Subcategory ────────────────────────────────────────────────────
  {
    let redirectTarget: string | null = null;
    let renderBlogSubcategory = false;
    try {
      if (resolved?.type === "blogSubcategory") {
        if (resolved.correctSlug !== slug) {
          redirectTarget = `/${locale}/${resolved.correctSlug}`;
        } else {
          renderBlogSubcategory = true;
        }
      }
    } catch { /* API error — fall through */ }
    if (redirectTarget) permanentRedirect(redirectTarget);
    if (renderBlogSubcategory) return <BlogSubcategoryView slug={slug} locale={locale} />;
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

      const blogSubCat = blogData.subCategory;
      const blogCat = blogSubCat?.category;
      const blogCatName = blogCat && typeof blogCat === 'object' ? getLocalizedValue(blogCat.name, locale) : 'Blog';
      const blogCatSlug = blogCat && typeof blogCat === 'object'
        ? getStrictLocalizedSlug(blogCat.slug, locale as SupportedLocale)
        : null;
      const blogCatUrl = blogCatSlug ? `${baseUrl}/${locale}/${blogCatSlug}` : null;

      const blogJsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": blogTitle,
        ...(blogFeaturedImageUrl ? { "image": [blogFeaturedImageUrl] } : {}),
        "author": {
          "@type": "Person",
          "name": publicAuthorName,
          ...(publicAuthorUrl ? { "url": publicAuthorUrl } : {}),
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

      const blogBreadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": `${baseUrl}/${locale}`,
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": blogCatName,
            ...(blogCatUrl ? { "item": blogCatUrl } : {}),
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": blogTitle,
            "item": `${baseUrl}/${locale}/${slug}`,
          },
        ],
      };

      return (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(blogBreadcrumbJsonLd) }}
          />
          <BlogDetailView slug={slug} locale={locale} initialBlog={blogData} />
        </>
      );
    }
  }

  // ── 5.5. Destination ──────────────────────────────────────────────────
  {
    let redirectTarget: string | null = null;
    let renderDestination = false;
    try {
      if (resolved?.type === "destination") {
        if (resolved.correctSlug !== slug) {
          redirectTarget = `/${locale}/${resolved.correctSlug}`;
        } else {
          renderDestination = true;
        }
      }
    } catch { /* API error — fall through */ }
    if (redirectTarget) permanentRedirect(redirectTarget);
    if (renderDestination) return <DestinationView slug={slug} locale={locale} />;
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
      const name = getLocalizedValue(tour.heading || tour.name, locale) || "Tour Details";

      // ── Breadcrumbs — flat URLs for category and subcategory ────────────────
      const subcategory = tour.subcategory;
      const category = subcategory?.category;
      const breadcrumbs: { label: string; href?: string }[] = [];

      if (category?.name) {
        const catSlug = getStrictLocalizedSlug(category.slug, locale as SupportedLocale);
        breadcrumbs.push({
          label: getLocalizedValue(category.name, locale),
          href: catSlug ? `/${locale}/${catSlug}` : undefined,
        });
      }
      if (subcategory?.name) {
        const subSlug = getStrictLocalizedSlug(subcategory.slug, locale as SupportedLocale);
        breadcrumbs.push({
          label: getLocalizedValue(subcategory.name, locale),
          href: subSlug ? `/${locale}/${subSlug}` : undefined,
        });
      }
      breadcrumbs.push({ label: name as string });

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
      });

      return (
        <>
          <SlugManager slugs={tour.slug as any} />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <Layout>
            <TopbarOne />
            <HeaderOne linkTheme="light" />
            <PageHeader
              title={name || "Tour Details"}
              subTitle={getLocalizedValue(tour.headingDescription, locale)}
              breadcrumbs={breadcrumbs}
              bgImage={tour.images?.[0]?.url || tour.featuredImage?.url || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwBz9RsGBZErQQOzYdoMyqX-6tjs_zUEuiJg&s"}
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
