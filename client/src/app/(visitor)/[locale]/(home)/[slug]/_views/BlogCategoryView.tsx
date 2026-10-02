'use client';

import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/layout/Layout/Layout';
import TopbarOne from '@/components/common/TopbarOne/TopbarOne';
import HeaderOne from '@/components/layout/HeaderOne/HeaderOne';
import HeaderOneCloned from '@/components/layout/HeaderOneCloned/HeaderOneCloned';
import FooterOne from '@/components/layout/FooterOne/FooterOne';
import DynamicBlogGrid from '@/components/sections/DynamicBlogGrid/DynamicBlogGrid';
import type { BlogCategory, BlogListResponse, BlogSubCategory } from '@/lib/api/blog';
import { SlugManager } from '@/components/common/SlugManager';
import { getLocalizedValue } from '@/lib/localize';
import { getStrictLocalizedSlug, type SupportedLocale } from '@/lib/url';
import { ArrowRight, MapPin } from 'lucide-react';
import ListingFaqs from '@/components/common/ListingSections/ListingFaqs';
import ClientCarousel from '@/components/sections/ClientCarousel/ClientCarousel';
import BlogHero from '@/components/sections/BlogHero/BlogHero';
import BlogCategoryCTA from '@/components/sections/BlogCategoryCTA/BlogCategoryCTA';
import { entrance, useEntranceOnMount } from '@/components/common/Entrance/Entrance';
import { Container, Row, Col } from 'react-bootstrap';
import Image from 'next/image';
import Link from 'next/link';
import {
  TinySliderWrapper as TinySlider,
  type TinySliderHandle,
} from '@/components/common/TinySliderWrapper';
import LucideIcon from '@/components/common/LucideIcon';

import enBlogs from '@/i18n/locales/en/blogs.json';
import deBlogs from '@/i18n/locales/de/blogs.json';
import itBlogs from '@/i18n/locales/it/blogs.json';
import esBlogs from '@/i18n/locales/es/blogs.json';

const translations: any = { en: enBlogs, de: deBlogs, it: itBlogs, es: esBlogs };

// ─── Helper ───────────────────────────────────────────────────────────────────
const getImageUrl = (img: any): string => {
  if (!img) return '';
  if (typeof img === 'string') return img;
  if (img.url) return img.url;
  return '';
};

const getImageTitle = (img: any, locale: string, fallback?: string): string => {
  if (!img || typeof img === 'string') return fallback || '';
  return getLocalizedValue(img.title, locale) || getLocalizedValue(img.alt, locale) || fallback || '';
};

// Render icon: emoji character → as text, otherwise try gotur icon class
const SubcatIcon: React.FC<{ icon?: string; hover?: boolean }> = ({ icon }) => {
  if (!icon) {
    // fallback compass SVG
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    );
  }
  // If single emoji / unicode char (≤2 characters counting surrogates)
  const codePoints = [...icon];
  if (codePoints.length <= 2) {
    return <span style={{ fontSize: '28px', lineHeight: 1 }}>{icon}</span>;
  }
  // Otherwise treat as icon name (Lucide)
  return <LucideIcon name={icon} size={28} strokeWidth={1.5} />;
};

interface BlogCategoryViewProps {
  slug: string;
  locale: string;
  /** The category, exactly as the route's resolver read it. */
  category: BlogCategory;
  /** Its sub-categories — the "Browse by Topic" cards. */
  subcategories: BlogSubCategory[];
  /** The listing page this URL asks for (?page=), read on the server — cards only. */
  blogsData: BlogListResponse;
}

// ─── Main Component ───────────────────────────────────────────────────────────
/**
 * Rendered from server data, the way BlogSubcategoryView already is.
 *
 * This view used to reach the browser as an empty shell: the server rendered a
 * spinner, and the category, its sub-categories and the listing were fetched
 * only after hydration. The HTML had no <h1>, no article cards and no links to
 * them, and a client-side visit showed the spinner until three requests
 * returned. The route now reads all three and passes them in.
 *
 * No client fetch is left, pagination included. The pager is a real <Link> to
 * ?page=N, and following it re-renders the route on the server, which reads
 * that page and hands it over as new props — React keeps this instance and
 * swaps the props rather than remounting it. A client fetch on top would
 * request the same page a second time, and copying these props into local
 * state would pin the view to its first page, because a state initializer
 * only runs on mount.
 */
