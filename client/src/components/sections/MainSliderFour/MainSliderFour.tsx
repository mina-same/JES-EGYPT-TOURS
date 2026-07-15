"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, ChevronDown, Headset, ShieldCheck, Sparkles, Wallet } from "lucide-react";

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

// Display-side text hygiene: trim + collapse stray spaces before punctuation
// ("Your Guide , And" → "Your Guide, And"), matching the admin's save-time
// normalization so the homepage always renders clean even for legacy content.
const cleanHeroText = (value: unknown): string =>
  (typeof value === "string" ? value : "").replace(/\s+([,.;:!?…])/g, "$1").trim();

const mapApiSlideToVm = (item: ApiSliderItem, lang: string): SlideVM => ({
  id: item._id,
  subtitle: cleanHeroText(getLocalizedValue(item.subtitle, lang)),
  title: cleanHeroText(getLocalizedValue(item.title, lang)),
  titleSpan: cleanHeroText(getLocalizedValue(item.titleSpan, lang)),
  titleEnd: cleanHeroText(getLocalizedValue(item.titleEnd, lang)),
  imageUrl: item.image?.url,
  imageAlt:
    getLocalizedValue(item.image?.alt, lang) ||
    getLocalizedValue(item.image?.title, lang) ||
    "slider image",
  buttonText: item.button?.text ? getLocalizedValue(item.button.text, lang) : undefined,
  // The button link is localized per language (legacy items may hold a plain
  // string = the English link); getLocalizedValue resolves the active
  // language and falls back to English when a translation is empty.
  buttonLink: item.button?.link ? getLocalizedValue(item.button.link, lang) || undefined : undefined,
  buttonTarget: item.button?.linkDirection,
});

// Keep in sync with the dot progress-fill duration in custom.css
// (heroDotProgress animation).
const AUTOPLAY_MS = 6000;

