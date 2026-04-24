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
import { getBlogsBySubCategory, getSubCategoryBySlug } from "@/lib/api/blog";
import { SlugManager } from "@/components/common/SlugManager";
import { getLocalizedValue } from "@/lib/localize";
import { Loader2 } from "lucide-react";
import ListingFaqs from "@/components/common/ListingSections/ListingFaqs";
import BannerCTA from "../../../../../../components/sections/BannerCTA/BannerCTA";
import ClientCarousel from "@/components/sections/ClientCarousel/ClientCarousel";

// Import locally for now as translations might be needed for subTitle
import enBlogs from "@/i18n/locales/en/blogs.json";
import deBlogs from "@/i18n/locales/de/blogs.json";
import itBlogs from "@/i18n/locales/it/blogs.json";
import esBlogs from "@/i18n/locales/es/blogs.json";

const translations: any = { en: enBlogs, de: deBlogs, it: itBlogs, es: esBlogs };

export default function BlogSubcategoryView({ slug, locale }: { slug: string; locale: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Number(searchParams?.get("page")) || 1;
  const t = (key: string) => translations[locale]?.[key] || translations['en'][key];

  const [loading, setLoading] = useState(true);
  const [subcategory, setSubcategory] = useState<any>(null);
  const [blogsData, setBlogsData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const sub = await getSubCategoryBySlug(slug);
        // Use the base (English) slug for the posts API call
        const baseSlug = typeof sub.slug === 'object' ? sub.slug.en : sub.slug;
        const blogs = await getBlogsBySubCategory(baseSlug || slug, page, 9);
        setSubcategory(sub);
        setBlogsData(blogs);
      } catch (err) {
        console.error("Error fetching blog subcategory data:", err);
        setError("Subcategory not found");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, page]);

  if (loading && !subcategory) {
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

  if (error || !subcategory) {
    return (
      <Layout>
        <TopbarOne /><HeaderOne linkTheme="light" /><HeaderOneCloned />
        <div className="flex items-center justify-center min-h-[400px]">
          <h3>Subcategory Not Found</h3>
        </div>
        <FooterOne />
      </Layout>
    );
  }

  const parentName = typeof subcategory.category === 'object' ? getLocalizedValue((subcategory.category as any).name, locale) : '';

  return (
    <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <SlugManager slugs={typeof subcategory.slug === 'object' ? subcategory.slug : { en: slug }} />
      <PageHeader 
        title={getLocalizedValue(subcategory.name, locale)} 
        subTitle={getLocalizedValue(subcategory.description, locale) || parentName || t('blogCategory')} 
        bgImage={typeof subcategory.image === 'object' ? subcategory.image?.url : subcategory.image || undefined}
        alt={typeof subcategory.image === 'object' ? getLocalizedValue(subcategory.image?.alt, locale) : undefined}
        breadcrumbs={[
          { label: t('blog'), href: `/${locale}/blogs` },
          ...(subcategory.category ? [{ label: parentName, href: `/${locale}/${typeof subcategory.category === 'object' ? getLocalizedValue((subcategory.category as any).slug, locale) : ''}` }] : []),
          { label: getLocalizedValue(subcategory.name, locale) }
        ]}
      />

      {/* Hero Section */}
      {(getLocalizedValue(subcategory.heroTitle, locale) || getLocalizedValue(subcategory.heroDescription, locale)) && (
        <section className="section-space-top">
          <div className="container">
            {getLocalizedValue(subcategory.heroTitle, locale) && (
              <div className="sec-title text-center mb-4">
                <h2 className="sec-title__title">{getLocalizedValue(subcategory.heroTitle, locale)}</h2>
              </div>
            )}
            {getLocalizedValue(subcategory.heroDescription, locale) && (
              <div 
                className="prose max-w-none text-center mx-auto" 
                dangerouslySetInnerHTML={{ __html: getLocalizedValue(subcategory.heroDescription, locale) as string }} 
              />
            )}
          </div>
        </section>
      )}

      {/* Featured Blogs */}
      {subcategory.featuredBlogs && subcategory.featuredBlogs.length > 0 && (
        <section className="section-space bg-gray-50 dark:bg-slate-900/50 mt-5 pt-5 pb-5">
          <div className="container">
            <div className="sec-title text-center mb-5">
              <h2 className="sec-title__title">
                {getLocalizedValue(subcategory.featuredBlogsSectionTitle, locale) || t('featuredBlogs') || 'Featured Blogs'}
              </h2>
            </div>
            <DynamicBlogGrid
              blogs={subcategory.featuredBlogs}
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
              {getLocalizedValue(subcategory.blogsSectionTitle, locale) || t('allArticles') || 'All Articles'}
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
      {subcategory.faqs && subcategory.faqs.length > 0 && (
        <ListingFaqs 
          faqs={subcategory.faqs} 
          sectionTitle={subcategory.faqsSectionTitle}
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
