import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import MainSliderThree from "@/components/sections/MainSliderThree/MainSliderThree";
import AboutOne from "@/components/sections/AboutOne/AboutOne";
import FeatureTwo from "@/components/sections/FeatureTwo/FeatureTwo";
import OfferTwo from "@/components/sections/OfferTwo/OfferTwo";
import OfferOne from "@/components/sections/OfferOne/OfferOne";
import DestinationCarouselTwo from "@/components/sections/DestinationCarouselTwo/DestinationCarouselTwo";
import TestimonialsTwo from "@/components/sections/TestimonialsTwo/TestimonialsTwo";
import InstagramOne from "@/components/sections/InstagramOne/InstagramOne";
import BlogTwoTwo from "@/components/sections/BlogTwoTwo/BlogTwoTwo";
import DestinationsTwoTwo from "@/components/sections/DestinationsTwoTwo/DestinationsTwoTwo";
import HeaderOneSingle from "@/components/layout/HeaderOne/HeaderOneSingle";
import HeaderOneSingleCloned from "@/components/layout/HeaderOneCloned/HeaderOneSingleCloned";

export const metadata = {
  title: "Home Three || Gotur || Travel & Tour NextJS Template",
  description:
    "Gotur is a modern travel & tour booking NextJS Template. It is perfect for travel agencies, tour operators, trip holiday booking websites, adventure and booking companies looking for a unique and intuitive search function and all other travel & tourism websites and businesses.",
  icons: {
    icon: "/favicon-32x32.png",
  },
};

export default function HomeThree() {
  return (
    <Layout>
      <TopbarOne extraClass='top-one--two' />
      <HeaderOneSingle />
      <HeaderOneSingleCloned />
      <MainSliderThree />
      <AboutOne />
      <DestinationsTwoTwo />
      <FeatureTwo extraClass='section-space' id='guide' homeThree={true} />
      <OfferTwo />
      <OfferOne homeThree={true} />
      <DestinationCarouselTwo />
      <TestimonialsTwo />
      <InstagramOne />

      <BlogTwoTwo />

      <FooterOne />
    </Layout>
  );
}
