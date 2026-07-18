'use client';
import React, { useState } from 'react';
import { Row, Col, Container, Accordion } from 'react-bootstrap';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLocalizedStaticSlug } from '@/lib/url';
import { getLocalizedValue } from '@/lib/localize';
import Image from 'next/image';
import Link from 'next/link';
import faqSidebarImage from "@/assets/images/resources/faq-sidebar.png";

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
}

const ListingFaqs: React.FC<ListingFaqsProps> = ({ faqs, title, sectionTitle, locale, style }) => {
  const { t } = useTranslation('faq');
  const [activeKey, setActiveKey] = useState<string | null>("0");

  if (!faqs || faqs.length === 0) return null;

  const displayTitle = sectionTitle && getLocalizedValue(sectionTitle, locale)
    ? getLocalizedValue(sectionTitle, locale)
    : (title || t('sectionTitle'));
  const sidebarImageLabel = t('sidebarTitle');

  return (
    <section className="faq-page section-space-top section-space-bottom" style={style}>
      <Container>
        <div className="sec-title text-center mb-5">
          <h2 className="sec-title__title">{displayTitle}</h2>
        </div>

        <Row className='gutter-y-30'>
          <Col lg={4}>
            <div className='faq-page__sidebar'>
              <div
                className='faq-page__sidebar__item wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='300ms'
              >
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
              <Accordion
                activeKey={activeKey ?? undefined}
                onSelect={(eventKey) => setActiveKey(eventKey as string | null)}
                className="wow fadeInUp"
                data-wow-duration="1500ms"
              >
                {faqs.map((faq, idx) => {
                  const eventKey = idx.toString();
                  const isOpen = activeKey === eventKey;
                  // Strict locale lookup — no fallback to English.
                  // A German-only FAQ must not appear on the English or Italian page.
                  const question = faq.question?.[locale] || '';
                  const answer   = faq.answer?.[locale]   || '';

                  if (!question || !answer) return null;

                  return (
                    <Accordion.Item eventKey={eventKey} key={idx}>
                      <div className="accordion-header">
                        <Accordion.Button className="bg-transparent border-0 w-100 shadow-none p-0">
                          <div className="faq-header-content d-flex align-items-center gap-3 w-100" style={{ padding: "20px" }}>
                            <div className="faq-icon-box">
                              <HelpCircle size={20} />
                            </div>
                            <div className="faq-question-box text-start flex-grow-1">
                              <h3 className="faq-question-title" style={{ margin: 0 }}>{question}</h3>
                            </div>
                            <div
                              className="faq-chevron"
                              style={{
                                marginLeft: "auto",
                                display: "flex",
                                alignItems: "center",
                                transition: "transform 200ms ease",
                                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                              }}
                            >
                              <ChevronDown size={18} />
                            </div>
                          </div>
                        </Accordion.Button>
                      </div>
                      <Accordion.Body>
                        <div className='accordion-content'>
                          <div className='inner'>
                            <div dangerouslySetInnerHTML={{ __html: answer }} className='inner__text prose max-w-none text-gray-600' />
                          </div>
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>
                  );
                })}
              </Accordion>
            </div>
          </Col>
        </Row>
      </Container>
      <style jsx global>{`
        @media (max-width: 991px) {
          .faq-page { padding: 60px 0; }
          .faq-page__sidebar { margin-bottom: 40px; }
          .faq-page__sidebar__cta { max-width: 400px; margin: 0 auto; }
          .sec-title__title { font-size: 28px !important; }
        }
        @media (max-width: 575px) {
          .faq-question-title { font-size: 15px !important; font-weight: 700 !important; }
          .faq-icon-box { display: none !important; }
          .faq-header-content { gap: 10px !important; }
          .faq-accordion .accordion-button { padding: 15px !important; }
        }
      `}</style>
    </section>
  );
};

export default ListingFaqs;
