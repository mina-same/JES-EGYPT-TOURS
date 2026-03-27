import { tourAPI, tourCategoryAPI, tourSubcategoryAPI } from "@/lib/api/tour";
import { getCategoryBySlug as getBlogCategoryBySlug, getSubCategoryBySlug as getBlogSubCategoryBySlug, getBlogBySlug } from "@/lib/api/blog";
import { getLocalizedValue } from "@/lib/localize";
import { reviewsAPI } from "@/lib/api/reviews";
import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import TourListingOneDetails from "@/components/sections/TourListingDetailsOne/TourListingDetailsOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import { SlugManager } from "@/components/common/SlugManager";
import CategoryView from "./_views/CategoryView";
import SubcategoryView from "./_views/SubcategoryView";
import BlogCategoryView from "./_views/BlogCategoryView";
import BlogSubcategoryView from "./_views/BlogSubcategoryView";
import BlogDetailView from "./_views/BlogDetailView";

/**
 * Get the slug for a specific locale WITHOUT the deep fallback chain.
 * Falls back to 'en' only if the locale slug is truly missing.
 * Returns null if neither exists — preventing false "slug matches" via fallback.
 */
function getLocaleSlug(slugObj: any, locale: string): string | null {
  if (!slugObj || typeof slugObj !== 'object') return slugObj || null;
  return slugObj[locale] || slugObj['en'] || null;
}

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://jesegypttours.com";
const LOCALES = ["en", "de", "it", "es"] as const;

