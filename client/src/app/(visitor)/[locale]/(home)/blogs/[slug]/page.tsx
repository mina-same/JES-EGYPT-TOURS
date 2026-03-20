import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import DynamicBlogDetails from "@/components/sections/DynamicBlogDetails/DynamicBlogDetails";
import { getBlogBySlug } from "@/lib/api/blog";
import { notFound } from "next/navigation";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://jesegypttours.com";

function getLocalizedValue(value: any, locale: string): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[locale] || value.en || "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  try {
    const { slug, locale } = await params;
    const blog = await getBlogBySlug(slug);
    
    const featuredImageUrl =
      typeof blog.featuredImage === "string"
        ? blog.featuredImage
        : blog.featuredImage?.url;

    const title = getLocalizedValue(blog.seo?.metaTitle, locale) || getLocalizedValue(blog.title, locale) || "Blog Details";
    const description = getLocalizedValue(blog.seo?.metaDescription, locale) || getLocalizedValue(blog.excerpt, locale) || "";

    return {
      title: `${title} | JES Egypt Tours`,
      description: description,
      alternates: {
        canonical: `${baseUrl}/${locale}/blogs/${slug}`,
        languages: {
          en: `${baseUrl}/en/blogs/${slug}`,
          de: `${baseUrl}/de/blogs/${slug}`,
          it: `${baseUrl}/it/blogs/${slug}`,
          es: `${baseUrl}/es/blogs/${slug}`,
        },
      },
      openGraph: {
        title,
        description,
        images: blog.seo?.metaImage?.url
          ? [blog.seo.metaImage.url]
          : [featuredImageUrl || "https://placehold.co/1200x630?text=Image"],
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: blog.seo?.metaImage?.url
          ? [blog.seo.metaImage.url]
          : [featuredImageUrl || "https://placehold.co/1200x630?text=Image"],
      },
      robots: "noindex, nofollow",
    };
  } catch (error) {
    return {
      title: "Blog Details | JES Egypt Tours",
      robots: "noindex, nofollow",
    };
  }
}

export default async function BlogDetailsPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  try {
    const { slug, locale } = await params;
    const blog = await getBlogBySlug(slug);

    const title = getLocalizedValue(blog.title, locale);
    const description = getLocalizedValue(blog.excerpt, locale) || getLocalizedValue(blog.seo?.metaDescription, locale) || "";
    const featuredImageUrl = typeof blog.featuredImage === "string" ? blog.featuredImage : blog.featuredImage?.url;

    // Professional Blog Schema (JSON-LD)
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": title,
      "image": [
        featuredImageUrl,
        ...(blog.contentBlocks?.map((block: any) => block.url || block.image).filter(Boolean) || [])
      ].filter(Boolean),
      "author": {
        "@type": "Person",
        "name": blog.author?.name || "JES Egypt Tours",
      },
      "description": description.replace(/<[^>]*>/g, ""),
      "datePublished": blog.publishedAt || blog.createdAt,
      "dateModified": blog.updatedAt || blog.createdAt,
      "publisher": {
        "@type": "Organization",
        "name": "JES Egypt Tours",
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/logo-dark.png`,
        },
        "@id": `${baseUrl}/#organization`
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `${baseUrl}/${locale}/blogs/${slug}`,
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
          <PageHeader title={title} subTitle='Blog Details' />
          <DynamicBlogDetails blog={blog} showSidebar='right' />
          <FooterOne />
        </Layout>
      </>
    );
  } catch (error) {
    console.error("Error loading blog page:", error);
    notFound();
  }
}


