"use client";
import React, { useEffect, useMemo, useState } from "react";

import Image from "next/image";
import LineShape from "@/assets/images/shapes/line-shape.png";
import Link from "next/link";
import { SliderItem as ApiSliderItem, SliderUnderPromo } from "@/types/slider";
import { sliderService } from "@/services/sliderService";
import { useTranslation } from "react-i18next";
import { getLocalizedValue } from "@/lib/localize";
import { TinySliderWrapper as TinySlider } from "@/components/common/TinySliderWrapper";

type SlideVM = {
  id: string;
  subtitle: string;
  title: string;
  titleSpan: string;
  titleEnd: string;
  imageUrl: string;
  imageAlt?: string;
  buttonText?: string;
  buttonLink?: string;
  buttonTarget?: "_blank" | "_self";
};

const mapApiSlideToVm = (item: ApiSliderItem, lang: string): SlideVM => ({
  id: item._id,
  subtitle: getLocalizedValue(item.subtitle, lang),
  title: getLocalizedValue(item.title, lang),
  titleSpan: getLocalizedValue(item.titleSpan, lang),
  titleEnd: getLocalizedValue(item.titleEnd, lang),
  imageUrl: item.image?.url,
  imageAlt:
    getLocalizedValue(item.image?.alt, lang) ||
    getLocalizedValue(item.image?.title, lang) ||
    "slider image",
  buttonText: item.button?.text ? getLocalizedValue(item.button.text, lang) : undefined,
  buttonLink: item.button?.link,
  buttonTarget: item.button?.linkDirection,
});

const settings = {
  loop: true,
  autoplay: true,
  mode: "gallery",
  animateOut: "tns-fadeOut",
  animateIn: "tns-fadeIn",
  items: 1,
  gutter: 0,
  mouseDrag: true,
  preventScrollOnTouch: "auto",
  nav: false,
  autoplayButtonOutput: false,
  controlsContainer: ".owl-nav",
  dots: true,
  autoplayTimeout: 6000,
  speed: 1000,
};

type MainSliderFourProps = {
  initialSliders?: ApiSliderItem[];
  initialPromo?: SliderUnderPromo | null;
};

const MainSliderFour: React.FC<MainSliderFourProps> = ({
  initialSliders = [],
  initialPromo = null,
}) => {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  // Single source of truth for the server-fed slides (maps + filters once).
  const initialSlides = useMemo(
    () =>
      initialSliders
        .map((item) => mapApiSlideToVm(item, lang))
        .filter((s) => !!s.imageUrl),
    [initialSliders, lang]
  );

  const [slides, setSlides] = useState<SlideVM[]>(initialSlides);
  const [promo, setPromo] = useState<SliderUnderPromo | null>(initialPromo);

  // Keep slides in sync with the server data / active language.
  useEffect(() => {
    setSlides(initialSlides);
  }, [initialSlides]);

  // Client fallback: fetch slides only when the server provided none.
  useEffect(() => {
    if (initialSlides.length) return;
    let alive = true;
    sliderService
      .getActiveSliderContent()
      .then((items) => {
        if (!alive) return;
        setSlides(
          (items || [])
            .map((item) => mapApiSlideToVm(item, lang))
            .filter((s) => !!s.imageUrl)
        );
      })
      .catch(() => {
        if (alive) setSlides([]);
      });
    return () => {
      alive = false;
    };
  }, [initialSlides, lang]);

  // Client fallback: fetch the promo only when the server didn't provide it.
  useEffect(() => {
    if (initialPromo) return;
    let alive = true;
    sliderService
      .getPublicSliderPromo()
      .then((p) => {
        if (alive) setPromo(p || null);
      })
      .catch(() => {
        if (alive) setPromo(null);
      });
    return () => {
      alive = false;
    };
  }, [initialPromo]);

  const hasSlides = slides.length > 0;

  return (
    <section className={`main-slider-four${hasSlides ? "" : " main-slider-four--empty"}`} id="home">
      <div className="main-slider-four__carousel gotur-owl__carousel owl-carousel">
        {hasSlides ? (
          <TinySlider settings={settings} placeholderClassName="main-slider-four__slider-placeholder">
            {slides.map((item, index) => (
              <div key={item.id}>
                <div className="item">
                  <div className="main-slider-four__item">
                    <div className="main-slider-four__bg">
                      <Image
                        src={item.imageUrl}
                        alt={item.imageAlt || "slider image"}
                        fill
                        priority={index === 0}
                        sizes="100vw"
                      />
                    </div>
                    <div className="container">
                      <div className="main-slider-four__content">
                        <h5 className="main-slider-four__subtitle">{item.subtitle}</h5>
                        <h2 className="main-slider-four__title">
                          {item.title}
                          {item.titleSpan && (
                            <>
                              {" "}
                              <span>
                                {item.titleSpan}
                                <Image src={LineShape} alt="" aria-hidden width={330} height={24} />
                              </span>
                            </>
                          )}
                          {item.titleEnd && <> {item.titleEnd}</>}
                        </h2>
                        {item.buttonText && item.buttonLink && (
                          <div className="wow fadeInUp animated mt-30" data-wow-duration="1500ms" data-wow-delay="600ms">
                            <Link
                              href={item.buttonLink}
                              target={item.buttonTarget === "_blank" ? "_blank" : undefined}
                              rel={item.buttonTarget === "_blank" ? "noopener noreferrer" : undefined}
                              className="gotur-btn gotur-btn--primary"
                            >
                              {item.buttonText} <span className="icon"><i className="icon-right"></i></span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </TinySlider>
        ) : (
          <div className="main-slider-four__empty-shell" aria-hidden="true" />
        )}
        {hasSlides && (
          <div className="owl-nav">
            <button type="button" role="presentation" className="owl-prev" aria-label="carousel button">
              <span className="icon-arrow-left"></span>
            </button>
            <button type="button" role="presentation" className="owl-next" aria-label="carousel button">
              <span className="icon-arrow-right"></span>
            </button>
          </div>
        )}
      </div>
      <div className="main-slider-four__action-form">
        <div className="main-slider-four__form text-center">
          {promo?.text && promo?.link && promo?.linkText && (
            <div className="main-slider-four__promo-wrapper">
              <span className="main-slider-four__promo-text">
                🎉 {getLocalizedValue(promo.text, lang)}{" "}
                <Link
                  href={promo.link}
                  target={promo.linkDirection === "_blank" ? "_blank" : undefined}
                  rel={promo.linkDirection === "_blank" ? "noopener noreferrer" : undefined}
                  className="main-slider-four__promo-btn"
                >
                  {getLocalizedValue(promo.linkText, lang)} →
                </Link>
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MainSliderFour;
