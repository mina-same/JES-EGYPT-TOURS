import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import TourListingTwoDetails from "@/components/sections/TourListingDetailsTwo/TourListingDetailsTwo";
import HeaderInner from "@/components/layout/HeaderInner/HeaderInner";
import HeaderInnerCloned from "@/components/layout/HeaderInnerCloned/HeaderInnerCloned";

export const metadata = {
  title: "Tour Listing Details 01 || Gotur || Travel & Tour NextJS Template",
  description:
    "Gotur is a modern travel & tour booking NextJS Template. It is perfect for travel agencies, tour operators, trip holiday booking websites, adventure and booking companies looking for a unique and intuitive search function and all other travel & tourism websites and businesses.",
  icons: {
    icon: "/favicon-32x32.png",
  },
};

export default function TourListingDetailsTwoPage() {
  return (
    <Layout>
      <TopbarOne />
      <HeaderInner />
      <HeaderInnerCloned />
      <PageHeader
        title='Tour Listing Details 02'
        subTitle='
Tour Listing Details 02'
        bgImage='https://www.egypttoursportal.com/images/2017/01/Ancient-Egyptian-Pyramids-Egypt-Tours-Portal.jpg'
      />
      <TourListingTwoDetails />

      <FooterOne />
    </Layout>
  );
}
