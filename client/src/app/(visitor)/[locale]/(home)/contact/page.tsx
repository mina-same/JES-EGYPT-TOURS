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
import { getStaticLocaleAlternates, SEO_BASE_URL } from "@/lib/seo/localeAlternates";
import { getLocalizedStaticSlug } from "@/lib/url";
import { ogSiteDefaults } from "@/lib/ogDefaults";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslation(locale, 'contact');
  const canonicalUrl = `${SEO_BASE_URL}/${locale}/${getLocalizedStaticSlug("contact", locale)}`;

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: getStaticLocaleAlternates(locale, "contact"),
    openGraph: {
      ...ogSiteDefaults(locale),
      title: t('metaTitle'),
      description: t('metaDescription'),
      type: "website",
      url: canonicalUrl,
      images: [
        {
          url: `${SEO_BASE_URL}/images/resources/contact-og.jpg`,
          alt: t('pageTitle'),
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t('metaTitle'),
      description: t('metaDescription'),
      images: [`${SEO_BASE_URL}/images/resources/contact-og.jpg`],
    },
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
      <ContactPage locale={locale} />
      <FooterOne />
    </Layout>
  );
}