function formatISO8601Duration(durationStr: string): string | undefined {
  if (!durationStr) return undefined;
  const lower = durationStr.toLowerCase();
  const daysMatch = lower.match(/(\d+)\s*(day|tag|giorno|día)/);
  const hoursMatch = lower.match(/(\d+)\s*(hour|stunde|ora|hora)/);
  if (daysMatch) return `P${daysMatch[1]}D`;
  if (hoursMatch) return `PT${hoursMatch[1]}H`;
  const justNumber = lower.match(/^(\d+)$/);
  if (justNumber) return `P${justNumber[1]}D`;
  return undefined;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;

  // 1. Try category
  try {
    const catRes = await tourCategoryAPI.getBySlug(slug, locale);
    if (catRes?.success && catRes?.data) {
      const data = catRes.data;
      const title = getLocalizedValue(data.metaTitle || data.name, locale);
      const rawDesc = getLocalizedValue(data.metaDescription || data.description, locale);
      const description = rawDesc ? rawDesc.replace(/<[^>]*>?/gm, '') : "";
      const languages: Record<string, string> = {};
      for (const loc of LOCALES) {
        const s = getLocalizedValue(data.slug, loc);
        if (s) languages[loc] = `${baseUrl}/${loc}/${s}`;
      }
      return {
        title: title ? `${title} | JES Egypt Tours` : "Tour Category | JES Egypt Tours",
        description,
        alternates: { canonical: `${baseUrl}/${locale}/${slug}`, languages },
      };
    }
  } catch {}

  // 2. Try subcategory
  try {
    const subRes = await tourSubcategoryAPI.getBySlug(slug, undefined, locale);
    if (subRes?.success && subRes?.data) {
      const data = subRes.data;
      const title = getLocalizedValue(data.metaTitle || data.name, locale);
      const rawDesc = getLocalizedValue(data.metaDescription || data.description, locale);
      const description = rawDesc ? rawDesc.replace(/<[^>]*>?/gm, '') : "";
      const languages: Record<string, string> = {};
      for (const loc of LOCALES) {
        const s = getLocalizedValue(data.slug, loc);
        if (s) languages[loc] = `${baseUrl}/${loc}/${s}`;
      }
      return {
        title: title ? `${title} | JES Egypt Tours` : "Tour Subcategory | JES Egypt Tours",
        description,
        alternates: { canonical: `${baseUrl}/${locale}/${slug}`, languages },
      };
    }
  } catch {}

  // 3. Try Blog Category
  try {
    const category = await getBlogCategoryBySlug(slug);
    if (category) {
      const title = getLocalizedValue(category.seo?.metaTitle || category.name, locale);
      const rawDesc = getLocalizedValue(category.seo?.metaDescription || category.description, locale);
      const description = rawDesc ? rawDesc.replace(/<[^>]*>?/gm, '') : "";
      const languages: Record<string, string> = {};
      for (const loc of LOCALES) {
        const s = getLocalizedValue(category.slug, loc);
        if (s) languages[loc] = `${baseUrl}/${loc}/${s}`;
      }
      return {
        title: title ? `${title} | JES Egypt Tours` : "Blog Category | JES Egypt Tours",
        description,
        alternates: { canonical: `${baseUrl}/${locale}/${slug}`, languages },
      };
    }
  } catch {}

  // 4. Try Blog Subcategory
  try {
    const subcategory = await getBlogSubCategoryBySlug(slug);
    if (subcategory) {
      const title = getLocalizedValue(subcategory.seo?.metaTitle || subcategory.name, locale);
      const rawDesc = getLocalizedValue(subcategory.seo?.metaDescription || subcategory.description, locale);
      const description = rawDesc ? rawDesc.replace(/<[^>]*>?/gm, '') : "";
      const languages: Record<string, string> = {};
      for (const loc of LOCALES) {
        const s = getLocalizedValue(subcategory.slug, loc);
        if (s) languages[loc] = `${baseUrl}/${loc}/${s}`;
      }
      return {
        title: title ? `${title} | JES Egypt Tours` : "Blog Subcategory | JES Egypt Tours",
        description,
        alternates: { canonical: `${baseUrl}/${locale}/${slug}`, languages },
      };
    }
  } catch {}

  // 5. Try Blog Post
  try {
    const blog = await getBlogBySlug(slug);
    if (blog) {
      const featuredImageUrl = typeof blog.featuredImage === "string" ? blog.featuredImage : blog.featuredImage?.url;
      const title = getLocalizedValue(blog.seo?.metaTitle || blog.title, locale);
      const rawDesc = getLocalizedValue(blog.seo?.metaDescription || blog.excerpt, locale);
      const description = rawDesc ? rawDesc.replace(/<[^>]*>?/gm, '') : "";
      const languages: Record<string, string> = {};
      for (const loc of LOCALES) {
        const s = getLocalizedValue(blog.slug, loc);
        if (s) languages[loc] = `${baseUrl}/${loc}/${s}`;
      }
      return {
        title: `${title} | JES Egypt Tours`,
        description,
        alternates: { canonical: `${baseUrl}/${locale}/${slug}`, languages },
        openGraph: {
          title,
          description,
          images: blog.seo?.metaImage?.url ? [blog.seo.metaImage.url] : [featuredImageUrl].filter(Boolean) as string[],
          type: "article",
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          images: blog.seo?.metaImage?.url ? [blog.seo.metaImage.url] : [featuredImageUrl].filter(Boolean) as string[],
        },
      };
    }
  } catch {}

  // 6. Try tour
  try {
    const tourRes = await tourAPI.getBySlug(slug, locale);
    if (tourRes?.success && tourRes?.data) {
      const tour = tourRes.data;
      const title = tour.metaTitle?.[locale as any] || tour.heading?.[locale as any] || tour.name || "Tour Details";
      const rawDesc = tour.metaDescription?.[locale as any] || tour.overview || "";
      const description = rawDesc ? rawDesc.replace(/<[^>]*>?/gm, '').substring(0, 160) : "";
      const image = tour.featuredImage?.url || tour.sliderImages?.[0];
      const languages: Record<string, string> = {};
      for (const loc of LOCALES) {
        const s = tour.slug?.[loc] || slug;
        if (s) languages[loc] = `${baseUrl}/${loc}/${s}`;
      }
      return {
        title: `${title} | JES Egypt Tours`,
        description,
        alternates: { canonical: `${baseUrl}/${locale}/${slug}`, languages },
        openGraph: { title, description, images: image ? [image] : [], type: "website" },
        twitter: { card: "summary_large_image", title, description, images: image ? [image] : [] },
        robots: "noindex, nofollow",
      };
    }
  } catch {}

  return { title: "Not Found | JES Egypt Tours", robots: "noindex" };
}

