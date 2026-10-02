'use client';

import React, { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Container, Row, Col } from "react-bootstrap";
import Image from "next/image";
import { Trophy, Link2, Clock, Sun } from "lucide-react";

import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import { SlugManager } from "@/components/common/SlugManager";
import DynamicBlogGrid from "@/components/sections/DynamicBlogGrid/DynamicBlogGrid";
import ListingFaqs from "@/components/common/ListingSections/ListingFaqs";
import BannerCTA from "../../../../../../components/sections/BannerCTA/BannerCTA";
import BlogHero from "@/components/sections/BlogHero/BlogHero";
import ClientCarousel from "@/components/sections/ClientCarousel/ClientCarousel";

import type { Destination, DestinationBlogsResponse } from "@/lib/api/destination";
import { getLocalizedValue } from "@/lib/localize";
import { entrance, useEntranceOnMount } from "@/components/common/Entrance/Entrance";
import "./DestinationView.css";

import enBlogs from "@/i18n/locales/en/blogs.json";
import deBlogs from "@/i18n/locales/de/blogs.json";
import itBlogs from "@/i18n/locales/it/blogs.json";
import esBlogs from "@/i18n/locales/es/blogs.json";

interface DestinationViewProps {
  slug: string;
  locale: string;
  /** The destination the route already resolved; the view does not read it again. */
  destination: Destination;
  /** This page's article cards, read on the server for the route's ?page=. */
  blogsData: DestinationBlogsResponse;
}

const translations: any = { en: enBlogs, de: deBlogs, it: itBlogs, es: esBlogs };

const AT_A_GLANCE_ITEMS = [
  {
    key: 'bestFor' as const,
    icon: Trophy,
    label: 'Best For',
    labelAr: 'الأفضل لـ',
    color: '#b79c5c',
    bg: '#fdf7f0',
  },
  {
    key: 'combinesWith' as const,
    icon: Link2,
    label: 'Combines With',
    labelAr: 'يتكامل مع',
    color: '#0e3a57',
    bg: '#f0f5fa',
  },
  {
    key: 'timeNeeded' as const,
    icon: Clock,
    label: 'Time Needed',
    labelAr: 'الوقت اللازم',
    color: '#2d6a4f',
    bg: '#f0f9f4',
  },
  {
    key: 'bestSeason' as const,
    icon: Sun,
    label: 'Best Season',
    labelAr: 'أفضل موسم',
    color: '#c77d00',
    bg: '#fdf9f0',
  },
];

