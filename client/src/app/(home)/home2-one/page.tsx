import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import MainSliderTwo from "@/components/sections/MainSliderTwo/MainSliderTwo";
import PopularDestinations from "@/components/sections/PopularDestination/PopularDestination";
import AboutFive from "@/components/sections/AboutFive/AboutFive";
import FeatureOne from "@/components/sections/FeatureOne/FeatureOne";
import CtaTwo from "@/components/sections/CtaTwo/CtaTwo";
import ClientCarousel from "@/components/sections/ClientCarousel/ClientCarousel";
import CtaThree from "@/components/sections/CtaThree/CtaThree";
import BlogTwo from "@/components/sections/BlogTwo/BlogTwo";
import DestinationThree from "@/components/sections/DestinationsThree/DestinationThree";
import AboutTestimonialsTwo from "@/components/sections/AboutTestimonialsTwo/AboutTestimonialsTwo";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import HeaderTwoSingle from "@/components/layout/HeaderTwo/HeaderTwoSingle";
import HeaderTwoSingleCloned from "@/components/layout/HeaderTwoCloned/HeaderTwoSingleCloned";

export const metadata = {
  title: "Home Two || Gotur || Travel & Tour NextJS Template",
  description:
    "Gotur is a modern travel & tour booking NextJS Template. It is perfect for travel agencies, tour operators, trip holiday booking websites, adventure and booking companies looking for a unique and intuitive search function and all other travel & tourism websites and businesses.",
  icons: {
    icon: "/favicon-32x32.png",
  },
};

export default function HomeTwo() {
  return (
    <Layout>
      <TopbarOne />
      <HeaderTwoSingle />
      <HeaderTwoSingleCloned />
      <MainSliderTwo />
      <PopularDestinations />
      <AboutFive />
      <FeatureOne />
      <CtaTwo />
      <ClientCarousel extraClass='client-carousel--two' />
      <DestinationThree />
      <AboutTestimonialsTwo />
      <CtaThree />
      <BlogTwo />

      <FooterOne />
    </Layout>
  );
}
