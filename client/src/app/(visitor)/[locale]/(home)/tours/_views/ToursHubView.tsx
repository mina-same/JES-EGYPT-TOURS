'use client';
import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getLocalizedValue } from "@/lib/localize";
import { getDisplayName } from "@/lib/displayName";
import { getStrictLocalizedSlug, type SupportedLocale } from "@/lib/url";
import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import { TOUR_IMAGE_PLACEHOLDER } from "@/lib/images/placeholders";

export interface CategoryWithSubcategories {
  _id: string;
  name: any;
  slug: any;
  image?: { url: string; alt: string };
  description?: any;
  subcategories: any[];
}

/**
 * The presentation half of /tours. Categories arrive with the HTML from the
 * server component, so the directory is in the markup on first byte instead of
 * appearing after an effect. The headings used to be hardcoded English on a
 * page served in four languages; they now come from the `tours` namespace.
 */
export default function ToursHubView({
  categories,
  locale,
}: {
  categories: CategoryWithSubcategories[];
  locale: string;
}) {
  const { t } = useTranslation('tours');

  return (
    <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <PageHeader
        title={t('categoriesTitle')}
        subTitle={t('categoriesSubtitle')}
        breadcrumbs={[]}
      />
      
      <section className="category-directory section-space">
        <Container>
          <div className="section-title text-center mb-5">
            <span className="section-title__tagline">{t('categoriesTagline')}</span>
            <h2 className="section-title__title">{t('categoriesHeading')}</h2>
          </div>

          <Row className="gutter-y-40">
            {categories.map((category) => {
              const catSlug = getStrictLocalizedSlug(category.slug, locale as SupportedLocale) || "";
              const catName = getDisplayName(category, locale);
              return (
              <Col lg={4} md={6} key={category._id} className="wow fadeInUp" data-wow-delay="100ms">
                <div className="category-card-premium">
                  <div className="category-card-premium__image-wrapper">
                    <Image
                      src={category.image?.url || TOUR_IMAGE_PLACEHOLDER}
                      alt={getLocalizedValue(category.name, locale)}
                      fill
                      className="category-card-premium__image"
                    />
                    <div className="category-card-premium__overlay" />
                    <div className="category-card-premium__content">
                      <div className="category-card-premium__badge">
                        {category.subcategories.length} Sub-destinations
                      </div>
                      <h3 className="category-card-premium__title">
                        {catSlug ? (
                          <Link href={`/${locale}/${catSlug}`}>{catName}</Link>
                        ) : (
                          <span>{catName}</span>
                        )}
                      </h3>
                      {catSlug && (
                        <Link href={`/${locale}/${catSlug}`} className="category-card-premium__link">
                          View All Tours <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="category-card-premium__subcategories">
                    <h4 className="category-card-premium__sub-title">Popular in {catName}</h4>
                    <ul className="category-card-premium__list">
                      {category.subcategories.slice(0, 5).map((sub) => {
                        const subSlug = getStrictLocalizedSlug(sub.slug, locale as SupportedLocale) || "";
                        const subName = getDisplayName(sub, locale);
                        return (
                        <li key={sub._id}>
                          {subSlug ? (
                            <Link href={`/${locale}/${subSlug}`} className="flex items-center gap-2">
                               <MapPin className="w-3 h-3 text-primary" />
                               {subName}
                            </Link>
                          ) : (
                            <span className="flex items-center gap-2">
                               <MapPin className="w-3 h-3 text-primary" />
                               {subName}
                            </span>
                          )}
                        </li>
                        );
                      })}
                      {category.subcategories.length > 5 && catSlug && (
                        <li className="more-link">
                           <Link href={`/${locale}/${catSlug}`}>+ {category.subcategories.length - 5} more</Link>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </Col>
              );
            })}
          </Row>

          <div className="text-center mt-5">
            <Link href={`/${locale}/tours/all`} className="gotur-btn">
               View All Tours
               <span className="icon"><i className="icon-right"></i></span>
            </Link>
          </div>
        </Container>
      </section>

      <style jsx global>{`
        .category-card-premium {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .category-card-premium:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .category-card-premium__image-wrapper {
          position: relative;
          height: 240px;
          width: 100%;
        }

        .category-card-premium__image {
          object-cover: cover;
        }

        .category-card-premium__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, transparent 100%);
        }

        .category-card-premium__content {
          position: absolute;
          bottom: 0;
          left: 0;
          padding: 20px;
          color: white;
          width: 100%;
        }

        .category-card-premium__badge {
          display: inline-block;
          background: var(--gotur-primary, #b79c5c);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .category-card-premium__title {
          font-size: 24px;
          margin-bottom: 8px;
          font-weight: 700;
        }

        .category-card-premium__title a {
          color: white;
          text-decoration: none;
        }

        .category-card-premium__link {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          color: rgba(255,255,255,0.8);
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s;
        }

        .category-card-premium__link:hover {
          color: white;
        }

        .category-card-premium__subcategories {
          padding: 24px;
          background: white;
          flex-grow: 1;
        }

        .category-card-premium__sub-title {
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          color: #888;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
        }

        .category-card-premium__list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .category-card-premium__list li a {
          font-size: 15px;
          color: #444;
          text-decoration: none;
          transition: color 0.2s;
          font-weight: 500;
        }

        .category-card-premium__list li a:hover {
          color: var(--gotur-primary, #b79c5c);
        }

        .more-link a {
          font-size: 13px !important;
          color: #b79c5c !important;
          font-weight: 700 !important;
        }
      `}</style>

      <FooterOne />
    </Layout>
  );
}
