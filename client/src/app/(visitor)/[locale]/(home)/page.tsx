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
import InstagramOne from "@/components/sections/InstagramOne/InstagramOne";
import BlogTwoTwo from "@/components/sections/BlogTwoTwo/BlogTwoTwo";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import MainSliderFour from "@/components/sections/MainSliderFour/MainSliderFour";
import WhyChooseUs from "@/components/sections/whyChooseUs/whyChoseeUs";
import ClientCarousel from "@/components/sections/ClientCarousel/ClientCarousel";
import ReflectiveReviews from "@/components/sections/ReflectiveReviews/ReflectiveReviews";
import HomeFAQ from "@/components/sections/FaqSection/HomeFAQ";
import HomeIntro from "@/components/sections/HomeIntro/HomeIntro";
import { getStaticLocaleAlternates } from "@/lib/seo/localeAlternates";
import { Metadata } from "next";

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



export default function HomeThree() {
  return (
    <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <MainSliderFour />
      <AboutOne />
      <WhyChooseUs />
      <HomeIntro />
      <FeaturedToursSection />
      <OfferTwo />
      <OfferOne />
      <DestinationCarouselTwo />
      <TestimonialsTwo />
      <ReflectiveReviews />
      <InstagramOne />
      <HomeFAQ />
      <BlogTwoTwo />
      <ClientCarousel />
      <FooterOne />
    </Layout>
  );
}
