'use client';
import React from 'react';
import { Row, Col, Container } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { getLocalizedStaticSlug } from '@/lib/url';
import { getLocalizedValue } from '@/lib/localize';
import Image from 'next/image';
import Link from 'next/link';
import faqSidebarImage from "@/assets/images/resources/faq-sidebar.png";
import FaqAccordion from '@/components/common/Faq/FaqAccordion';
import { listingFaqContent } from '@/lib/faqContent';
import { buildFaqPageJsonLd } from '@/lib/seo/pageJsonLd';
import { serializeJsonLd } from '@/lib/seo/serializeJsonLd';
import './ListingSections.css';

interface FAQ {
  question: any;
  answer: any;
}

interface ListingFaqsProps {
  faqs?: FAQ[];
  title?: string;
  sectionTitle?: any;
  locale: string;
  style?: React.CSSProperties;
  /**
   * `@id` for a FAQPage built from exactly the rows shown here
   * (`<page url>#faq`). No FAQPage is printed when it is not given.
   */
  schemaId?: string;
}

const ListingFaqs: React.FC<ListingFaqsProps> = ({ faqs, title, sectionTitle, locale, style, schemaId }) => {
  const { t } = useTranslation('faq');

  if (!faqs || faqs.length === 0) return null;

  // The rows the accordion shows. The FAQPage below is built from the same
  // array, so the schema cannot list a row the visitor does not see.
  const items = listingFaqContent(faqs, locale);
  const faqJsonLd = schemaId ? buildFaqPageJsonLd({ id: schemaId, locale, faqs: items }) : null;

  const displayTitle = sectionTitle && getLocalizedValue(sectionTitle, locale)
    ? getLocalizedValue(sectionTitle, locale)
    : (title || t('sectionTitle'));
  const sidebarImageLabel = t('sidebarTitle');

  return (
    <>
    {faqJsonLd && (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd) }}
      />
    )}
    <section className="faq-page section-space-top section-space-bottom listing-faqs" style={style}>
      <Container>
        <div className="sec-title text-center mb-5">
          <h2 className="sec-title__title">{displayTitle}</h2>
        </div>

        <Row className='gutter-y-30'>
          <Col lg={4}>
            <div className='faq-page__sidebar'>
              <div className='faq-page__sidebar__item'>
                <div className='faq-page__sidebar__cta'>
                  <Image src={faqSidebarImage} alt={sidebarImageLabel} title={sidebarImageLabel} />
                  <div className='faq-page__sidebar__cta__content'>
                    <span className='faq-page__sidebar__sub-title'>
                      {t('sectionSubTitle')}
                    </span>
                    <span className='faq-page__sidebar__title'>
                      {t('anyQuestions', { defaultValue: 'Any Questions?' })}
                    </span>
                    <Link href={`/${locale}/${getLocalizedStaticSlug("contact", locale)}`} className="gotur-btn">
                      {t('contactUs', { defaultValue: 'Contact Us' })}
                      <span className="icon">
                        <i className="icon-right-arrow"></i>
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Col>

          <Col lg={8}>
            <div className="faq-accordion mx-auto">
              {/* The shared `.faq-list` treatment -- the same one the tour page
                  and /faq use. All three carried identical copies of a theme
                  accordion wrapped in inline styles before. */}
              {/* One shared list, styled in custom.css. */}
              {/* Strict locale lookup, no fallback to English: a German-only
                  FAQ must not appear on the English page (lib/faqContent). */}
              <FaqAccordion
                idPrefix="listing-faq"
                items={items}
              />
            </div>
          </Col>
        </Row>
      </Container>
    </section>
    </>
  );
};

export default ListingFaqs;
