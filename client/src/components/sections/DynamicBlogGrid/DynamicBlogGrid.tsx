"use client";

import { BlogPost, PaginationData, formatBlogDate } from "@/lib/api/blog";
import Image from "next/image";
import { Col, Container, Row } from "react-bootstrap";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getLocalizedValue } from "@/lib/localize";
import { useTranslation } from "react-i18next";

interface DynamicBlogGridProps {
  blogs: BlogPost[];
  pagination?: PaginationData;
  basePath: string;
  variant?: 'standard' | 'featured';
}

function getStrictLocalizedSlug(slugValue: any, locale: string): string | null {
  if (!slugValue) return null;

  if (typeof slugValue === "string") {
    const trimmed = slugValue.trim();
    return locale === "en" && trimmed ? trimmed : null;
  }

  if (typeof slugValue !== "object") return null;

  const value = slugValue[locale];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

const DynamicBlogGrid: React.FC<DynamicBlogGridProps> = ({ blogs, pagination, basePath, variant = 'standard' }) => {
  const router = useRouter();
  const { t, i18n } = useTranslation('blogs');
  const currentLocale = i18n.language || 'en';
  const renderableBlogs = blogs.filter((post) => getStrictLocalizedSlug(post.slug, currentLocale));

  const handlePageChange = (page: number) => {
    const separator = basePath.includes("?") ? "&" : "?";
    router.push(`${basePath}${separator}page=${page}`);
  };

  if (variant === 'featured') {
    return (
      <Row className='gutter-y-20'>
        {renderableBlogs.map((post, index) => {
          const { day, month } = formatBlogDate(post.publishedAt || post.createdAt);
          const imageUrl = typeof post.featuredImage === 'string' ? post.featuredImage : post.featuredImage?.url;
          const imageAlt = typeof post.featuredImage === 'object' && post.featuredImage?.alt
            ? getLocalizedValue(post.featuredImage.alt, currentLocale)
            : getLocalizedValue(post.title, currentLocale);
          const imageTitle = typeof post.featuredImage === 'object' && post.featuredImage?.title
            ? getLocalizedValue(post.featuredImage.title, currentLocale)
            : imageAlt;
          
          const blogSlug = getStrictLocalizedSlug(post.slug, currentLocale);
          if (!blogSlug) return null;
          const blogUrl = `/${currentLocale}/${blogSlug}`;

          return (
            <Col lg={3} md={6} key={post._id}>
              <Link href={blogUrl} className="group block no-underline">
                <div 
                  className='relative transition-all duration-500'
                  data-wow-duration='1500ms'
                  data-wow-delay={`${100 * (index + 1)}ms`}
                >
                  {/* Clean Image Container */}
                  <div className='relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-3'>
                    <Image 
                      src={imageUrl || "https://placehold.co/600x400?text=Image"} 
                      alt={imageAlt}
                      title={imageTitle}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                  </div>

                  {/* Minimal Content */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                       <span className="text-[9px] font-black text-[#b79c5c] uppercase tracking-widest">{day} {month}</span>
                    </div>
                    <h3 className='text-sm font-bold text-[#1d231f] group-hover:text-[#b79c5c] transition-colors duration-300 leading-tight line-clamp-2'>
                      {getLocalizedValue(post.title, currentLocale)}
                    </h3>
                  </div>
                </div>
              </Link>
            </Col>
          );
        })}
      </Row>
    );
  }

  return (
    <section className='blog-page'>
      <Container>
        <Row className='gutter-y-30'>
          {renderableBlogs.map((post, index) => {
            const { day, month } = formatBlogDate(post.publishedAt || post.createdAt);
            const imageUrl = typeof post.featuredImage === 'string' ? post.featuredImage : post.featuredImage?.url;
            const imageAlt = typeof post.featuredImage === 'object' && post.featuredImage?.alt
              ? getLocalizedValue(post.featuredImage.alt, currentLocale)
              : getLocalizedValue(post.title, currentLocale);
            const imageTitle = typeof post.featuredImage === 'object' && post.featuredImage?.title
              ? getLocalizedValue(post.featuredImage.title, currentLocale)
              : imageAlt;

            const authorName =
              post.author && typeof post.author === 'object'
                ? (post.author as any).name || 'Admin'
                : 'Admin';
            
            // Build blog URL using localized slug
            const blogSlug = getStrictLocalizedSlug(post.slug, currentLocale);
            if (!blogSlug) return null;
            const blogUrl = `/${currentLocale}/${blogSlug}`;

            return (
              <Col lg={4} md={6} key={post._id}>
                <div
                  className='blog-card wow fadeInUp'
                  data-wow-duration='1500ms'
                  data-wow-delay={`${100 * (index + 1)}ms`}
                >
                  <div className='blog-card__image'>
                    <div className="relative w-full" style={{ height: '250px' }}>
                      <Image 
                        src={imageUrl || "https://placehold.co/600x400?text=Image"} 
                        alt={imageAlt}
                        title={imageTitle}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <Link href={blogUrl} className='blog-card-two__image__link'>
                      <span className='sr-only'>{getLocalizedValue(post.title, currentLocale)}</span>
                    </Link>

                  </div>
                  <div className='blog-card__content'>
                    <div className='blog-card__content__top'>
                      <div className='blog-card__date'>
                        <span className='blog-card__date__day'>{day}</span>
                        <span className='blog-card__date__month'>{month}</span>
                      </div>
                      <ul className='list-unstyled blog-card__meta'>
                        <li>
                          <Link href={blogUrl}>
                            <span className='blog-card__meta__icon'>
                              <i className='icon-user'></i>
                            </span>
                            {t('by')} {authorName}
                          </Link>
                        </li>
                        {post.tags && (getLocalizedValue(post.tags, currentLocale) as string[]).length > 0 && (
                          <li>
                            <Link href={blogUrl}>
                              <span className='blog-card__meta__icon'>
                                <i className='icon-price-tag'></i>
                              </span>
                              {(getLocalizedValue(post.tags, currentLocale) as string[])[0]}
                            </Link>
                          </li>
                        )}

                      </ul>
                    </div>
                    <h3 className='blog-card__title'>
                      <Link href={blogUrl}>{getLocalizedValue(post.title, currentLocale)}</Link>
                    </h3>
                    {post.excerpt && (
                      <p 
                        className='blog-card__text' 
                        style={{ 
                          display: '-webkit-box', 
                          WebkitLineClamp: 2, 
                          WebkitBoxOrient: 'vertical', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          minHeight: '48px' 
                        }}
                      >
                        {getLocalizedValue(post.excerpt, currentLocale)}
                      </p>
                    )}

                    <Link href={blogUrl} className='blog-card__content__btn'>
                      {t('readMore', { defaultValue: 'Read More' })} <i className='icon-arrow-right'></i>
                    </Link>
                  </div>
                </div>
              </Col>
            );
          })}
          
          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <Col lg={12}>
              <ul className='list-unstyled pagination justify-content-center'>
                {/* Previous Button */}
                <li className={pagination.page === 1 ? 'disabled' : ''}>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className='page-link'
                  >
                    <i className='icon-arrow-left'></i>
                  </button>
                </li>

                {/* Page Numbers */}
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((pageNum) => (
                  <li key={pageNum} className={pagination.page === pageNum ? 'active' : ''}>
                    <button
                      onClick={() => handlePageChange(pageNum)}
                      className='page-link'
                    >
                      {pageNum}
                    </button>
                  </li>
                ))}

                {/* Next Button */}
                <li className={pagination.page === pagination.pages ? 'disabled' : ''}>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className='page-link'
                  >
                    <i className='icon-arrow-right'></i>
                  </button>
                </li>
              </ul>
            </Col>
          )}
        </Row>
      </Container>
    </section>
  );
};

export default DynamicBlogGrid;
