import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import PricingOne from "@/components/sections/PricingOne/PricingOne";
import FaqSection from "@/components/sections/FaqSection/FaqSection";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import HeaderTwo from "@/components/layout/HeaderTwo/HeaderTwo";
import HeaderTwoCloned from "@/components/layout/HeaderTwoCloned/HeaderTwoCloned";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne"; 


export const metadata = {
  title: "Pricing Plan || Gotur || Travel & Tour NextJS Template",
  description:
    "Gotur is a modern travel & tour booking NextJS Template. It is perfect for travel agencies, tour operators, trip holiday booking websites, adventure and booking companies looking for a unique and intuitive search function and all other travel & tourism websites and businesses.",
  icons: {
    icon: "/favicon-32x32.png",
  },
};

export default function PricingPage() {
  return (
    <Layout>
      <TopbarOne />
      <HeaderOne />
      <HeaderOneCloned/>
      <PageHeader title='Pricing Plan' subTitle='Pricing Plan' />
      <PricingOne />
      <FaqSection />
      <FooterOne />
    </Layout>
  );
}