const baseSettings = {
  loop: true,
  autoplay: true,
  mode: "gallery",
  animateOut: "tns-fadeOut",
  animateIn: "tns-fadeIn",
  items: 1,
  gutter: 0,
  // The library's own drag/touch is BROKEN in gallery (fade) mode: any 1px
  // movement counts as a swipe (no threshold) and transitions interrupt each
  // other, causing rapid uncontrolled flipping. Both are disabled — swiping
  // is reimplemented with a proper threshold in this component instead.
  mouseDrag: false,
  touch: false,
  // Never let a new transition cut into a running fade.
  preventActionWhenRunning: true,
  // No prev/next arrows: navigation is swipe/drag + the dot indicator.
  controls: false,
  autoplayButtonOutput: false,
  // Pause the rotation while the visitor hovers/reads the hero.
  autoplayHoverPause: true,
  autoplayTimeout: AUTOPLAY_MS,
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
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const params = useParams();
  const locale = (params?.locale as string) || "en";

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
  const hasMultiple = slides.length > 1;

  // The dot indicator only makes sense with more than one slide. tiny-slider
  // binds clicks + toggles `tns-nav-active` on the buttons we render in
  // `.main-slider-four__dots` (its real option is `nav`, not owl's `dots`).
  const settings = useMemo(
    () =>
      hasMultiple
        ? { ...baseSettings, nav: true, navContainer: ".main-slider-four__dots" }
        : { ...baseSettings, nav: false },
    [hasMultiple]
  );

  const scrollDown = () => {
    if (typeof window !== "undefined") {
      window.scrollBy({ top: window.innerHeight * 0.9, behavior: "smooth" });
    }
  };

  // ---- Custom swipe navigation (replaces the library's gallery-mode drag,
  // which flips on any 1px movement). A gesture counts as a swipe only when
  // it is clearly horizontal and travels >= 50px — then exactly ONE flip.
  const SWIPE_THRESHOLD_PX = 50;
  const sliderRef = useRef<any>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    swipeStart.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || !hasMultiple) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) >= SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
      // Swallow the click that follows the gesture so a swipe ending on a
      // link/button doesn't also activate it.
      suppressClick.current = true;
      sliderRef.current?.slider?.goTo(dx < 0 ? "next" : "prev");
    }
  };

  const onPointerCancel = () => {
    swipeStart.current = null;
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <section className={`main-slider-four${hasSlides ? "" : " main-slider-four--empty"}`} id="home">
      <div
        className="main-slider-four__carousel gotur-owl__carousel owl-carousel"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClickCapture={onClickCapture}
      >
        {hasSlides ? (
          <TinySlider ref={sliderRef} settings={settings} placeholderClassName="main-slider-four__slider-placeholder">
            {slides.map((item, index) => {
              const primaryLabel = item.buttonText || t("hero.primaryCtaFallback");
              const primaryHref = item.buttonLink || `/${locale}/tailor-made`;
              const primaryExternal = item.buttonTarget === "_blank";
              // Leading punctuation of titleEnd (e.g. ", your guide…") must
              // stay GLUED to the gold phrase — browsers may otherwise break
              // the line right before the comma (inline-block boundary is a
              // wrap opportunity). It is rendered inside a no-break wrapper
              // with the phrase; the rest of the text flows normally.
              const endPunct = item.titleSpan
                ? item.titleEnd.match(/^[,.;:!?…]+/)?.[0] ?? ""
                : "";
              const endRest = item.titleSpan
                ? item.titleEnd.slice(endPunct.length).trimStart()
                : item.titleEnd;
              return (
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
                          {item.subtitle && (
                            <h5 className="main-slider-four__subtitle">
                              <span className="main-slider-four__eyebrow-line" aria-hidden="true" />
                              <span>{item.subtitle}</span>
                              <span className="main-slider-four__eyebrow-line" aria-hidden="true" />
                            </h5>
                          )}
                          <h2 className="main-slider-four__title">
                            {item.title}
                            {item.titleSpan && (
                              <>
                                {" "}
                                <span className="main-slider-four__nobreak">
                                  <span className="main-slider-four__title-accent">
                                    {item.titleSpan}
                                    {/* Hand-drawn gold underline (inline SVG):
                                        stretches to the phrase width and takes
                                        the brand gold via currentColor. */}
                                    <svg
                                      className="main-slider-four__title-line"
                                      viewBox="0 0 330 24"
                                      preserveAspectRatio="none"
                                      fill="none"
                                      aria-hidden="true"
                                    >
                                      <path
                                        d="M8 17 C 90 7, 240 5, 322 11"
                                        stroke="currentColor"
                                        strokeWidth="5"
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                  </span>
                                  {endPunct}
                                </span>
                              </>
                            )}
                            {endRest && (
                              <>{item.titleSpan || !/^[,.;:!?…]/.test(endRest) ? " " : ""}{endRest}</>
                            )}
                          </h2>
                          <span className="main-slider-four__divider" aria-hidden="true" />
                          <div className="main-slider-four__cta">
                            <Link
                              href={primaryHref}
                              target={primaryExternal ? "_blank" : undefined}
                              rel={primaryExternal ? "noopener noreferrer" : undefined}
                              className="main-slider-four__cta-primary"
                            >
                              {primaryLabel}
                              <ArrowRight size={18} aria-hidden="true" />
                            </Link>
                            <Link
                              href={`/${locale}/special-offers`}
                              className="main-slider-four__cta-secondary"
                            >
                              {t("hero.secondaryCta")}
                              <ArrowRight size={18} aria-hidden="true" />
                            </Link>
                          </div>
                          <ul className="main-slider-four__trust">
                            <li>
                              <ShieldCheck size={18} aria-hidden="true" />
                              {t("hero.trust1")}
                            </li>
                            <li>
                              <Wallet size={18} aria-hidden="true" />
                              {t("hero.trust2")}
                            </li>
                            <li>
                              <Headset size={18} aria-hidden="true" />
                              {t("hero.trust3")}
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </TinySlider>
        ) : (
          <div className="main-slider-four__empty-shell" aria-hidden="true" />
        )}
        {/* Glass-pill slide indicator: one dot per slide, clickable; the
            active dot stretches into a gold "worm" whose fill visualizes the
            auto-rotation. tiny-slider wires the clicks via navContainer. */}
        {hasMultiple && (
          <div className="main-slider-four__dots" aria-label="Slides">
            {slides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Go to slide ${index + 1} of ${slides.length}`}
              />
            ))}
          </div>
        )}
        {hasSlides && (
          <button
            type="button"
            className="main-slider-four__scroll"
            aria-label={t("hero.scroll")}
            onClick={scrollDown}
          >
            <span>{t("hero.scroll")}</span>
            <ChevronDown size={20} aria-hidden="true" />
          </button>
        )}
      </div>
      {(() => {
        // The link is localized per language (legacy documents may still hold
        // a plain string = the English link). getLocalizedValue resolves the
        // active language and falls back to English when a translation is
        // empty, so the bar never disappears for untranslated locales.
        const promoText = getLocalizedValue(promo?.text, lang);
        const promoHref = getLocalizedValue(promo?.link, lang);
        const promoLinkText = getLocalizedValue(promo?.linkText, lang);
        if (!promoText || !promoHref || !promoLinkText) return null;
        return (
          <div className="main-slider-four__promo-wrapper">
            <span className="main-slider-four__promo-text">
              <Sparkles size={16} aria-hidden="true" className="main-slider-four__promo-icon" />
              {promoText}{" "}
              <Link
                href={promoHref}
                target={promo?.linkDirection === "_blank" ? "_blank" : undefined}
                rel={promo?.linkDirection === "_blank" ? "noopener noreferrer" : undefined}
                className="main-slider-four__promo-btn"
              >
                {promoLinkText} →
              </Link>
            </span>
          </div>
        );
      })()}
    </section>
  );
};

export default MainSliderFour;
