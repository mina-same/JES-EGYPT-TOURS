"use client";

import { Container, Row, Col } from "react-bootstrap";
import testimonialsTwoData, { TestimonialItem } from "@/data/testimonialsTwoData";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import {
  TinySliderWrapper as TinySlider,
  type TinySliderHandle,
} from "@/components/common/TinySliderWrapper";
import { useTranslation } from "react-i18next";
import { useRef } from "react";

type SupportedLang = "en" | "de" | "it" | "es";

const TestimonialsTwo = () => {
  const sliderRef = useRef<TinySliderHandle>(null);
  const { i18n } = useTranslation("common");
  const lang = (i18n.language?.split("-")[0] as SupportedLang) ?? "en";

  const { tagline, title, highlighted, testimonials } = testimonialsTwoData;

  if (!testimonials || testimonials.length === 0) return null;

  const settings = {
    items: 1,
    gutter: 30,
    loop: testimonials.length > 1,
    nav: false,
    autoplay: false,
    controls: false,
    mouseDrag: true,
    responsive: {
      0: { items: 1 },
      768: { items: Math.min(2, testimonials.length) },
      992: { items: Math.min(2, testimonials.length) },
      1199: { items: Math.min(2, testimonials.length) },
    },
  };

  return (
    <section className='testimonials-two' id='testimonials'>
      <Container fluid>
        <Row className='align-items-center gy-4'>
          <Col xl={4} xxl={3}>
            <div className='mb-4'>
              <div className='sec-title'>
                <p className='sec-title__tagline'>
                  <TextAnimation text={tagline} animationType='right' semantic />
                </p>
                <h2 className='sec-title__title'>
                  <TextAnimation text={title} animationType='left' semantic />
                  {" "}
                  <span>
                    <TextAnimation text={highlighted} animationType='left' semantic />
                  </span>
                </h2>
              </div>
              {testimonials.length > 1 && (
                <div className='testimonials-two__bottom__nav'>
                  <button
                    type="button"
                    className='testimonials-two__carousel__nav--left'
                    aria-label="Previous testimonial"
                    onClick={() => sliderRef.current?.slider?.goTo("prev")}
                  >
                    <span className='icon-arrow-left'></span>
                  </button>
                  <button
                    type="button"
                    className='testimonials-two__carousel__nav--right'
                    aria-label="Next testimonial"
                    onClick={() => sliderRef.current?.slider?.goTo("next")}
                  >
                    <span className='icon-arrow-right'></span>
                  </button>
                </div>
              )}
            </div>
          </Col>

          <Col xl={8} xxl={9}>
            <TinySlider
              ref={sliderRef}
              settings={settings}
              rebuildKey={lang}
              className='testimonials-two__carousel gotur-owl__carousel gotur-owl__carousel--custom-nav gotur-owl__carousel--with-shadow owl-carousel owl-theme'
            >
              {testimonials.map((testimonial: TestimonialItem) => {
                const name = testimonial.name[lang] ?? testimonial.name.en;
                const text = testimonial.text[lang] ?? testimonial.text.en;
                return (
                  <div key={testimonial.id}>
                    <div
                      className='testimonials-two-card wow fadeInUp'
                      data-wow-duration='1500ms'
                      data-wow-delay='00ms'
                    >
                      <div className='testimonials-two-card__inner' style={{ paddingTop: 30 }}>
                        {/* Quote mark sits in normal flow ABOVE the content
                            (the theme's absolute top/left placement made it
                            overlap the centered testimonial text). */}
                        <div className='testimonials-two-card__quite' aria-hidden='true'>
                          <i className='icon-straight-quotes'></i>
                        </div>
                        <div className='testimonials-two-card__content'>
                          <div className='testimonials-two-card__author'>
                            <h3 className='testimonials-two-card__author__name'>{name}</h3>
                          </div>
                          <p className='testimonials-two-card__text'>{text}</p>
                        </div>
                        <div className='testimonials-two-card__star'>
                          <div className='testimonials-two-card__star__item'>
                            <i className='icon-star'></i>
                            <i className='icon-star'></i>
                            <i className='icon-star'></i>
                            <i className='icon-star'></i>
                            <i className='icon-star'></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </TinySlider>
          </Col>
        </Row>
      </Container>
      {/* Decorative wrapper kept EMPTY on purpose: its ::after renders the
          soft gold glow behind the heading. The old suitcase PNG that lived
          here collided with the section title and was removed. */}
      <div className='testimonials-two__element' aria-hidden='true'></div>
    </section>
  );
};

export default TestimonialsTwo;
