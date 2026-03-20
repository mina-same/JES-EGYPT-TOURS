import { tourAPI } from "@/lib/api/tour";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import TourListingOneDetails from "@/components/sections/TourListingDetailsOne/TourListingDetailsOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";

interface PageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://jesegypttours.com";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  try {
    const res = await tourAPI.getBySlug(slug);
    if (!res?.success || !res?.data) {
      return { title: "Tour Not Found | JES Egypt Tours" };
    }

    const tour = res.data;
    const title = tour.metaTitle || tour.name || tour.title || "Tour Details";
    const description = tour.metaDescription || tour.overview?.replace(/<[^>]*>/g, "").substring(0, 160);
    const image = tour.featuredImage?.url || tour.sliderImages?.[0];

    return {
      title: `${title} | JES Egypt Tours`,
      description,
      alternates: {
        canonical: `${baseUrl}/${locale}/tours/${slug}`,
        languages: {
          en: `${baseUrl}/en/tours/${slug}`,
          de: `${baseUrl}/de/tours/${slug}`,
          it: `${baseUrl}/it/tours/${slug}`,
          es: `${baseUrl}/es/tours/${slug}`,
        },
      },
      openGraph: {
        title,
        description,
        images: image ? [image] : [],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: image ? [image] : [],
      },
    };
  } catch (error) {
    return { title: "Tour Details | JES Egypt Tours" };
  }
}

export default async function TourListingDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const res = await tourAPI.getBySlug(slug);

  if (!res?.success || !res?.data) {
    notFound();
  }

  const tour = res.data;
  const name = tour.heading || tour.name || tour.title || "Tour Details";

  // Breadcrumbs logic
  const category = tour.category;
  const subcategory = tour.subcategory;
  const breadcrumbs: { label: string; href?: string }[] = [
    { label: "Destination", href: "/tours" },
  ];

  if (category?.name) {
    breadcrumbs.push({
      label: category.name as string,
      href: category.slug ? `/tours/category/${category.slug}` : undefined,
    });
  }

  if (subcategory?.name) {
    breadcrumbs.push({
      label: subcategory.name as string,
      href: subcategory.slug ? `/tours/subcategory/${subcategory.slug}` : undefined,
    });
  }
  breadcrumbs.push({ label: name as string });

  // Tour Schema (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Tour",
    name: name,
    description: tour.overview?.replace(/<[^>]*>/g, ""),
    image: tour.featuredImage?.url || tour.sliderImages?.[0],
    tourDuration: tour.activateDay ? `P${tour.activateDay}D` : undefined,
    offers: {
      "@type": "Offer",
      price: tour.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${baseUrl}/tours/${slug}`,
    },
    provider: {
      "@type": "TravelAgency",
      name: "JES Egypt Tours",
      url: baseUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Layout>
        <TopbarOne />
        <HeaderOne linkTheme="light" />
        <HeaderOneCloned />
        <PageHeader
          title={name || "Tour Details"}
          breadcrumbs={breadcrumbs}
          bgImage={tour.featuredImage?.url || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwBz9RsGBZErQQOzYdoMyqX-6tjs_zUEuiJg&s"}
        />
        <TourListingOneDetails id={slug} />
        <FooterOne />
      </Layout>
    </>
  );
}


