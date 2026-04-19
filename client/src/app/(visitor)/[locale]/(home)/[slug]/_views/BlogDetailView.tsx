'use client';

import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import DynamicBlogDetails from "@/components/sections/DynamicBlogDetails/DynamicBlogDetails";
import { getBlogBySlug } from "@/lib/api/blog";
import { SlugManager } from "@/components/common/SlugManager";
import { getLocalizedValue } from "@/lib/localize";
import { Loader2 } from "lucide-react";

// Translations
import enBlogs from "@/i18n/locales/en/blogs.json";
import deBlogs from "@/i18n/locales/de/blogs.json";
import itBlogs from "@/i18n/locales/it/blogs.json";
import esBlogs from "@/i18n/locales/es/blogs.json";

const translations: any = { en: enBlogs, de: deBlogs, it: itBlogs, es: esBlogs };
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://jesegypttours.com";

export default function BlogDetailView({ slug, locale }: { slug: string; locale: string }) {
  const t = (key: string) => translations[locale]?.[key] || translations['en'][key];

  const [loading, setLoading] = useState(true);
  const [blog, setBlog] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getBlogBySlug(slug);
        setBlog(data);
      } catch (err) {
        console.error("Error fetching blog detail data:", err);
        setError("Blog not found");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  if (loading && !blog) {
    return (
      <Layout>
        <TopbarOne /><HeaderOne linkTheme="light" /><HeaderOneCloned />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
        <FooterOne />
      </Layout>
    );
  }

  if (error || !blog) {
    return (
      <Layout>
        <TopbarOne /><HeaderOne linkTheme="light" /><HeaderOneCloned />
        <div className="flex items-center justify-center min-h-[400px]">
          <h3>Blog Not Found</h3>
        </div>
        <FooterOne />
      </Layout>
    );
  }

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
      "@id": `${baseUrl}/${locale}/${slug}`,
    },
  };

  const localizedSlugs = typeof blog.slug === 'object' ? blog.slug : { en: slug };

  const breadcrumbs: { label: any; href?: string }[] = [
    { label: t('blog'), href: `/${locale}/blogs` },
  ];
  if (blog.category) {
    breadcrumbs.push({
      label: getLocalizedValue(blog.category.name, locale),
      href: `/${locale}/${getLocalizedValue(blog.category.slug, locale) || ''}`
    });
  }
  if (blog.subCategory) {
    breadcrumbs.push({
      label: getLocalizedValue(blog.subCategory.name, locale),
      href: `/${locale}/${getLocalizedValue(blog.subCategory.slug, locale) || ''}`
    });
  }
  breadcrumbs.push({ label: title });

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
        <PageHeader 
          title={title} 
          subTitle={getLocalizedValue(blog.excerpt, locale) || t('ourBlog')} 
          bgImage={featuredImageUrl}
          alt={typeof blog.featuredImage === 'object' ? getLocalizedValue(blog.featuredImage?.alt, locale) : undefined}
          breadcrumbs={breadcrumbs}
        />
        <DynamicBlogDetails blog={blog} showSidebar='right' />
        <FooterOne />
      </Layout>
    </>
  );
}
