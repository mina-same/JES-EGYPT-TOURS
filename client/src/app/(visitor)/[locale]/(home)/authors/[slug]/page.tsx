import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Col, Container, Row } from 'react-bootstrap';
import { API_URL } from '@/config/api';
import { getLocalizedValue } from '@/lib/localize';
import TopbarOne from '@/components/common/TopbarOne/TopbarOne';
import HeaderOne from '@/components/layout/HeaderOne/HeaderOne';
import HeaderOneCloned from '@/components/layout/HeaderOneCloned/HeaderOneCloned';
import Layout from '@/components/layout/Layout/Layout';
import PageHeader from '@/components/sections/PageHeader/PageHeader';
import FooterOne from '@/components/layout/FooterOne/FooterOne';
import DynamicBlogGrid from '@/components/sections/DynamicBlogGrid/DynamicBlogGrid';
import type { BlogPost } from '@/lib/api/blog';
import { getStrictLocalizedSlug, type SupportedLocale } from '@/lib/url';

export default async function EditorialAuthorPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const response = await fetch(`${API_URL}/blog/authors/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
    headers: { 'X-Locale': locale },
  });
  if (!response.ok) notFound();
  const payload = await response.json();
  const author = payload.data;
  const articles: BlogPost[] = Array.isArray(author.articles) ? author.articles : [];
  const visibleArticles = articles
    .filter((article) => getStrictLocalizedSlug(article.slug, locale as SupportedLocale))
    .slice(0, 4);
  const role = getLocalizedValue(author.role, locale);
  const bio = getLocalizedValue(author.bio, locale);
  const imageAlt = getLocalizedValue(author.image?.alt, locale) || author.name;

  return (
    <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <PageHeader title={author.name} subTitle={role} breadcrumbs={[{ label: 'Authors' }]} alt={imageAlt} />
      <section className="section-space">
        <Container>
          <Row className="align-items-center justify-content-center gutter-y-40">
            <Col lg={4} md={5}>
              <Image src={author.image.url} alt={imageAlt} width={520} height={520} className="w-100 rounded-4 object-fit-cover" />
            </Col>
            <Col lg={7} md={7}>
              <span className="sec-title__tagline">{role}</span>
              <h1 className="sec-title__title mb-4">{author.name}</h1>
              <p className="mb-4">{bio}</p>
              <Link href={`/${locale}/blogs`} className="gotur-btn gotur-btn--base">
                Browse travel articles <span className="icon"><i className="icon-right" /></span>
              </Link>
            </Col>
          </Row>
        </Container>
      </section>
      {visibleArticles.length > 0 && (
        <section className="section-space">
          <Container>
            <div className="section-title text-center mb-5">
              <span className="section-title__tagline">Related content</span>
              <h2 className="section-title__title">Articles by {author.name}</h2>
            </div>
            <DynamicBlogGrid
              blogs={visibleArticles}
              basePath={`/${locale}/authors/${slug}`}
              variant="featured"
            />
          </Container>
        </section>
      )}
      <FooterOne />
    </Layout>
  );
}
