"use client";
import React from "react";

import dynamic from "next/dynamic";
import mainSliderFourData from "@/data/mainSliderFourData";
import LineShape from "@/assets/images/shapes/line-shape.png";
import Link from "next/link";
import { SliderItem as ApiSliderItem, SliderUnderPromo } from "@/types/slider";
import { sliderService } from "@/services/sliderService";
// import BannerForm from "../BannerForm/BannerForm";

// Add custom styles for dots
const dotsStyles = `
  .tns-dots-container {
    text-align: center;
    margin-top: 20px;
  }
  .tns-dots {
    display: inline-flex;
    gap: 8px;
    padding: 0;
    margin: 0;
    list-style: none;
  }
  .tns-dots button {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid #fff;
    background: transparent;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 0;
  }
  .tns-dots button:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  .tns-dots button.tns-nav-active {
    background: #fff;
  }
`;

const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});

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

const mapApiSlideToVm = (item: ApiSliderItem): SlideVM => {
  return {
    id: item._id,
    subtitle: item.subtitle,
    title: item.title,
    titleSpan: item.titleSpan,
    titleEnd: item.titleEnd,
    imageUrl: item.image?.url,
    imageAlt: item.image?.alt || item.image?.title || "slider image",
    buttonText: item.button?.text,
    buttonLink: item.button?.link,
    buttonTarget: item.button?.linkDirection,
  };
};

const getFallbackSlides = (): SlideVM[] => {
  return (mainSliderFourData || []).map((item: any) => ({
    id: String(item.id),
    subtitle: item.subtitle,
    title: item.title,
    titleSpan: item.titleSpan,
    titleEnd: item.titleEnd,
    imageUrl: item.imageSrc?.src,
    imageAlt: item.imageAlt,
    buttonText: "Explore Tours",
    buttonLink: "/tours",
    buttonTarget: "_self",
  }));
};

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

const MainSliderFour: React.FC = () => {
  const [promo, setPromo] = React.useState<SliderUnderPromo | null>(null);
  const [slides, setSlides] = React.useState<SlideVM[]>(() => getFallbackSlides());

  React.useEffect(() => {
    // Inject custom styles for dots
    const styleId = 'main-slider-four-dots-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = dotsStyles;
      document.head.appendChild(style);
    }
  }, []);

  React.useEffect(() => {
    const loadSlides = async () => {
      try {
        const items = await sliderService.getActiveSliderContent();
        const mapped = (items || []).map(mapApiSlideToVm).filter((s) => !!s.imageUrl);

        setSlides(mapped.length ? mapped : getFallbackSlides());
      } catch {
        setSlides(getFallbackSlides());
      }
    };

    const loadPromo = async () => {
      try {
        const p = await sliderService.getPublicSliderPromo();
        setPromo(p || null);
      } catch {
        setPromo(null);
      }
    };

    loadSlides();
    loadPromo();
  }, []);

  return (
    <section className='main-slider-four' id='home'>
      <div className='main-slider-four__carousel gotur-owl__carousel owl-carousel'>
        <TinySlider settings={settings}>
          {slides?.map((item) => (
            <div key={item.id}>
              <div className='item'>
                <div className='main-slider-four__item'>
                  <div
                    className='main-slider-four__bg'
                    style={{
                      backgroundImage: `url(${item.imageUrl})`,
                    }}
                  ></div>
                  <div className='container'>
                    <div className='main-slider-four__content'>
                      <h5 className='main-slider-four__subtitle'>
                        {item.subtitle}
                      </h5>
                      <h2 className='main-slider-four__title'>
                        {item.title}{' '}
                        <span>
                          {item.titleSpan}
                          <img src={LineShape.src} alt='line' />
                        </span>
                        {' '}{item.titleEnd}
                      </h2>
                      {item.buttonText && item.buttonLink && (
                        <div className="main-slider-four__explore-btn wow fadeInUp animated" data-wow-duration="1500ms" data-wow-delay="600ms" >
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
        <div className='owl-nav'>
          <button
            type='button'
            role='presentation'
            className='owl-prev'
            aria-label='carousel button'
          >
            <span className='icon-arrow-left'></span>
          </button>
          <button
            type='button'
            role='presentation'
            className='owl-next'
            aria-label='carousel button'
          >
            <span className='icon-arrow-right'></span>
          </button>
        </div>
        {/* <div className='tns-dots-container'></div> */}
      </div>
      <div className='main-slider-four__action-form'>

          <div className='main-slider-four__form text-center'>
            {promo?.text && promo?.link && promo?.linkText && (
              <div className='main-slider-four__promo-wrapper'>
                <span className='main-slider-four__promo-text'>
                  🎉 {promo.text}{' '}
                  <Link
                    href={promo.link}
                    target={promo.linkDirection === '_blank' ? '_blank' : undefined}
                    rel={promo.linkDirection === '_blank' ? 'noopener noreferrer' : undefined}
                    className='main-slider-four__promo-btn'
                  >
                    {promo.linkText} →
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
