'use client';
import React, { useMemo } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '@/lib/localize';
import { formatBlogDate } from '@/lib/api/blog';

interface ListingBlogsProps {
  blogs?: any[];
  title?: string;
  sectionTitle?: any;
  locale: string;
}

const ListingBlogs: React.FC<ListingBlogsProps> = ({ blogs, title, sectionTitle, locale }) => {
  const { t } = useTranslation('blogs');

  const viewModel = useMemo(() => {
    if (!blogs || !Array.isArray(blogs)) return [];
    return blogs.slice(0, 3).map((post) => {
      const { day, month } = formatBlogDate(post.publishedAt || post.createdAt);
      const image = typeof post.featuredImage === 'string' ? post.featuredImage : post.featuredImage?.url || 'https://placehold.co/600x400?text=Image';
      const authorName = post.author && typeof post.author === 'object' ? (post.author as any).name || 'Admin' : 'Admin';
      const localizedTags = getLocalizedValue(post.tags, locale);
      const category = Array.isArray(localizedTags) && localizedTags.length > 0 ? localizedTags[0] : '';
      const slug = getLocalizedValue(post.slug, locale);

      return {
        id: post._id,
        title: getLocalizedValue(post.title, locale),
        image,
        day,
        month,
        author: authorName,
        category,
        link: `/blogs/${slug}`,
      };
    });
  }, [blogs, locale]);

  if (!blogs || blogs.length === 0) return null;

  const displayTitle = sectionTitle && getLocalizedValue(sectionTitle, locale)
    ? getLocalizedValue(sectionTitle, locale)
    : (title || t('ourLatestNews'));

  return (
    <section className="blog-two section-space">
      <Container>
        <div className="sec-title text-center mb-5">
          <span className="sec-title__tagline">{t('blogTagline')}</span>
          <h2 className="sec-title__title">{displayTitle}</h2>
        </div>
        <Row className="gutter-y-30">
          {viewModel.map((post, idx) => (
            <Col lg={4} md={6} key={post.id}>
              <div
                className='blog-card-two blog-card-two--one wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay={`${100 * (idx + 1)}ms`}
              >
                <div className='blog-card-two__image'>
                  <Image
                    src={post.image}
                    alt={post.title || "Blog post image"}
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
                      <Link href={post.link}>
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
            </Col>
          ))}
        </Row>
      </Container>
      <style jsx global>{`
        @media (max-width: 991px) {
          .blog-card-two { margin-bottom: 20px; }
          .sec-title__title { font-size: 28px !important; }
          .section-space { padding: 40px 0; }
        }
      `}</style>
    </section>
  );
};

export default ListingBlogs;
