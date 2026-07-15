"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";

import { Container, Row, Col } from "react-bootstrap";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperClass } from "swiper";
import "swiper/css";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { blogTwoInfo } from "@/data/blogTwoTwoData";
import Link from "next/link";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import { API_URL } from "@/config/api";
import { BlogPost, BlogResponse, formatBlogDate } from "@/lib/api/blog";
import { getLocalizedValue } from "@/lib/localize";
import { getStrictLocalizedSlug, type SupportedLocale } from "@/lib/url";
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
        const res = await fetch(`${API_URL}/blog/posts/featured?limit=${FEATURED_FETCH_POOL}`);
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
  }, [initialBlogs]);

  const featuredViewModel = useMemo(() => {
    return featuredBlogs
      .filter((post) => getStrictLocalizedSlug(post.slug, currentLocale as SupportedLocale))
      .map((post) => {
      const slug = getStrictLocalizedSlug(post.slug, currentLocale as SupportedLocale) || "";
      const { day, month } = formatBlogDate(post.publishedAt || post.createdAt);
      const image =
        typeof post.featuredImage === "string"
          ? post.featuredImage
          : post.featuredImage?.url || "https://placehold.co/600x400?text=Image";
      const imageAlt =
        typeof post.featuredImage === "object" && post.featuredImage?.alt
          ? getLocalizedValue(post.featuredImage.alt, currentLocale)
          : getLocalizedValue(post.title, currentLocale);


      const authorName = post.editorialAuthor?.name || "Madonna Roshdey";
      const authorLink = `/${currentLocale}/authors/${post.editorialAuthor?.slug || 'madonna-roshdey'}`;

      const localizedTags = getLocalizedValue(post.tags, currentLocale);
      const category = Array.isArray(localizedTags) && localizedTags.length > 0 ? localizedTags[0] : "";

      return {
        id: post._id,
        title: getLocalizedValue(post.title, currentLocale),
        image,
        imageAlt,
        day,
        month,
        author: authorName,
        authorLink,
        category,
        link: `/${currentLocale}/${slug}`,
      };

    });
  }, [featuredBlogs, currentLocale]);

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
                      aria-label='Previous articles'
                      onClick={() => swiper?.slidePrev()}
                    >
                      <ChevronLeft size={20} aria-hidden='true' />
                    </button>
                    <button
                      type='button'
                      className='blog-two__nav__btn'
                      aria-label='Next articles'
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
          {featuredViewModel.map((post) => (
            <SwiperSlide key={post.id}>
              <div className='blog-card-two blog-card-two--one'>
                <div className='blog-card-two__image'>
                  <Image
                    src={post.image}
                    alt={post.imageAlt || post.title || "Blog post image"}
                    className="img-fluid"
                    width={600}
                    height={450}
                    style={{ width: "100%", height: "260px", objectFit: "cover" }}
                  />
                  <div className='blog-card-two__date'>
                    <span className='blog-card-two__date__day'>{post.day}</span>
                    <span className='blog-card-two__date__month'>
                      {post.month}
                    </span>
                  </div>
                  <Link href={post.link} className='blog-card-two__image__link'>
                    <span className='sr-only'>{post.title}</span>
                  </Link>
                </div>
                <div className='blog-card-two__content'>
                  <ul className='list-unstyled blog-card-two__meta'>
                    <li>
                      <Link href={post.authorLink}>
                        <span className='blog-card-two__meta__icon'>
                          <i className='icon-user'></i>
                        </span>{" "}
                        {t('by')} {post.author}
                      </Link>
                    </li>
                    <li>
                      <Link href={post.link}>
                        <span className='blog-card-two__meta__icon'>
                          <i className='icon-price-tag'></i>
                        </span>{" "}
                        {post.category}
                      </Link>
                    </li>
                  </ul>
                  <h3 className='blog-card-two__title'>
                    <Link href={post.link}>{post.title}</Link>
                  </h3>
                  <Link
                    href={post.link}
                    className='blog-card-two__content__btn'
                  >
                    {t('readMore')} <i className='icon-arrow-right'></i>
                  </Link>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </Container>

      <div className='blog-two__element'></div>
    </section>
  );
};

export default BlogTwoTwo;
