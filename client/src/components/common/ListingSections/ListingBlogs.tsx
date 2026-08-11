'use client';
import React, { useMemo } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '@/lib/localize';
import BlogCard from '@/components/common/BlogCard/BlogCard';
import { buildBlogCardViewModels } from '@/lib/blog/cardViewModel';

interface ListingBlogsProps {
  blogs?: any[];
  title?: string;
  sectionTitle?: any;
  locale: string;
}

/** The section is a teaser beside other content, not a listing page. */
const MAX_CARDS = 3;

const ListingBlogs: React.FC<ListingBlogsProps> = ({ blogs, title, sectionTitle, locale }) => {
  const { t } = useTranslation('blogs');

  const cards = useMemo(
    () => buildBlogCardViewModels(blogs, locale, MAX_CARDS),
    [blogs, locale]
  );

  if (cards.length === 0) return null;

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
          {cards.map((post, index) => (
            <Col lg={4} md={6} key={post.id}>
              <BlogCard post={post} variant='feature' index={index} showExcerpt />
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
