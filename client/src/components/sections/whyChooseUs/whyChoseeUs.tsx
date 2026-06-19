"use client";

import Image, { StaticImageData } from "next/image";
import { Container, Row, Col } from "react-bootstrap";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import whyChooseUsData from "@/data/destinationsTwoData";
import { useRef } from "react";
import { TinySliderWrapper as TinySlider } from "@/components/common/TinySliderWrapper";
import { useTranslation } from "react-i18next";

interface Destination {
  title: string;
  link: string;
  image: StaticImageData;
  hoverImage: StaticImageData;
}

interface WhyChooseUsData {
  tagline: string;
  title: string;
  destinations: Destination[];
}

const WhyChooseUs = () => {
  const { destinations }: WhyChooseUsData = whyChooseUsData;
  const sliderRef = useRef<any>(null);
  const { t } = useTranslation("common");

  const whyChooseUsContent = {
    tagline: t("whyChooseUs.tagline"),
    title: t("whyChooseUs.title"),
    subtitle: t("whyChooseUs.subtitle"),
    reasons: [
      {
        title: t("whyChooseUs.reasons.tailoredTitle"),
        description: t("whyChooseUs.reasons.tailoredDesc"),
      },
      {
        title: t("whyChooseUs.reasons.multiCountryTitle"),
        description: t("whyChooseUs.reasons.multiCountryDesc"),
      },
      {
        title: t("whyChooseUs.reasons.yearsTitle"),
        description: t("whyChooseUs.reasons.yearsDesc"),
      },
      {
        title: t("whyChooseUs.reasons.paymentTitle"),
        description: t("whyChooseUs.reasons.paymentDesc"),
      },
    ],
  };

  const carouselOptions = {
    items: 1,
    gutter: 30,
    loop: true,
    smartSpeed: 700,
    controls: true,
    controlsContainer: ".destinations-two__bottom__nav",
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
                <h6 className='sec-title__tagline'>
                  <TextAnimation text={whyChooseUsContent.tagline} animationType='right' />
                </h6>
                <h3 className='sec-title__title d-md-flex gap-2'>
                  <TextAnimation text={whyChooseUsContent.title} animationType='left' />
                </h3>
                <p className='sec-title__subtitle'>
                  {whyChooseUsContent.subtitle}
                </p>
              </div>
            </Col>
            <Col lg={4}>
              <div className='destinations-two__bottom__nav'>
                <button 
                  className='destinations-two__carousel__nav--left'
                  onClick={() => sliderRef.current?.slider?.goTo("prev")}
                >
                  <span className='icon-arrow-left'></span>
                </button>
                <button 
                  className='destinations-two__carousel__nav--right'
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
        >
          {destinations.map((dest: Destination, index) => (
            <div key={index}>
              <div className='item'>
                <div
                  className='destinations-card-two wow fadeInUp'
                  data-wow-duration='1500ms'
                  data-wow-delay='100ms'
                >
                  <div className='destinations-card-two__thumb'>
                    <Image
                      src={dest.image}
                      alt={dest.title}
                      className='img-fluid'
                    />
                    <div className='destinations-card-two__hover'>
                      <Image
                        src={dest.hoverImage}
                        alt={dest.title}
                        className='img-fluid'
                      />
                    </div>
                    {/* Add Why Choose Us content overlay */}
                    <div className='reason-card__overlay'></div>
                    <div className='reason-card__content'>
                      <h4 className='reason-card__title'>
                        {whyChooseUsContent.reasons[index]?.title || dest.title}
                      </h4>
                      <p className='reason-card__description'>
                        {whyChooseUsContent.reasons[index]?.description || ''}
                      </p>
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
