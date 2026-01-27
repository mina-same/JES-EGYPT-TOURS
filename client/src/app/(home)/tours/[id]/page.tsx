import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import TourListingOneDetails from "@/components/sections/TourListingDetailsOne/TourListingDetailsOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import MainSliderThree from "@/components/sections/MainSliderThree/MainSliderThree";
import PageHeader from "@/components/sections/PageHeader/PageHeader";

export const metadata = {
  title: "Tour Listing Details || Gotur || Travel & Tour NextJS Template",
  description:
    "Gotur is a modern travel & tour booking NextJS Template. It is perfect for travel agencies, tour operators, trip holiday booking websites, adventure and booking companies looking for a unique and intuitive search function and all other travel & tourism websites and businesses.",
  icons: {
    icon: "/favicon-32x32.png",
  },
};

interface PageProps {
  params: {
    id: string;
  };
}

export default function TourListingDetailsPage({ params }: PageProps) {
  return (
    <Layout>
      <TopbarOne/>
      <HeaderOne linkTheme="light" />
      <PageHeader
        title="Tour Listing Details"
        subTitle="Tour Listing Details"
        bgImage='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwBz9RsGBZErQQOzYdoMyqX-6tjs_zUEuiJg&s'
      />
      <TourListingOneDetails id={params.id} />
      <FooterOne />
    </Layout>
  );
}
