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

    const title = blog.metaTitle || blog.title;
    const description = blog.metaDescription || blog.excerpt;

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
      icons: {
        icon: "/favicon-32x32.png",
      },
      openGraph: {
        title,
        description,
        images: blog.metaImage?.url
          ? [blog.metaImage.url]
          : [featuredImageUrl || "https://placehold.co/1200x630?text=Image"],
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: blog.metaImage?.url
          ? [blog.metaImage.url]
          : [featuredImageUrl || "https://placehold.co/1200x630?text=Image"],
      },
    };
  } catch (error) {
    return {
      title: "Blog Details | JES Egypt Tours",
    };
  }
}

export default async function BlogDetailsPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  try {
    const { slug } = await params;
    const blog = await getBlogBySlug(slug);

    // Blog Schema (JSON-LD)
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: blog.title,
      image: typeof blog.featuredImage === "string" ? blog.featuredImage : blog.featuredImage?.url,
      author: {
        "@type": "Person",
        name: blog.author?.name || "JES Egypt Tours",
      },
      description: blog.excerpt || blog.metaDescription,
      datePublished: blog.publishedAt || blog.createdAt,
      dateModified: blog.updatedAt || blog.createdAt,
      publisher: {
        "@type": "Organization",
        name: "JES Egypt Tours",
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/logo-dark.png`,
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${baseUrl}/blogs/${slug}`,
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
          <PageHeader title={blog.title} subTitle='Blog Details' />
          <DynamicBlogDetails blog={blog} showSidebar='right' />
          <FooterOne />
        </Layout>
      </>
    );
  } catch (error) {
    notFound();
  }
}

