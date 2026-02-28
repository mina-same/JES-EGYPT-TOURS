"use client";

import React, { useEffect, useState } from "react";
import { Container, Accordion } from "react-bootstrap";
import { faqService, type FAQ } from "@/services/faqService";
import { HelpCircle, Loader2 } from "lucide-react";

const HomeFAQ: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoading(true);
        const response = await faqService.getHomeFaqs(8);
        
        if (response.success && response.data) {
          setFaqs(response.data);
        } else {
          // If no dedicated FAQs, fallback to tour FAQs (existing logic)
          await fetchTourFaqs();
        }
      } catch (err) {
        console.error("Error fetching home FAQs:", err);
        // Fallback to tour FAQs
        await fetchTourFaqs();
      } finally {
        setLoading(false);
      }
    };

    const fetchTourFaqs = async () => {
      try {
        const { tourAPI } = await import("@/lib/api/tour");
        const response = await tourAPI.getFeatured();
        if (response.success && response.data) {
          const allFaqs: FAQ[] = [];
          response.data.forEach((tour: any) => {
            if (tour.faqs && Array.isArray(tour.faqs)) {
              tour.faqs.forEach((f: any) => {
                if (f.question && f.answer) {
                  allFaqs.push({
                    _id: `tour-${tour._id}-${f.question.slice(0, 10)}`,
                    question: f.question,
                    answer: f.answer,
                    category: tour.heading || tour.name,
                    isActive: true,
                    order: 0,
                    displayOnHome: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
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
                                  _id: `tour-${tour._id}-${f.question.slice(0, 10)}`,
                                  question: f.question,
                                  answer: f.answer,
                                  category: tour.heading || tour.name,
                                  isActive: true,
                                  order: 0,
                                  displayOnHome: true,
                                  createdAt: new Date().toISOString(),
                                  updatedAt: new Date().toISOString()
                                });
                            }
                        });
                    }
                });
             }
          }

          setFaqs(allFaqs.slice(0, 8));
        }
      } catch (tourErr) {
        console.error("Error fetching tour FAQs:", tourErr);
        setError("Failed to load FAQs");
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
          <Accordion defaultActiveKey="0">
            {faqs.map((faq, index) => (
              <Accordion.Item eventKey={String(index)} key={faq._id}>
                <Accordion.Header>
                  <div className="faq-header-content d-flex align-items-center gap-3 w-100">
                    <div className="faq-icon-box">
                      <HelpCircle size={20} />
                    </div>
                    <div className="faq-question-box text-start">
                      <h4 className="faq-question-title">
                        {faq.question}
                      </h4>
                    </div>
                  </div>
                </Accordion.Header>
                <Accordion.Body>
                  <div className="accordion-content">
                    <div className="inner">
                      <div 
                        className="inner__text" 
                        dangerouslySetInnerHTML={{ __html: faq.answer }} 
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
            ))}
          </Accordion>
        </div>
      </Container>
    </section>
  );
};

export default HomeFAQ;