export default function DestinationView({ slug, locale, destination, blogsData }: DestinationViewProps) {
  const searchParams = useSearchParams();
  const page = Number(searchParams?.get("page")) || 1;
  const t = (key: string, params?: Record<string, string | number>) => {
    let value = translations[locale]?.[key] || translations.en?.[key] || key;
    Object.entries(params || {}).forEach(([paramKey, paramValue]) => {
      value = value.replace(`{{${paramKey}}}`, String(paramValue));
    });
    return value;
  };

  // Everything below is in the server HTML now, so it must start in its final
  // state: an entrance animation starting from opacity 0 would leave it
  // invisible until the page's JavaScript ran. See Entrance.ts.
  const animateIn = useEntranceOnMount();

  // The pager is links to ?page=N: the route re-renders on the server and this
  // view receives that page's cards as props. Bring the list into view when the
  // page changes, as the blog listings do — not on the first render.
  const articlesRef = useRef<HTMLElement>(null);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    articlesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [page]);

  const name = getLocalizedValue(destination.name, locale);
  const subheader = getLocalizedValue(destination.subheader, locale);
  const heroTitle = getLocalizedValue(destination.heroTitle, locale);
  const heroDescription = getLocalizedValue(destination.heroDescription, locale);
  const coverImageUrl = destination.coverImage?.url;
  const coverImageAlt = getLocalizedValue(destination.coverImage?.alt, locale) || name;
  const coverImageTitle = getLocalizedValue(destination.coverImage?.title, locale) || coverImageAlt;
  const hasGlanceData = destination.bestFor || destination.combinesWith || destination.timeNeeded || destination.bestSeason;

  return (
    <>
      {destination.slug && <SlugManager slugs={destination.slug as any} />}

      <Layout>
        <TopbarOne />
        <HeaderOne linkTheme="light" />
        <HeaderOneCloned />

        {/* ── Hero Section ─────────────────────────────────────────────────── */}
        <BlogHero
          title={name}
          subTitle={subheader}
          bgImage={coverImageUrl}
          imageAlt={coverImageAlt}
          imageTitle={coverImageTitle}
          breadcrumbs={[{ label: name }]}
        />

        {/* ── Hero Details Section (Title + Description + Side Image) ──────── */}
        {(heroTitle || heroDescription || coverImageUrl) && (
          <section className="section-space" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
            <Container>
              <Row className="align-items-center gutter-y-40">
                <Col lg={coverImageUrl ? 7 : 12}>
                  {heroTitle && (
                    <div {...entrance(animateIn, { x: -30, duration: 0.6, inView: 'once' })}>
                      <div className="d-flex align-items-center gap-3 mb-4">
                        <div style={{ height: '3px', width: '40px', background: '#b79c5c', borderRadius: '2px' }} />
                        <span style={{ fontSize: '11px', fontWeight: 900, color: '#b79c5c', textTransform: 'uppercase', letterSpacing: '0.25em' }}>
                          {t('aboutThisDestination')}
                        </span>
                      </div>
                      <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: '#1d231f', lineHeight: 1.2, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
                        {heroTitle}
                      </h2>
                    </div>
                  )}
                  {getLocalizedValue(destination.description, locale) && (
                    <p
                      {...entrance(animateIn, { delay: 0.1, duration: 0.6, inView: 'once' }, { color: '#4b5563', fontSize: '1.125rem', fontWeight: 500, marginBottom: '2rem', lineHeight: 1.6 })}
                    >
                      {getLocalizedValue(destination.description, locale)}
                    </p>
                  )}
                  {heroDescription && (
                    <div
                      {...entrance(animateIn, { delay: 0.2, duration: 0.6, inView: 'once' }, { color: '#6b7280', lineHeight: 1.8, fontSize: '1.0625rem' })}
                    >
                      {Array.isArray(heroDescription) ? (
                        <ul className="list-unstyled space-y-3">
                          {heroDescription.map((item: string, i: number) => (
                            <li key={i} className="d-flex align-items-start gap-3">
                              <div className="mt-2" style={{ width: '6px', height: '6px', background: '#b79c5c', borderRadius: '50%', flexShrink: 0 }} />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: heroDescription }} />
                      )}
                    </div>
                  )}
                </Col>

                {coverImageUrl && (
                  <Col lg={5}>
                    <div
                      {...entrance(animateIn, { scale: 0.97, duration: 0.7, inView: 'once' }, { position: 'relative', borderRadius: '2rem', overflow: 'hidden', aspectRatio: '4/3' })}
                    >
                      <Image
                        src={coverImageUrl}
                        alt={coverImageAlt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 40vw"
                      />
                      {/* Decorative corner accent */}
                      <div style={{
                        position: 'absolute', bottom: '1.5rem', right: '1.5rem',
                        background: 'rgba(183,156,92,0.9)', backdropFilter: 'blur(10px)',
                        borderRadius: '1rem', padding: '0.75rem 1.25rem',
                        color: '#fff', fontWeight: 800, fontSize: '0.75rem',
                        textTransform: 'uppercase', letterSpacing: '0.1em'
                      }}>
                        {getLocalizedValue(destination.region, locale) || 'Egypt'}
                      </div>
                    </div>
                  </Col>
                )}
              </Row>
            </Container>
          </section>
        )}

        {/* ── At a Glance ──────────────────────────────────────────────────── */}
        {hasGlanceData && (
          <section style={{ paddingTop: '0', paddingBottom: '80px' }}>
            <Container>
              <div
                {...entrance(animateIn, { y: 20, inView: 'once' })}
                className="d-flex flex-column align-items-center text-center mb-5"
              >
                <span style={{ fontSize: '11px', fontWeight: 900, color: '#b79c5c', textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: '0.5rem' }}>
                  {t('quickOverview')}
                </span>
                <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#1d231f', margin: 0 }}>
                  {t('atAGlance')}
                </h2>
              </div>

              <Row className="gutter-y-20" style={{ '--bs-gutter-x': '20px' } as any}>
                {AT_A_GLANCE_ITEMS.map((item, idx) => {
                  const value = getLocalizedValue(destination[item.key], locale);
                  if (!value) return null;
                  const IconComponent = item.icon;
                  return (
                    <Col lg={3} md={6} key={item.key}>
                      <div
                        className="destination-glance-card"
                        {...entrance(animateIn, { y: 20, delay: idx * 0.1, inView: 'once' }, {
                          background: '#fff',
                          border: '1px solid #f0f0f0',
                          borderRadius: '1.5rem',
                          padding: '1.75rem',
                          height: '100%',
                        })}
                      >
                        <div style={{
                          width: '52px', height: '52px',
                          background: item.bg,
                          borderRadius: '1rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginBottom: '1rem',
                        }}>
                          <IconComponent size={24} style={{ color: item.color }} strokeWidth={1.5} />
                        </div>
                        <h3 style={{ fontSize: '0.7rem', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>
                          {item.label}
                        </h3>
                        <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1d231f', margin: 0, lineHeight: 1.4 }}>
                          {value}
                        </p>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Container>
          </section>
        )}

        {/* ── Featured Blogs ────────────────────────────────────────────────── */}
        {destination.featuredBlogs && destination.featuredBlogs.length > 0 && (
          <section style={{ paddingTop: '0', paddingBottom: '80px', background: '#fdf7f0' }}>
            <Container>
              <div
                {...entrance(animateIn, { y: 20, inView: 'once' }, { paddingTop: '60px' })}
                className="d-flex flex-column align-items-center text-center mb-5"
              >
                <span style={{ fontSize: '11px', fontWeight: 900, color: '#b79c5c', textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: '0.5rem' }}>
                  {t('handpickedArticles')}
                </span>
                <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#1d231f', margin: 0 }}>
                  {getLocalizedValue(destination.featuredBlogsSectionTitle, locale) || t('featuredContent')}
                </h2>
              </div>

              <DynamicBlogGrid
                blogs={destination.featuredBlogs}
                basePath={`/${locale}/${slug}`}
                variant="featured"
              />
            </Container>
          </section>
        )}

        {/* ── All Articles ──────────────────────────────────────────────────── */}
        <section ref={articlesRef} className="section-space">
          <div className="container">
            <div
              {...entrance(animateIn, { y: 20, inView: 'once' })}
              className="d-flex flex-column align-items-center text-center mb-5"
            >
              {/* No `viewport.once` in the Framer version: replays on re-entry. */}
              <span
                {...entrance(animateIn, { scale: 0.8, inView: 'repeat' }, { color: '#b79c5c', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.5rem' })}
              >
                {t('allArticles')}
              </span>
              <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#1d231f' }}>
                {t('exploreDestination', { name })}
              </h2>
              <div style={{ width: '48px', height: '2px', background: '#e5e7eb', marginTop: '1rem', borderRadius: '999px' }} />
            </div>

            {blogsData.data.length > 0 ? (
              <DynamicBlogGrid
                blogs={blogsData.data}
                pagination={blogsData.pagination}
                basePath={`/${locale}/${slug}`}
              />
            ) : (
              <div className="text-center py-5">
                <p style={{ color: '#9ca3af', fontWeight: 600 }}>No articles found for this destination yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* ── FAQs ─────────────────────────────────────────────────────────── */}
        {destination.faqs && destination.faqs.length > 0 && (
          <ListingFaqs
            faqs={destination.faqs}
            sectionTitle={destination.faqsSectionTitle}
            title="Frequently Asked Questions"
            locale={locale}
          />
        )}

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <BannerCTA
          locale={locale}
          variant="destination"
          contextName={name}
          imageUrl={destination.coverImage?.url}
        />

        <ClientCarousel />

        <FooterOne />
      </Layout>
    </>
  );
}
