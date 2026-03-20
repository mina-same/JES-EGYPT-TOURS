import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import ContactTop from "@/components/sections/ContactTop/ContactTop";
import ContactPage from "@/components/sections/ContactPage/ContactPage";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import './contact.css';

export const metadata = {
  title: "Contact Us | JES Egypt Tours",
  description:
    "Get in touch with JES Egypt Tours. We're here to help plan your perfect Egyptian adventure.",
  icons: {
    icon: "/favicon-32x32.png",
  },
};

export default function Contact() {
  return (
    <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <PageHeader title='Contact us' subTitle='Contact us' />
      <ContactTop />
      <ContactPage />
      <FooterOne />
    </Layout>
  );
}