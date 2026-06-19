"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";
import destinationCarouselTwoData from "@/data/destinationCarouselTwoData";
import { TinySliderWrapper as TinySlider } from "@/components/common/TinySliderWrapper";

interface DestinationItem {
  id: number;
  image: string;
  titleKey: string;
  subtitleKey: string;
}

const DestinationCarouselTwo = () => {
  const { t } = useTranslation("common");

  return (
    <div className="destination-carousel destination-carousel--two section-space">
      <div className="gotur-owl__carousel--basic-nav owl-carousel">
        <TinySlider
          settings={{
            items: 1,
            gutter: 30,
            loop: true,
            nav: false,
            autoplay: false,
            controls: true,
            mouseDrag: true,
            controlsContainer: ".gotur-owl__carousel--basic-nav .owl-nav",
          }}
          className="destination-carousel__inner owl-carousel owl-theme"
        >
          {destinationCarouselTwoData.map((item: DestinationItem) => (
            <div className="item" key={item.id}>
              <div className="destination-carousel__item">
                <Image
                  src={item.image}
                  alt={t(item.titleKey)}
                  fill
                  style={{ objectFit: "cover" }}
                  priority={item.id === 1}
                />
                <div className="destination-carousel__text-group">
                  <span className="destination-carousel__big-text">
                    {t(item.titleKey)}
                  </span>
                  <p className="destination-carousel__small-text">
                    {t(item.subtitleKey)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </TinySlider>
        <div className="owl-nav">
          <button
            type="button"
            role="presentation"
            className="owl-prev"
            aria-label="carousel button"
          >
            <span className="icon-arrow-left"></span>
          </button>
          <button
            type="button"
            role="presentation"
            className="owl-next"
            aria-label="carousel button"
          >
            <span className="icon-arrow-right"></span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DestinationCarouselTwo;
