"use client";

import React from "react";
import Image, { StaticImageData } from "next/image";
import { localizeInternalUrl } from "@/lib/url";
import { aboutOneData } from "@/data/aboutOne";
import { Col, Container, Row } from "react-bootstrap";
import Link from "next/link";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
// Eye of Horus (no icon library ships one) — same stroke style as the site's lucide icons
const EyeOfHorusIcon = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width={40}
    height={40}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={1.35}
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <path d='M3.5 6.3C8 3.6 16 3.6 21 6.6' />
    <path d='M3 10.8C7.5 7.4 15.5 7.4 21 10.8C15.5 14.2 7.5 14.2 3 10.8Z' />
    <circle cx='12' cy='10.8' r='2.4' />
    <path d='M21 10.8L23.2 11.6' />
    <path d='M9 14L9 18.8C9 20.2 7.6 20.6 6.9 19.8' />
    <path d='M16.5 13.8C17.9 16 18 18.6 16.2 19.9C14.8 20.8 13.4 19.6 14 18.4C14.5 17.4 15.9 17.6 16 18.6' />
  </svg>
);

export interface Button {
  link: string;
  callIcon: string;
  phone: string;
}

export interface SecondaryButton {
  link: string;
}

export interface AboutData {
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
  headingLevel?: "h1" | "h2";
}

const AboutOne: React.FC<AboutOneProps> = ({ extraclass, headingLevel = "h2" }) => {
  const { button, secondaryButton, images }: AboutData = aboutOneData;
  const { t } = useTranslation("common");

  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const HeadingTag = headingLevel;
  const MissionHeadingTag = headingLevel === "h1" ? "h2" : "h3";

  const features = [t("about.feature1"), t("about.feature2")];

  return (
    <section className={`about-one section-space ${extraclass ?? ""}`} id='about'>
      <Container>
        <Row className='gutter-y-40'>
          <Col lg={6}>
            <div className='about-one__thumb'>
              <div className='about-one__thumb__item'>
                <Image
                  src={images.mainImage}
                  alt={t("about.mainImageAlt")}
                  width={600}
                  height={480}
                  sizes='(max-width: 991px) 100vw, 50vw'
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              </div>
              {/* NOTE: no `sizes` here — the absolutely-positioned container
                  shrink-wraps, so the browser derives the DISPLAY size from the
                  chosen source file; a `sizes` attr visibly shrinks the photo. */}
              <div className='about-one__thumb__item-small'>
                <Image
                  src={images.smallImage}
                  alt={t("about.smallImageAlt")}
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
              <div className='sec-title'>
                <p className='sec-title__tagline'>
                  <TextAnimation text={t("about.tagline")} animationType='right' semantic />
                </p>
                <HeadingTag className='sec-title__title'>
                  {t("about.title")}{" "}
                  <span>{t("about.titleHighlight")}</span>
                </HeadingTag>
              </div>

              <p className='about-one__top__text'>
                {t("about.description")}
              </p>

              <div className='about-one__feature'>
                <Row>
                  <Col xs={12}>
                    <ul className='about-one__feature-list'>
                      {features.map((feature) => (
                        <li key={feature}>
                          <i className='icon-check-star' aria-hidden='true'></i> {feature}
                        </li>
                      ))}
                    </ul>
                  </Col>

                  <Col xs={12}>
                    <div className='about-one__feature-vestion'>
                      <div className='about-one__feature_icon'>
                        <EyeOfHorusIcon />
                      </div>
                      <div className='about-one__feature-content'>
                        <MissionHeadingTag className='about-one__feature-title'>
                          {t("about.approachTitle")}
                        </MissionHeadingTag>
                        <p className='about-one__feature-text'>
                          {t("about.approachText")}
                        </p>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              <div className='about-one__button'>
                <div className='about-one__button-links'>
                  <Link
                    href={localizeInternalUrl(button.link, locale)}
                    className='gotur-btn gotur-btn--primary'
                  >
                    {t("about.exploreCta")}{" "}
                    <span className='icon'>
                      <i className='icon-right' aria-hidden='true'></i>
                    </span>
                  </Link>

                  {secondaryButton && (
                    <Link
                      href={localizeInternalUrl(secondaryButton.link, locale)}
                      className='gotur-btn'
                    >
                      {t("about.customTripCta")}{" "}
                      <span className='icon'>
                        <i className='icon-right' aria-hidden='true'></i>
                      </span>
                    </Link>
                  )}
                </div>

                <div className='about-one__button__call'>
                  {/* the label promises both channels: icon opens WhatsApp, the number places a real call */}
                  <a
                    href={`https://wa.me/${button.phone.replace(/\D/g, "")}`}
                    className='about-one__button__call__icon'
                    target='_blank'
                    rel='noopener noreferrer'
                    aria-label='WhatsApp'
                  >
                    <i className={button.callIcon} aria-hidden='true'></i>
                  </a>
                  <div className='about-one__button__call__content'>
                    <span>{t("about.callText")}</span>
                    <a href={`tel:${button.phone.replace(/[^+\d]/g, "")}`} style={{ whiteSpace: 'nowrap' }}>
                      {button.phone}
                    </a>
                    <small className='about-one__button__call__note'>{t("about.replyTime")}</small>
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
        {/* true aspect ratio of the artwork (464x538) at ~75% size */}
        <Image src={images.shape2} alt='' aria-hidden='true' width={348} height={404} />
      </div>
    </section>
  );
};

export default AboutOne;
