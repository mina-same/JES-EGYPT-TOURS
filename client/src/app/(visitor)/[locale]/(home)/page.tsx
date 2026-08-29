import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import AboutOne from "@/components/sections/AboutOne/AboutOne";
import FeaturedToursSection from "@/components/sections/FeatureTwo/FeaturedToursSection";
import OfferTwo from "@/components/sections/OfferTwo/OfferTwo";
import OfferOne from "@/components/sections/OfferOne/OfferOne";
import DestinationCarouselTwo from "@/components/sections/DestinationCarouselTwo/DestinationCarouselTwo";
import TestimonialsTwo from "@/components/sections/TestimonialsTwo/TestimonialsTwo";
import VideoReviewsTwo, { type HomeVideoReview } from "@/components/sections/VideoReviewsTwo/VideoReviewsTwo";
import LazyInstagramSection from "@/components/common/LazySection/LazyInstagramSection";
import BlogTwoTwo from "@/components/sections/BlogTwoTwo/BlogTwoTwo";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import MainSliderFour from "@/components/sections/MainSliderFour/MainSliderFour";
import WhyChooseUs from "@/components/sections/whyChooseUs/whyChoseeUs";
import ClientCarousel from "@/components/sections/ClientCarousel/ClientCarousel";
import HomeFAQ from "@/components/sections/FaqSection/HomeFAQ";
import HomeIntro, { type HomeIntroContent } from "@/components/sections/HomeIntro/HomeIntro";
import { API_URL } from "@/config/api";
import { getFeaturedBlogs, type BlogPost } from "@/lib/api/blog";
import { getStaticLocaleAlternates, SEO_BASE_URL } from "@/lib/seo/localeAlternates";
import { getServerTranslation } from "@/lib/i18n-server";
import { ogSiteDefaults } from "@/lib/ogDefaults";
import { normalizeLocale } from "@/lib/url";
import { faqService, type FAQ } from "@/services/faqService";
import { sliderService } from "@/services/sliderService";
import type { SliderItem, SliderUnderPromo } from "@/types/slider";
import { Metadata } from "next";

// Upper bound for the homepage Featured Tours carousel (looping slider shows
// all of them, filtered to the active locale). Generous but bounded for perf.
const FEATURED_TOURS_LIMIT = 24;
// Fetch the featured-blogs pool for the homepage carousel. BlogTwoTwo shows
// all of them (filtered to the active locale) in a rewinding slider, so this
// is a generous upper bound. Keep in sync with FEATURED_FETCH_POOL there.
const FEATURED_BLOGS_POOL = 24;
const HOME_FAQS_LIMIT = 8;

/**
 * How long a homepage data read may be served from cache.
 *
 * These fetches were uncached — Next 15+ defaults `fetch` to no-store — so
 * every single homepage view, for every visitor, opened five fresh round trips
 * to the API. They run in parallel, so TTFB was bound by the slowest of them
 * rather than their sum, but that is still the slowest backend call sitting on
 * the critical path of every page view.
 *
 * The window is long because it is NOT the invalidation mechanism: each fetch
 * carries a cache tag that server/src/services/revalidate.ts clears the moment
 * an editor saves, so an edit is live immediately. A bare timed revalidate with
 * no tag was tried on this codebase and reverted for exactly that reason — see
 * the note in src/app/api/revalidate/route.ts. This is the safety net for a
 * webhook that never arrived, not the refresh interval.
 */
const HOME_CACHE_SECONDS = 3600;

/** 1200x630, generated from the site's own Giza photograph. */
const HOME_OG_IMAGE = "/images/resources/home-og.jpg";

