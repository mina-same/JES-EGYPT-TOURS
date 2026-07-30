"use client";

import { useCallback, useRef, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import type { TinySliderSettings } from "tiny-slider";
import "@/lib/i18n";
import destinationCarouselTwoData from "@/data/destinationCarouselTwoData";
import {
  TinySliderWrapper as TinySlider,
  type TinySliderHandle,
} from "@/components/common/TinySliderWrapper";
import { normalizeLocale } from "@/lib/url";

const sliderSettings: TinySliderSettings = {
  items: 1,
  gutter: 0,
  loop: false,
  rewind: true,
  nav: false,
  autoplay: false,
  controls: false,
  mouseDrag: true,
  speed: 600,
  preventActionWhenRunning: true,
  preventScrollOnTouch: "auto",
};

const DestinationCarouselTwo = () => {
  const { t } = useTranslation("common");
  const params = useParams<{ locale?: string }>();
  const locale = normalizeLocale(params?.locale);
  const sectionRef = useRef<HTMLElement>(null);
  const sliderRef = useRef<TinySliderHandle>(null);

  const syncAccessibility = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;

    section
      .querySelectorAll<HTMLElement>(".tns-item .destination-carousel__link")
      .forEach((link) => {
        link.tabIndex = link.closest(".tns-slide-active") ? 0 : -1;
      });
  }, []);

  const scheduleAccessibilitySync = useCallback(() => {
    window.requestAnimationFrame(syncAccessibility);
  }, [syncAccessibility]);

  const moveCarousel = useCallback((direction: "prev" | "next") => {
    sliderRef.current?.slider?.goTo(direction);
  }, []);

  const handleControlKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, direction: "prev" | "next") => {
      let requestedDirection: "prev" | "next" | null = null;
      if (event.key === "ArrowLeft") requestedDirection = "prev";
      if (event.key === "ArrowRight") requestedDirection = "next";
      if (event.key === "Enter" || event.key === " ") requestedDirection = direction;

      if (!requestedDirection) return;

      event.preventDefault();
      moveCarousel(requestedDirection);
    },
    [moveCarousel]
  );

  return (
    <section
      ref={sectionRef}
      className="destination-carousel destination-carousel--two section-space"
      aria-labelledby="destination-carousel-title"
    >
      <h2 id="destination-carousel-title" className="sr-only">
        {t("destinations.carousel.sectionTitle")}
      </h2>
      <div className="gotur-owl__carousel--basic-nav owl-carousel">
        <div id="destination-carousel-slides">
          <TinySlider
            ref={sliderRef}
            settings={sliderSettings}
            rebuildKey={locale}
            onInit={scheduleAccessibilitySync}
            onIndexChanged={scheduleAccessibilitySync}
            onTransitionEnd={scheduleAccessibilitySync}
            className="destination-carousel__inner owl-carousel owl-theme"
            placeholderClassName="destination-carousel__inner destination-carousel__inner--placeholder"
          >
            {destinationCarouselTwoData.map((item) => (
              <div className="item" key={item.id}>
                <div className="destination-carousel__item">
                  <Link
                    href={item.hrefByLocale[locale]}
                    className="destination-carousel__link"
                    draggable={false}
                    aria-label={t("destinations.carousel.viewDestination", {
                      destination: t(item.titleKey),
                    })}
                  >
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="100vw"
                      className="destination-carousel__image"
                      draggable={false}
                    />
                    <span className="destination-carousel__dim" aria-hidden="true" />
                    <span className="destination-carousel__text-group" aria-hidden="true">
                      <span className="destination-carousel__big-text">
                        {t(item.titleKey)}
                      </span>
                      <span className="destination-carousel__small-text">
                        {t(item.subtitleKey)}
                      </span>
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </TinySlider>
        </div>
        <nav
          className="owl-nav"
          aria-label={t("destinations.carousel.navigationLabel")}
        >
          <button
            type="button"
            className="owl-prev"
            aria-label={t("destinations.carousel.previous")}
            aria-controls="destination-carousel-slides"
            onClick={() => moveCarousel("prev")}
            onKeyDown={(event) => handleControlKeyDown(event, "prev")}
          >
            <span className="icon-arrow-left" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="owl-next"
            aria-label={t("destinations.carousel.next")}
            aria-controls="destination-carousel-slides"
            onClick={() => moveCarousel("next")}
            onKeyDown={(event) => handleControlKeyDown(event, "next")}
          >
            <span className="icon-arrow-right" aria-hidden="true" />
          </button>
        </nav>
      </div>
    </section>
  );
};

export default DestinationCarouselTwo;
