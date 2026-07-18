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
import { Handshake } from "lucide-react";

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
                        <Handshake size={40} strokeWidth={1.8} aria-hidden='true' />
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
