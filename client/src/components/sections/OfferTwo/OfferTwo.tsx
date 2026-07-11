"use client";
import React from "react";

import { Row, Col } from "react-bootstrap";
import Image, { StaticImageData } from "next/image";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Clock } from "lucide-react";
import { offerTwoData } from "@/data/offerTwoData";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";

interface OfferData {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  count: number;
  tagline: string;
  funfactText: string;
  upToText: string;
  shapes: {
    shape1: StaticImageData;
    planShape: StaticImageData;
  };
}

const OfferTwo = () => {
  const {
    title,
    subtitle,
    buttonText,
    count,
    tagline,
    funfactText,
    upToText,
    shapes,
  }: OfferData = offerTwoData;

  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const buttonLink = `/${locale}/special-offers`;

  // Using IntersectionObserver to trigger animations when the section comes into view
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.5,
  });

  return (
    <section className='offer-two section-space-bottom' ref={ref}>
      <div className='container'>
        <div className='offer-two__inner'>
          <Row>
            <Col lg={8} xl={6}>
              <div className='offer-two__content'>
                <div className='sec-title text-start'>
                  <h6 className='sec-title__tagline bw-split-in-right'>
                    <TextAnimation text={tagline} animationType='right' />
                  </h6>{" "}
                  <h3 className='sec-title__title bw-split-in-left'>
                    <TextAnimation text={title} animationType='left' />
                    <span>
                      <TextAnimation text={subtitle} animationType='left' />
                    </span>
                  </h3>
                </div>
                <div
                  className='offer-two__btn wow fadeInUp'
                  data-wow-delay='0.2s'
                  data-wow-duration='1500ms'
                >
                  <Link href={buttonLink} className='gotur-btn'>
                    {buttonText}{" "}
                    <span className='icon'>
                      <i className='icon-right'></i>
                    </span>
                  </Link>
                </div>
              </div>
            </Col>
          </Row>

          <div
            className='offer-two__thumb wow fadeInLeft'
            data-wow-duration='1500ms'
            data-wow-delay='400ms'
          >
            <div className='offer-two__thumb__item offer-two__thumb__item'>
              <Image
                src='/images/egypt-tour-traveler-with-suitcase-jes-egypt-tour.webp'
                alt='Female traveler with a suitcase exploring Egypt'
                width={489}
                height={652}
                style={{ objectFit: "contain" }}
              />
            </div>
            <div className='offer-two__thumb__element'></div>
          </div>

          <div className='offer-two__funfact'>
            <span className='offer-two__sale-label'>
              <Clock
                size={14}
                strokeWidth={2.5}
                aria-hidden='true'
                className='offer-two__sale-label__icon'
              />
              Limited-Time Offer
            </span>
            <div className='offer-two__funfact__item'>
              <div className='offer-two__funfact__item__inner count-box'>
                <h2 className='offer-two__funfact__item__count'>
                  <span className='count-text'>
                    {inView && <CountUp start={0} end={count} duration={2} />}
                  </span>
                  <span>%</span>
                </h2>
                <p className='offer-two__funfact__item__text'>{funfactText}</p>{" "}
                <span className='offer-two__funfact__item__upto'>
                  {upToText}
                </span>{" "}
                <div className='offer-two__funfact__item__shape'>
                  <Image src={shapes.shape1} alt='shape' />
                </div>
              </div>
            </div>
          </div>

          <div className='offer-two__element w-full max-w-[60%] pointer-events-none'>
            <Image
              src='/images/egypt-nile-felucca-pyramids-travel-scene.webp'
              alt=''
              width={720}
              height={480}
              className="max-w-full h-auto"
            />
          </div>
          <div className='offer-two__element-two w-full max-w-[50%] pointer-events-none'>
            <Image
              src='/images/egypt-tour-airplane-decoration.png'
              alt='about shape'
              width={293}
              height={155}
              className="max-w-full h-auto"
            />
          </div>
          <div className='offer-two__element-three w-full max-w-[50%] pointer-events-none'>
            <Image src={shapes.planShape} alt='plan shape' className="max-w-full h-auto" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default OfferTwo;
