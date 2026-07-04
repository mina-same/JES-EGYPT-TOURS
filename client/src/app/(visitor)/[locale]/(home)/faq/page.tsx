import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import FaqSection from "@/components/sections/FaqSection/FaqSection";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";

import { getServerTranslation } from "@/lib/i18n-server";
import { FaqStructuredData, FaqBreadcrumbStructuredData } from "@/components/sections/FaqSection/FaqStructuredData";
import { faqService } from "@/services/faqService";
import { generateFaqMetadata } from "@/lib/seo/faqMetadata";
import { Metadata } from "next";
import { getStaticLocaleAlternates } from "@/lib/seo/localeAlternates";

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const metadata = await generateFaqMetadata({ locale });

  return {
    ...metadata,
    alternates: getStaticLocaleAlternates(locale, "faq"),
  };
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getServerTranslation(locale, 'faq');
  
  let faqs: any[] = [];
  try {
    const response = await faqService.getAllFaqs({
      isActive: true,
      sort: "category,order",
      limit: 200,
    });
    if (response.success && response.data) {
      faqs = response.data;
    }
  } catch (error) {
    console.error("Error fetching FAQs server-side:", error);
  }
  
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
          title={t('sectionTitle')}
          subTitle={t('sectionSubTitle')}
        />
        <FaqSection initialData={faqs} />
        <FooterOne />
      </Layout>
    </>
  );
}
