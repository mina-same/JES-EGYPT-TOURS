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
import LazyInstagramSection from "@/components/common/LazySection/LazyInstagramSection";
import BlogTwoTwo from "@/components/sections/BlogTwoTwo/BlogTwoTwo";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import MainSliderFour from "@/components/sections/MainSliderFour/MainSliderFour";
import WhyChooseUs from "@/components/sections/whyChooseUs/whyChoseeUs";
import ClientCarousel from "@/components/sections/ClientCarousel/ClientCarousel";
import HomeFAQ from "@/components/sections/FaqSection/HomeFAQ";
import HomeIntro from "@/components/sections/HomeIntro/HomeIntro";
import { API_URL } from "@/config/api";
import { getFeaturedBlogs, type BlogPost } from "@/lib/api/blog";
import { getStaticLocaleAlternates } from "@/lib/seo/localeAlternates";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Home | JES Egypt Tours",
    description:
      "JES Egypt Tours is a premium travel agency offering unique and authentic Egyptian experiences. Explore the land of pharaohs with our expert-led tours.",
    icons: {
      icon: "/favicon-logo.png",
      apple: "/favicon-logo.png",
    },
    alternates: getStaticLocaleAlternates(locale),
  };
}



async function getInitialSliders(): Promise<SliderItem[]> {
  try {
    return await sliderService.getActiveSliderContent();
  } catch {
    return [];
  }
}

async function getInitialSliderPromo(): Promise<SliderUnderPromo | null> {
  try {
    return await sliderService.getPublicSliderPromo();
  } catch {
    return null;
  }
}

async function getInitialFeaturedTours(locale: string): Promise<any[]> {
  try {
    const response = await fetch(`${API_URL}/tours/featured?limit=${FEATURED_TOURS_LIMIT}`, {
      headers: {
        "X-Locale": locale,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    return data.success && Array.isArray(data.data) ? data.data : [];
  } catch {
    return [];
  }
}

async function getInitialFeaturedBlogs(): Promise<BlogPost[]> {
  try {
    const response = await getFeaturedBlogs(FEATURED_BLOGS_POOL);

    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}

async function getInitialHomeFaqs(): Promise<FAQ[]> {
  try {
    const response = await faqService.getAllFaqs({
      isActive: true,
      displayOnHome: true,
      sort: "category,order",
      limit: HOME_FAQS_LIMIT,
    });

    return response.success && Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}

export default async function HomeThree({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [initialSliders, initialSliderPromo, initialTours, initialBlogs, initialFaqs] = await Promise.all([
    getInitialSliders(),
    getInitialSliderPromo(),
    getInitialFeaturedTours(locale),
    getInitialFeaturedBlogs(),
    getInitialHomeFaqs(),
  ]);

  return (
    <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <MainSliderFour initialSliders={initialSliders} initialPromo={initialSliderPromo} />
      <AboutOne />
      <WhyChooseUs />
      <HomeIntro />
      <FeaturedToursSection initialTours={initialTours} />
      <OfferTwo />
      <OfferOne />
      <DestinationCarouselTwo />
      <TestimonialsTwo />
      <LazyInstagramSection />
      <HomeFAQ initialFaqs={initialFaqs} />
      <BlogTwoTwo initialBlogs={initialBlogs} />
      <ClientCarousel />
      <FooterOne />
    </Layout>
  );
}
