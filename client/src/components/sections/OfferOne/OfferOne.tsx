"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import "./OfferOne.css";

interface OfferOneProps {
  homeThree?: boolean;
}

const OfferOne: React.FC<OfferOneProps> = () => {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const { t } = useTranslation("common");

  const features = [
    t("tailorOffer.feature1"),
    t("tailorOffer.feature2"),
    t("tailorOffer.feature3"),
    t("tailorOffer.feature4"),
  ];

  return (
    <section className="offer-one section-space" id="tailor-made-offer">
      <Container>
        <Row className="gutter-y-40 align-items-center">
          {/* Content — left */}
          <Col lg={6}>
            <div className="about-one__right">
              <div
                className="sec-title wow fadeInUp"
                data-wow-duration="1200ms"
                data-wow-delay="100ms"
              >
                <h6 className="sec-title__tagline bw-split-in-right">
                  <TextAnimation
                    text={t("tailorOffer.tagline")}
                    animationType="right"
                  />
                </h6>
                <h3 className="sec-title__title bw-split-in-left">
                  <TextAnimation
                    text={t("tailorOffer.titleLine1")}
                    animationType="left"
                  />{" "}
                  <span>
                    <TextAnimation
                      text={t("tailorOffer.titleLine2")}
                      animationType="left"
                    />
                  </span>
                </h3>
              </div>

              <p
                className="about-one__top__text wow fadeInUp"
                data-wow-duration="1200ms"
                data-wow-delay="200ms"
              >
                {t("tailorOffer.desc")}
              </p>

              <div
                className="about-one__feature wow fadeInUp"
                data-wow-duration="1200ms"
                data-wow-delay="300ms"
              >
                <ul className="about-one__feature-list">
                  {features.map((feature, i) => (
                    <li key={i}>
                      <i className="icon-check-star"></i> {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className="offer-one__btn wow fadeInUp"
                data-wow-duration="1200ms"
                data-wow-delay="400ms"
              >
                <Link
                  href={`/${locale}/tailorMade`}
                  className="gotur-btn gotur-btn--primary"
                >
                  {t("tailorOffer.cta")}{" "}
                  <span className="icon">
                    <i className="icon-right"></i>
                  </span>
                </Link>
              </div>
            </div>
          </Col>

          {/* Image — right */}
          <Col lg={6}>
            <div
              className="offer-one__thumb wow fadeInLeft"
              data-wow-duration="1500ms"
              data-wow-delay="300ms"
            >
              <div className="offer-one__thumb__item">
                <Image
                  src="/images/backgrounds/giza-pyramids-sphinx-sunset-panorama-egypt.webp"
                  alt="Private Egypt Tour — Giza Pyramids at Sunset"
                  width={600}
                  height={480}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              </div>
              <div className="offer-one__thumb__badge">
                {t("tailorOffer.badge")}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default OfferOne;
