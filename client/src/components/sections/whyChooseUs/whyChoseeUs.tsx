"use client";

import Image from "next/image";
import { Container, Row, Col } from "react-bootstrap";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import { useRef } from "react";
import {
  TinySliderWrapper as TinySlider,
  type TinySliderHandle,
} from "@/components/common/TinySliderWrapper";
import { useTranslation } from "react-i18next";

const CARD_IMAGES = [
  "/images/why%20choose%20us/licensed-local-egyptologist-guide-temple-tour.webp",
  "/images/why%20choose%20us/one-party-at-a-time-abu-simbel-private-tour.webp",
  "/images/why%20choose%20us/cairo-based-egypt-tour-operator-nile-cityscape.webp",
  "/images/why%20choose%20us/flexible-private-egypt-tour-temple-visit.webp",
  "/images/why%20choose%20us/easy-card-payment-egypt-tour-booking.webp",
  "/images/why%20choose%20us/fast-whatsapp-reply-egypt-tour-operator.webp",
];

const WhyChooseUs = () => {
  const sliderRef = useRef<TinySliderHandle>(null);
  const { t, i18n } = useTranslation("common");

  const cards = [
    { title: t("whyChooseUs.card1Title"), desc: t("whyChooseUs.card1Desc") },
    { title: t("whyChooseUs.card2Title"), desc: t("whyChooseUs.card2Desc") },
    { title: t("whyChooseUs.card3Title"), desc: t("whyChooseUs.card3Desc") },
    { title: t("whyChooseUs.card4Title"), desc: t("whyChooseUs.card4Desc") },
    { title: t("whyChooseUs.card5Title"), desc: t("whyChooseUs.card5Desc") },
    { title: t("whyChooseUs.card6Title"), desc: t("whyChooseUs.card6Desc") },
  ];

  const carouselOptions = {
    items: 1,
    gutter: 30,
    loop: true,
    speed: 700,
    controls: false,
    nav: false,
    autoplay: false,
    responsive: {
      0: { items: 1 },
      575: { items: 2 },
      768: { items: 3 },
      992: { items: 3 },
    },
  };

  return (
    <section className='destinations-two section-space' id='why-choose-us'>
      <Container>
        <div className='destinations-two__top'>
          <Row className='align-items-end'>
            <Col lg={8}>
              <div className='sec-title'>
                <p className='sec-title__tagline'>
                  <TextAnimation text={t("whyChooseUs.tagline")} animationType='right' semantic />
                </p>
                <h2 className='sec-title__title'>
                  <TextAnimation text={t("whyChooseUs.title")} animationType='left' semantic />
                </h2>
                <p className='sec-title__subtitle'>
                  {t("whyChooseUs.subtitle")}
                </p>
              </div>
            </Col>
            <Col lg={4}>
              <div className='destinations-two__bottom__nav'>
                <button
                  type="button"
                  className='destinations-two__carousel__nav--left'
                  aria-label={t("destinations.carousel.previous")}
                  onClick={() => sliderRef.current?.slider?.goTo("prev")}
                >
                  <span className='icon-arrow-left'></span>
                </button>
                <button
                  type="button"
                  className='destinations-two__carousel__nav--right'
                  aria-label={t("destinations.carousel.next")}
                  onClick={() => sliderRef.current?.slider?.goTo("next")}
                >
                  <span className='icon-arrow-right'></span>
                </button>
              </div>
            </Col>
          </Row>
        </div>
        <TinySlider
          ref={sliderRef}
          className='destinations-two__carousel gotur-owl__carousel gotur-owl__carousel--custom-nav gotur-owl__carousel--with-shadow owl-carousel owl-theme owl-loaded owl-drag'
          settings={carouselOptions}
          rebuildKey={i18n.language}
          // Pre-hydration the six cards stacked vertically; see custom.css.
          placeholderClassName="destinations-two__carousel tns-placeholder-single"
        >
          {cards.map((card, index) => (
            <div key={index}>
              <div className='item'>
                <div className='destinations-card-two'>
                  <div className='destinations-card-two__thumb'>
                    <Image
                      src={CARD_IMAGES[index]}
                      alt={card.title}
                      className='img-fluid'
                      width={400}
                      height={500}
                    />
                    <div className='reason-card__overlay'></div>
                    <div className='reason-card__content'>
                      <h3 className='reason-card__title'>{card.title}</h3>
                      <p className='reason-card__description'>{card.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </TinySlider>
      </Container>
    </section>
  );
};

export default WhyChooseUs;
