"use client";

import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { faqService, type FAQ } from "@/services/faqService";
import { Plus, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getLocalizedValue } from "@/lib/localize";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";

/**
 * One question.
 *
 * The two columns used to carry byte-identical copies of this markup, and in
 * both the click handler sat on the wrapper that CONTAINS the answer -- so
 * selecting a line of the answer, or following a link inside it, collapsed the
 * question. It was also a div with role="button" holding an <h3> and, once an
 * answer contained a link, interactive content nested inside interactive
 * content.
 *
 * The heading-wraps-button arrangement is the accessible accordion pattern: the
 * question stays a real heading for the document outline, only the header row
 * is clickable, and the answer is a plain region the pointer can work in.
 */
const HomeFaqItem: React.FC<{
  faq: FAQ;
  /** 1-based, shown as the 01/02 counter. */
  number: number;
  isOpen: boolean;
  onToggle: () => void;
  language: string;
}> = ({ faq, number, isOpen, onToggle, language }) => {
  const panelId = `hfaq-panel-${number}`;
  const headerId = `hfaq-header-${number}`;

  return (
    <div className={`hfaq-item${isOpen ? " hfaq-item--open" : ""}`}>
      <h3 className="hfaq-heading">
        <button
          type="button"
          id={headerId}
          className="hfaq-item__head"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
        >
          <span className="hfaq-num">{String(number).padStart(2, "0")}</span>
          <span className="hfaq-question">
            {getLocalizedValue(faq.question, language)}
          </span>
          <span className="hfaq-icon" aria-hidden="true">
            {isOpen ? <Minus size={14} /> : <Plus size={14} />}
          </span>
        </button>
      </h3>
      <div
        className="hfaq-item__body"
        id={panelId}
        role="region"
        aria-labelledby={headerId}
      >
        <div className="hfaq-item__clip">
          <div
            className="hfaq-answer"
            dangerouslySetInnerHTML={{
              __html: getLocalizedValue(faq.answer, language) || "",
            }}
          />
          {faq.category && <span className="hfaq-tag">{faq.category}</span>}
        </div>
      </div>
    </div>
  );
};

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
          locale: i18n.language,
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
          <p className="sec-title__tagline">
            <TextAnimation
              text={t("gotQuestions", "Got Questions?")}
              animationType="right"
              semantic
            />
          </p>
          <h2 className="sec-title__title">
            <TextAnimation
              text={t("frequentlyAsked", "Frequently Asked")}
              animationType="left"
              semantic
            />
            {" "}<span>{t("questions", "Questions")}</span>
          </h2>
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
            {leftFaqs.map((faq, i) => (
              <HomeFaqItem
                key={faq._id}
                faq={faq}
                number={i + 1}
                isOpen={openIndex === i}
                onToggle={() => toggle(i)}
                language={i18n.language}
              />
            ))}
          </Col>

          <Col lg={6} className="hfaq-col hfaq-col--right">
            {rightFaqs.map((faq, i) => (
              <HomeFaqItem
                key={faq._id}
                faq={faq}
                number={i + half + 1}
                isOpen={openIndex === i + half}
                onToggle={() => toggle(i + half)}
                language={i18n.language}
              />
            ))}
          </Col>
        </Row>

      </Container>
    </section>
  );
};

export default HomeFAQ;
