"use client";

import { useEffect, useState, use } from "react";
import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import TourListingOneDetails from "@/components/sections/TourListingDetailsOne/TourListingDetailsOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import { tourAPI } from "@/lib/api/tour";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function TourListingDetailsPage({ params }: PageProps) {
  const { slug } = use(params);
  const [tourName, setTourName] = useState("Tour Details");
  const [pageTitle, setPageTitle] = useState("Tour Details");
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ label: string; href?: string }>>([
    { label: 'Destination', href: '/tours' },
  ]);

  useEffect(() => {
    // Update document title
    if (typeof window !== 'undefined') {
      document.title = pageTitle;
    }
  }, [slug, pageTitle]);

  useEffect(() => {
    let cancelled = false;

    const loadTour = async () => {
      try {
        const res = await tourAPI.getBySlug(slug);
        if (!res?.success || !res?.data) return;
        if (cancelled) return;

        const tour = res.data as any;
        const name = tour.heading || tour.name || tour.title || "Tour Details";
        setTourName(name);
        setPageTitle(name);

        const category = tour.category;
        const subcategory = tour.subcategory;

        const nextCrumbs: Array<{ label: string; href?: string }> = [
          { label: 'Destination', href: '/tours' },
        ];

        if (category?.name) {
          nextCrumbs.push({
            label: category.name,
            href: category.slug ? `/tours/category/${category.slug}` : undefined,
          });
        }

        if (subcategory?.name) {
          nextCrumbs.push({
            label: subcategory.name,
            href: subcategory.slug ? `/tours/subcategory/${subcategory.slug}` : undefined,
          });
        }

        nextCrumbs.push({ label: name });
        setBreadcrumbs(nextCrumbs);
      } catch {
        // ignore
      }
    };

    loadTour();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <Layout>
      <TopbarOne/>
      <HeaderOne linkTheme="light" />
      <PageHeader
        title={tourName}
        breadcrumbs={breadcrumbs}
        bgImage='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwBz9RsGBZErQQOzYdoMyqX-6tjs_zUEuiJg&s'
      />
      <TourListingOneDetails id={slug} />
      <FooterOne />
    </Layout>
  );
}
