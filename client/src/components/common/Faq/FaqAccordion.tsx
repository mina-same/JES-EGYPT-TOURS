"use client";

import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";

export interface FaqAccordionItem {
  question: React.ReactNode;
  /** Answer markup. Callers pass HTML that has already been localized. */
  answer: string;
}

interface FaqAccordionProps {
  items: FaqAccordionItem[];
  /**
   * Namespaces the generated ids. Two lists on one page must not share it, or
   * `aria-controls` on one would point at the other's answer.
   */
  idPrefix: string;
  /** Set on the `.faq-list` element itself, for anything that references it. */
  id?: string;
  /**
   * Extra classes for one row. The tour page uses it to hide the questions past
   * its fold without dropping them from the markup.
   */
  rowClassName?: (index: number) => string | undefined;
}

/**
 * The question list used across the site: the tour page, articles, listing
 * pages, /faq and special offers.
 *
 * Each of those carried its own copy of this markup. They rendered the same
 * DOM, so the copies were pure duplication -- and a fix applied to one of them
 * silently left the other three behind, which is how the article list kept a
 * `max-height` that clipped long answers after the tour page had stopped using
 * one. The styling lives in `custom.css` under `.faq-list*`.
 *
 * The home page deliberately does NOT use this: it has its own two-column,
 * numbered treatment for a landing page rather than a reading page.
 */
const FaqAccordion: React.FC<FaqAccordionProps> = ({
  items,
  idPrefix,
  id,
  rowClassName,
}) => {
  // The first question opens on load, everywhere.
  const [activeKey, setActiveKey] = useState<string | null>("0");

  return (
    <div className="faq-list" id={id}>
      {items.map((item, index) => {
        const key = String(index);
        const isOpen = activeKey === key;
        const questionId = `${idPrefix}-question-${index}`;
        const answerId = `${idPrefix}-answer-${index}`;
        const extra = rowClassName?.(index);

        return (
          <div
            key={index}
            className={
              "faq-list__row" +
              (isOpen ? " is-open" : "") +
              (extra ? ` ${extra}` : "")
            }
          >
            <h3 className="faq-list__heading">
              <button
                type="button"
                id={questionId}
                className="faq-list__toggle"
                onClick={() => setActiveKey(isOpen ? null : key)}
                aria-expanded={isOpen}
                aria-controls={answerId}
              >
                <span className="faq-list__question">{item.question}</span>
                <span className="faq-list__icon" aria-hidden="true">
                  {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                </span>
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
                  dangerouslySetInnerHTML={{ __html: item.answer }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FaqAccordion;
