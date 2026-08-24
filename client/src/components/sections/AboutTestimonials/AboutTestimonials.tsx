"use client";
import React, { useRef } from "react";

import Image, { StaticImageData } from "next/image"; // Import Image from next/image
import { Container, Row, Col } from "react-bootstrap";
import { aboutTestimonialsData } from "@/data/aboutTestimonialsData";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import ClientCarousel from "../ClientCarousel/ClientCarousel";

import {
  TinySliderWrapper as TinySlider,
  type TinySliderHandle,
} from "@/components/common/TinySliderWrapper";
export interface Testimonial {
  image: StaticImageData;
  text: string;
  authorName: string;
  position: string;
}

export interface AboutTestimonialsData {
  sectionTitle: string;
  sectionTagline: string;
  testiThumb: StaticImageData;
  testimonials: Testimonial[];
  shapeImages: StaticImageData[];
  brands: {
    image: StaticImageData;
    hoverImage: StaticImageData;
  }[];
}
const AboutTestimonials: React.FC = () => {
  const sliderRef = useRef<TinySliderHandle>(null);
  const {
    sectionTitle,
    sectionTagline,
    testiThumb,
    testimonials,
    shapeImages,
  }: AboutTestimonialsData = aboutTestimonialsData;
  return (
    <section className='about-testimonials section-space' id='testimonials'>
      <Container>
        <Row className=' align-items-center gutter-y-40'>
          <Col lg={4}>
            <div className='about-testimonials__left'>
              <div className='about-testimonials__thumb'>
                <div className='about-testimonials__thumb__item'>
                  <Image src={testiThumb} alt='man' />
                </div>
              </div>
            </div>
          </Col>
          <Col lg={8}>
            <div className='about-testimonials__right'>
              <div className='sec-title'>
                <h6 className='sec-title__tagline bw-split-in-right'>
                  <TextAnimation text={sectionTagline} animationType='right' />
                </h6>
                <h3 className='sec-title__title bw-split-in-left'>
                  <TextAnimation text={sectionTitle} animationType='left' />
                </h3>
              </div>
              <div className='gotur-owl__carousel--basic-nav owl-carousel about-testimonials__carousel gotur-owl__carousel owl-theme'>
                <TinySlider
                  ref={sliderRef}
                  settings={{
                    items: 1,
                    gutter: 30,
                    speed: 700,
                    loop: false,
                    rewind: true,
                    nav: false,
                    autoplay: false,
                    controls: false,
                    mouseDrag: true,
                  }}
                  className=''
                >
                  {testimonials.map((testimonial, index) => (
                    <div className='about-testimonials__item' key={index}>
                      {/* No star row — see TestimonialsTwo: five hardcoded icons
                          on every quote, matching no rating anyone gave. */}
                      <p className='about-testimonials__text'>
                        {testimonial.text}
                      </p>
                      <div className='about-testimonials__author'>
                        <div className='about-testimonials__author__thumb'>
                          <Image src={testimonial.image} alt='author' />
                        </div>
                        <div className='about-testimonials__content'>
                          <h6 className='about-testimonials__title'>
                            {testimonial.authorName}
                          </h6>
                          <span>{testimonial.position}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </TinySlider>
                <div className='owl-nav'>
                  <button
                    type='button'
                    className='owl-prev'
                    aria-label='Previous testimonial'
                    onClick={() => sliderRef.current?.slider?.goTo("prev")}
                  >
                    <span className='icon-arrow-left'></span>
                  </button>
                  <button
                    type='button'
                    className='owl-next'
                    aria-label='Next testimonial'
                    onClick={() => sliderRef.current?.slider?.goTo("next")}
                  >
                    <span className='icon-arrow-right'></span>
                  </button>
                </div>
              </div>
            </div>
          </Col>
        </Row>
        <ClientCarousel />
      </Container>
      <div className='about-testimonials__element-one'>
        <Image src={shapeImages[0]} alt='shape-image' />
      </div>
      <div className='about-testimonials__element-two'>
        <Image src={shapeImages[1]} alt='shape-image' />
      </div>
    </section>
  );
};

export default AboutTestimonials;
