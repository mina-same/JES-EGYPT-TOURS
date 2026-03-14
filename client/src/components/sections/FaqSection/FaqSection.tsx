"use client";
import React, { useEffect, useState } from "react";
import { Accordion, Col, Container, Row } from "react-bootstrap";
import { faqService, type FAQ } from "@/services/faqService";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { ChevronDown, HelpCircle, Loader2 } from "lucide-react";
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

const AnimatedFaqAccordion: React.FC<{ faqs: Faq[] }> = ({ faqs }) => {
  const [activeKey, setActiveKey] = useState<string | null>("0");

  return (
    <Accordion
      activeKey={activeKey ?? undefined}
      onSelect={(eventKey) => setActiveKey(eventKey as string | null)}
      className=' wow fadeInUp'
      data-wow-duration='1500ms'
      data-wow-delay='500ms'
    >
      {faqs.map((faq, idx) => {
        const eventKey = idx.toString();
        const isOpen = activeKey === eventKey;

        return (
          <Accordion.Item eventKey={eventKey} key={idx}>
            <Accordion.Header>
              <div className="faq-header-content d-flex align-items-center gap-3 w-100">
                <div className="faq-icon-box">
                  <HelpCircle size={20} />
                </div>
                <div className="faq-question-box text-start flex-grow-1">
                  <h4 className="faq-question-title">{faq.question}</h4>
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
            </Accordion.Header>
            <Accordion.Body>
              <div className='accordion-content'>
                <div className='inner'>
                  <p className='inner__text'>{faq.answer}</p>
                </div>
              </div>
            </Accordion.Body>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
};

export interface FaqData {
  title: string;
  subTitle: string;
  image: StaticImageData;
  faqTabs: FaqTab[];
  faqTabsContent: FaqTabContent[];
}

const FaqSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("1");
  const [faqData, setFaqData] = useState<FaqData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await faqService.getAllFaqs({
          isActive: true,
          sort: "category,order",
          limit: 200,
        });

        if (!response.success || !response.data) {
          setError("Failed to load FAQs");
          return;
        }

        const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();

        const faqsForFaqPage = response.data.filter((f) => !f.displayOnHome);

        const grouped = faqsForFaqPage.reduce((acc, faq) => {
          const category = faq.category || "General";
          if (!acc[category]) acc[category] = [];
          acc[category].push(faq);
          return acc;
        }, {} as Record<string, FAQ[]>);

        const categories = Object.keys(grouped).sort((a, b) =>
          a.localeCompare(b, undefined, { sensitivity: "base" })
        );

        const tabs: FaqTab[] = categories.map((category, index) => ({
          id: String(index + 1),
          title: category,
        }));

        const tabContents: FaqTabContent[] = tabs.map((tab, index) => {
          const faqsForCategory = grouped[tab.title] || [];
          return {
            id: String(index + 1),
            faqId: tab.id,
            faqContent: [
              {
                id: `content-${tab.id}`,
                title: tab.title,
                faqs: faqsForCategory.map((f) => ({
                  question: f.question,
                  answer: stripHtml(f.answer),
                })),
              },
            ],
          };
        });

        const structured: FaqData = {
          title: "Egypt Travel FAQ - Expert Answers",
          subTitle:
            "Find answers to frequently asked questions about Egypt travel, tours, booking, safety, and more.",
          image,
          faqTabs: tabs,
          faqTabsContent: tabContents,
        };

        setFaqData(structured);
        if (tabs.length > 0) {
          setActiveTab((prev) => prev || tabs[0].id);
        }
      } catch (e) {
        console.error("Error fetching FAQs:", e);
        setError("Failed to load FAQs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);
  };

  if (loading) {
    return (
      <section className='faq-page section-space tabs-box'>
        <Container>
          <div className='text-center py-5'>
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
            <p className="mt-2 text-muted">Loading FAQs...</p>
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
            <p className="text-danger">{error || "No FAQs available"}</p>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className='faq-page section-space tabs-box'>
      <Container>
        <div className='sec-title text-center mb-5'>
          <h6 className='sec-title__tagline'>{faqData.subTitle}</h6>
          <h3 className='sec-title__title'>{faqData.title}</h3>
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
                    <Image src={faqData.image} alt='sidebar' />
                    <div className='faq-page__sidebar__cta__content'>
                      <span className='faq-page__sidebar__sub-title'>
                        {faqData.subTitle}
                      </span>
                      <h3 className='faq-page__sidebar__title'>
                        {faqData.title}
                      </h3>
                      <Link
                        href='/tour-listing-details-2'
                        className='gotur-btn'
                      >
                        Book Now{" "}
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
