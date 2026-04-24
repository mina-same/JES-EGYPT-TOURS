'use client';

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import DynamicBlogGrid from "@/components/sections/DynamicBlogGrid/DynamicBlogGrid";
import { getBlogsByCategory, getCategoryBySlug } from "@/lib/api/blog";
import { SlugManager } from "@/components/common/SlugManager";
import { getLocalizedValue } from "@/lib/localize";
import { Loader2 } from "lucide-react";
import ListingFaqs from "@/components/common/ListingSections/ListingFaqs";
import BannerCTA from "../../../../../../components/sections/BannerCTA/BannerCTA";
import ClientCarousel from "@/components/sections/ClientCarousel/ClientCarousel";

export default function BlogCategoryView({ slug, locale }: { slug: string; locale: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Number(searchParams?.get("page")) || 1;
  const t = (key: string) => {
    const translations: any = {
      en: require("@/i18n/locales/en/blogs.json"),
      de: require("@/i18n/locales/de/blogs.json"),
      it: require("@/i18n/locales/it/blogs.json"),
      es: require("@/i18n/locales/es/blogs.json")
    };
    return translations[locale]?.[key] || translations['en']?.[key] || key;
  };

  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<any>(null);
  const [blogsData, setBlogsData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const cat = await getCategoryBySlug(slug);
        // Use the base (English) slug for the posts API call to ensure it's found
        const baseSlug = typeof cat.slug === 'object' ? cat.slug.en : cat.slug;
        const blogs = await getBlogsByCategory(baseSlug || slug, page, 9);
        setCategory(cat);
        setBlogsData(blogs);
      } catch (err) {
        console.error("Error fetching blog category data:", err);
        setError("Category not found");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, page]);

  if (loading && !category) {
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

  if (error || !category) {
    return (
      <Layout>
        <TopbarOne /><HeaderOne linkTheme="light" /><HeaderOneCloned />
        <div className="flex items-center justify-center min-h-[400px]">
          <h3>Category Not Found</h3>
        </div>
        <FooterOne />
      </Layout>
    );
  }

  return (
    <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <SlugManager slugs={typeof category.slug === 'object' ? category.slug : { en: slug }} />
      <PageHeader 
        title={getLocalizedValue(category.name, locale)} 
        subTitle={getLocalizedValue(category.description, locale)} 
        bgImage={typeof category.image === 'object' ? category.image?.url : category.image || undefined}
        alt={typeof category.image === 'object' ? getLocalizedValue(category.image?.alt, locale) : undefined}
        breadcrumbs={[
          { label: t('blog'), href: `/${locale}/blogs` },
          { label: getLocalizedValue(category.name, locale) }
        ]}
      />

      {/* Hero Section */}
      {(getLocalizedValue(category.heroTitle, locale) || getLocalizedValue(category.heroDescription, locale)) && (
        <section className="section-space-top">
          <div className="container">
            {getLocalizedValue(category.heroTitle, locale) && (
              <div className="sec-title text-center mb-4">
                <h2 className="sec-title__title">{getLocalizedValue(category.heroTitle, locale)}</h2>
              </div>
            )}
            {getLocalizedValue(category.heroDescription, locale) && (
              <div 
                className="prose max-w-none text-center mx-auto" 
                dangerouslySetInnerHTML={{ __html: getLocalizedValue(category.heroDescription, locale) as string }} 
              />
            )}
          </div>
        </section>
      )}

      {/* Featured Blogs */}
      {category.featuredBlogs && category.featuredBlogs.length > 0 && (
        <section className="section-space bg-gray-50 dark:bg-slate-900/50 mt-5 pt-5 pb-5">
          <div className="container">
            <div className="sec-title text-center mb-5">
              <h2 className="sec-title__title">
                {getLocalizedValue(category.featuredBlogsSectionTitle, locale) || t('featuredBlogs') || 'Featured Blogs'}
              </h2>
            </div>
            <DynamicBlogGrid
              blogs={category.featuredBlogs}
              pagination={undefined}
              basePath={`/${locale}/${slug}`}
            />
          </div>
        </section>
      )}

      {/* All Articles */}
      <section className="section-space-top pb-5">
        <div className="container">
          <div className="sec-title text-center mb-5">
            <h2 className="sec-title__title">
              {getLocalizedValue(category.blogsSectionTitle, locale) || t('allArticles') || 'All Articles'}
            </h2>
          </div>
          <DynamicBlogGrid
            blogs={blogsData?.data || []}
            pagination={blogsData?.pagination}
            basePath={`/${locale}/${slug}`}
          />
        </div>
      </section>

      {/* FAQs */}
      {category.faqs && category.faqs.length > 0 && (
        <ListingFaqs 
          faqs={category.faqs} 
          sectionTitle={category.faqsSectionTitle}
          title="FAQs"
          locale={locale} 
        />
      )}

      <BannerCTA locale={locale} />
      <ClientCarousel />
      <FooterOne />
    </Layout>
  );
}
