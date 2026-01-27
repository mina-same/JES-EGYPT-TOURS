import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import FaqSection from "@/components/sections/FaqSection/FaqSection";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";

export const metadata = {
  title: "FAQS || Gotur || Travel & Tour NextJS Template",
  description:
    "Gotur is a modern travel & tour booking NextJS Template. It is perfect for travel agencies, tour operators, trip holiday booking websites, adventure and booking companies looking for a unique and intuitive search function and all other travel & tourism websites and businesses.",
  icons: {
    icon: "/favicon-32x32.png",
  },
};

export default function FaqPage() {
  return (
    <Layout>
     <TopbarOne/>
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <PageHeader title='FAQS' subTitle='FAQS' />
      <FaqSection />
      <FooterOne />
    </Layout>
  );
}
