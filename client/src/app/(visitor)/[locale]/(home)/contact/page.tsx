import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import ContactTop from "@/components/sections/ContactTop/ContactTop";
import ContactPage from "@/components/sections/ContactPage/ContactPage";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import { getServerTranslation } from "@/lib/i18n-server";
import { Metadata } from "next";
import { getStaticLocaleAlternates } from "@/lib/seo/localeAlternates";
import './contact.css';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslation(locale, 'contact');
  
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    icons: {
      icon: "/favicon-32x32.png",
    },
    alternates: getStaticLocaleAlternates(locale, "contact"),
  };
}

export default async function Contact({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getServerTranslation(locale, 'contact');
  
  return (
    <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <PageHeader title={t('pageTitle')} subTitle={t('pageSubTitle')} />
      <ContactTop />
      <ContactPage />
      <FooterOne />
    </Layout>
  );
}
