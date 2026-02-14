"use client";

import { useEffect, useState, use } from "react";
import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import TourListingOneDetails from "@/components/sections/TourListingDetailsOne/TourListingDetailsOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function TourListingDetailsPage({ params }: PageProps) {
  const { slug } = use(params);
  const [tourName, setTourName] = useState("Tour Details");
  const [pageTitle, setPageTitle] = useState("Tour Details");

  useEffect(() => {
    // Update document title
    if (typeof window !== 'undefined') {
      document.title = pageTitle;
    }
  }, [slug, pageTitle]);

  return (
    <Layout>
      <TopbarOne/>
      <HeaderOne linkTheme="light" />
      <PageHeader
        title={tourName}
        subTitle="Tour Details"
        bgImage='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwBz9RsGBZErQQOzYdoMyqX-6tjs_zUEuiJg&s'
      />
      <TourListingOneDetails id={slug} />
      <FooterOne />
    </Layout>
  );
}
