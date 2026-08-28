import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import FaqSection from "@/components/sections/FaqSection/FaqSection";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";

import { getServerTranslation } from "@/lib/i18n-server";
import { FaqStructuredData, FaqBreadcrumbStructuredData } from "@/components/sections/FaqSection/FaqStructuredData";
import { generateFaqMetadata } from "@/lib/seo/faqMetadata";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStaticLocaleAlternates } from "@/lib/seo/localeAlternates";
import { getFaqsForLocale, getLocalesWithFaqs } from "@/lib/faqLocales";

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await generateFaqMetadata({ locale });

  return {
    ...metadata,
    // Only the languages that actually have FAQs — the others 404.
    alternates: getStaticLocaleAlternates(locale, "faq", await getLocalesWithFaqs()),
  };
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getServerTranslation(locale, 'faq');

  const result = await getFaqsForLocale(locale);

  // A language with no FAQs of its own gets no page — the alternative is a
  // header above an empty accordion, or English answers under a German URL.
  // `null` means the request failed, which is NOT the same answer: rendering
  // with what we have lets the client-side fetch in FaqSection recover, whereas
  // 404-ing here would take a live page down over a momentary API blip.
  if (result !== null && result.length === 0) {
    notFound();
  }

  const faqs = result ?? [];

  return (
    <>
      {/* Structured Data for SEO */}
      <FaqStructuredData 
        faqs={faqs}
        title={t('pageTitle')}
        description={t('pageDescription')}
      />
      <FaqBreadcrumbStructuredData />
      
      <Layout>
       <TopbarOne/>
        <HeaderOne linkTheme="light" />
        <HeaderOneCloned />
        <PageHeader
          /* FaqBreadcrumbStructuredData publishes this page's trail. */
          breadcrumbJsonLd={false}
          
          title={t('sectionTitle')}
          subTitle={t('sectionSubTitle')}
        />
        <FaqSection initialData={faqs} />
        <FooterOne />
      </Layout>
    </>
  );
}
