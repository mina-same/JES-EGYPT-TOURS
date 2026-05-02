'use client';
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Container, Row, Col } from "react-bootstrap";
import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '@/lib/localize';
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import ClientCarousel from "@/components/sections/ClientCarousel/ClientCarousel";
import { TinySliderWrapper as TinySlider } from "@/components/common/TinySliderWrapper";
import { aboutTestimonialsData } from "@/data/aboutTestimonialsData";
import ReviewAvatar from "@/components/common/ReviewAvatar";

interface ReviewCurated {
  name: any;
  avatar?: string;
  rating: number;
  comment: any;
  status?: string;
}

interface ListingReviewsProps {
  reviews: ReviewCurated[];
  title?: string;
  sectionTitle?: any;
  locale: string;
}

const ListingReviews: React.FC<ListingReviewsProps> = ({ reviews, title, sectionTitle, locale }) => {
  const { t } = useTranslation('common');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!reviews || reviews.length === 0) return null;

  const displayTitle = getLocalizedValue(sectionTitle, locale) || title || t('travelersExperiences');
  const sectionTagline = t('reviewsTagline', { defaultValue: 'Testimonials' });

  // Use shapes and default thumb from aboutTestimonialsData for visual consistency
  const { testiThumb, shapeImages } = aboutTestimonialsData;

  const sliderSettings = {
    items: 1,
    gutter: 30,
    smartSpeed: 700,
    loop: reviews.filter(r => r.status !== 'rejected').length > 1,
    nav: false,
    autoplay: true,
    autoplayTimeout: 5000,
    autoplayButtonOutput: false,
    mouseDrag: true,
    controls: true,
    controlsContainer: ".gotur-owl__carousel--basic-nav .owl-nav",
  };

  return (
    <section className="about-testimonials section-space listing-reviews" id="testimonials">
      <Container>
        <Row className="align-items-center gutter-y-40">
          <Col lg={4}>
            <div
              className="about-testimonials__left wow fadeInLeft"
              data-wow-duration="1500ms"
              data-wow-delay="300ms"
            >
              <div className="about-testimonials__thumb">
                <div className="about-testimonials__thumb__item">
                  <Image src={testiThumb} alt="Featured Testimonial" layout="responsive" />
                </div>
              </div>
            </div>
          </Col>
          <Col lg={8}>
            <div className="about-testimonials__right">
              <div className="sec-title">
                <span className="sec-title__tagline bw-split-in-right">
                  <TextAnimation text={sectionTagline} animationType="right" />
                </span>
                <h2 className="sec-title__title bw-split-in-left">
                  <TextAnimation text={displayTitle} animationType="left" />
                </h2>
              </div>

              {!mounted ? (
                <div className="flex items-center justify-center p-5 min-h-[300px]">
                  <div className="w-8 h-8 rounded-full border-4 border-[#b79c5c] border-t-transparent animate-spin"></div>
                </div>
              ) : (
                <div className="gotur-owl__carousel--basic-nav owl-carousel about-testimonials__carousel gotur-owl__carousel owl-theme position-relative">
                  <TinySlider settings={sliderSettings} className="about-testimonials__carousel">
                    {reviews.filter(r => r.status !== 'rejected').map((review, index) => (
                      <div className="about-testimonials__item" key={index}>
                        <div className="about-testimonials__star">
                          {[...Array(5)].map((_, i) => (
                            <i
                              key={i}
                              className={`icon-star ${i < (review.rating || 5) ? '' : 'text-gray-300'}`}
                              style={{ color: i < (review.rating || 5) ? '#ffab01' : '#e5e7eb' }}
                            ></i>
                          ))}
                        </div>
                        <div className="about-testimonials__text html-content">
                          {getLocalizedValue(review.comment, locale)}
                        </div>
                        <div className="about-testimonials__author">
                          <div className="about-testimonials__author__thumb">
                            <ReviewAvatar
                              src={review.avatar}
                              name={getLocalizedValue(review.name, locale)}
                              width={60}
                              height={60}
                              className="rounded-full"
                            />
                          </div>
                          <div className="about-testimonials__content">
                            <span className="about-testimonials__title">
                              {getLocalizedValue(review.name, locale) || 'Anonymous'}
                            </span>
                            <span>{t('verifiedTraveler', { defaultValue: 'Verified Traveler' })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </TinySlider>

                  <div className="owl-nav">
                    <button type="button" className="owl-prev" aria-label="Previous">
                      <span className="icon-arrow-left"></span>
                    </button>
                    <button type="button" className="owl-next" aria-label="Next">
                      <span className="icon-arrow-right"></span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Col>
        </Row>

        <div className="mt-5 pt-4 border-t border-gray-100">
          <ClientCarousel />
        </div>
      </Container>

      {/* Shapes for background consistency */}
      <div className="about-testimonials__element-one">
        <Image src={shapeImages[0]} alt="shape-image" />
      </div>
      <div className="about-testimonials__element-two">
        <Image src={shapeImages[1]} alt="shape-image" />
      </div>

      <style jsx global>{`
        .listing-reviews .about-testimonials__item {
           padding: 20px 0;
        }
      `}</style>
    </section>
  );
};

export default ListingReviews;
