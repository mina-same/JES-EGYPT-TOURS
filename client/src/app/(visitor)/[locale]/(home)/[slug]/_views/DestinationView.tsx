'use client';

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Container, Row, Col } from "react-bootstrap";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
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

import { getDestinationBySlug, getBlogsByDestination, Destination } from "@/lib/api/destination";
import { getLocalizedValue } from "@/lib/localize";
import { Loader2 } from "lucide-react";

interface DestinationViewProps {
  slug: string;
  locale: string;
}

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

export default function DestinationView({ slug, locale }: DestinationViewProps) {
  const searchParams = useSearchParams();
  const page = Number(searchParams?.get("page")) || 1;

  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [blogsData, setBlogsData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const dest = await getDestinationBySlug(slug);
        if (!dest) throw new Error('Destination not found');
        const blogs = await getBlogsByDestination(dest._id, page, 9);
        setDestination(dest);
        setBlogsData(blogs);
      } catch (err: any) {
        setError(err.message || 'Failed to load destination');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, page]);

  if (loading) {
    return (
      <Layout>
        <TopbarOne />
        <HeaderOne linkTheme="light" />
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
          <Loader2 className="animate-spin" style={{ color: '#b79c5c', width: 48, height: 48 }} />
        </div>
        <FooterOne />
      </Layout>
    );
  }

  if (error || !destination) {
    return (
      <Layout>
        <TopbarOne />
        <HeaderOne linkTheme="light" />
        <div className="text-center py-5" style={{ minHeight: '60vh' }}>
          <h2 className="text-2xl font-bold text-gray-700">Destination not found</h2>
          <Link href={`/${locale}`} className="mt-4 inline-block text-[#b79c5c] underline">
            Return Home
          </Link>
        </div>
        <FooterOne />
      </Layout>
    );
  }

  const name = getLocalizedValue(destination.name, locale);
  const subheader = getLocalizedValue(destination.subheader, locale);
  const heroTitle = getLocalizedValue(destination.heroTitle, locale);
  const heroDescription = getLocalizedValue(destination.heroDescription, locale);
  const coverImageUrl = destination.coverImage?.url;
  const coverImageAlt = getLocalizedValue(destination.coverImage?.alt, locale) || name;
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
          breadcrumbs={[{ label: 'Destinations', href: `/${locale}/destinations` }, { label: name }]}
        />

        {/* ── Hero Details Section (Title + Description + Side Image) ──────── */}
        {(heroTitle || heroDescription || coverImageUrl) && (
          <section className="section-space" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
            <Container>
              <Row className="align-items-center gutter-y-40">
                <Col lg={coverImageUrl ? 7 : 12}>
                  {heroTitle && (
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6 }}
                    >
                      <div className="d-flex align-items-center gap-3 mb-4">
                        <div style={{ height: '3px', width: '40px', background: '#b79c5c', borderRadius: '2px' }} />
                        <span style={{ fontSize: '11px', fontWeight: 900, color: '#b79c5c', textTransform: 'uppercase', letterSpacing: '0.25em' }}>
                          About This Destination
                        </span>
                      </div>
                      <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: '#1d231f', lineHeight: 1.2, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
                        {heroTitle}
                      </h2>
                    </motion.div>
                  )}
                  {getLocalizedValue(destination.description, locale) && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1, duration: 0.6 }}
                      style={{ color: '#4b5563', fontSize: '1.125rem', fontWeight: 500, marginBottom: '2rem', lineHeight: 1.6 }}
                    >
                      {getLocalizedValue(destination.description, locale)}
                    </motion.p>
                  )}
                  {heroDescription && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                      style={{ color: '#6b7280', lineHeight: 1.8, fontSize: '1.0625rem' }}
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
                    </motion.div>
                  )}
                </Col>

                {coverImageUrl && (
                  <Col lg={5}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      style={{ position: 'relative', borderRadius: '2rem', overflow: 'hidden', aspectRatio: '4/3' }}
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
                    </motion.div>
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="d-flex flex-column align-items-center text-center mb-5"
              >
                <span style={{ fontSize: '11px', fontWeight: 900, color: '#b79c5c', textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: '0.5rem' }}>
                  Quick Overview
                </span>
                <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#1d231f', margin: 0 }}>
                  At a Glance
                </h2>
              </motion.div>

              <Row className="gutter-y-20" style={{ '--bs-gutter-x': '20px' } as any}>
                {AT_A_GLANCE_ITEMS.map((item, idx) => {
                  const value = getLocalizedValue(destination[item.key], locale);
                  if (!value) return null;
                  const IconComponent = item.icon;
                  return (
                    <Col lg={3} md={6} key={item.key}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        style={{
                          background: '#fff',
                          border: '1px solid #f0f0f0',
                          borderRadius: '1.5rem',
                          padding: '1.75rem',
                          height: '100%',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                          transition: 'box-shadow 0.3s ease',
                        }}
                        whileHover={{ boxShadow: '0 8px 30px rgba(0,0,0,0.1)', translateY: -4 }}
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
                      </motion.div>
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="d-flex flex-column align-items-center text-center mb-5"
                style={{ paddingTop: '60px' }}
              >
                <span style={{ fontSize: '11px', fontWeight: 900, color: '#b79c5c', textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: '0.5rem' }}>
                  Handpicked Articles
                </span>
                <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#1d231f', margin: 0 }}>
                  {getLocalizedValue(destination.featuredBlogsSectionTitle, locale) || 'Featured Content'}
                </h2>
              </motion.div>

              <DynamicBlogGrid
                blogs={destination.featuredBlogs}
                basePath={`/${locale}/${slug}`}
                variant="featured"
              />
            </Container>
          </section>
        )}

        {/* ── All Articles ──────────────────────────────────────────────────── */}
        <section className="section-space">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="d-flex flex-column align-items-center text-center mb-5"
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                style={{ color: '#b79c5c', fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.5rem' }}
              >
                All Articles
              </motion.span>
              <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#1d231f' }}>
                {`Explore ${name}`}
              </h2>
              <div style={{ width: '48px', height: '2px', background: '#e5e7eb', marginTop: '1rem', borderRadius: '999px' }} />
            </motion.div>

            {blogsData?.data && blogsData.data.length > 0 ? (
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