export default async function SlugPage({ params }: PageProps) {
  const { slug, locale } = await params;

  // ── 1. Category ──────────────────────────────────────────────────────────
  {
    let redirectTarget: string | null = null;
    let renderCategory = false;
    try {
      const catRes = await tourCategoryAPI.getBySlug(slug, locale);
      if (catRes?.success && catRes?.data) {
        const correctSlug = getLocaleSlug(catRes.data.slug, locale);
        if (correctSlug && correctSlug !== slug) {
          redirectTarget = `/${locale}/${correctSlug}`;
        } else {
          renderCategory = true;
        }
      }
    } catch { /* API error — fall through to next lookup */ }
    // Call permanentRedirect OUTSIDE the try-catch so Next.js can throw NEXT_REDIRECT
    if (redirectTarget) permanentRedirect(redirectTarget);
    if (renderCategory) return <CategoryView slug={slug} locale={locale} />;
  }

  // ── 2. Subcategory ────────────────────────────────────────────────────────
  {
    let redirectTarget: string | null = null;
    let renderSubcategory = false;
    try {
      const subRes = await tourSubcategoryAPI.getBySlug(slug, undefined, locale);
      if (subRes?.success && subRes?.data) {
        const correctSlug = getLocaleSlug(subRes.data.slug, locale);
        if (correctSlug && correctSlug !== slug) {
          redirectTarget = `/${locale}/${correctSlug}`;
        } else {
          renderSubcategory = true;
        }
      }
    } catch { /* API error — fall through to next lookup */ }
    // Call permanentRedirect OUTSIDE the try-catch
    if (redirectTarget) permanentRedirect(redirectTarget);
    if (renderSubcategory) return <SubcategoryView slug={slug} locale={locale} />;
  }

  // ── 3. Blog Category ───────────────────────────────────────────────────────
  {
    let redirectTarget: string | null = null;
    let renderBlogCategory = false;
    try {
      const category = await getBlogCategoryBySlug(slug);
      if (category) {
        const correctSlug = getLocaleSlug(category.slug, locale);
        if (correctSlug && correctSlug !== slug) {
          redirectTarget = `/${locale}/${correctSlug}`;
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
      const subcategory = await getBlogSubCategoryBySlug(slug);
      if (subcategory) {
        const correctSlug = getLocaleSlug(subcategory.slug, locale);
        if (correctSlug && correctSlug !== slug) {
          redirectTarget = `/${locale}/${correctSlug}`;
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
    let renderBlogPost = false;
    try {
      const blog = await getBlogBySlug(slug);
      if (blog) {
        const correctSlug = getLocaleSlug(blog.slug, locale);
        if (correctSlug && correctSlug !== slug) {
          redirectTarget = `/${locale}/${correctSlug}`;
        } else {
          renderBlogPost = true;
        }
      }
    } catch { /* API error — fall through */ }
    if (redirectTarget) permanentRedirect(redirectTarget);
    if (renderBlogPost) return <BlogDetailView slug={slug} locale={locale} />;
  }

  // ── 6. Tour ───────────────────────────────────────────────────────────────
  {
    let tourRedirectTarget: string | null = null;
    let tourData: any = null;
    try {
      const tourRes = await tourAPI.getBySlug(slug, locale);
      if (tourRes?.success && tourRes?.data) {
        const tour = tourRes.data;
        const correctSlug = getLocaleSlug(tour.slug, locale);
        if (correctSlug && correctSlug !== slug) {
          tourRedirectTarget = `/${locale}/${correctSlug}`;
        } else {
          tourData = tour;
        }
      }
    } catch { /* API error — fall through to notFound */ }
    // Call permanentRedirect OUTSIDE the try-catch
    if (tourRedirectTarget) permanentRedirect(tourRedirectTarget);

    if (tourData) {
      const tour = tourData;
      const tourId = tour._id;
      const name = tour.heading?.[locale as any] || tour.name || "Tour Details";

      // Fetch reviews server-side for Schema.org
      let reviews: any[] = [];
      try {
        const reviewsRes = await reviewsAPI.getReviewsByTour(tourId);
        if (reviewsRes.success) reviews = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];
      } catch {}

      // Breadcrumbs — flat URLs for category and subcategory
      const category = tour.category;
      const subcategory = tour.subcategory;
      const breadcrumbs: { label: string; href?: string }[] = [{ label: "Destination", href: "/" }];

      if (category?.name?.[locale as any] || category?.name) {
        const catSlug = getLocalizedValue(category.slug, locale);
        breadcrumbs.push({
          label: (category.name?.[locale as any] || category.name) as string,
          href: catSlug ? `/${locale}/${catSlug}` : undefined,
        });
      }
      if (subcategory?.name?.[locale as any] || subcategory?.name) {
        const subSlug = getLocalizedValue(subcategory.slug, locale);
        breadcrumbs.push({
          label: (subcategory.name?.[locale as any] || subcategory.name) as string,
          href: subSlug ? `/${locale}/${subSlug}` : undefined,
        });
      }
      breadcrumbs.push({ label: name as string });

      // Schema.org JSON-LD
      const avgRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
        : "5.0";
      const durationStr = tour.duration?.[locale as any] || tour.duration?.en || "";
      const isoDuration = formatISO8601Duration(durationStr);

      const itinerarySteps = tour.itinerary?.days?.map((day: any) => ({
        "@type": "ItemList",
        "name": `Day ${day.day}: ${day.title?.[locale as any] || day.title?.en || ""}`,
        "description": day.description?.[locale as any] || day.description?.en || "",
        "itemListElement": day.activities?.map((act: any, idx: number) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "name": act.heading?.[locale as any] || act.heading?.en || "",
        })),
      })) || [];

      const mapUrl = tour.tourMapIframe?.match(/src="([^"]+)"/)?.[1];

      const jsonLd: any = {
        "@context": "https://schema.org",
        "@type": "Tour",
        "name": name,
        "description": (tour.overview?.[locale as any] || tour.overview?.en || tour.overview || "").replace(/<[^>]*>/g, ""),
        "image": [...(tour.images?.map((img: any) => img.url) || []), ...(tour.gallery?.map((img: any) => img.url) || [])].filter(Boolean),
        "tourDuration": isoDuration,
        "duration": isoDuration,
        "touristDestination": { "@type": "Place", "name": tour.tourLocation?.[locale as any] || tour.tourLocation?.en || "" },
        "touristType": tour.tourType?.[locale as any] || tour.tourType?.en || "",
        "itinerary": itinerarySteps,
        "offers": {
          "@type": "Offer",
          "price": tour.priceStartingFrom || tour.price,
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "url": `${baseUrl}/${locale}/${slug}`,
        },
        "provider": { "@type": "TravelAgency", "name": "JES Egypt Tours", "url": baseUrl, "@id": `${baseUrl}/#organization` },
        "mainEntityOfPage": { "@type": "WebPage", "@id": `${baseUrl}/${locale}/${slug}` },
      };

      if (reviews.length > 0) {
        jsonLd.aggregateRating = { "@type": "AggregateRating", "ratingValue": avgRating, "reviewCount": reviews.length, "bestRating": "5", "worstRating": "1" };
        jsonLd.review = reviews.slice(0, 5).map(r => ({
          "@type": "Review",
          "reviewRating": { "@type": "Rating", "ratingValue": r.rating || 5 },
          "author": { "@type": "Person", "name": r.name || "Anonymous" },
          "reviewBody": r.comment || "",
        }));
      }
      if (mapUrl) jsonLd.hasMap = mapUrl;

      return (
        <>
          <SlugManager slugs={tour.slug as any} />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
          <Layout>
            <TopbarOne />
            <HeaderOne linkTheme="light" />
            <PageHeader
              title={name || "Tour Details"}
              breadcrumbs={breadcrumbs}
              bgImage={tour.featuredImage?.url || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwBz9RsGBZErQQOzYdoMyqX-6tjs_zUEuiJg&s"}
              alt={getLocalizedValue(tour.featuredImage?.alt, locale) || name}
            />
            <TourListingOneDetails id={slug} />
            <FooterOne />
          </Layout>
        </>
      );
    }  // end if (tourData)
  }  // end tour scoped block

  // Nothing matched → proper 404
  notFound();
}
