"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { BlogPost, formatBlogDate } from "@/lib/api/blog";
import { Col, Container, Row } from "react-bootstrap";
import BlogSidebar from "@/components/common/BlogSidebar/BlogSidebar";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { getLocalizedValue } from "@/lib/localize";
import { getStrictLocalizedSlug, type SupportedLocale } from "@/lib/url";
import BlogTOC from "@/components/common/BlogTOC/BlogTOC";
import { CheckCircle, List, HelpCircle, Plus, Minus } from "lucide-react";
import FaqAccordion from "@/components/common/Faq/FaqAccordion";
import ReviewAvatar from "@/components/common/ReviewAvatar";
import { API_URL } from "@/config/api";
import TourCard from "@/components/common/TourCard/TourCard";
import { visibleBlocksFor } from "@/lib/blogBlocks";
import { EDITORIAL_AUTHOR_SLUG, resolveBlogByline } from "@/lib/blog/author";
import { useWishlist } from "@/contexts/WishlistContext";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import BlogImage from "@/components/common/BlogImage/BlogImage";
import BannerCTA from "@/components/sections/BannerCTA/BannerCTA";
import { normalizeAmenityItems } from '@/lib/normalizeAmenityItems';
import { TOUR_IMAGE_PLACEHOLDER } from "@/lib/images/placeholders";
import BlogCard from "@/components/common/BlogCard/BlogCard";
import { buildBlogCardViewModels } from "@/lib/blog/cardViewModel";


interface DynamicBlogDetailsProps {
  blog: BlogPost;
  showSidebar?: 'left' | 'right' | 'none';
}

