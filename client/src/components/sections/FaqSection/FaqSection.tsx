"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { faqService, type FAQ } from "@/services/faqService";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { ChevronDown, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getLocalizedValue } from "@/lib/localize";
import image from "@/assets/images/resources/faq-sidebar.png";
// types.ts
interface Faq {
  question: string;
  answer: string;
}

interface FaqTab {
  id: string;
  title: string;
}

interface FaqTabContent {
  id: string;
  faqId: string;
  faqContent: {
    id: string;
    title: string;
    faqs: Faq[];
  }[];
}

/**
 * The question list on /faq.
 *
 * This markup and the tour page's were copy-paste twins: the same
 * `faq-icon-box` / `faq-header-content` / `faq-question-title` class names,
 * none of which any stylesheet defined, so both leaned on the purchased
 * theme's `.faq-accordion` rules and a pile of inline styles. Both now use the
 * shared `.faq-list` treatment instead, which is styled in custom.css and
 * matches the rest of the site.
 */
const AnimatedFaqAccordion: React.FC<{ faqs: Faq[] }> = ({ faqs }) => {
  const [activeKey, setActiveKey] = useState<string | null>("0");

  return (
    <div className="faq-list wow fadeInUp" data-wow-duration="1500ms" data-wow-delay="500ms">
      {faqs.map((faq, idx) => {
        const key = idx.toString();
        const isOpen = activeKey === key;
        const questionId = `faq-question-${idx}`;
        const answerId = `faq-answer-${idx}`;

        return (
          <div key={idx} className={`faq-list__row${isOpen ? " is-open" : ""}`}>
            <h3 className="faq-list__heading">
              <button
                type="button"
                id={questionId}
                className="faq-list__toggle"
                onClick={() => setActiveKey(isOpen ? null : key)}
                aria-expanded={isOpen}
                aria-controls={answerId}
              >
                <span className="faq-list__question">{faq.question}</span>
                <ChevronDown size={18} className="faq-list__chevron" />
              </button>
            </h3>
            <div
              className="faq-list__body"
              id={answerId}
              role="region"
              aria-labelledby={questionId}
            >
              <div className="faq-list__clip">
                <div
                  className="faq-list__answer html-content"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export interface FaqData {
  title: string;
  subTitle: string;
  image: StaticImageData;
  faqTabs: FaqTab[];
  faqTabsContent: FaqTabContent[];
}

/**
 * Groups the questions by category and resolves each one into the active
 * language. Pure, and at module scope, so the server render and the browser
 * fetch produce identical output from identical input — which is what keeps
 * hydration quiet.
 *
 * No placement filtering happens here: both callers ask the API for
 * `displayOnHome: false`, so everything that arrives belongs on this page.
 * Filtering a second time in the browser is what once made the page's FAQPage
 * schema advertise questions the visitor could not see.
 */
function buildFaqData(
  data: FAQ[],
  currentLang: 'en' | 'de' | 'it' | 'es',
  t: (key: string) => string
): FaqData {
  const grouped = data.reduce((acc, faq) => {
    const category = faq.category || t('categoryGeneral');
    if (!acc[category]) acc[category] = [];
    acc[category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  const categories = Object.keys(grouped).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );

  const tabs: FaqTab[] = categories.map((category, index) => ({
    id: String(index + 1),
    title: category,
  }));

  const faqTabsContent: FaqTabContent[] = tabs.map((tab, index) => ({
    id: String(index + 1),
    faqId: tab.id,
    faqContent: [
      {
        id: `content-${tab.id}`,
        title: tab.title,
        faqs: (grouped[tab.title] || []).map((f) => ({
          question: getLocalizedValue(f.question, currentLang),
          answer: getLocalizedValue(f.answer, currentLang),
        })),
      },
    ],
  }));

  return {
    title: t('sectionTitle'),
    subTitle: t('sectionSubTitle'),
    image,
    faqTabs: tabs,
    faqTabsContent,
  };
}

const FaqSection: React.FC<{ initialData?: FAQ[] }> = ({ initialData }) => {
  const { i18n, t } = useTranslation('faq');
  const currentLang = (i18n.language || 'en') as 'en' | 'de' | 'it' | 'es';

  /*
   * Built during render, not in an effect.
   *
   * Effects do not run while the server renders, so shaping the questions there
   * meant the server sent only a loading skeleton and the accordion appeared
   * after hydration. The page still declared a FAQPage schema listing questions
   * that were nowhere in the HTML — structured data with no matching visible
   * content, which is exactly what Google penalises. useMemo puts the questions
   * in the server output, and hydration matches because both sides shape the
   * same `initialData` the same way.
   */
  const initialFaqData = useMemo(
    () => (initialData && initialData.length > 0 ? buildFaqData(initialData, currentLang, t) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialData, currentLang]
  );

  const [activeTab, setActiveTab] = useState<string>(
    () => initialFaqData?.faqTabs[0]?.id ?? "1"
  );
  const [faqData, setFaqData] = useState<FaqData | null>(initialFaqData);
  const [loading, setLoading] = useState(!initialFaqData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processFaqs = (data: FAQ[]) => {
      const structured = buildFaqData(data, currentLang, t);
      setFaqData(structured);
      if (structured.faqTabs.length > 0) {
        setActiveTab((prev) => prev || structured.faqTabs[0].id);
      }
    };

    // Already shaped during render — nothing left for the effect to do.
    if (initialData && initialData.length > 0) {
      setLoading(false);
      return;
    }

    const fetchFaqs = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await faqService.getAllFaqs({
          isActive: true,
          // Must match the server render — see the note in processFaqs.
          displayOnHome: false,
          sort: "category,order",
          limit: 200,
          locale: currentLang,
        });

        if (!response.success || !response.data) {
          setError(t('errorLoading'));
          return;
        }

        processFaqs(response.data);
      } catch (e) {
        console.error("Error fetching FAQs:", e);
        setError(t('errorLoading'));
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, [currentLang, initialData]);

  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);
  };

  if (loading) {
    return (
      <section className='faq-page section-space tabs-box'>
        <Container>
          <div className='text-center py-5'>
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
            <p className="mt-2 text-muted">{t('loading')}</p>
          </div>
        </Container>
      </section>
    );
  }

  if (error || !faqData) {
    return (
      <section className='faq-page section-space tabs-box'>
        <Container>
          <div className='text-center py-5'>
            <p className="text-danger">{error || t('noFaqs')}</p>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className='faq-page section-space tabs-box'>
      <Container>
        <div className='sec-title text-center mb-5'>
          <h2 className='sec-title__tagline'>{faqData.subTitle}</h2>
          <h2 className='sec-title__title'>{faqData.title}</h2>
        </div>
        <div className='tabs-box'>
          <Row className='gutter-y-30'>
            <Col lg={4}>
              <div className='faq-page__sidebar'>
                <div
                  className='faq-page__sidebar__item wow fadeInUp'
                  data-wow-duration='1500ms'
                  data-wow-delay='300ms'
                >
                  <ul className='faq-page__sidebar__list list-unstyled tab-buttons'>
                    {faqData.faqTabs.map((tab) => (
                      <li
                        key={tab.id}
                        className={`sidebar__tab tab-btn ${
                          activeTab === tab.id ? "active-btn" : ""
                        }`}
                        data-tab={`#item${tab.id}`}
                        onClick={() => handleTabSelect(tab.id)}
                      >
                        <span>{tab.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  className='faq-page__sidebar__item wow fadeInUp'
                  data-wow-duration='1500ms'
                  data-wow-delay='500ms'
                >
                  <div className='faq-page__sidebar__cta'>
                    <Image src={faqData.image} alt={faqData.title} title={faqData.title} />
                    <div className='faq-page__sidebar__cta__content'>
                      <span className='faq-page__sidebar__sub-title'>
                        {faqData.subTitle}
                      </span>
                      <h3 className='faq-page__sidebar__title'>
                        {faqData.title}
                      </h3>
                      <Link
                        href={`/${currentLang}/tours`}
                        className='gotur-btn'
                      >
                        {t('bookNow')}{" "}
                        <span className='icon'>
                          <i className='icon-right'></i>
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
            <Col lg={8}>
              <div className='tabs-content'>
                {faqData.faqTabsContent.map((tabContent: FaqTabContent) => (
                  <div
                    key={tabContent.id}
                    className={`faq-accordion__item tab ${
                      tabContent.faqId === activeTab ? "active-tab" : ""
                    }`}
                  >
                    <div
                      title={
                        faqData.faqTabs.find(
                          (tab) => tab.id === tabContent.faqId
                        )?.title
                      }
                    >
                      {tabContent.faqContent.map((faq) => (
                        <div
                          key={faq.id}
                          className='faq-accordion gotur-accordion'
                          data-grp-name='gotur-accordion'
                        >
                          <div
                            className='faq-page__title wow fadeInUp'
                            data-wow-duration='1500ms'
                            data-wow-delay='500ms'
                          >
                            {faq.title}
                          </div>
                          <AnimatedFaqAccordion faqs={faq.faqs} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </div>
      </Container>
    </section>
  );
};

export default FaqSection;