/**
 * The homepage used to return ONE English title and description for all four
 * languages — `"Home | JES Egypt Tours"` on /en, /de, /it and /es alike. Four
 * URLs declared as hreflang alternates of each other, carrying byte-identical
 * titles, is the exact signal that tells a search engine the alternates are
 * not really different content. "Home" also spent the highest-value 40
 * characters of the result on a word nobody searches for.
 *
 * There was no openGraph or twitter block either, so sharing the homepage to
 * WhatsApp or Facebook produced a bare link with no image and no description —
 * on a site whose customers share trip links.
 *
 * Follows the pattern the contact and special-offers pages already use:
 * getServerTranslation for the copy, ogSiteDefaults for siteName/locale, and
 * getStaticLocaleAlternates for canonical + hreflang.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = normalizeLocale(locale);
  const { t } = await getServerTranslation(lang, "common");

  const title = t("homeMeta.title");
  const description = t("homeMeta.description");
  const alternates = getStaticLocaleAlternates(lang);
  const canonicalUrl = String(alternates.canonical ?? `${SEO_BASE_URL}/${lang}`);
  const imageUrl = `${SEO_BASE_URL}${HOME_OG_IMAGE}`;

  return {
    title,
    description,
    icons: {
      icon: "/favicon-logo.png",
      apple: "/favicon-logo.png",
    },
    alternates,
    openGraph: {
      ...ogSiteDefaults(lang),
      title,
      description,
      type: "website",
      url: canonicalUrl,
      images: [
        {
          url: imageUrl,
          alt: t("homeMeta.imageAlt"),
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}



async function getInitialSliders(locale: string): Promise<SliderItem[]> {
  try {
    return await sliderService.getActiveSliderContent(locale, {
      revalidate: HOME_CACHE_SECONDS,
      tags: ["slider"],
    });
  } catch {
    return [];
  }
}

async function getInitialSliderPromo(locale: string): Promise<SliderUnderPromo | null> {
  try {
    return await sliderService.getPublicSliderPromo(locale, {
      revalidate: HOME_CACHE_SECONDS,
      tags: ["slider"],
    });
  } catch {
    return null;
  }
}

async function getInitialFeaturedTours(locale: string): Promise<any[]> {
  try {
    // The locale is in the query string as well as the header so the cache
    // keeps one entry per language.
    const response = await fetch(
      `${API_URL}/tours/featured?limit=${FEATURED_TOURS_LIMIT}&locale=${locale}`,
      {
        headers: { "X-Locale": locale },
        next: { revalidate: HOME_CACHE_SECONDS, tags: ["tours"] },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    return data.success && Array.isArray(data.data) ? data.data : [];
  } catch {
    return [];
  }
}

async function getInitialVideoReviews(locale: string): Promise<HomeVideoReview[]> {
  try {
    // Fetched here rather than in the component so the videos are part of the
    // server-rendered HTML: a client-side fetch would pop the section in after
    // hydration and shift everything below it.
    const response = await fetch(`${API_URL}/video-reviews?locale=${locale}`, {
      headers: { "X-Locale": locale },
      next: { revalidate: HOME_CACHE_SECONDS, tags: ["video-reviews"] },
    });
    if (!response.ok) return [];

    const data = await response.json();
    return data.success && Array.isArray(data.data) ? data.data : [];
  } catch {
    // The section simply does not render — the homepage must not fail over a
    // supplementary band of videos.
    return [];
  }
}

async function getInitialFeaturedBlogs(locale: string): Promise<BlogPost[]> {
  try {
    // Without the locale the API falls back to English, so the German homepage
    // would show English blog cards.
    const response = await getFeaturedBlogs(FEATURED_BLOGS_POOL, locale);

    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}

async function getInitialHomeFaqs(locale: string): Promise<FAQ[]> {
  try {
    const response = await faqService.getAllFaqs({
      isActive: true,
      displayOnHome: true,
      sort: "category,order",
      limit: HOME_FAQS_LIMIT,
      locale,
      cache: { revalidate: HOME_CACHE_SECONDS, tags: ["faq"] },
    });

    return response.success && Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}

/**
 * The long-form intro block, fetched server-side.
 *
 * It was loaded in a useEffect inside the component, so this — the most
 * keyword-dense prose on the homepage — never reached the server-rendered
 * HTML, and the section popped in after hydration at a different height.
 *
 * A plain fetch, not generalContentAPI: that helper is built on axios, which
 * cannot participate in Next's Data Cache at all. The response is the raw
 * all-locales document, so one cache entry serves every language.
 */
async function getInitialHomeIntro(): Promise<HomeIntroContent | null> {
  try {
    const response = await fetch(`${API_URL}/general-content/home-intro`, {
      next: { revalidate: HOME_CACHE_SECONDS, tags: ["general-content"] },
    });
    if (!response.ok) return null;

    const data = await response.json();
    return data.success && data.data ? (data.data as HomeIntroContent) : null;
  } catch {
    // The component's own fetch is still there as a fallback.
    return null;
  }
}

export default async function HomeThree({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [
    initialSliders,
    initialSliderPromo,
    initialTours,
    initialBlogs,
    initialFaqs,
    initialVideoReviews,
    initialHomeIntro,
  ] = await Promise.all([
    getInitialSliders(locale),
    getInitialSliderPromo(locale),
    getInitialFeaturedTours(locale),
    getInitialFeaturedBlogs(locale),
    getInitialHomeFaqs(locale),
    getInitialVideoReviews(locale),
    getInitialHomeIntro(),
  ]);

  return (
    <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <MainSliderFour initialSliders={initialSliders} initialPromo={initialSliderPromo} />
      <AboutOne headingLevel="h1" />
      <WhyChooseUs />
      <HomeIntro initialContent={initialHomeIntro} />
      <FeaturedToursSection initialTours={initialTours} />
      <OfferTwo />
      <OfferOne />
      <DestinationCarouselTwo />
      <TestimonialsTwo />
      <VideoReviewsTwo reviews={initialVideoReviews} />
      <LazyInstagramSection />
      <HomeFAQ initialFaqs={initialFaqs} />
      <BlogTwoTwo initialBlogs={initialBlogs} />
      <ClientCarousel />
      <FooterOne />
    </Layout>
  );
}
