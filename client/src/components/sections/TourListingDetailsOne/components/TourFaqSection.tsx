import React from "react";
import { Accordion } from "react-bootstrap";
import EmptyState from "@/components/common/EmptyState/EmptyState";

interface FAQ {
  question: string;
  answer: string;
}

interface TourFaqSectionProps {
  faqs: FAQ[];
}

export const TourFaqSection: React.FC<TourFaqSectionProps> = ({ faqs }) => {
  if (!faqs || faqs.length === 0) {
    return (
      <EmptyState
        title="No FAQs Available"
        description="There are currently no frequently asked questions for this tour."
        icon="file"
        size="medium"
      />
    );
  }

  return (
    <div className='tour-listing-details__content__item tour-listing-details__faqs'>
      <div className="mb-4">
        <h4 className='tour-listing-details__title mb-2'>Frequently Asked Questions</h4>
        <p className="tour-reviews-subtitle">Common questions and answers to help you prepare.</p>
      </div>
      <div className="faq-accordion gotur-accordion" data-grp-name="gotur-accordion">
        <Accordion defaultActiveKey="0">
          {faqs.map((faq, index) => (
            <Accordion.Item eventKey={String(index)} key={index}>
              <Accordion.Header>
                <div className="accordion-title">
                  <h4 className="accordion-title__text">
                    {faq.question}
                    <span className="accordion-title__icon"></span>
                  </h4>
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <div className="accordion-content">
                  <div className="inner">
                    <div className="inner__text" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                  </div>
                </div>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      </div>
    </div>
  );
};
