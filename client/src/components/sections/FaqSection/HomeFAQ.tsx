"use client";

import React, { useEffect, useState } from "react";
import { Container, Accordion } from "react-bootstrap";
import { tourAPI } from "@/lib/api/tour";
import { Loader2 } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  tourName: string;
}

const HomeFAQ: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        // Fetch featured tours first as they usually have the best content
        const response = await tourAPI.getFeatured();
        if (response.success && response.data) {
          const allFaqs: FAQItem[] = [];
          response.data.forEach((tour: any) => {
            if (tour.faqs && Array.isArray(tour.faqs)) {
              tour.faqs.forEach((f: any) => {
                if (f.question && f.answer) {
                  allFaqs.push({
                    question: f.question,
                    answer: f.answer,
                    tourName: tour.heading || tour.name
                  });
                }
              });
            }
          });
          
          // If we don't have enough FAQs, fetch regular tours
          if (allFaqs.length < 5) {
             const allToursResponse = await tourAPI.getAll({ limit: 20 });
             if (allToursResponse.success && allToursResponse.data) {
                allToursResponse.data.forEach((tour: any) => {
                    if (tour.faqs && Array.isArray(tour.faqs)) {
                        tour.faqs.forEach((f: any) => {
                            if (f.question && f.answer && !allFaqs.some(existing => existing.question === f.question)) {
                                allFaqs.push({
                                    question: f.question,
                                    answer: f.answer,
                                    tourName: tour.heading || tour.name
                                });
                            }
                        });
                    }
                });
             }
          }

          // Randomize or filter to get a good mix
          setFaqs(allFaqs.slice(0, 8));
        }
      } catch (err) {
        console.error("Error fetching home FAQs:", err);
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

  if (faqs.length === 0) return null;

  return (
    <section className="home-faq section-space" id="faq">
      <Container>
        <div className="sec-title text-center mb-5">
            <h6 className="sec-title__tagline">Got Questions?</h6>
            <h3 className="sec-title__title">Frequently Asked <span>Questions</span></h3>
            <p className="mt-3 text-muted">Everything you need to know about our tours and services.</p>
        </div>

        <div className="faq-accordion gotur-accordion mx-auto" style={{ maxWidth: '900px' }}>
          <Accordion defaultActiveKey="0">
            {faqs.map((faq, index) => (
              <Accordion.Item eventKey={String(index)} key={index} className="border-0 mb-3 shadow-sm rounded-4 overflow-hidden">
                <Accordion.Header className="bg-white">
                  <div className="accordion-title py-2">
                    <h4 className="accordion-title__text" style={{ fontSize: '18px', fontWeight: '600' }}>
                      {faq.question}
                      <span className="accordion-title__icon"></span>
                    </h4>
                  </div>
                </Accordion.Header>
                <Accordion.Body className="bg-white pt-0">
                  <div className="accordion-content">
                    <div className="inner">
                      <div 
                        className="inner__text text-muted" 
                        style={{ lineHeight: '1.8' }}
                        dangerouslySetInnerHTML={{ __html: faq.answer }} 
                      />
                      {faq.tourName && (
                        <div className="mt-3">
                          <small className="text-uppercase" style={{ fontSize: '10px', letterSpacing: '1px', color: '#b79c5c' }}>
                            Source: {faq.tourName}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      </Container>
    </section>
  );
};

export default HomeFAQ;