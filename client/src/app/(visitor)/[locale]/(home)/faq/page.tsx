import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import FaqSection from "@/components/sections/FaqSection/FaqSection";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";

import { FaqStructuredData, FaqBreadcrumbStructuredData } from "@/components/sections/FaqSection/FaqStructuredData";
import { generateFaqMetadata } from "@/lib/seo/faqMetadata";
import { Metadata } from "next";

// Generate dynamic metadata for SEO
export const metadata: Metadata = generateFaqMetadata();

export default function FaqPage() {
  return (
    <>
      {/* Structured Data for SEO */}
      <FaqStructuredData 
        faqs={[]} // Will be populated dynamically by FaqSection
        title="Egypt Travel FAQ | Expert Answers | JES Egypt Tours"
        description="Get expert answers to frequently asked questions about Egypt travel, tours, booking, safety, and more. Plan your perfect Egypt trip with confidence."
      />
      <FaqBreadcrumbStructuredData />
      
      <Layout>
       <TopbarOne/>
        <HeaderOne linkTheme="light" />
        <HeaderOneCloned />
        <PageHeader 
          title='Egypt Travel FAQ' 
          subTitle='Expert Answers to Your Egypt Travel Questions' 
        />
        <FaqSection />
        <FooterOne />
      </Layout>
    </>
  );
}
