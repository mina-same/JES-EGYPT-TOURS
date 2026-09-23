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

/**
 * One reason card. The photo and its two copy keys travel together: they used
 * to live in two parallel arrays joined by nothing but the map index, so a
 * seventh card would have read `CARD_IMAGES[6]` — `undefined` at runtime, and
 * silent at build time because `noUncheckedIndexedAccess` is off.
 */
interface ReasonCard {
  image: string;
  titleKey: string;
  descKey: string;
}

/* The folder really is named with spaces on disk; the encoded path is what
   next/image needs and it resolves correctly through the optimizer. */
const REASON_CARDS: readonly ReasonCard[] = [
  {
    image: "/images/why%20choose%20us/licensed-local-egyptologist-guide-temple-tour.webp",
    titleKey: "whyChooseUs.card1Title",
    descKey: "whyChooseUs.card1Desc",
  },
  {
    image: "/images/why%20choose%20us/one-party-at-a-time-abu-simbel-private-tour.webp",
    titleKey: "whyChooseUs.card2Title",
    descKey: "whyChooseUs.card2Desc",
  },
  {
    image: "/images/why%20choose%20us/cairo-based-egypt-tour-operator-nile-cityscape.webp",
    titleKey: "whyChooseUs.card3Title",
    descKey: "whyChooseUs.card3Desc",
  },
  {
    image: "/images/why%20choose%20us/flexible-private-egypt-tour-temple-visit.webp",
    titleKey: "whyChooseUs.card4Title",
    descKey: "whyChooseUs.card4Desc",
  },
  {
    image: "/images/why%20choose%20us/easy-card-payment-egypt-tour-booking.webp",
    titleKey: "whyChooseUs.card5Title",
    descKey: "whyChooseUs.card5Desc",
  },
  {
    image: "/images/why%20choose%20us/fast-whatsapp-reply-egypt-tour-operator.webp",
    titleKey: "whyChooseUs.card6Title",
    descKey: "whyChooseUs.card6Desc",
  },
];

/**
 * The rendered card width at every breakpoint, so the browser stops picking a
 * resource sized for a viewport instead of for this card.
 *
 * Derived from the two things that actually decide it: the `.container`
 * max-width (Bootstrap's, capped at 1200px by gotur.css, minus 30px padding)
 * and the carousel's own `responsive` map below. tiny-slider gives each slide
 * `width: calc(100% / items)` of a track widened by a -30px right margin and
 * then eats the gutter with `padding-right: 30px`, so the visible card is
 * `(container + 30) / items - 30`:
 *
 *   <=574px   1 card    100vw - 30px   (544px at 574px wide)
 *   575px     2 cards  the one width this over-declares, by 287px
 *   <=767px   2 cards   540/2  - 30 = 240px
 *   <=991px   3 cards   720/3  - 30 = 210px
 *   <=1199px  3 cards   960/3  - 30 = 290px
 *   above     3 cards   1200/3 - 30 = 370px
 *
 * Note the card is at its widest on a phone, not on a desktop.
 */
const CARD_SIZES =
  "(max-width: 575px) calc(100vw - 30px), (max-width: 767px) 240px, (max-width: 991px) 210px, (max-width: 1199px) 290px, 370px";

const WhyChooseUs = () => {
  const sliderRef = useRef<TinySliderHandle>(null);
  const { t, i18n } = useTranslation("common");

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
          {REASON_CARDS.map((card) => (
            <div key={card.image}>
              <div className='item'>
                <div className='destinations-card-two'>
                  <div className='destinations-card-two__thumb'>
                    <Image
                      src={card.image}
                      // Decorative: the heading below carries the same
                      // meaning, and alt={title} made every card announce
                      // itself twice.
                      alt=""
                      className='img-fluid'
                      // The files' real pixels (they are 1106x1422). The
                      // old 400x500 declared 0.800 against an actual 0.778,
                      // so the reserved box was corrected after load.
                      width={1106}
                      height={1422}
                      sizes={CARD_SIZES}
                    />
                    <div className='reason-card__overlay'></div>
                    <div className='reason-card__content'>
                      <h3 className='reason-card__title'>{t(card.titleKey)}</h3>
                      <p className='reason-card__description'>{t(card.descKey)}</p>
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
