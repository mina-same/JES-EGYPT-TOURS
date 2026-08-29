"use client";
import React from "react";

import { Row, Col } from "react-bootstrap";
import Image from "next/image";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Clock } from "lucide-react";
import { getLocalizedStaticSlug } from "@/lib/url";
import { offerTwoData } from "@/data/offerTwoData";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import { useTranslation } from "react-i18next";

const OfferTwo = () => {
  // Every string in this band was an English literal in offerTwoData (plus a
  // hardcoded "Limited-Time Offer" below), so the German, Italian and Spanish
  // homepages showed an entirely English promotional section.
  const { t } = useTranslation("common");
  const { count, shapes } = offerTwoData;

  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const buttonLink = `/${locale}/${getLocalizedStaticSlug("special-offers", locale)}`;

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
                  <p className='sec-title__tagline bw-split-in-right'>
                    <TextAnimation text={t("specialOffer.tagline")} animationType='right' semantic />
                  </p>{" "}
                  <h2 className='sec-title__title bw-split-in-left'>
                    <TextAnimation
                      text={`${t("specialOffer.title")} ${t("specialOffer.subtitle")}`}
                      animationType='left'
                      semantic
                    />
                  </h2>
                </div>
                <div className='offer-two__btn'>
                  <Link href={buttonLink} className='gotur-btn'>
                    {t("specialOffer.cta")}{" "}
                    <span className='icon'>
                      <i className='icon-right' aria-hidden='true'></i>
                    </span>
                  </Link>
                </div>
              </div>
            </Col>
          </Row>

          <div className='offer-two__thumb'>
            <div className='offer-two__thumb__item offer-two__thumb__item'>
              <Image
                src='/images/egypt-tour-traveler-with-suitcase-jes-egypt-tour.webp'
                alt={t("specialOffer.travellerImageAlt")}
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
              {t("specialOffer.limitedTime")}
            </span>
            <div className='offer-two__funfact__item'>
              <div className='offer-two__funfact__item__inner count-box'>
                <div className='offer-two__funfact__item__count'>
                  <span className='count-text'>
                    {inView && <CountUp start={0} end={count} duration={2} />}
                  </span>
                  <span>%</span>
                </div>
                <p className='offer-two__funfact__item__text'>{t("specialOffer.off")}</p>{" "}
                <span className='offer-two__funfact__item__upto'>
                  {t("specialOffer.upTo")}
                </span>{" "}
                <div className='offer-two__funfact__item__shape'>
                  <Image src={shapes.shape1} alt='' aria-hidden='true' />
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
              alt='' aria-hidden='true'
              width={293}
              height={155}
              className="max-w-full h-auto"
            />
          </div>
          <div className='offer-two__element-three w-full max-w-[50%] pointer-events-none'>
            <Image src={shapes.planShape} alt='' aria-hidden='true' className="max-w-full h-auto" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default OfferTwo;
