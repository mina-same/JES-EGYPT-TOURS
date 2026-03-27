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
    <section className="section-space">
      <Container>
        <div className="sec-title text-center mb-5">
          <h6 className="sec-title__tagline">{t('blogAndNews')}</h6>
          <h3 className="sec-title__title">{displayTitle}</h3>
        </div>
        <Row className="gutter-y-30">
          {viewModel.map((post, idx) => (
            <Col lg={4} md={6} key={post.id}>
              <div className="blog-card rounded-4 overflow-hidden border shadow-sm hover:translate-y-[-10px] transition-all duration-300 bg-white">
                <div className="relative h-60 w-full overflow-hidden">
                  <Image 
                    src={post.image} 
                    alt={post.title} 
                    fill 
                    className="object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 bg-[#b79c5c] text-white px-3 py-1 rounded-lg text-center font-bold">
                    <span className="block text-xl leading-none">{post.day}</span>
                    <span className="text-xs uppercase">{post.month}</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1 font-semibold uppercase">{post.category}</span>
                    <span className="flex items-center gap-1">by {post.author}</span>
                  </div>
                  <h4 className="text-xl font-bold mb-4 leading-tight group-hover:text-[#b79c5c] transition-colors line-clamp-2" style={{ minHeight: 48 }}>
                    <Link href={post.link}>{post.title}</Link>
                  </h4>
                  <Link href={post.link} className="inline-flex items-center gap-2 font-bold text-[#b79c5c] text-sm hover:underline uppercase tracking-wider">
                    {t('readMore')} <span className="icon-arrow-right"></span>
                  </Link>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default ListingBlogs;
