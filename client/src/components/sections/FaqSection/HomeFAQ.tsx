"use client";

import React, { useEffect, useState } from "react";
import { Container, Accordion } from "react-bootstrap";
import { faqService, type FAQ } from "@/services/faqService";
import { ChevronDown, HelpCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getLocalizedValue } from "@/lib/localize";

const HomeFAQ: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>("0");
  const { i18n } = useTranslation();

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await faqService.getAllFaqs({
          isActive: true,
          displayOnHome: true,
          sort: "category,order",
          limit: 8,
        });

        if (response.success && response.data) {
          setFaqs(response.data);
          return;
        }

        setFaqs([]);
      } catch (err) {
        console.error("Error fetching home FAQs:", err);
        setError("Failed to load FAQs");
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || faqs.length === 0) {
    return null;
  }

  return (
    <section className="home-faq section-space" id="faq">
      <Container>
        <div className="sec-title text-center mb-5">
            <h6 className="sec-title__tagline">Got Questions?</h6>
            <h3 className="sec-title__title">Frequently Asked <span>Questions</span></h3>
            <p className="mt-3 text-muted">Everything you need to know about our tours and services.</p>
        </div>

        <div className="faq-accordion mx-auto" style={{ maxWidth: '900px' }}>
          <Accordion
            activeKey={activeKey ?? undefined}
            onSelect={(eventKey) => setActiveKey(eventKey as string | null)}
          >
            {faqs.map((faq, index) => {
              const eventKey = String(index);
              const isOpen = activeKey === eventKey;

              return (
                <Accordion.Item eventKey={eventKey} key={faq._id}>
                  <Accordion.Header>
                    <div className="faq-header-content d-flex align-items-center gap-3 w-100">
                      <div className="faq-icon-box">
                        <HelpCircle size={20} />
                      </div>
                      <div className="faq-question-box text-start flex-grow-1">
                        <h4 className="faq-question-title">
                          {getLocalizedValue(faq.question, i18n.language)}
                        </h4>
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
                    <div className="accordion-content">
                      <div className="inner">
                        <div
                          className="inner__text"
                          dangerouslySetInnerHTML={{ __html: getLocalizedValue(faq.answer, i18n.language) || "" }}
                        />
                        {faq.category && (
                          <div className="mt-3">
                            <small className="text-uppercase" style={{ fontSize: '10px', letterSpacing: '1px', color: '#b79c5c', fontWeight: '700' }}>
                              Category: {faq.category}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              );
            })}
          </Accordion>
        </div>
      </Container>
    </section>
  );
};

export default HomeFAQ;