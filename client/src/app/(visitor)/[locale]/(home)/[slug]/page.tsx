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
 * Returns null if the slug doesn't exist for the specific locale (forcing a 404).
 */
function getLocaleSlug(slugObj: any, locale: string): string | null {
  if (!slugObj || typeof slugObj !== 'object') return slugObj || null;
  return slugObj[locale] || null;
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
      const correctSlug = getLocaleSlug(data.slug, locale);
      if (correctSlug) {
        const seoTitle = getLocalizedValue(data.seo?.metaTitle, locale);
        const title = seoTitle || getLocalizedValue(data.name, locale);
        const seoDescription = getLocalizedValue(data.seo?.metaDescription, locale);
        const rawDesc = seoDescription || getLocalizedValue(data.description, locale);
        const description = rawDesc ? rawDesc.replace(/<[^>]*>?/gm, '').substring(0, 160) : "";
        const keywords = getLocalizedValue(data.seo?.metaKeywords, locale);
        
        const languages: Record<string, string> = {};
        for (const loc of LOCALES) {
          const s = getLocalizedValue(data.slug, loc);
          if (s) languages[loc] = `${baseUrl}/${loc}/${s}`;
        }
        return {
          title: seoTitle ? seoTitle : `${title} | JES Egypt Tours`,
          description,
          keywords: keywords || undefined,
          alternates: { canonical: `${baseUrl}/${locale}/${slug}`, languages },
          openGraph: {
            title: seoTitle || title,
            description,
            type: "website",
          }
        };
      }
    }
  } catch {}

  // 2. Try subcategory
  try {
    const subRes = await tourSubcategoryAPI.getBySlug(slug, undefined, locale);
    if (subRes?.success && subRes?.data) {
      const data = subRes.data;
      const correctSlug = getLocaleSlug(data.slug, locale);
      if (correctSlug) {
        const seoTitle = getLocalizedValue(data.seo?.metaTitle, locale);
        const title = seoTitle || getLocalizedValue(data.name, locale);
        const seoDescription = getLocalizedValue(data.seo?.metaDescription, locale);
        const rawDesc = seoDescription || getLocalizedValue(data.description, locale);
        const description = rawDesc ? rawDesc.replace(/<[^>]*>?/gm, '').substring(0, 160) : "";
        const keywords = getLocalizedValue(data.seo?.metaKeywords, locale);

        const languages: Record<string, string> = {};
        for (const loc of LOCALES) {
          const s = getLocalizedValue(data.slug, loc);
          if (s) languages[loc] = `${baseUrl}/${loc}/${s}`;
        }
        return {
          title: seoTitle ? seoTitle : `${title} | JES Egypt Tours`,
          description,
          keywords: keywords || undefined,
          alternates: { canonical: `${baseUrl}/${locale}/${slug}`, languages },
          openGraph: {
            title: seoTitle || title,
            description,
            type: "website",
          }
        };
      }
    }
  } catch {}

  // 3. Try Blog Category
  try {
    const category = await getBlogCategoryBySlug(slug);
    if (category) {
      const correctSlug = getLocaleSlug(category.slug, locale);
      if (correctSlug) {
        const seoTitle = getLocalizedValue(category.seo?.metaTitle, locale);
        const title = seoTitle || getLocalizedValue(category.name, locale);
        const seoDescription = getLocalizedValue(category.seo?.metaDescription, locale);
        const rawDesc = seoDescription || getLocalizedValue(category.description, locale);
        const description = rawDesc ? rawDesc.replace(/<[^>]*>?/gm, '').substring(0, 160) : "";
        const keywords = getLocalizedValue(category.seo?.metaKeywords, locale);

        const languages: Record<string, string> = {};
        for (const loc of LOCALES) {
          const s = getLocalizedValue(category.slug, loc);
          if (s) languages[loc] = `${baseUrl}/${loc}/${s}`;
        }
        return {
          title: seoTitle ? seoTitle : `${title} | JES Egypt Tours`,
          description,
          keywords: keywords || undefined,
          alternates: { canonical: `${baseUrl}/${locale}/${slug}`, languages },
        };
      }
    }
  } catch {}

  // 4. Try Blog Subcategory
  try {
    const subcategory = await getBlogSubCategoryBySlug(slug);
    if (subcategory) {
      const correctSlug = getLocaleSlug(subcategory.slug, locale);
      if (correctSlug) {
        const seoTitle = getLocalizedValue(subcategory.seo?.metaTitle, locale);
        const title = seoTitle || getLocalizedValue(subcategory.name, locale);
        const seoDescription = getLocalizedValue(subcategory.seo?.metaDescription, locale);
        const rawDesc = seoDescription || getLocalizedValue(subcategory.description, locale);
        const description = rawDesc ? rawDesc.replace(/<[^>]*>?/gm, '').substring(0, 160) : "";
        const keywords = getLocalizedValue(subcategory.seo?.metaKeywords, locale);

        const languages: Record<string, string> = {};
        for (const loc of LOCALES) {
          const s = getLocalizedValue(subcategory.slug, loc);
          if (s) languages[loc] = `${baseUrl}/${loc}/${s}`;
        }
        return {
          title: seoTitle ? seoTitle : `${title} | JES Egypt Tours`,
          description,
          keywords: keywords || undefined,
          alternates: { canonical: `${baseUrl}/${locale}/${slug}`, languages },
        };
      }
    }
  } catch {}

  // 5. Try Blog Post
  try {
    const blog = await getBlogBySlug(slug);
    if (blog) {
      const correctSlug = getLocaleSlug(blog.slug, locale);
      if (correctSlug) {
        const featuredImageUrl = typeof blog.featuredImage === "string" ? blog.featuredImage : blog.featuredImage?.url;
        const seoTitle = getLocalizedValue(blog.seo?.metaTitle, locale);
        const title = seoTitle || getLocalizedValue(blog.title, locale);
        const seoDescription = getLocalizedValue(blog.seo?.metaDescription, locale);
        const rawDesc = seoDescription || getLocalizedValue(blog.excerpt, locale);
        const description = rawDesc ? rawDesc.replace(/<[^>]*>?/gm, '').substring(0, 160) : "";
        const keywords = getLocalizedValue(blog.seo?.metaKeywords, locale);

        const languages: Record<string, string> = {};
        for (const loc of LOCALES) {
          const s = getLocalizedValue(blog.slug, loc);
          if (s) languages[loc] = `${baseUrl}/${loc}/${s}`;
        }
        return {
          title: seoTitle ? seoTitle : `${title} | JES Egypt Tours`,
          description,
          keywords: keywords || undefined,
          alternates: { canonical: `${baseUrl}/${locale}/${slug}`, languages },
          openGraph: {
            title: seoTitle || title,
            description,
            images: blog.seo?.metaImage?.url ? [blog.seo.metaImage.url] : [featuredImageUrl].filter(Boolean) as string[],
            type: "article",
          },
          twitter: {
            card: "summary_large_image",
            title: seoTitle || title,
            description,
            images: blog.seo?.metaImage?.url ? [blog.seo.metaImage.url] : [featuredImageUrl].filter(Boolean) as string[],
          },
        };
      }
    }
  } catch {}

  // 6. Try tour
  try {
    const tourRes = await tourAPI.getBySlug(slug, locale);
    if (tourRes?.success && tourRes?.data) {
      const tour = tourRes.data;
      const correctSlug = getLocaleSlug(tour.slug, locale);
      if (correctSlug) {
        const seoTitle = getLocalizedValue(tour.seo?.metaTitle, locale);
        const title = seoTitle || getLocalizedValue(tour.heading || tour.name, locale);
        const seoDescription = getLocalizedValue(tour.seo?.metaDescription, locale);
        const rawDesc = seoDescription || getLocalizedValue(tour.Description?.text, locale);
        const description = rawDesc ? rawDesc.replace(/<[^>]*>?/gm, '').substring(0, 160) : "";
        const keywords = getLocalizedValue(tour.seo?.metaKeywords, locale);

        const image = tour.seo?.metaImage?.url || tour.featuredImage?.url || tour.sliderImages?.[0];
        const languages: Record<string, string> = {};
        for (const loc of LOCALES) {
          const s = getLocaleSlug(tour.slug, loc);
          if (s) languages[loc] = `${baseUrl}/${loc}/${s}`;
        }
        return {
          title: seoTitle ? seoTitle : `${title} | JES Egypt Tours`,
          description,
          keywords: keywords || undefined,
          alternates: { canonical: `${baseUrl}/${locale}/${slug}`, languages },
          openGraph: { 
            title: seoTitle || title, 
            description, 
            images: image ? [image] : [], 
            type: "website" 
          },
          twitter: { 
            card: "summary_large_image", 
            title: seoTitle || title, 
            description, 
            images: image ? [image] : [] 
          },
        };
      }
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
    let categoryData: any = null;
    let initialSubcategories: any[] = [];
    try {
      const catRes = await tourCategoryAPI.getBySlug(slug, locale);
      if (catRes?.success && catRes?.data) {
        const correctSlug = getLocaleSlug(catRes.data.slug, locale);
        if (!correctSlug) {
          /* No translated slug for this locale, let it 404 */
        } else if (correctSlug !== slug) {
          redirectTarget = `/${locale}/${correctSlug}`;
        } else {
          categoryData = catRes.data;
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
      const subRes = await tourSubcategoryAPI.getBySlug(slug, undefined, locale);
      if (subRes?.success && subRes?.data) {
        const correctSlug = getLocaleSlug(subRes.data.slug, locale);
        if (!correctSlug) {
          /* No translated slug for this locale, let it 404 */
        } else if (correctSlug !== slug) {
          redirectTarget = `/${locale}/${correctSlug}`;
        } else {
          subcategoryData = subRes.data;
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
      const category = await getBlogCategoryBySlug(slug);
      if (category) {
        const correctSlug = getLocaleSlug(category.slug, locale);
        if (!correctSlug) {
          /* No translated slug for this locale, let it 404 */
        } else if (correctSlug !== slug) {
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
        if (!correctSlug) {
          /* No translated slug for this locale, let it 404 */
        } else if (correctSlug !== slug) {
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
        if (!correctSlug) {
          /* No translated slug for this locale, let it 404 */
        } else if (correctSlug !== slug) {
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
        if (!correctSlug) {
          /* No translated slug for this locale, let it 404 */
        } else if (correctSlug !== slug) {
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
      const name = getLocalizedValue(tour.heading || tour.name, locale) || "Tour Details";

      // Fetch reviews server-side for Schema.org
      let reviews: any[] = [];
      try {
        const reviewsRes = await reviewsAPI.getReviewsByTour(tourId);
        if (reviewsRes.success) reviews = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];
      } catch {}

      // Breadcrumbs — flat URLs for category and subcategory
      const subcategory = tour.subcategory;
      const category = subcategory?.category;
      const breadcrumbs: { label: string; href?: string }[] = [{ label: "Destination", href: "/" }];

      if (category?.name) {
        const catSlug = getLocalizedValue(category.slug, locale);
        breadcrumbs.push({
          label: getLocalizedValue(category.name, locale),
          href: catSlug ? `/${locale}/${catSlug}` : undefined,
        });
      }
      if (subcategory?.name) {
        const subSlug = getLocalizedValue(subcategory.slug, locale);
        breadcrumbs.push({
          label: getLocalizedValue(subcategory.name, locale),
          href: subSlug ? `/${locale}/${subSlug}` : undefined,
        });
      }
      breadcrumbs.push({ label: name as string });

      // Schema.org JSON-LD
      const avgRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
        : "5.0";
      const durationStr = getLocalizedValue(tour.duration, locale);
      const isoDuration = formatISO8601Duration(durationStr);

      const itinerarySteps = tour.itinerary?.days?.map((day: any) => ({
        "@type": "ItemList",
        "name": `Day ${day.day}: ${getLocalizedValue(day.title, locale)}`,
        "description": getLocalizedValue(day.description, locale),
        "itemListElement": day.activities?.map((act: any, idx: number) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "name": getLocalizedValue(act.heading, locale),
        })),
      })) || [];

      const mapUrl = tour.tourMapIframe?.match(/src="([^"]+)"/)?.[1];

      const jsonLd: any = {
        "@context": "https://schema.org",
        "@type": "Tour",
        "name": name,
        "description": (getLocalizedValue(tour.overview, locale)).replace(/<[^>]*>/g, ""),
        "image": [...(tour.images?.map((img: any) => img.url) || []), ...(tour.gallery?.map((img: any) => img.url) || [])].filter(Boolean),
        "tourDuration": isoDuration,
        "duration": isoDuration,
        "touristDestination": { "@type": "Place", "name": getLocalizedValue(tour.tourLocation, locale) },
        "touristType": getLocalizedValue(tour.tourType, locale),
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
              bgImage={tour.images?.[0]?.url || tour.featuredImage?.url || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwBz9RsGBZErQQOzYdoMyqX-6tjs_zUEuiJg&s"}
              alt={getLocalizedValue(tour.images?.[0]?.alt || tour.featuredImage?.alt, locale) || name}
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
