"use client";

import React from "react";
import Image, { StaticImageData } from "next/image";
import { aboutOneData } from "@/data/aboutOne";
import { Col, Container, Row } from "react-bootstrap";
import Link from "next/link";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import { useParams } from "next/navigation";

export interface Feature {
  icon: string;
  text: string;
}

export interface Mission {
  icon: string;
  title: string;
  text: string;
}

export interface Button {
  text: string;
  link: string;
  callIcon: string;
  callText: string;
  phone: string;
}

export interface SecondaryButton {
  text: string;
  link: string;
}

export interface AboutData {
  title: string;
  titleHighlight?: string;
  subtitle: string;
  description: string;
  features: Feature[];
  mission: Mission;
  button: Button;
  secondaryButton?: SecondaryButton;
  images: {
    mainImage: StaticImageData | string;
    smallImage: StaticImageData | string;
    popupImage: StaticImageData | string;
    shape1: StaticImageData | string;
    shape2: StaticImageData | string;
  };
}

interface AboutOneProps {
  extraclass?: string;
}

const AboutOne: React.FC<AboutOneProps> = ({ extraclass }) => {
  const {
    title,
    titleHighlight,
    subtitle,
    description,
    features,
    mission,
    button,
    secondaryButton,
    images,
  }: AboutData = aboutOneData;

  const params = useParams();
  const locale = (params?.locale as string) || "en";

  return (
    <section className={`about-one section-space ${extraclass}`} id='about'>
      <Container>
        <Row className='gutter-y-40'>
          <Col lg={6}>
            <div
              className='about-one__thumb wow fadeInLeft'
              data-wow-duration='1500ms'
              data-wow-delay='300ms'
            >
              <div className='about-one__thumb__item'>
                <Image
                  src={images.mainImage}
                  alt='Private Egypt Tours - Giza Pyramids'
                  width={600}
                  height={480}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              </div>
              <div className='about-one__thumb__item-small'>
                <Image
                  src={images.smallImage}
                  alt='Egypt private guide - temple tour'
                  width={220}
                  height={180}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              </div>
              <div className='about-one__thumb__item-popup'>
                <Image src={images.popupImage} alt='JES Egypt Tours' />
              </div>
            </div>
          </Col>

          <Col lg={6}>
            <div className='about-one__right'>
              <div className='sec-title wow fadeInUp' data-wow-duration='1200ms' data-wow-delay='100ms'>
                <h6 className='sec-title__tagline bw-split-in-right'>
                  <TextAnimation text={subtitle} animationType='right' />
                </h6>
                <h3 className='sec-title__title bw-split-in-left'>
                  {title}{" "}
                  {titleHighlight && <span>{titleHighlight}</span>}
                </h3>
              </div>

              <p
                className='about-one__top__text wow fadeInUp'
                data-wow-duration='1200ms'
                data-wow-delay='200ms'
              >
                {description}
              </p>

              <div className='about-one__feature'>
                <Row>
                  <Col
                    xs={12}
                    className='wow fadeInUp'
                    data-wow-duration='1200ms'
                    data-wow-delay='300ms'
                  >
                    <ul className='about-one__feature-list'>
                      {features.map((feature, index) => (
                        <li key={index}>
                          <i className='icon-check-star'></i> {feature.text}
                        </li>
                      ))}
                    </ul>
                  </Col>

                  <Col
                    xs={12}
                    className='wow fadeInUp'
                    data-wow-duration='1200ms'
                    data-wow-delay='450ms'
                  >
                    <div className='about-one__feature-vestion'>
                      <div className='about-one__feature_icon'>
                        <i className={mission.icon}></i>
                      </div>
                      <div className='about-one__feature-content'>
                        <h5 className='about-one__feature-title'>
                          {mission.title}
                        </h5>
                        <p className='about-one__feature-text'>
                          {mission.text}
                        </p>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              <div
                className='about-one__button wow fadeInUp'
                data-wow-duration='1200ms'
                data-wow-delay='550ms'
              >
                <div className='about-one__button-links'>
                  <Link
                    href={`/${locale}/${button.link}`}
                    className='gotur-btn gotur-btn--primary'
                  >
                    {button.text}{" "}
                    <span className='icon'>
                      <i className='icon-right'></i>
                    </span>
                  </Link>

                  {secondaryButton && (
                    <Link
                      href={`/${locale}/${secondaryButton.link}`}
                      className='gotur-btn'
                    >
                      {secondaryButton.text}{" "}
                      <span className='icon'>
                        <i className='icon-right'></i>
                      </span>
                    </Link>
                  )}
                </div>

                <div className='about-one__button__call'>
                  <div className='about-one__button__call__icon'>
                    <i className={button.callIcon}></i>
                  </div>
                  <div className='about-one__button__call__content'>
                    <span>{button.callText}</span>
                    <Link href={`https://wa.me/${button.phone.replace(/\D/g, "")}`} target='_blank' rel='noopener noreferrer' style={{ whiteSpace: 'nowrap' }}>
                      {button.phone}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      <div className='about-one__element-one'>
        <Image src={images.shape1} alt='' aria-hidden='true' width={293} height={155} />
      </div>
      <div className='about-one__element-two'>
        <Image src={images.shape2} alt='' aria-hidden='true' width={500} height={300} />
      </div>
    </section>
  );
};

export default AboutOne;
