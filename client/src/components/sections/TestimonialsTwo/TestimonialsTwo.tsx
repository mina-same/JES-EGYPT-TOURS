"use client";

import Image, { StaticImageData } from "next/image";
import { Container, Row, Col } from "react-bootstrap";
import testimonialsTwoData, { TestimonialItem } from "@/data/testimonialsTwoData";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import { TinySliderWrapper as TinySlider } from "@/components/common/TinySliderWrapper";
import { useTranslation } from "react-i18next";

type SupportedLang = "en" | "de" | "it" | "es";

const TestimonialsTwo = () => {
  const { i18n } = useTranslation("common");
  const lang = (i18n.language?.split("-")[0] as SupportedLang) ?? "en";

  const { tagline, title, highlighted, testimonials, elementImage } = testimonialsTwoData;

  if (!testimonials || testimonials.length === 0) return null;

  const settings = {
    items: 1,
    gutter: 30,
    loop: testimonials.length > 1,
    nav: false,
    autoplay: false,
    controls: testimonials.length > 1,
    mouseDrag: true,
    controlsContainer: testimonials.length > 1 ? ".testimonials-two__bottom__nav" : undefined,
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
                <h6 className='sec-title__tagline'>
                  <TextAnimation text={tagline} animationType='right' />
                </h6>
                <h3 className='sec-title__title'>
                  <TextAnimation text={title} animationType='left' />
                  <span>
                    <TextAnimation text={highlighted} animationType='left' />
                  </span>
                </h3>
              </div>
              {testimonials.length > 1 && (
                <div className='testimonials-two__bottom__nav'>
                  <button className='testimonials-two__carousel__nav--left'>
                    <span className='icon-arrow-left'></span>
                  </button>
                  <button className='testimonials-two__carousel__nav--right'>
                    <span className='icon-arrow-right'></span>
                  </button>
                </div>
              )}
            </div>
          </Col>

          <Col xl={8} xxl={9}>
            <TinySlider
              settings={settings}
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
                        <div className='testimonials-two-card__content'>
                          <div className='testimonials-two-card__author'>
                            <h4 className='testimonials-two-card__author__name'>{name}</h4>
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
                        <div className='testimonials-two-card__quite'>
                          <i className='icon-straight-quotes'></i>
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
      <div className='testimonials-two__element'>
        <Image src={elementImage as StaticImageData} alt='testimonial background element' />
      </div>
    </section>
  );
};

export default TestimonialsTwo;
