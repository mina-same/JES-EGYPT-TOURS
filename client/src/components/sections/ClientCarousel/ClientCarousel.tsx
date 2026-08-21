"use client";

import { clientCarouselData } from "@/data/clientCarouselData";
import Image from "next/image";
import React from "react";

import { TinySliderWrapper as TinySlider } from "@/components/common/TinySliderWrapper";

import { useTranslation } from "react-i18next";

interface ClientCarouselProps {
  extraClass?: string;
}

const ClientCarousel: React.FC<ClientCarouselProps> = ({ extraClass }) => {
  const { t, i18n } = useTranslation("common");

  // Don't render if no items
  if (!clientCarouselData?.items || clientCarouselData.items.length === 0) {
    return null;
  }

  const settings = {
    items: Math.min(5, clientCarouselData.items.length),
    gutter: 65,
    loop: false,
    rewind: clientCarouselData.items.length > 1,
    autoplay: false,
    autoplayTimeout: 6000,
    mouseDrag: true,
    nav: false,
    controls: false,
    autoplayButtonOutput: false,

    responsive: {
      0: {
        items: Math.min(2, clientCarouselData.items.length),
        gutter: 30,
      },
      431: {
        items: Math.min(1, clientCarouselData.items.length),
        gutter: 30,
      },
      500: {
        items: Math.min(2, clientCarouselData.items.length),
        gutter: 30,
      },
      768: {
        items: Math.min(3, clientCarouselData.items.length),
        gutter: 50,
      },
      992: {
        items: Math.min(4, clientCarouselData.items.length),
        gutter: 60,
      },
      1200: {
        items: Math.min(5, clientCarouselData.items.length),
        gutter: 100,
      },
    },
  };
  return (
    <div className={`client-carousel ${extraClass ? extraClass : ""}`}>
      <div className='container'>
        <h2 className='client-carousel__title'>{t("trustedPartners")}</h2>

        <TinySlider
          settings={settings}
          rebuildKey={i18n.language}
          className='client-carousel__one gotur-owl__carousel owl-theme owl-carousel'
        >
          {clientCarouselData.items.map((item, index) => (
            <div className='item' key={item.id}>
              <div className='client-carousel__one__item'>
                <Image
                  src={item.image}
                  alt={t("partnerAlt", { count: index + 1 })}
                  title={t("partnerTitle", { count: index + 1 })}
                  className='client-carousel__one__image'
                />
                <Image
                  src={item.hoverImage}
                  alt={t("partnerAlt", { count: index + 1 })}
                  title={t("partnerTitle", { count: index + 1 })}
                  className='client-carousel__one__hover-image'
                />
              </div>
            </div>
          ))}
        </TinySlider>
      </div>
    </div>
  );
};

export default ClientCarousel;
