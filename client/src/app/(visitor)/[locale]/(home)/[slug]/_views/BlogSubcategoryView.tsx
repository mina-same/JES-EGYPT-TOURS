'use client';

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import DynamicBlogGrid from "@/components/sections/DynamicBlogGrid/DynamicBlogGrid";
import { getBlogsBySubCategory, getSubCategoryBySlug, getSubCategoriesByCategory } from "@/lib/api/blog";
import { SlugManager } from "@/components/common/SlugManager";
import { getLocalizedValue } from "@/lib/localize";
import { Loader2 } from "lucide-react";
import ListingFaqs from "@/components/common/ListingSections/ListingFaqs";
import BannerCTA from "../../../../../../components/sections/BannerCTA/BannerCTA";
import ClientCarousel from "@/components/sections/ClientCarousel/ClientCarousel";
import BlogHero from "@/components/sections/BlogHero/BlogHero";
import BlogSubcategoryNav from "@/components/sections/BlogSubcategoryNav/BlogSubcategoryNav";
import { motion } from "framer-motion";
import { Row, Col } from "react-bootstrap";
import Image from "next/image";

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
  const [siblingSubcategories, setSiblingSubcategories] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const sub = await getSubCategoryBySlug(slug);
        setSubcategory(sub);

        // Fetch sibling subcategories if category is available
        if (sub.category) {
          const categoryId = typeof sub.category === 'object' ? sub.category._id : sub.category;
          if (categoryId) {
            const siblings = await getSubCategoriesByCategory(categoryId);
            setSiblingSubcategories(siblings);
          }
        }

        // Use the base (English) slug for the posts API call
        const baseSlug = typeof sub.slug === 'object' ? sub.slug.en : sub.slug;
        const blogs = await getBlogsBySubCategory(baseSlug || slug, page, 9);
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
      
      <BlogHero 
        title={getLocalizedValue(subcategory.name, locale)} 
        subTitle={getLocalizedValue(subcategory.description, locale)} 
        bgImage={typeof subcategory.image === 'object' ? subcategory.image?.url : subcategory.image || undefined}
        breadcrumbs={[
          { label: t('blog'), href: `/${locale}/blogs` },
          ...(subcategory.category ? [{ label: parentName, href: `/${locale}/${typeof subcategory.category === 'object' ? getLocalizedValue((subcategory.category as any).slug, locale) : ''}` }] : []),
          { label: getLocalizedValue(subcategory.name, locale) }
        ]}
        stats={{
          articles: blogsData?.pagination?.total || 0,
          updatedAt: subcategory.updatedAt ? new Date(subcategory.updatedAt).toLocaleDateString() : undefined
        }}
      />

      <BlogSubcategoryNav 
        subcategories={siblingSubcategories} 
        currentSlug={slug} 
        locale={locale} 
      />

      {/* Hero Title & Description Section */}
      {(getLocalizedValue(subcategory.heroTitle, locale) || getLocalizedValue(subcategory.heroDescription, locale)) && (
        <section className="section-space-top pb-5">
          <div className="container">
            <Row className="align-items-center">
              <Col lg={7}>
                <div className="hero-content-box">
                  {getLocalizedValue(subcategory.heroTitle, locale) && (
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[#b79c5c]">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                      </span>
                      <h2 className="text-3xl font-extrabold text-[#1d231f]">
                        {getLocalizedValue(subcategory.heroTitle, locale)}
                      </h2>
                    </div>
                  )}
                  {getLocalizedValue(subcategory.heroDescription, locale) && (
                    <div 
                      className="prose max-w-none text-gray-600 leading-relaxed mb-10" 
                      dangerouslySetInnerHTML={{ __html: getLocalizedValue(subcategory.heroDescription, locale) as string }} 
                    />
                  )}

                  {/* Features Icons Section */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-gray-100">
                    {(subcategory.features && subcategory.features.length > 0 ? subcategory.features : [
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
                    src={subcategory.sideImage?.url || (typeof subcategory.image === 'object' ? subcategory.image?.url : subcategory.image) || "https://placehold.co/800x600?text=JES+Egypt+Tours"} 
                    alt={getLocalizedValue(subcategory.sideImage?.alt, locale) || (typeof subcategory.image === 'object' ? getLocalizedValue(subcategory.image?.alt, locale) : getLocalizedValue(subcategory.name, locale))}
                    title={getLocalizedValue(subcategory.sideImage?.title, locale) || (typeof subcategory.image === 'object' ? getLocalizedValue(subcategory.image?.title, locale) : getLocalizedValue(subcategory.name, locale))}
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

      {/* Featured Blogs Section */}
      {subcategory.featuredBlogs && subcategory.featuredBlogs.length > 0 && (
        <section className="section-space bg-[#fdf7f0]/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
             <svg width="400" height="400" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="#b79c5c" fill="none" strokeWidth="0.5" /></svg>
          </div>
          <div className="container relative z-10">
            <div className="flex flex-col items-center mb-10">
              <motion.span 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="text-[#b79c5c] font-bold text-sm uppercase tracking-widest mb-2"
              >
                Top Picks
              </motion.span>
              <h2 className="text-4xl font-extrabold text-[#1d231f] text-center">
                {getLocalizedValue(subcategory.featuredBlogsSectionTitle, locale) || t('featuredBlogs') || 'Featured Blogs'}
              </h2>
              <div className="w-20 h-1 bg-[#b79c5c] mt-4 rounded-full" />
            </div>
            <DynamicBlogGrid
              blogs={subcategory.featuredBlogs}
              pagination={undefined}
              basePath={`/${locale}/${slug}`}
              variant="featured"
            />
          </div>
        </section>
      )}

      {/* All Articles Section */}
      <section className="section-space">
        <div className="container">
          <div className="flex flex-col items-center mb-10">
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="text-[#b79c5c] font-bold text-sm uppercase tracking-widest mb-2"
            >
              Explore More
            </motion.span>
            <h2 className="text-4xl font-extrabold text-[#1d231f] text-center">
              {getLocalizedValue(subcategory.blogsSectionTitle, locale) || t('allArticles') || 'All Articles'}
            </h2>
            <div className="w-20 h-1 bg-gray-200 mt-4 rounded-full" />
          </div>
          <DynamicBlogGrid
            blogs={blogsData?.data || []}
            pagination={blogsData?.pagination}
            basePath={`/${locale}/${slug}`}
          />
        </div>
      </section>

      {/* FAQs Section */}
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
