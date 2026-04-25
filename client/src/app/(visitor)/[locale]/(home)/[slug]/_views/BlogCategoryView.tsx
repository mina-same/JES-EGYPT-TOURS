'use client';

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import DynamicBlogGrid from "@/components/sections/DynamicBlogGrid/DynamicBlogGrid";
import { getBlogsByCategory, getCategoryBySlug } from "@/lib/api/blog";
import { SlugManager } from "@/components/common/SlugManager";
import { getLocalizedValue } from "@/lib/localize";
import { Loader2 } from "lucide-react";
import ListingFaqs from "@/components/common/ListingSections/ListingFaqs";
import BannerCTA from "../../../../../../components/sections/BannerCTA/BannerCTA";
import ClientCarousel from "@/components/sections/ClientCarousel/ClientCarousel";
import BlogHero from "@/components/sections/BlogHero/BlogHero";
import { motion } from "framer-motion";
import { Row, Col } from "react-bootstrap";
import Image from "next/image";

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
      <BlogHero 
        title={getLocalizedValue(category.name, locale)} 
        subTitle={getLocalizedValue(category.description, locale)} 
        bgImage={typeof category.image === 'object' ? category.image?.url : category.image || undefined}
        breadcrumbs={[
          { label: t('blog'), href: `/${locale}/blogs` },
          { label: getLocalizedValue(category.name, locale) }
        ]}
        stats={{
          articles: blogsData?.pagination?.total || 0,
          updatedAt: category.updatedAt ? new Date(category.updatedAt).toLocaleDateString() : undefined
        }}
      />

      {/* Hero Title & Description Section */}
      {(getLocalizedValue(category.heroTitle, locale) || getLocalizedValue(category.heroDescription, locale)) && (
        <section className="section-space-top pb-5">
          <div className="container">
            <Row className="align-items-center">
              <Col lg={7}>
                <div className="hero-content-box">
                  {getLocalizedValue(category.heroTitle, locale) && (
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[#b79c5c]">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                      </span>
                      <h2 className="text-3xl font-extrabold text-[#1d231f]">
                        {getLocalizedValue(category.heroTitle, locale)}
                      </h2>
                    </div>
                  )}
                  {getLocalizedValue(category.heroDescription, locale) && (
                    <div 
                      className="prose max-w-none text-gray-600 leading-relaxed mb-10" 
                      dangerouslySetInnerHTML={{ __html: getLocalizedValue(category.heroDescription, locale) as string }} 
                    />
                  )}

                  {/* Features Icons Section */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-gray-100">
                    {(category.features && category.features.length > 0 ? category.features : [
                      { icon: 'shield', title: { en: 'Scenic Journey' }, description: { en: 'Relaxing views' } },
                      { icon: 'map-pin', title: { en: 'Luxor to Aswan' }, description: { en: 'Iconic sites' } },
                      { icon: 'calendar', title: { en: 'Multi-Day Trip' }, description: { en: '3 to 7 nights' } },
                      { icon: 'users', title: { en: 'Great for First-Timers' }, description: { en: 'Easy & unforgettable' } }
                    ]).map((feature: any, idx: number) => (
                      <div key={idx} className="flex flex-col items-center text-center gap-2">
                        <div className="p-3 bg-[#fdf7f0] rounded-full text-[#b79c5c]">
                           {/* Simple Icon Fallback */}
                           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             {feature.icon === 'sun' ? <><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></> :
                              feature.icon === 'map-pin' ? <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></> :
                              feature.icon === 'calendar' ? <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></> :
                              feature.icon === 'users' ? <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></> :
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}
                           </svg>
                        </div>
                        <div>
                          <h4 className="text-[12px] font-bold text-[#1d231f]">{getLocalizedValue(feature.title, locale)}</h4>
                          <p className="text-[10px] text-gray-400">{getLocalizedValue(feature.description, locale)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
              <Col lg={5} className="mt-5 mt-lg-0">
                <motion.div 
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className="relative rounded-3xl overflow-hidden shadow-2xl"
                  style={{ height: '400px' }}
                >
                  <Image 
                    src={category.sideImage?.url || (typeof category.image === 'object' ? category.image?.url : category.image) || "https://placehold.co/800x600?text=JES+Egypt+Tours"} 
                    alt={getLocalizedValue(category.sideImage?.alt, locale) || (typeof category.image === 'object' ? getLocalizedValue(category.image?.alt, locale) : getLocalizedValue(category.name, locale))}
                    title={getLocalizedValue(category.sideImage?.title, locale) || (typeof category.image === 'object' ? getLocalizedValue(category.image?.title, locale) : getLocalizedValue(category.name, locale))}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-3xl" />
                </motion.div>
              </Col>
            </Row>
          </div>
        </section>
      )}

      {/* Featured Blogs */}
      {category.featuredBlogs && category.featuredBlogs.length > 0 && (
        <section className="section-space bg-gray-50 dark:bg-slate-900/50 mt-5 pt-5 pb-5">
          <Container>
            <div className="section-title text-center mb-10">
              <h2 className="text-3xl font-black text-[#1d231f]">
                {getLocalizedValue(category.featuredBlogsSectionTitle, locale) || "Our Featured Articles"}
              </h2>
            </div>
            <DynamicBlogGrid 
              blogs={category.featuredBlogs} 
              basePath={`/${locale}/${slug}`}
              variant="featured"
            />
          </Container>
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
