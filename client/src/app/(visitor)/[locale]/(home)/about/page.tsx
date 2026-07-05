import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import InstagramOne from "@/components/sections/InstagramOne/InstagramOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import AboutOne from "@/components/sections/AboutOne/AboutOne";
import CtaTwo from "@/components/sections/CtaTwo/CtaTwo";
import HowItWorks from "@/components/sections/HowItWorks/HowItWorks";
import AboutTestimonials from "@/components/sections/AboutTestimonials/AboutTestimonials";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import { getStaticLocaleAlternates } from "@/lib/seo/localeAlternates";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "About Us | JES Egypt Tours",
    description:
      "JES Egypt Tours is a premium travel agency offering unique and authentic Egyptian experiences. Explore the land of pharaohs with our expert-led tours.",
    icons: {
      icon: "/favicon-32x32.png",
    },
    alternates: getStaticLocaleAlternates(locale, "about"),
  };
}

export default function About() {
  return (
    <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <PageHeader title='About Us' subTitle='About Us' />
      <AboutOne />
      <CtaTwo />
      <HowItWorks />
      <AboutTestimonials />
      <InstagramOne />
      <FooterOne />
    </Layout>
  );
}