const DynamicBlogDetails: React.FC<DynamicBlogDetailsProps> = ({ 
  blog, 
  showSidebar = 'right' 
}) => {
  const { t, i18n } = useTranslation("blogs");
  const locale = (i18n.language || 'en');
  const blogsPath = `/${locale}/blogs`;

  const [scrollProgress, setScrollProgress] = useState(0);
  const [relatedTours, setRelatedTours] = useState<any[]>([]);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isVideoOpen, setVideoOpen] = useState(false);
  const [videoIds, setVideoIds] = useState<string[]>([]);
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = totalScroll / windowHeight;
      setScrollProgress(scroll);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch related tours
  useEffect(() => {
    let isMounted = true;

    const fetchSideData = async () => {
      try {
        // Related tours — use plain fetch (no auth token) for public endpoint
        const toursRes = await fetch(`${API_URL}/tours?limit=3&isActive=true&isFeatured=true`);
        if (isMounted && toursRes.ok) {
          const data = await toursRes.json();
          setRelatedTours(data.data?.slice(0, 3) || []);
        }
      } catch (e) {
        console.error('Failed to load related tours:', e);
      }
    };

    fetchSideData();
    return () => { isMounted = false; };
  }, [blog._id]);



  const { day, month } = formatBlogDate(blog.publishedAt || blog.createdAt, locale);

  /*
   * The byline box, read from the DATABASE — no hard-coded copy.
   *
   * This component used to carry its own EDITORIAL_AUTHOR constant: the house
   * author's name, role, bio and portrait alt, in all four languages, written
   * into the file. It was preferred over the API value for the default author,
   * so editing her in the database changed her author page and left every
   * article byline saying the old thing. That is exactly what happened when
   * her title was corrected: the profile page read "Travel Content Editor"
   * while all 23 articles still read "Travel Specialist", three clicks apart.
   *
   * One source now. `resolveBlogByline` already handles the name (including
   * the "Admin" account fallback), and the rest comes off the populated
   * author. An article whose author is not populated simply shows no box —
   * better than a box asserting details for a person the data does not name.
   */
  const selectedAuthor = blog.editorialAuthor;
  const byline = resolveBlogByline(blog, locale);
  const author = byline.name;
  const editorialAuthorHref = byline.link || `/${locale}/authors/${EDITORIAL_AUTHOR_SLUG}`;
  const authorRole = getLocalizedValue(selectedAuthor?.role, locale);
  const authorBio = getLocalizedValue(selectedAuthor?.bio, locale);

  /*
   * The byline avatar is `avatar`, NOT `image`.
   *
   * This box masks the picture to an 84px circle. `image` is the author page's
   * hero portrait — a 3:4 half-length shot — and a circle cut from the middle
   * of one leaves the subject small and off to the side. `avatar` is the tight
   * head-and-shoulders crop that reads at this size. The fallback chain still
   * ends at `image` so an author with a single photograph is not left blank.
   */
  const authorImage = selectedAuthor?.avatar?.url || selectedAuthor?.image?.url;
  const authorImageAlt =
    getLocalizedValue(selectedAuthor?.avatar?.alt || selectedAuthor?.image?.alt, locale) || author;

  const title = getLocalizedValue(blog.title, locale);
  const featuredImageUrl = typeof blog.featuredImage === 'string' ? blog.featuredImage : blog.featuredImage?.url;
  const featuredImageAlt = getLocalizedValue(typeof blog.featuredImage === 'object' ? blog.featuredImage?.alt : undefined, locale) || title;
  const featuredImageTitle = getLocalizedValue(typeof blog.featuredImage === 'object' ? blog.featuredImage?.title : undefined, locale) || featuredImageAlt;

  
  const approvedComments = blog.comments?.filter(c => c.isApproved) || [];

  /*
   * Per-language block visibility — one rule, no fallback to another language.
   *
   * A block renders in this locale when BOTH hold:
   *   1. its `languages` list allows the locale (absent/empty = every language),
   *   2. and, for text blocks, it actually has text in THIS locale.
   *
   * That is what makes a language-specific block possible: a sixth block written
   * only in German shows only to German readers, and an editor who deliberately
   * leaves a block empty in a language keeps it off that language's article.
   *
   * The old code had a second branch: if a locale had no text blocks of its own
   * it rendered ALL of them and let getLocalizedValue fall back to English. That
   * republished hidden blocks in the wrong language, so it is gone — a locale
   * with nothing of its own now has no article at all (the page 404s).
   */
  const allContentBlocks: any[] = blog.contentBlocks || [];
  const visibleContentBlocks = visibleBlocksFor(allContentBlocks, locale);

  const renderContentBlock = (block: any, index: number) => {
    const content = getLocalizedValue(block.content, locale);

    switch (block.type) {
      case 'html': {
        const cleanHtml = typeof content === 'string'
          ? content
              .replace(/&nbsp;/g, ' ')
              .replace(/ /g, ' ')
              .replace(/<span[^>]*class="ql-ui"[^>]*>\s*<\/span>/gi, '')
              .replace(/\s+data-list="[^"]*"/gi, '')
          : content;
        return (
          <div key={index} className='blog-details-card__text'>
            {block.title && <h2 className="blog-details-card__title">{getLocalizedValue(block.title, locale)}</h2>}
            <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
          </div>
        );
      }
      
      case 'imageRow': {
        const imageCount = block.images?.length || 0;
        const colClass = imageCount === 1 ? 'col-md-12' : 'col-md-6';
        // Single image gets full 16:9; side-by-side pair gets 4:3 to avoid being too wide/thin
        const imgAspectRatio = imageCount === 1 ? '16:9' : '4:3';

        return (
          <div key={index} className='blog-details__inner'>
            <div className='row gutter-y-30'>
              {block.images?.map((img: any, imgIndex: number) => {
                const imageAlt = getLocalizedValue(img.alt, locale) || 'Blog image';
                const imageTitle = getLocalizedValue(img.title, locale) || getLocalizedValue(img.alt, locale);

                return (
                  <div
                    className={colClass}
                    key={imgIndex}
                  >
                    <BlogImage
                      src={img.url}
                      alt={imageAlt}
                      title={imageTitle || undefined}
                      aspectRatio={imgAspectRatio}
                      fit="cover"
                      focus="center"
                      caption={getLocalizedValue(img.caption, locale) || undefined}
                    />
                  </div>
                );
              })}
            </div>
            {content && (
              <div className='blog-details__inner__content'>
                <p
                  className='blog-details__inner__text'
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            )}
          </div>
        );
      }

      
      case 'blockquote':
        // Check if this blockquote should be inside blog-details__inner__content (after imageRow)
        const prevBlock = index > 0 ? blog.contentBlocks[index - 1] : null;
        const isAfterImageRow = prevBlock?.type === 'imageRow';
        
        if (isAfterImageRow) {
          return (
            <div key={index} className='blog-details__inner__content'>
              <blockquote className='blog-details__inner__text-one'>
                {content}
                {block.image && (
                  <Image
                    className='blog-details__inner__image'
                    src={block.image}
                    alt='Quote'
                    width={50}
                    height={50}
                  />
                )}
              </blockquote>
            </div>
          );
        }
        
        return (
          <div key={index} className="blockquote-wrapper">
            {block.title && <h3 className="blog-details-card__content-title">{getLocalizedValue(block.title, locale)}</h3>}
            <blockquote className='blog-details__inner__text-one'>
              {content}
              {block.image && (
                <Image
                  className='blog-details__inner__image'
                  src={block.image}
                  alt='Quote'
                  width={50}
                  height={50}
                />
              )}
            </blockquote>
          </div>
        );

      
      case 'image':
        return (
          <div key={index} className='blog-details__inner__image'>
            <BlogImage
              src={block.url || ''}
              alt={getLocalizedValue(block.alt, locale) || 'Blog image'}
              title={(getLocalizedValue(block.title, locale) || getLocalizedValue(block.alt, locale)) || undefined}
              aspectRatio={block.aspectRatio || '16:9'}
              fit={block.fit || 'cover'}
              focus={block.focus || 'center'}
              caption={block.caption ? getLocalizedValue(block.caption, locale) : undefined}
            />
          </div>
        );

      
      default:
        return null;
    }
  };

  const TopSummary = () => {
    // New format: localized HTML (list items become the bullets).
    // Legacy format: array of bullet strings. Both normalize to items.
    const items = normalizeAmenityItems(getLocalizedValue(blog.summary, locale));

    if (items.length === 0) return null;

    return (
      <div className="blog-details__summary-list" style={{ backgroundColor: '#fff', borderRadius: '4px', height: '100%', padding: '0' }}>
        <h2 id="summary" style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1b4168', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
          <List size={20} color="#1b4168" />
          {t('summary')}
        </h2>
        <ul className="list-unstyled m-0">
          {items.map((item: string, idx: number) => (
            <li key={idx} className="d-flex align-items-start gap-3 mb-3" style={{ fontSize: '0.95rem', color: '#444', lineHeight: '1.6' }}>
              <div style={{ width: '6px', height: '6px', backgroundColor: '#1b4168', marginTop: '8px', flexShrink: 0 }}></div>
              <span dangerouslySetInnerHTML={{ __html: item }} />
            </li>
          ))}
        </ul>
      </div>
    );
  };
  const KeyTakeawaysSection = () => {
    const items = normalizeAmenityItems(getLocalizedValue(blog.keyTakeaways, locale));
    if (items.length === 0) return null;

    return (
      <div className="blog-details__key-takeaways mt-5 mb-5 p-4" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #b79c5c' }}>
        <h2 id="key-takeaways" className="mb-4 d-flex align-items-center gap-2" style={{ color: '#1d231f', fontSize: '24px', fontWeight: '700' }}>
          <CheckCircle size={24} color="#b79c5c" />
          {t('keyTakeaways') || 'Key Takeaways'}
        </h2>
        <ul className="list-unstyled m-0">
          {items.map((item: string, idx: number) => (
            <li key={idx} className="mb-3 d-flex align-items-start gap-3" style={{ fontSize: '1rem', color: '#444', lineHeight: '1.6' }}>
              <div style={{ width: '6px', height: '6px', backgroundColor: '#b79c5c', borderRadius: '50%', marginTop: '10px', flexShrink: 0 }}></div>
              <span dangerouslySetInnerHTML={{ __html: item }} />
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const BlogFAQs = () => {
    // Strict locale filter: only show rows where the active locale has BOTH question and answer.
    // No fallback to English — a German-only FAQ must not appear on the English page.
    const faqs = (blog.faqs || []).filter((faq: any) => {
      const q = faq.question?.[locale];
      const a = faq.answer?.[locale];
      const hasQ = q != null && (typeof q === 'string' ? q.trim().length > 0 : true);
      const hasA = a != null && (typeof a === 'string' ? a.trim().length > 0 : true);
      return hasQ && hasA;
    });
    if (faqs.length === 0) return null;

    return (
      <div className="blog-details__faq mt-5 pt-5 border-top">
        <div className="blog-faq-header mb-4">
          <div className="d-flex align-items-center gap-3 mb-2">
            <div className="blog-faq-icon-wrap">
              <HelpCircle size={22} />
            </div>
            <h2 id="blog-faq" className="blog-faq-title mb-0">{t('faq')}</h2>
          </div>
          <div className="blog-faq-divider" />
        </div>

        {/* The same list the tour page uses: one look for a question and its
            answer everywhere on the site, and one place to change it. */}
        <FaqAccordion
          idPrefix="blog-faq"
          items={faqs.map((faq: any) => ({
            question: faq.question?.[locale],
            answer: faq.answer?.[locale] || '',
          }))}
        />
      </div>
    );
  };

  const AboutAuthorSection = () => {
    // Nothing to say about the author: no box, rather than an empty shell.
    if (!authorBio && !authorRole) return null;

    return (
      <section className="blog-author-box mt-5" aria-labelledby="blog-author-title">
        {authorImage && (
          <Image
            src={authorImage}
            alt={authorImageAlt}
            width={84}
            height={84}
            className="blog-author-box__avatar"
          />
        )}
        <div className="blog-author-box__content">
          <h2 id="blog-author-title" className="blog-author-box__title">{t('aboutAuthor')}</h2>
          <h3 className="blog-author-box__name">
            <Link href={editorialAuthorHref} className="blog-author-box__name-link">
              {author}
            </Link>
          </h3>
          {authorRole && <p className="blog-author-box__role">{authorRole}</p>}
          {authorBio && <p className="blog-author-box__text">{authorBio}</p>}
        </div>
      </section>
    );
  };

  const RelatedPosts = () => {
    const manualRelated = Array.isArray(blog.relatedPosts) ? blog.relatedPosts : [];
    const uniqueManualRelated = manualRelated.filter((post: any, index: number, posts: any[]) => {
      const postKey = post?._id || post?.id || getLocalizedValue(post?.slug, locale);
      if (!postKey) return false;
      return posts.findIndex((item: any) => (item?._id || item?.id || getLocalizedValue(item?.slug, locale)) === postKey) === index;
    });
    // Drops anything with no slug in this language — a related article that
    // does not exist in German must not appear on the German page.
    const posts = buildBlogCardViewModels(uniqueManualRelated, locale);
    if (posts.length === 0) return null;

    // A plain div, not a Bootstrap <Col>. The scroller below is its own flex
    // container with its own track sizing, so `.col-md-4` only added a
    // competing `width: 33.33%` that happened to be overridden by whichever
    // stylesheet the bundler injected last.
    const postCards = posts.map((post) => (
      <div key={post.id} className='related-posts-scroll__item'>
        <BlogCard
          post={post}
          variant='bordered'
          // The track caps each card at 360px; the grid default asked the
          // browser for a third of the viewport.
          sizes='(max-width: 991px) 82vw, 360px'
        />
      </div>
    ));

    return (
      <div>
        <h2 className="post-article-section-title">
          {t('postArticleArticlesTitle', { defaultValue: 'Keep Exploring Egypt' })}
        </h2>
        <div className="related-posts-scroll">
          {postCards}
        </div>
      </div>
    );
  };

  const RelatedToursSection = () => {
    const manualRelatedTours = Array.isArray(blog.relatedTours) ? blog.relatedTours : [];
    const uniqueManualRelatedTours = manualRelatedTours.filter((tour: any, index: number, tours: any[]) => {
      const tourKey = tour?._id || tour?.id || getLocalizedValue(tour?.slug, locale);
      if (!tourKey) return false;
      return tours.findIndex((item: any) => (item?._id || item?.id || getLocalizedValue(item?.slug, locale)) === tourKey) === index;
    });
    const hasManualRelatedTours = uniqueManualRelatedTours.length > 0;
    const toursToRender = (hasManualRelatedTours ? uniqueManualRelatedTours : relatedTours)
      .filter((tour: any) => getStrictLocalizedSlug(tour?.slug, locale as SupportedLocale));
    if (toursToRender.length === 0) return null;

    const openVideoReviews = (slug: string) => {
      const tour = toursToRender.find((item: any) => getStrictLocalizedSlug(item.slug, locale as SupportedLocale) === slug);
      if (tour?.videoLink) {
        setVideoIds([tour.videoLink]);
        setVideoOpen(true);
      }
    };

    const tourCards = toursToRender.map((tour: any, idx: number) => {
      const galleryImages = [
        ...(tour.images || []).map((img: any) => img.url),
        ...(tour.gallery || []).map((img: any) => img.url),
      ].filter(Boolean);
      const uniqueImages = Array.from(new Set(galleryImages));
      const tourSlug = getStrictLocalizedSlug(tour.slug, locale as SupportedLocale);
      if (!tourSlug) return null;

      const item = {
        id: tour._id,
        slug: tourSlug,
        image: uniqueImages[0] || TOUR_IMAGE_PLACEHOLDER,
        imageAlt: getLocalizedValue(tour.images?.[0]?.alt || tour.gallery?.[0]?.alt, locale),
        allImages: uniqueImages.length > 0 ? uniqueImages : [TOUR_IMAGE_PLACEHOLDER],
        title: getLocalizedValue(tour.heading, locale) || getLocalizedValue(tour.name, locale),
        link: `/${locale}/${tourSlug}`,
        price: tour.priceStartingFrom || { USD: 0 },
        videoId: tour.videoLink || "",
        discount: "",
        // Same source as every other listing: the editor's card teaser, with
        // the overview text as the fallback.
        description:
          getLocalizedValue(tour.cardDescription, locale) ||
          getLocalizedValue(tour.Description?.text, locale) ||
          "",
        meta: [
          { id: 1, title: `${getLocalizedValue(tour.duration, locale) || '7 Days'}`, icon: "icon-clock" },
          { id: 3, title: getLocalizedValue(tour.tourLocation, locale) || 'Egypt', icon: "icon-location" },
        ],
      };

      // This handler plays `tour.videoLink`, not the review list, so that is
      // what decides whether the button can do anything at all.
      const card = (
        <TourCard
          item={item}
          toggleWishlist={toggleWishlist}
          isInWishlist={isInWishlist}
          openVideoReviews={tour.videoLink ? openVideoReviews : undefined}
        />
      );

      return hasManualRelatedTours ? (
        <div className="related-tours-scroll__item" key={tour._id || tour.id || item.link || idx}>
          {card}
        </div>
      ) : (
        <Col md={4} key={tour._id || tour.id || item.link || idx}>
          {card}
        </Col>
      );
    });

    return (
      <div>
        <h2 className="post-article-section-title">{t('postArticleRelatedToursTitle', { defaultValue: 'Explore Private Tours in Egypt' })}</h2>
        {hasManualRelatedTours ? (
          <div className="related-tours-scroll">
            {tourCards}
          </div>
        ) : (
          <Row className="gutter-y-30">
            {tourCards}
          </Row>
        )}
      </div>
    );
  };

  return (
    <section className='blog-details-page section-space' style={{ backgroundColor: '#fff' }}>
      {/* Reading Progress Bar */}
      <div 
        className="reading-progress-bar" 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: `${scrollProgress * 100}%`, 
          height: '4px', 
          backgroundColor: '#b79c5c', 
          zIndex: 9999,
          transition: 'width 0.1s ease-out'
        }} 
      />
      <Container>
        <Row className='justify-content-center'>
          {showSidebar === 'left' && (
            <Col lg={4}>
              <BlogSidebar />
            </Col>
          )}
          
          <Col lg={8}>
            <div className='blog-details'>
              {/* Blog Image */}
              <div className='blog-details-card'>
                <div className='blog-details-card__image'>
                  <Image 
                    src={featuredImageUrl || "https://placehold.co/1200x600?text=Image"} 
                    alt={featuredImageAlt}
                    title={featuredImageTitle}
                    width={1200}
                    height={600}
                    style={{ width: '100%', height: 'auto' }}
                    priority
                  />
                  <div className='blog-details-card__date'>
                    <span className='blog-details-card__date__day'>{day}</span>
                    <span className='blog-details-card__date__month'>{month}</span>
                  </div>
                </div>

                {/* Blog Content */}
                <div className='blog-details-card__content'>
                  {/* Article Meta Bar */}
                  <div className="blog-meta-bar">
                    <div className="blog-meta-bar__item">
                      <i className='icon-user' style={{ color: '#b79c5c' }}></i>
                      <span>
                        {t('by')}{" "}
                        <Link href={editorialAuthorHref} className="blog-meta-bar__author-link">
                          <strong>{author}</strong>
                        </Link>
                      </span>
                    </div>
                    <div className="blog-meta-bar__divider" />
                    <div className="blog-meta-bar__item">
                      <i className='icon-calendar' style={{ color: '#b79c5c' }}></i>
                      <span>{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    {approvedComments.length > 0 && (
                      <>
                        <div className="blog-meta-bar__divider" />
                        <div className="blog-meta-bar__item">
                          <i className='icon-massage' style={{ color: '#b79c5c' }}></i>
                          <span>{approvedComments.length} {t('comments')}</span>
                        </div>
                      </>
                    )}
                    {getLocalizedValue(blog.tags) && (getLocalizedValue(blog.tags) as any).length > 0 && (
                      <>
                        <div className="blog-meta-bar__divider" />
                        <div className="blog-meta-bar__item">
                          <i className='icon-price-tag' style={{ color: '#b79c5c' }}></i>
                          <span>{(getLocalizedValue(blog.tags) as any)[0]}</span>
                        </div>
                      </>
                    )}
                    {blog.updatedAt && (
                      <div className="blog-meta-bar__item ms-auto" style={{ fontSize: '0.8rem', color: '#aaa' }}>
                        <span>Updated: {new Date(blog.updatedAt).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}
                  </div>

                  {/* Title is rendered in the BlogHero component */}

                  <div id="blog-content">
                    {/* TOC & Summary Intro Layout */}
                    <div className="row mb-5">
                      <div className="col-lg-12">
                        <TopSummary />
                      </div>
                    </div>

                    {/* Render Content Blocks — strictly the current language's
                        own blocks when it has any (each language's body is
                        authored independently; e.g. a Spanish-only section
                        must not leak into the English page). Articles whose
                        text blocks lack this language entirely keep the
                        legacy fallback rendering. */}
                    <div className='blog-details-card__content__inner'>
                      {visibleContentBlocks.map((block, index) => renderContentBlock(block, index))}
                      <KeyTakeawaysSection />
                      <BlogFAQs />
                      <VideoModal 
                        isOpen={isVideoOpen} 
                        setOpen={setVideoOpen} 
                        ids={videoIds} 
                      />
                    </div>
                  </div>
                  <AboutAuthorSection />

                </div>
              </div>

              {/* Blog Tags */}
              {getLocalizedValue(blog.tags) && (getLocalizedValue(blog.tags) as any).length > 0 && (
                <div className='blog-details__meta'>
                  <div className='blog-details__categories'>
                    <h4 className='blog-details__meta__title'>{t('tags')}</h4>
                    <div className='blog-details__categories__box'>
                      {(getLocalizedValue(blog.tags) as string[]).map((tag, index) => (
                        <Link
                          // /blogs ignores ?tag= — /blogs/all is the filtering route.
                          href={`${blogsPath}/all?tag=${encodeURIComponent(tag)}`}
                          key={index}
                          className='blog-details__categories__btn gotur-btn'
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* Comments */}
              {blog.commentsEnabled && approvedComments.length > 0 && (
                <div className='comments-one'>
                  <h3 className='comments-one__title'>{t('comments')}</h3>
                  <ul className='list-unstyled comments-one__list'>
                    {approvedComments.map((comment) => (
                      <li
                        key={comment._id}
                        className='comments-one__card'
                      >
                        <div className='comments-one__card__image'>
                          <ReviewAvatar 
                            src={comment.avatar} 
                            name={comment.name}
                            width={80}
                            height={80}
                          />
                        </div>
                        <div className='comments-one__card__content'>
                          <div className='comments-one__card__top'>
                            <div className='comments-one__card__info'>
                              <h3 className='comments-one__card__title'>
                                {comment.name}
                              </h3>
                              <p className='comments-one__card__date'>
                                {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <p className='comments-one__card__text'>
                            {comment.text}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          </Col>
          
          {showSidebar === 'right' && (
            <Col lg={4}>
              <div className="blog-sidebar-wrapper">
                {/* Sticky Sidebar — TOC and Tags stay on screen as you scroll */}
                <div className="blog-toc-sticky">
                  <BlogTOC contentSelector="#blog-content" />
                  <div className="mt-4">
                    <BlogSidebar />
                  </div>
                </div>
              </div>
            </Col>
          )}
        </Row>
      </Container>

      <BannerCTA locale={locale} variant="blogArticle" />

      <div className="related-sections-wrapper" style={{ background: '#f9f9f9', marginTop: '80px', padding: '80px 0' }}>
        <Container>
          <RelatedToursSection />
          <div style={{ height: '60px' }} />
          <RelatedPosts />
        </Container>
      </div>

      <style jsx global>{`
        .blog-details-page {
          /* Was hardcoded to Inter, which bypassed the theme tokens entirely -
             blog articles rendered in a font the rest of the site never used. */
          font-family: var(--gotur-font, "Segoe UI"), system-ui, -apple-system, sans-serif;
        }

        .blog-author-box {
          display: flex;
          gap: 18px;
          align-items: flex-start;
          max-width: 900px;
          margin-left: auto;
          margin-right: auto;
          width: 100%;
          background: #fff;
          border: 1px solid rgba(23, 63, 99, 0.1);
          border-left: 4px solid #c7a24a;
          border-radius: 8px;
          box-shadow: 0 12px 30px rgba(15, 36, 51, 0.06);
          padding: 24px;
        }

        .blog-author-box__avatar {
          width: 84px;
          height: 84px;
          border-radius: 50%;
          object-fit: cover;
          object-position: center;
          border: 2px solid #c7a24a;
          flex-shrink: 0;
          display: block;
        }

        .blog-author-box__title {
          font-size: 0.75rem;
          font-weight: 600;
          color: #c7a24a;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin: 0 0 4px;
        }

        .blog-author-box__name {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f2433;
          line-height: 1.3;
          margin: 0 0 3px;
        }

        .blog-author-box__name-link,
        .blog-meta-bar__author-link {
          color: inherit;
          text-decoration: none;
        }

        .blog-author-box__name-link:hover,
        .blog-meta-bar__author-link:hover {
          color: inherit;
          text-decoration: underline;
        }

        .blog-author-box__role {
          font-size: 0.88rem;
          font-weight: 500;
          color: #173f63;
          margin: 0 0 10px;
        }

        .blog-author-box__text {
          font-size: 0.95rem;
          line-height: 1.7;
          color: #44515a;
          margin: 0;
        }

        .post-article-section-title {
          position: relative;
          margin: 0 0 48px;
          padding-bottom: 16px;
          font-size: clamp(2rem, 3vw, 2.45rem);
          font-weight: 800;
          color: #0f2433;
          line-height: 1.2;
          text-align: center;
        }

        .post-article-section-title::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: 0;
          width: 72px;
          height: 4px;
          background: #c7a24a;
          border-radius: 999px;
          transform: translateX(-50%);
        }

        .related-posts-scroll {
          display: flex;
          gap: 30px;
          overflow-x: auto;
          scroll-snap-type: x proximity;
          padding-bottom: 12px;
        }

        .related-tours-scroll {
          display: flex;
          gap: 30px;
          overflow-x: auto;
          scroll-snap-type: x proximity;
          padding-bottom: 12px;
        }

        .related-posts-scroll__item {
          flex: 0 0 min(360px, calc((100% - 60px) / 3));
          max-width: 360px;
          scroll-snap-align: start;
        }

        .related-tours-scroll__item {
          flex: 0 0 min(360px, calc((100% - 60px) / 3));
          max-width: 360px;
          scroll-snap-align: start;
        }

        @media (max-width: 991px) {
          .related-posts-scroll__item,
          .related-tours-scroll__item {
            flex-basis: min(320px, 82vw);
            max-width: min(320px, 82vw);
          }
        }

        @media (max-width: 575px) {
          .blog-author-box {
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 22px;
          }
        }

        @supports (overflow: clip) {
          html:has(.blog-details-page),
          body:has(.blog-details-page) {
            overflow-x: clip !important;
          }
        }

        @supports not (overflow: clip) {
          html:has(.blog-details-page),
          body:has(.blog-details-page) {
            overflow-x: visible !important;
          }
        }

        /* Professional Drop Cap */
        .blog-details-card__content__inner .blog-details-card__text:first-of-type p:first-of-type::first-letter {
          float: left;
          font-size: 4.5rem;
          line-height: 1;
          font-weight: 700;
          margin-right: 0.75rem;
          margin-top: 0.25rem;
          color: #b79c5c;
          text-transform: uppercase;
        }

        /* Improved Body Typography */
        .blog-details-card__text p {
          font-size: 1.15rem;
          line-height: 1.85;
          color: #2d3436;
          margin-bottom: 2rem;
          font-weight: 400;
          overflow-wrap: break-word;
        }

        /* ── Unordered lists ──────────────────────────── */
        .blog-details-card__text ul {
          list-style: none;
          padding-left: 0;
          margin: 0.8rem 0 1.8rem;
        }

        /* Hanging indent via an absolutely-positioned marker — NOT flex on the
           <li>. Flex would turn every inline run (text, <strong>, <a>) into a
           separate flex item that wraps on its own narrow column, shattering
           any line that mixes bold/links with plain text. */
        .blog-details-card__text ul > li {
          position: relative;
          padding-left: 17px;
          font-size: 1.08rem;
          line-height: 1.75;
          color: #2d3436;
          margin-bottom: 0.65rem;
          overflow-wrap: break-word;
        }

        .blog-details-card__text ul > li::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0.54em;
          width: 7px;
          height: 7px;
          background: #c7a24a;
          border-radius: 50%;
        }

        /* ── Ordered lists ───────────────────────────── */
        .blog-details-card__text ol {
          list-style: none;
          padding-left: 0;
          margin: 0.8rem 0 1.8rem;
          counter-reset: article-list;
        }

        .blog-details-card__text ol > li {
          position: relative;
          padding-left: calc(1.6em + 10px);
          font-size: 1.08rem;
          line-height: 1.75;
          color: #2d3436;
          margin-bottom: 0.65rem;
          counter-increment: article-list;
          overflow-wrap: break-word;
        }

        .blog-details-card__text ol > li::before {
          content: counter(article-list) ".";
          position: absolute;
          left: 0;
          top: 0;
          min-width: 1.6em;
          font-weight: 700;
          font-size: 0.95em;
          color: #c7a24a;
          line-height: 1.75;
        }

        /* ── Nested lists second level ───────────────── */
        .blog-details-card__text ul ul,
        .blog-details-card__text ol ul {
          margin: 0.5rem 0 0.5rem 0.5rem;
        }

        .blog-details-card__text ul ul > li::before {
          width: 5px;
          height: 5px;
          background: transparent;
          border: 1.5px solid #c7a24a;
          top: 0.58em;
        }

        .blog-details-page .blog-details-card__content__inner .blog-details-card__text h2.blog-details-card__title {
          display: block;
          font-size: 32px;
          font-weight: 800;
          color: #0f2942;
          line-height: 1.25;
          letter-spacing: -0.02em;
          margin-top: 3.5rem;
          margin-bottom: 1.25rem;
          position: relative;
        }

        .blog-details-page .blog-details-card__content__inner .blog-details-card__text h2.blog-details-card__title::after {
          content: "";
          display: block;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, #c7a24a 0%, rgba(199, 162, 74, 0.2) 60%, transparent 100%);
          border-radius: 999px;
          margin-top: 12px;
        }

        .blog-details-card__text h3 {
          position: relative;
          font-size: 21px;
          font-weight: 700;
          color: #173f63;
          line-height: 1.35;
          margin-top: 40px;
          margin-bottom: 14px;
          padding-left: 16px;
        }

        .blog-details-card__text h3::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0.22em;
          width: 4px;
          height: 1.2em;
          background: #c7a24a;
          border-radius: 999px;
        }

        /* Elegant Pull Quotes */
        .blog-details__inner__text-one {
          font-style: italic;
          font-size: 1.4rem !important;
          background-color: #fdfaf3 !important;
          border-left: 6px solid #b79c5c !important;
          position: relative;
          padding: 3rem 3rem 3rem 4.5rem !important;
          margin: 3rem 0 !important;
          border-radius: 0 12px 12px 0 !important;
          color: #1d231f !important;
          line-height: 1.6 !important;
          box-shadow: 0 10px 30px rgba(183, 156, 92, 0.05);
        }
        
        .blog-details__inner__text-one::before {
          content: '“';
          position: absolute;
          top: -10px;
          left: 15px;
          font-size: 6rem;
          color: rgba(183, 156, 92, 0.15);
          font-family: var(--gotur-display-font, Georgia), "Times New Roman", serif;
        }

        /* Section Header Polish */
        .blog-details-card__title {
          letter-spacing: -0.02em;
          position: relative;
          display: inline-block;
        }

        /* Content spacing */
        .blog-details-card__content__inner {
          max-width: 900px;
          margin: 0 auto;
        }

        /* Image Polish */
        .blog-details__inner__image {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 15px 45px rgba(0,0,0,0.08);
          margin: 2.5rem 0;
        }

        .blog-details__inner__caption {
          text-align: center;
          font-size: 0.9rem;
          color: #888;
          margin-top: 0.75rem;
          font-style: italic;
        }
        /* Blog Meta Bar */
        .blog-meta-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px 0;
          padding: 13px 20px;
          background: #fdfaf3;
          border: 1px solid #e8e0d0;
          border-radius: 10px;
          margin-bottom: 30px;
          font-size: 0.875rem;
          color: #555;
        }

        .blog-meta-bar__item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 14px;
        }

        .blog-meta-bar__item:first-child { padding-left: 0; }

        .blog-meta-bar__divider {
          width: 1px;
          height: 16px;
          background: #ddd;
          flex-shrink: 0;
        }


        /* Featured image hero polish */
        .blog-details-card__image {
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.12);
          margin-bottom: 36px;
        }
        /* Sidebar wrapper */
        .blog-sidebar-wrapper {
          position: relative;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        /* Mobile/tablet: TOC flows normally in the document */
        .blog-toc-sticky {
          position: relative;
        }

        /* Desktop: TOC sticks as the reader scrolls */
        @media (min-width: 992px) {
          .blog-toc-sticky {
            position: -webkit-sticky;
            position: sticky;
            top: 125px;
            z-index: 100;
            max-height: calc(100vh - 145px);
            overflow-y: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            transition: top 0.3s ease;
          }
          .blog-toc-sticky::-webkit-scrollbar {
            display: none;
          }
        }

        /* ── Blog FAQ ──────────────────────────────────────────── */
        .blog-faq-icon-wrap {
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, rgba(183,156,92,0.13), rgba(183,156,92,0.07));
          border: 1.5px solid rgba(183,156,92,0.3);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #b79c5c;
          flex-shrink: 0;
        }

        .blog-faq-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1d231f;
          letter-spacing: -0.02em;
        }

        .blog-faq-divider {
          height: 3px;
          width: 56px;
          background: linear-gradient(90deg, #b79c5c, transparent);
          border-radius: 2px;
          margin-top: 10px;
          margin-left: 54px;
        }

        /* Wider container — scoped only to the blog detail page */
        @media (min-width: 1200px) {
          .blog-details-page .container {
            max-width: 1320px;
          }
        }

        @media (min-width: 1440px) {
          .blog-details-page .container {
            max-width: 1360px;
          }
        }
      `}</style>
    </section>
  );
};

export default DynamicBlogDetails;
