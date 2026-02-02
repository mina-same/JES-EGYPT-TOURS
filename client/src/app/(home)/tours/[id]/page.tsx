"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import TourListingOneDetails from "@/components/sections/TourListingDetailsOne/TourListingDetailsOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import tourDetailsOneData from "@/data/tourDetailsOneData";

interface PageProps {
  params: {
    id: string; // This will be the slug
  };
}

export default function TourListingDetailsPage({ params }: PageProps) {
  const [tourName, setTourName] = useState("Tour Details");
  const [pageTitle, setPageTitle] = useState("Tour Details");

  useEffect(() => {
    // Use the tour details data to get the title
    if (tourDetailsOneData.title) {
      setTourName(tourDetailsOneData.title);
      setPageTitle(`${tourDetailsOneData.title} || Gotur || Travel & Tour NextJS Template`);
    }
    
    // Update document title
    if (typeof window !== 'undefined') {
      document.title = pageTitle;
    }
  }, [params.id, pageTitle]);

  return (
    <Layout>
      <TopbarOne/>
      <HeaderOne linkTheme="light" />
      <PageHeader
        title={tourName}
        subTitle="Tour Details"
        bgImage='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwBz9RsGBZErQQOzYdoMyqX-6tjs_zUEuiJg&s'
      />
      <TourListingOneDetails id={params.id} />
      <FooterOne />
    </Layout>
  );
}
