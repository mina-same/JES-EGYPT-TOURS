"use client";

import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { faqService, type FAQ } from "@/services/faqService";
import { Plus, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getLocalizedValue } from "@/lib/localize";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";

type HomeFAQProps = {
  initialFaqs?: FAQ[];
};

const HomeFAQ: React.FC<HomeFAQProps> = ({ initialFaqs = [] }) => {
  const [faqs, setFaqs] = useState<FAQ[]>(() => initialFaqs);
  const [loading, setLoading] = useState(initialFaqs.length === 0);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { i18n, t } = useTranslation("common");

  useEffect(() => {
    if (initialFaqs.length > 0) {
      setFaqs(initialFaqs);
      setLoading(false);
      return;
    }

    const fetchFaqs = async () => {
      try {
        const response = await faqService.getAllFaqs({
          isActive: true,
          displayOnHome: true,
          sort: "category,order",
          limit: 8,
        });
        if (response.success && response.data) {
          setFaqs(response.data);
        } else {
          setFaqs([]);
        }
      } catch {
        setFaqs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, [initialFaqs]);

  if (loading || faqs.length === 0) return null;

  const toggle = (index: number) =>
    setOpenIndex(openIndex === index ? null : index);

  const half = Math.ceil(faqs.length / 2);
  const leftFaqs = faqs.slice(0, half);
  const rightFaqs = faqs.slice(half);

  return (
    <section className="home-faq section-space" id="faq">
      <Container>

        {/* Section header — matches all other sections on the page */}
        <div className="sec-title text-center">
          <h6 className="sec-title__tagline">
            <TextAnimation
              text={t("gotQuestions", "Got Questions?")}
              animationType="right"
            />
          </h6>
          <h3 className="sec-title__title">
            <TextAnimation
              text={t("frequentlyAsked", "Frequently Asked")}
              animationType="left"
            />
            {" "}<span>{t("questions", "Questions")}</span>
          </h3>
          <p className="hfaq-subtitle">
            {t(
              "faqSubtitle",
              "Everything you need to know about our tours and services."
            )}
          </p>
        </div>

        {/* Two-column FAQ grid */}
        <Row className="g-0 hfaq-grid">
          <Col lg={6} className="hfaq-col hfaq-col--left">
            {leftFaqs.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={faq._id}
                  className={`hfaq-item${isOpen ? " hfaq-item--open" : ""}`}
                  onClick={() => toggle(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") && toggle(i)
                  }
                  aria-expanded={isOpen}
                >
                  <div className="hfaq-item__head">
                    <span className="hfaq-num">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="hfaq-question">
                      {getLocalizedValue(faq.question, i18n.language)}
                    </span>
                    <span className="hfaq-icon" aria-hidden="true">
                      {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                    </span>
                  </div>
                  <div className="hfaq-item__body">
                    <div
                      className="hfaq-answer"
                      dangerouslySetInnerHTML={{
                        __html:
                          getLocalizedValue(faq.answer, i18n.language) || "",
                      }}
                    />
                    {faq.category && (
                      <span className="hfaq-tag">{faq.category}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </Col>

          <Col lg={6} className="hfaq-col hfaq-col--right">
            {rightFaqs.map((faq, i) => {
              const index = i + half;
              const isOpen = openIndex === index;
              return (
                <div
                  key={faq._id}
                  className={`hfaq-item${isOpen ? " hfaq-item--open" : ""}`}
                  onClick={() => toggle(index)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") && toggle(index)
                  }
                  aria-expanded={isOpen}
                >
                  <div className="hfaq-item__head">
                    <span className="hfaq-num">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="hfaq-question">
                      {getLocalizedValue(faq.question, i18n.language)}
                    </span>
                    <span className="hfaq-icon" aria-hidden="true">
                      {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                    </span>
                  </div>
                  <div className="hfaq-item__body">
                    <div
                      className="hfaq-answer"
                      dangerouslySetInnerHTML={{
                        __html:
                          getLocalizedValue(faq.answer, i18n.language) || "",
                      }}
                    />
                    {faq.category && (
                      <span className="hfaq-tag">{faq.category}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </Col>
        </Row>

      </Container>
    </section>
  );
};

export default HomeFAQ;
