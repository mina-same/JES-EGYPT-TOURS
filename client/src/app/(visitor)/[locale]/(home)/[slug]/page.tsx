import { tourAPI, tourCategoryAPI, tourSubcategoryAPI } from "@/lib/api/tour";
import { getCategoryBySlug as getBlogCategoryBySlug, getSubCategoryBySlug as getBlogSubCategoryBySlug, getBlogBySlug } from "@/lib/api/blog";
import { getDestinationBySlug } from "@/lib/api/destination";
import { getLocalizedValue } from "@/lib/localize";
import { reviewsAPI } from "@/lib/api/reviews";
import { generateTourJsonLd } from "@/lib/seo/tourJsonLd";
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
import DestinationView from "./_views/DestinationView";

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

// formatISO8601Duration has been moved to @/lib/seo/tourJsonLd

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
        const seoDescription = getLocalizedValue(data.seo?.metaDescription, locale);
        const description = seoDescription ? seoDescription.replace(/<[^>]*>?/gm, '').substring(0, 160) : "";
        const keywords = getLocalizedValue(data.seo?.metaKeywords, locale);
        const image = data.seo?.metaImage?.url || data.image || undefined;
        
        const languages: Record<string, string> = {};
        for (const loc of LOCALES) {
          const s = getLocalizedValue(data.slug, loc);
          if (s) languages[loc] = `${baseUrl}/${loc}/${s}`;
        }
        return {
          title: seoTitle ? seoTitle : "JES Egypt Tours",
          description,
          keywords: keywords || undefined,
          alternates: { canonical: `${baseUrl}/${locale}/${slug}`, languages },
          openGraph: {
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
        const seoDescription = getLocalizedValue(data.seo?.metaDescription, locale);
        const description = seoDescription ? seoDescription.replace(/<[^>]*>?/gm, '').substring(0, 160) : "";
        const keywords = getLocalizedValue(data.seo?.metaKeywords, locale);
        const image = data.seo?.metaImage?.url || data.image || undefined;

        const languages: Record<string, string> = {};
        for (const loc of LOCALES) {
          const s = getLocalizedValue(data.slug, loc);
          if (s) languages[loc] = `${baseUrl}/${loc}/${s}`;
        }
        return {
          title: seoTitle ? seoTitle : "JES Egypt Tours",
          description,
          keywords: keywords || undefined,
          alternates: { canonical: `${baseUrl}/${locale}/${slug}`, languages },
          openGraph: {
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
        const cAny = category as any;
        const seoTitle = getLocalizedValue(cAny.metaTitle, locale);
        const seoDescription = getLocalizedValue(cAny.metaDescription, locale);
        const description = seoDescription ? seoDescription.replace(/<[^>]*>?/gm, '').substring(0, 160) : "";
        const keywords = getLocalizedValue(cAny.metaKeywords, locale);
        // Fallback chain for image
        const ogImage = cAny.ogImage || (cAny.metaImage && cAny.metaImage.url) || (typeof cAny.image === 'object' ? cAny.image.url : cAny.image) || undefined;

        const languages: Record<string, string> = {};
        for (const loc of LOCALES) {
          const s = getLocalizedValue(category.slug, loc);
          if (s) languages[loc] = `${baseUrl}/${loc}/${s}`;
        }
        return {
          title: seoTitle ? seoTitle : "JES Egypt Tours",
          description,
          keywords: keywords || undefined,
          alternates: { canonical: `${baseUrl}/${locale}/${slug}`, languages },
          openGraph: {
            title: seoTitle || "JES Egypt Tours",
            description,
            type: "website",
            images: ogImage ? [ogImage] : undefined,
          }
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
        const sAny = subcategory as any;
        const seoTitle = getLocalizedValue(sAny.metaTitle, locale);
        const seoDescription = getLocalizedValue(sAny.metaDescription, locale);
        const description = seoDescription ? seoDescription.replace(/<[^>]*>?/gm, '').substring(0, 160) : "";
        const keywords = getLocalizedValue(sAny.metaKeywords, locale);
        // Fallback chain for image
        const ogImage = sAny.ogImage || (sAny.metaImage && sAny.metaImage.url) || (typeof sAny.image === 'object' ? sAny.image.url : sAny.image) || undefined;

        const languages: Record<string, string> = {};
        for (const loc of LOCALES) {
          const s = getLocalizedValue(subcategory.slug, loc);
          if (s) languages[loc] = `${baseUrl}/${loc}/${s}`;
        }
        return {
          title: seoTitle ? seoTitle : "JES Egypt Tours",
          description,
          keywords: keywords || undefined,
          alternates: { canonical: `${baseUrl}/${locale}/${slug}`, languages },
          openGraph: {
            title: seoTitle || "JES Egypt Tours",
            description,
            type: "website",
            images: ogImage ? [ogImage] : undefined,
          }
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
        const bAny = blog as any;
        const featuredImageUrl = typeof blog.featuredImage === "string" ? blog.featuredImage : blog.featuredImage?.url;
        const seoTitle = getLocalizedValue(bAny.metaTitle, locale);
        const seoDescription = getLocalizedValue(bAny.metaDescription, locale);
        const description = seoDescription ? seoDescription.replace(/<[^>]*>?/gm, '').substring(0, 160) : "";
        const keywords = getLocalizedValue(bAny.metaKeywords, locale);
        const ogImage = bAny.ogImage || (bAny.metaImage && bAny.metaImage.url) || featuredImageUrl || undefined;

        const languages: Record<string, string> = {};
        for (const loc of LOCALES) {
          const s = getLocalizedValue(blog.slug, loc);
          if (s) languages[loc] = `${baseUrl}/${loc}/${s}`;
        }
        return {
          title: seoTitle ? seoTitle : "JES Egypt Tours",
          description,
          keywords: keywords || undefined,
          alternates: { canonical: `${baseUrl}/${locale}/${slug}`, languages },
          openGraph: {
            title: seoTitle || "JES Egypt Tours",
            description,
            images: ogImage ? [ogImage] : undefined,
            type: "article",
          },
          twitter: {
            card: "summary_large_image",
            title: seoTitle || "JES Egypt Tours",
            description,
            images: ogImage ? [ogImage] : undefined,
          },
        };
      }
    }
  } catch {}

  // 5.5 Try Destination
  try {
    const destination = await getDestinationBySlug(slug);
    if (destination) {
      const correctSlug = getLocaleSlug(destination.slug, locale);
      if (correctSlug) {
        const seoTitle = getLocalizedValue(destination.metaTitle, locale);
        const seoDescription = getLocalizedValue(destination.metaDescription, locale);
        const description = seoDescription ? seoDescription.replace(/<[^>]*>?/gm, '').substring(0, 160) : "";
        const keywords = getLocalizedValue(destination.metaKeywords, locale);
        const ogImage = destination.ogImage || destination.metaImage?.url || destination.coverImage?.url || undefined;
        const languages: Record<string, string> = {};
        for (const loc of LOCALES) {
          const s = getLocalizedValue(destination.slug, loc);
          if (s) languages[loc] = `${baseUrl}/${loc}/${s}`;
        }
        return {
          title: seoTitle || `${getLocalizedValue(destination.name, locale)} | JES Egypt Tours`,
          description,
          keywords: keywords || undefined,
          alternates: { canonical: `${baseUrl}/${locale}/${slug}`, languages },
          openGraph: {
            title: seoTitle || getLocalizedValue(destination.name, locale),
            description,
            type: "website",
            images: ogImage ? [ogImage] : undefined,
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
        const seoDescription = getLocalizedValue(tour.seo?.metaDescription, locale);
        const description = seoDescription ? seoDescription.replace(/<[^>]*>?/gm, '').substring(0, 160) : "";
        const keywords = getLocalizedValue(tour.seo?.metaKeywords, locale);

        const image = tour.seo?.metaImage?.url || tour.featuredImage?.url || tour.sliderImages?.[0];
        const languages: Record<string, string> = {};
        for (const loc of LOCALES) {
          const s = getLocaleSlug(tour.slug, loc);
          if (s) languages[loc] = `${baseUrl}/${loc}/${s}`;
        }
        return {
          title: seoTitle ? seoTitle : "JES Egypt Tours",
          description,
          keywords: keywords || undefined,
          alternates: { canonical: `${baseUrl}/${locale}/${slug}`, languages },
          openGraph: { 
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

  // ── 5.5. Destination ──────────────────────────────────────────────────
  {
    let redirectTarget: string | null = null;
    let renderDestination = false;
    try {
      const destination = await getDestinationBySlug(slug);
      if (destination) {
        const correctSlug = getLocaleSlug(destination.slug, locale);
        if (!correctSlug) {
          /* No translated slug for this locale, let it 404 */
        } else if (correctSlug !== slug) {
          redirectTarget = `/${locale}/${correctSlug}`;
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
      const name = getLocalizedValue(tour.heading || tour.name, locale) || "Tour Details";

      // ── Breadcrumbs — flat URLs for category and subcategory ────────────────
      const subcategory = tour.subcategory;
      const category = subcategory?.category;
      const breadcrumbs: { label: string; href?: string }[] = [];

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
