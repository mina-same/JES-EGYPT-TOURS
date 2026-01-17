import Layout from "@/components/layout/Layout/Layout";
import HeaderFourSingle from "@/components/layout/HeaderFour/HeaderFourSingle";
import HeaderFourSingleCloned from "@/components/layout/HeaderFourCloned/HeaderFourCloned copy";
import MainSliderFour from "@/components/sections/MainSliderFour/MainSliderFour";
import AboutFiveTwo from "@/components/sections/AboutFiveTwo/AboutFiveTwo";
import DestinationsTwo from "@/components/sections/DestinationsTwo/DestinationsTwo";
import CtaFour from "@/components/sections/CtaFour/CtaFour";
import HowItWorks from "@/components/sections/HowItWorks/HowItWorks";
import AboutTestimonials from "@/components/sections/AboutTestimonials/AboutTestimonials";
import BlogThree from "@/components/sections/BlogThree/BlogThree";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import TourListingPage from "@/components/sections/TourListingPage/TourListingPage";

export const metadata = {
  title: "Home Four || Gotur || Travel & Tour NextJS Template",
  description:
    "Gotur is a modern travel & tour booking NextJS Template. It is perfect for travel agencies, tour operators, trip holiday booking websites, adventure and booking companies looking for a unique and intuitive search function and all other travel & tourism websites and businesses.",
  icons: {
    icon: "/favicon-32x32.png",
  },
};

export default function HomeFourOne() {
  return (
    <Layout>
      <HeaderFourSingle />
      <HeaderFourSingleCloned />
      <MainSliderFour />
      <TourListingPage />
      <AboutFiveTwo />
      <DestinationsTwo />
      <CtaFour />
      <HowItWorks />
      <AboutTestimonials />
      <BlogThree />
      <FooterOne />
    </Layout>
  );
}
