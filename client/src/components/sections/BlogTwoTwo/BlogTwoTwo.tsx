"use client";

import React, { useEffect, useMemo, useState } from "react";

import { Container, Row, Col } from "react-bootstrap";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperClass } from "swiper";
import "swiper/css";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { blogTwoInfo } from "@/data/blogTwoTwoData";
import Link from "next/link";
import BlogCard from "@/components/common/BlogCard/BlogCard";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import { API_URL } from "@/config/api";
import { BlogPost, BlogResponse } from "@/lib/api/blog";
import { buildBlogCardViewModels } from "@/lib/blog/cardViewModel";
import { useTranslation } from "react-i18next";

interface BlogData {
  tagline: string;
  title: string;
  link: string;
  linkLabel: string;
  blogData: unknown[];
}

type BlogTwoTwoProps = {
  initialBlogs?: BlogPost[];
};

// All featured blogs are shown in a rewinding carousel (no fixed count).
// This is a generous upper bound fetched from the API — enough for any
// realistic admin-curated "featured" set while protecting page weight.
// Must match the pool used in the homepage's server-side fetch.
const FEATURED_FETCH_POOL = 24;

const BlogTwoTwo = ({ initialBlogs = [] }: BlogTwoTwoProps) => {
  const { link }: BlogData = blogTwoInfo;
  const { t, i18n } = useTranslation("blogs");
  const currentLocale = i18n.language || 'en';
  const [featuredBlogs, setFeaturedBlogs] = useState<BlogPost[]>(() => initialBlogs);
  const [swiper, setSwiper] = useState<SwiperClass | null>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let isMounted = true;

    if (initialBlogs.length > 0) {
      setFeaturedBlogs(initialBlogs);
      return () => {
        isMounted = false;
      };
    }

    const loadFeatured = async () => {
      try {
        // Fallback path only — the homepage normally passes initialBlogs. The API
        // localizes this response, so the locale has to travel with the request.
        const res = await fetch(`${API_URL}/blog/posts/featured?limit=${FEATURED_FETCH_POOL}`, {
          headers: { "X-Locale": currentLocale },
        });
        if (!res.ok) {
          throw new Error("Failed to fetch featured blogs");
        }

        const json: BlogResponse = await res.json();
        if (!isMounted) {
          return;
        }

        setFeaturedBlogs(json.data || []);
      } catch (error) {
        console.error("Failed to load featured blogs:", error);
      }
    };

    loadFeatured();

    return () => {
      isMounted = false;
    };
  }, [initialBlogs, currentLocale]);

  const featuredViewModel = useMemo(
    () => buildBlogCardViewModels(featuredBlogs, currentLocale),
    [featuredBlogs, currentLocale]
  );

  return (
    <section className='blog-two section-space-bottom' id='blog'>
      <Container>
        <div className='blog-two__top'>
          <Row className='align-items-end gutter-y-20'>
            <Col lg={8}>
              <div className='sec-title'>
                <p className='sec-title__tagline bw-split-in-right'>
                  {mounted ? <TextAnimation text={t('blogAndNews')} animationType='right' semantic /> : <span>{t('blogAndNews')}</span>}
                </p>
                <h2 className='sec-title__title bw-split-in-left'>
                  {mounted ? <TextAnimation text={t('ourLatestNews')} animationType='left' semantic /> : <span>{t('ourLatestNews')}</span>}
                </h2>
              </div>
            </Col>
            <Col lg={4}>
              <div className='blog-two__actions'>
                {mounted && featuredViewModel.length > 1 && (
                  <div className='blog-two__nav'>
                    <button
                      type='button'
                      className='blog-two__nav__btn'
                      aria-label={t('previousArticles')}
                      onClick={() => swiper?.slidePrev()}
                    >
                      <ChevronLeft size={20} aria-hidden='true' />
                    </button>
                    <button
                      type='button'
                      className='blog-two__nav__btn'
                      aria-label={t('nextArticles')}
                      onClick={() => swiper?.slideNext()}
                    >
                      <ChevronRight size={20} aria-hidden='true' />
                    </button>
                  </div>
                )}
                <div className='blog-two__top__btn'>
                  {mounted ? (
                    <Link href={link} className='gotur-btn gotur-btn--base'>
                      {t('seeMoreArticle')}{" "}
                      <span className='icon'>
                        <i className='icon-right'></i>
                      </span>
                    </Link>
                  ) : <div style={{ height: '50px' }} />}
                </div>
              </div>
            </Col>
          </Row>
        </div>

        <Swiper
          onSwiper={setSwiper}
          className='blog-two__carousel'
          spaceBetween={30}
          rewind={true}
          speed={600}
          breakpoints={{
            0: { slidesPerView: 1 },
            576: { slidesPerView: 2 },
            992: { slidesPerView: 3 },
          }}
        >
          {featuredViewModel.map((post, index) => (
            <SwiperSlide key={post.id}>
              {/* The first slide is above the fold on the homepage; the rest
                  are off-screen until the carousel moves. */}
              <BlogCard
                post={post}
                variant='feature'
                index={index}
                animate={false}
                priority={index === 0}
                // The carousel's own breakpoints: 1 slide, then 2, then 3.
                sizes='(max-width: 576px) 100vw, (max-width: 992px) 50vw, 33vw'
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </Container>

      <div className='blog-two__element'></div>
    </section>
  );
};

export default BlogTwoTwo;
