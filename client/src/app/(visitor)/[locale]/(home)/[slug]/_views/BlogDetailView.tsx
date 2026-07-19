'use client';

import React, { useState, useEffect, useRef } from "react";
import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import BlogHero from "@/components/sections/BlogHero/BlogHero";
import DynamicBlogDetails from "@/components/sections/DynamicBlogDetails/DynamicBlogDetails";
import { getBlogBySlug } from "@/lib/api/blog";
import { SlugManager } from "@/components/common/SlugManager";
import { getLocalizedValue } from "@/lib/localize";
import { getStrictLocalizedSlug, type SupportedLocale } from "@/lib/url";
import { Loader2 } from "lucide-react";
import ClientCarousel from "@/components/sections/ClientCarousel/ClientCarousel";

// Translations
import enBlogs from "@/i18n/locales/en/blogs.json";
import deBlogs from "@/i18n/locales/de/blogs.json";
import itBlogs from "@/i18n/locales/it/blogs.json";
import esBlogs from "@/i18n/locales/es/blogs.json";

const translations: any = { en: enBlogs, de: deBlogs, it: itBlogs, es: esBlogs };

interface BlogDetailViewProps {
  slug: string;
  locale: string;
  /** Blog fetched server-side (the page resolver already has it) so the
   *  article body is part of the SSR HTML instead of a client-side spinner. */
  initialBlog?: any;
}

export default function BlogDetailView({ slug, locale, initialBlog }: BlogDetailViewProps) {
  const t = (key: string) => translations[locale]?.[key] || translations['en'][key];

  const [loading, setLoading] = useState(!initialBlog);
  const [blog, setBlog] = useState<any>(initialBlog ?? null);
  const [error, setError] = useState<string | null>(null);

  // Server already provided the blog — skip the duplicate mount fetch
  const skipFirstFetch = useRef(Boolean(initialBlog));
  useEffect(() => {
    if (skipFirstFetch.current) {
      skipFirstFetch.current = false;
      return;
    }
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
  const featuredImageUrl = typeof blog.featuredImage === "string" ? blog.featuredImage : blog.featuredImage?.url;

  const localizedSlugs = typeof blog.slug === 'object' ? blog.slug : { en: slug };

  const breadcrumbs: { label: any; href?: string }[] = [];
  
  const blogSubCat = blog.subCategory;
  const blogCat = blogSubCat?.category;

  if (blogCat && typeof blogCat === 'object') {
    const blogCatSlug = getStrictLocalizedSlug(blogCat.slug, locale as SupportedLocale);
    breadcrumbs.push({
      label: getLocalizedValue(blogCat.name, locale),
      href: blogCatSlug ? `/${locale}/${blogCatSlug}` : undefined
    });
  }

  if (blogSubCat && typeof blogSubCat === 'object') {
    const blogSubCatSlug = getStrictLocalizedSlug(blogSubCat.slug, locale as SupportedLocale);
    breadcrumbs.push({
      label: getLocalizedValue(blogSubCat.name, locale),
      href: blogSubCatSlug ? `/${locale}/${blogSubCatSlug}` : undefined
    });
  }

  breadcrumbs.push({ label: title });

  return (
    <>
      <SlugManager slugs={localizedSlugs} />
      <Layout>
        <TopbarOne />
        <HeaderOne linkTheme="light" />
        <HeaderOneCloned />
        <BlogHero 
          title={title} 
          subTitle={getLocalizedValue(blog.excerpt, locale) || t('ourBlog')} 
          bgImage={featuredImageUrl}
          imageAlt={typeof blog.featuredImage === 'object' ? getLocalizedValue(blog.featuredImage?.alt, locale) : undefined}
          imageTitle={
            typeof blog.featuredImage === 'object'
              ? getLocalizedValue(blog.featuredImage?.title, locale) || getLocalizedValue(blog.featuredImage?.alt, locale) || title
              : title
          }
          breadcrumbs={breadcrumbs}
        />
        <DynamicBlogDetails blog={blog} showSidebar='right' />
        <ClientCarousel />
        <FooterOne />
      </Layout>
    </>
  );
}
