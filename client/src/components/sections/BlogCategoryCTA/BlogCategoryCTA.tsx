'use client';

import React from 'react';
import Link from 'next/link';
import { localizeInternalUrl } from '@/lib/url';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowUpRight, Clock, ArrowRight } from 'lucide-react';
import { getLocalizedValue } from '@/lib/localize';
import { getStrictLocalizedSlug, type SupportedLocale } from '@/lib/url';
import enBlogs from '@/i18n/locales/en/blogs.json';
import deBlogs from '@/i18n/locales/de/blogs.json';
import itBlogs from '@/i18n/locales/it/blogs.json';
import esBlogs from '@/i18n/locales/es/blogs.json';

const translations: any = { en: enBlogs, de: deBlogs, it: itBlogs, es: esBlogs };

interface BlogPost {
  _id: string;
  title: any;
  slug: any;
  featuredImage: any;
  readingTime?: number;
  excerpt?: any;
}

interface BlogCategoryCTAProps {
  locale: string;
  categoryName: string;
  featuredBlogs?: BlogPost[];
  articleCount?: number;
}

const BlogCategoryCTA: React.FC<BlogCategoryCTAProps> = ({
  locale,
  categoryName,
  featuredBlogs = [],
  articleCount,
}) => {
  const previewBlogs = featuredBlogs.slice(0, 3);
  const t = (key: string, params?: Record<string, string | number>) => {
    let value = translations[locale]?.[key] || translations.en?.[key] || key;
    Object.entries(params || {}).forEach(([paramKey, paramValue]) => {
      value = value.replace(`{{${paramKey}}}`, String(paramValue));
    });
    return value;
  };

  const getImageUrl = (img: any): string => {
    if (!img) return '';
    if (typeof img === 'string') return img;
    if (img.url) return img.url;
    return '';
  };

  const getBlogTitle = (blog: BlogPost): string => {
    if (!blog.title) return '';
    return getLocalizedValue(blog.title, locale) || '';
  };

  return (
    <section
      className="blog-category-cta position-relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 40% 50%, #1a1a1a 0%, #0d0d0d 100%)',
        borderTop: '1px solid rgba(183,156,92,0.2)',
      }}
    >
      {/* Noise texture overlay */}
      <div
        className="position-absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
          opacity: 0.4,
          zIndex: 0,
        }}
      />

      {/* Large decorative quote mark */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        viewport={{ once: true }}
        className="position-absolute"
        style={{
          top: '-20px',
          left: '5%',
          fontSize: '180px',
          lineHeight: 1,
          color: '#b79c5c',
          opacity: 0.08,
          fontFamily: 'Georgia, serif',
          fontWeight: 900,
          zIndex: 1,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        "
      </motion.div>

      <div className="container position-relative" style={{ zIndex: 2, paddingTop: '100px', paddingBottom: '100px' }}>
        <div className="row align-items-center g-5">

          {/* ── LEFT COLUMN ── */}
          <div className="col-lg-6">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              viewport={{ once: true }}
            >
              {/* Tagline */}
              <p
                style={{
                  color: '#b79c5c',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  marginBottom: '20px',
                }}
              >
                {t('categoryCtaEyebrow')}
              </p>

              {/* Headline */}
              <h2
                style={{
                  color: '#ffffff',
                  fontSize: 'clamp(32px, 4vw, 52px)',
                  fontWeight: 800,
                  lineHeight: 1.1,
                  marginBottom: '24px',
                }}
              >
                {t('categoryCtaTitle', { category: categoryName })}
              </h2>

              {/* Body */}
              <p
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '16px',
                  lineHeight: 1.75,
                  maxWidth: '460px',
                  marginBottom: '40px',
                }}
              >
                {articleCount
                  ? t('categoryCtaTextWithCount', { count: articleCount })
                  : t('categoryCtaText')}
              </p>

              {/* Buttons */}
              <div className="d-flex flex-wrap gap-3">
                <Link
                  href={localizeInternalUrl('/tailor-made', locale)}
                  className="d-flex align-items-center gap-2"
                  style={{
                    background: '#b79c5c',
                    color: '#ffffff',
                    borderRadius: '50px',
                    padding: '14px 32px',
                    fontWeight: 700,
                    fontSize: '14px',
                    textDecoration: 'none',
                    transition: 'background 0.3s, transform 0.2s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = '#9a8248';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = '#b79c5c';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  {t('planYourJourney')}
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href={`/${locale}/blogs/all`}
                  className="d-flex align-items-center gap-2"
                  style={{
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.8)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: '50px',
                    padding: '14px 32px',
                    fontWeight: 700,
                    fontSize: '14px',
                    textDecoration: 'none',
                    transition: 'border-color 0.3s, color 0.3s, transform 0.2s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.7)';
                    (e.currentTarget as HTMLElement).style.color = '#ffffff';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.25)';
                    (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  {t('browseAllArticles')}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN — Mini Blog Cards ── */}
          {previewBlogs.length > 0 && (
            <div className="col-lg-5 offset-lg-1">
              <div className="d-flex flex-column gap-0">
                {previewBlogs.map((blog, index) => {
                  const imgUrl = getImageUrl(blog.featuredImage);
                  const title = getBlogTitle(blog);
                  const slug = getStrictLocalizedSlug(blog.slug, locale as SupportedLocale) || '';
                  // No real localized slug → omit this preview card rather than
                  // linking to a fallback (English) URL from a non-English page.
                  if (!slug) return null;

                  return (
                    <React.Fragment key={blog._id}>
                      <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.15 }}
                        viewport={{ once: true }}
                      >
                        <Link
                          href={`/${locale}/${slug}`}
                          className="d-flex align-items-center gap-3 position-relative text-decoration-none blog-cta-card"
                          style={{
                            padding: '20px 16px',
                            borderRadius: '16px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            transition: 'background 0.3s, border-color 0.3s',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(183,156,92,0.4)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                          }}
                        >
                          {/* Thumbnail */}
                          {imgUrl ? (
                            <div
                              style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                flexShrink: 0,
                                position: 'relative',
                              }}
                            >
                              <Image
                                src={imgUrl}
                                alt={title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div
                              style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '12px',
                                background: 'rgba(183,156,92,0.15)',
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <span style={{ fontSize: '24px' }}>📰</span>
                            </div>
                          )}

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                color: '#ffffff',
                                fontSize: '14px',
                                fontWeight: 600,
                                marginBottom: '6px',
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                lineHeight: 1.4,
                              }}
                            >
                              {title}
                            </p>
                            {blog.readingTime && (
                              <span
                                style={{
                                  color: '#b79c5c',
                                  fontSize: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Clock size={11} />
                                {blog.readingTime} min read
                              </span>
                            )}
                          </div>

                          {/* Arrow */}
                          <ArrowUpRight
                            size={16}
                            style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}
                          />
                        </Link>
                      </motion.div>

                      {/* Divider between cards */}
                      {index < previewBlogs.length - 1 && (
                        <div
                          style={{
                            height: '1px',
                            background: 'rgba(183,156,92,0.12)',
                            margin: '4px 16px',
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default BlogCategoryCTA;
