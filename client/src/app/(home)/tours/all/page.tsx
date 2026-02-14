import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import TourListing from "@/components/sections/TourListing/TourListing";
import AboutOne from "@/components/sections/AboutOne/AboutOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";

export const metadata = {
  title: "All Tours || Gotur || Travel & Tour NextJS Template",
  description: "View all our tours.",
};

export default function AllToursPage() {
  return (
    <Layout>
     <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <PageHeader title='All Tours' subTitle='Tour Listing' />
      <TourListing />
      <AboutOne extraclass='about-one--one' />
      <FooterOne />
    </Layout>
  );
}
