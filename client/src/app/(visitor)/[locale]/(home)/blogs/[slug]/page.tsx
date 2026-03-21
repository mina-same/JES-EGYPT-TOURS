import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import DynamicBlogDetails from "@/components/sections/DynamicBlogDetails/DynamicBlogDetails";
import { getBlogBySlug } from "@/lib/api/blog";
import { notFound, permanentRedirect } from "next/navigation";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import { SlugManager } from "@/components/common/SlugManager";

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
          en: `${baseUrl}/en/blogs/${blog.slug?.en || slug}`,
          de: `${baseUrl}/de/blogs/${blog.slug?.de || slug}`,
          it: `${baseUrl}/it/blogs/${blog.slug?.it || slug}`,
          es: `${baseUrl}/es/blogs/${blog.slug?.es || slug}`,
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
  let correctSlug = '';
  let title = '';
  let description = '';
  let featuredImageUrl = '';
  let blog: any = null;

  try {
    const { slug: urlSlug, locale: urlLocale } = await params;
    blog = await getBlogBySlug(urlSlug);
    correctSlug = getLocalizedValue(blog.slug, urlLocale);
    title = getLocalizedValue(blog.title, urlLocale);
    description = getLocalizedValue(blog.excerpt, urlLocale) || getLocalizedValue(blog.seo?.metaDescription, urlLocale) || "";
    featuredImageUrl = typeof blog.featuredImage === "string" ? blog.featuredImage : blog.featuredImage?.url;
  } catch (error) {
    console.error("Error loading blog page:", error);
    notFound();
  }

  const { slug, locale } = await params;
  if (correctSlug && correctSlug !== slug && correctSlug !== '') {
    permanentRedirect(`/${locale}/blogs/${correctSlug}`);
  }

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

    const localizedSlugs = typeof blog.slug === 'object' ? blog.slug : { en: slug };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SlugManager slugs={localizedSlugs} />
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
}