export default function BlogCategoryView({
  slug,
  locale,
  category,
  subcategories,
  blogsData,
}: BlogCategoryViewProps) {
  const searchParams = useSearchParams();
  const page = Number(searchParams?.get('page')) || 1;
  const allBlogsRef = useRef<HTMLElement>(null);
  const destinationSliderRef = useRef<TinySliderHandle>(null);
  // Scroll-triggered entrances: armed only below the fold, never on content
  // the server already painted on screen. See Entrance.ts.
  const animateIn = useEntranceOnMount('below-fold');
  const t = (key: string) => translations[locale]?.[key] || translations['en']?.[key] || key;

  // Scroll to All Blogs section on page change (not first load)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    allBlogsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [page]);

  const categoryName = getLocalizedValue(category.name, locale) || '';
  const categoryImage = getImageUrl(category.image);
  const categoryImageTitle = getImageTitle(category.image, locale, categoryName);
  const featuredBlogs = category.featuredBlogs ?? [];
  const featuredDestinations = category.featuredDestinations ?? [];
  const hasFeaturedBlogs = featuredBlogs.length > 0;
  const hasFeaturedDestinations = featuredDestinations.length > 0;
  const hasFaqs = (category.faqs?.length ?? 0) > 0;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <SlugManager slugs={typeof category.slug === 'object' ? category.slug : { en: slug }} />

      {/* ════════════════════════════════════════════════════════════════════════
          § 1  HERO
          ════════════════════════════════════════════════════════════════════════ */}
      <BlogHero
        title={categoryName}
        subTitle={getLocalizedValue(category.heroDescription, locale) || getLocalizedValue(category.description, locale)}
        bgImage={categoryImage || undefined}
        imageAlt={getLocalizedValue((category.image as any)?.alt, locale) || categoryImageTitle}
        imageTitle={categoryImageTitle}
        breadcrumbs={[
          { label: categoryName },
        ]}
        stats={{
          articles: blogsData?.pagination?.total || 0,
          updatedAt: category.updatedAt,
        }}
      />

      {/* ════════════════════════════════════════════════════════════════════════
          § 2  ABOUT CATEGORY (Side Image & Description)
          ════════════════════════════════════════════════════════════════════════ */}
      {(category.sideImage?.url || getLocalizedValue(category.description, locale)) && (
        <section style={{ background: '#ffffff', padding: '60px 0 100px 0' }}>
          <Container>
            <Row className="align-items-center">
              <Col lg={6}>
                <div {...entrance(animateIn, { x: -20, inView: 'once' })}>
                  <span style={{ color: '#b79c5c', fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px', display: 'block' }}>
                    About {categoryName}
                  </span>
                  <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 800, color: '#1a1a1a', marginBottom: '24px', lineHeight: 1.2 }}>
                    {getLocalizedValue(category.heroTitle, locale) || categoryName}
                  </h2>
                  <div 
                    style={{ fontSize: '17px', color: '#555', lineHeight: 1.8, marginBottom: '32px' }}
                    dangerouslySetInnerHTML={{ __html: getLocalizedValue(category.heroDescription, locale) || getLocalizedValue(category.description, locale) }}
                  />
                </div>
              </Col>
              
              {category.sideImage?.url && (
                <Col lg={6} className="mt-5 mt-lg-0">
                  <div
                    {...entrance(animateIn, { scale: 0.95, inView: 'once' }, { position: 'relative', borderRadius: '30px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' })}
                  >
                    <Image
                      src={category.sideImage.url}
                      alt={getLocalizedValue(category.sideImage.alt, locale) || categoryName}
                      title={getImageTitle(category.sideImage, locale, categoryName)}
                      width={800}
                      height={600}
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  </div>
                </Col>
              )}
            </Row>
          </Container>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          § 3  BROWSE BY TOPIC (Subcategory Cards)
          ════════════════════════════════════════════════════════════════════════ */}
      {subcategories.length > 0 && (
        <section style={{ background: '#f8f5f0', padding: '80px 0' }}>
          <Container>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <span
                {...entrance(animateIn, { scale: 0.85, inView: 'once' }, { display: 'inline-block', color: '#b79c5c', fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' })}
              >
                Explore Topics
              </span>
              <h2
                {...entrance(animateIn, { y: 12, delay: 0.1, inView: 'once' }, { fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, color: '#1a1a1a', marginBottom: '16px' })}
              >
                Browse by Topic
              </h2>
              <div style={{ width: '64px', height: '3px', background: '#b79c5c', margin: '0 auto', borderRadius: '2px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
              {subcategories.map((sub: any, index: number) => {
                const subSlug = getStrictLocalizedSlug(sub.slug, locale as SupportedLocale) || '';
                const subName = getLocalizedValue(sub.name, locale) || '';
                // No real localized slug → omit this subcategory card rather than
                // linking to a fallback (English) URL from a non-English page.
                if (!subSlug) return null;
                return (
                  <div key={sub._id || index} {...entrance(animateIn, { y: 20, delay: index * 0.07, inView: 'once' })}>
                    <Link href={`/${locale}/${subSlug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                      <div
                        style={{
                          background: '#ffffff',
                          border: '1px solid #eeeeee',
                          borderRadius: '20px',
                          padding: '28px 20px',
                          textAlign: 'center',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '14px',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.borderColor = '#b79c5c';
                          el.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)';
                          el.style.transform = 'translateY(-5px)';
                          const iconCircle = el.querySelector('.icon-circle') as HTMLElement;
                          if (iconCircle) { iconCircle.style.background = '#b79c5c'; iconCircle.style.color = '#ffffff'; }
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.borderColor = '#eeeeee';
                          el.style.boxShadow = 'none';
                          el.style.transform = 'translateY(0)';
                          const iconCircle = el.querySelector('.icon-circle') as HTMLElement;
                          if (iconCircle) {
                            iconCircle.style.background = '#ffffff';
                            iconCircle.style.color = '#b79c5c';
                          }
                        }}
                      >
                        {/* Icon circle */}
                        <div
                          className="icon-circle"
                          style={{
                            width: '68px',
                            height: '68px',
                            borderRadius: '50%',
                            background: '#f8f5f0',
                            color: '#b79c5c',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.3s, color 0.3s',
                            boxShadow: '0 4px 12px rgba(183,156,92,0.1)',
                            flexShrink: 0,
                          }}
                        >
                          <SubcatIcon icon={sub.icon} />
                        </div>

                        {/* Name */}
                        <p style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a', margin: 0, lineHeight: 1.3 }}>
                          {subName}
                        </p>

                        {/* Explore cue */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#b79c5c', fontSize: '12px', fontWeight: 600, marginTop: 'auto' }}>
                          Explore <ArrowRight size={12} />
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          § 4  BROWSE BY DESTINATION (Slider)
          ════════════════════════════════════════════════════════════════════════ */}
      {hasFeaturedDestinations && (
        <section style={{ background: '#ffffff', padding: '80px 0' }}>
          <Container>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '52px' }}>
              <span
                {...entrance(animateIn, { scale: 0.85, inView: 'once' }, { display: 'inline-block', color: '#b79c5c', fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' })}
              >
                Explore Destinations
              </span>
              <h2
                {...entrance(animateIn, { y: 12, delay: 0.1, inView: 'once' }, { fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, color: '#1a1a1a', marginBottom: '16px' })}
              >
                {getLocalizedValue(category.destinationsSectionTitle, locale) || 'Where Will You Go?'}
              </h2>
              <div style={{ width: '64px', height: '3px', background: '#b79c5c', margin: '0 auto', borderRadius: '2px' }} />
            </div>

            {/* Slider */}
            <div className="position-relative">
              <TinySlider
                ref={destinationSliderRef}
                settings={{
                  items: 1,
                  gutter: 24,
                  loop: false,
                  rewind: true,
                  autoplay: true,
                  autoplayTimeout: 3500,
                  nav: false,
                  controls: false,
                  mouseDrag: true,
                  responsive: {
                    576: { items: 2 },
                    992: { items: 3 },
                  },
                }}
                className="destination-slider-inner"
                rebuildKey={`${locale}:${featuredDestinations
                  .map((destination: any) => destination._id ?? "")
                  .join("|")}`}
              >
                {featuredDestinations.map((dest: any, idx: number) => {
                  const destImg = getImageUrl(dest.coverImage);
                  const destName = getLocalizedValue(dest.name, locale) || '';
                  const destImageTitle = getImageTitle(dest.coverImage, locale, destName);
                  const destSlug = getStrictLocalizedSlug(dest.slug, locale as SupportedLocale) || '';
                  // No real localized slug → omit this destination card rather than
                  // linking to a fallback (English) URL from a non-English page.
                  if (!destSlug) return null;
                  return (
                    <div key={dest._id || idx} className="item">
                      <Link href={`/${locale}/${destSlug}`} style={{ textDecoration: 'none', display: 'block' }}>
                        <div
                          style={{ borderRadius: '20px', overflow: 'hidden', height: '280px', position: 'relative', cursor: 'pointer' }}
                          onMouseEnter={e => { const img = (e.currentTarget as HTMLElement).querySelector('img'); if (img) img.style.transform = 'scale(1.05)'; }}
                          onMouseLeave={e => { const img = (e.currentTarget as HTMLElement).querySelector('img'); if (img) img.style.transform = 'scale(1)'; }}
                        >
                          {destImg ? (
                            <Image
                              src={destImg}
                              alt={getLocalizedValue(dest.coverImage?.alt, locale) || destImageTitle}
                              title={destImageTitle}
                              fill
                              className="object-cover"
                              style={{ transition: 'transform 0.5s ease' }}
                            />
                          ) : (
                            <div style={{ background: 'linear-gradient(135deg, #2c2c2c, #555)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <MapPin size={40} color="#b79c5c" />
                            </div>
                          )}
                          {/* Overlay */}
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)' }} />
                          {/* Name */}
                          <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <p style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                              {destName}
                            </p>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(183,156,92,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <ArrowRight size={16} color="#fff" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </TinySlider>

              {/* Custom nav arrows */}
              <div className="dest-slider-nav" style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '28px' }}>
                <button
                  type="button"
                  aria-label="Previous destination"
                  onClick={() => destinationSliderRef.current?.slider?.goTo("prev")}
                  style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#fff', border: '1px solid #e5e5e5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#b79c5c'; (e.currentTarget as HTMLElement).style.borderColor = '#b79c5c'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = '#e5e5e5'; }}
                >
                  <span className="icon-arrow-left" style={{ fontSize: '14px', color: 'inherit' }} />
                </button>
                <button
                  type="button"
                  aria-label="Next destination"
                  onClick={() => destinationSliderRef.current?.slider?.goTo("next")}
                  style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#b79c5c', border: '1px solid #b79c5c', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#9a8248'; (e.currentTarget as HTMLElement).style.borderColor = '#9a8248'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#b79c5c'; (e.currentTarget as HTMLElement).style.borderColor = '#b79c5c'; }}
                >
                  <span className="icon-arrow-right" style={{ fontSize: '14px', color: '#fff' }} />
                </button>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          § 5  POPULAR BLOGS (Admin chosen)
          ════════════════════════════════════════════════════════════════════════ */}
      {hasFeaturedBlogs && (
        <section style={{ background: '#f8f5f0', padding: '80px 0' }}>
          <Container>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '52px' }}>
              <span
                {...entrance(animateIn, { scale: 0.85, inView: 'once' }, { display: 'inline-block', color: '#b79c5c', fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' })}
              >
                {t('topPicks')}
              </span>
              <h2
                {...entrance(animateIn, { y: 12, delay: 0.1, inView: 'once' }, { fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, color: '#1a1a1a', marginBottom: '16px' })}
              >
                {getLocalizedValue(category.featuredBlogsSectionTitle, locale) || t('popularArticles')}
              </h2>
              <div style={{ width: '64px', height: '3px', background: '#b79c5c', margin: '0 auto', borderRadius: '2px' }} />
            </div>

            <DynamicBlogGrid
              blogs={featuredBlogs}
              basePath={`/${locale}/${slug}`}
              variant="featured"
            />
          </Container>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          § 6  ALL BLOGS (Paginated)
          ════════════════════════════════════════════════════════════════════════ */}
      <section ref={allBlogsRef} style={{ background: '#ffffff', padding: '80px 0' }}>
        <Container>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <span
              {...entrance(animateIn, { scale: 0.85, inView: 'once' }, { display: 'inline-block', color: '#b79c5c', fontSize: '11px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' })}
            >
              {t('exploreMore')}
            </span>
            <h2
              {...entrance(animateIn, { y: 12, delay: 0.1, inView: 'once' }, { fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, color: '#1a1a1a', marginBottom: '16px' })}
            >
              {getLocalizedValue(category.blogsSectionTitle, locale) || t('allArticles')}
            </h2>
            <div style={{ width: '64px', height: '3px', background: '#e5e5e5', margin: '0 auto', borderRadius: '2px' }} />
          </div>

          {blogsData?.data?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
              <p style={{ fontSize: '16px' }}>{t('noArticlesInCategory')}</p>
            </div>
          ) : (
            <DynamicBlogGrid
              blogs={blogsData?.data || []}
              pagination={blogsData?.pagination}
              basePath={`/${locale}/${slug}`}
            />
          )}
        </Container>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          § 7  FAQ
          ════════════════════════════════════════════════════════════════════════ */}
      {hasFaqs && (
        <ListingFaqs
          faqs={category.faqs}
          sectionTitle={category.faqsSectionTitle}
          title="FAQs"
          locale={locale}
          style={{ background: '#f8f5f0' }}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          § 7  DARK EDITORIAL CTA
          ════════════════════════════════════════════════════════════════════════ */}
      <BlogCategoryCTA
        locale={locale}
        categoryName={categoryName}
        featuredBlogs={category.featuredBlogs || []}
        articleCount={blogsData?.pagination?.total}
      />

      <ClientCarousel />
      <FooterOne />
    </Layout>
  );
}
