"use client";

import { clientCarouselData } from "@/data/clientCarouselData";
import dynamic from "next/dynamic";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});

interface ClientCarouselProps {
  extraClass?: string;
}

const ClientCarousel: React.FC<ClientCarouselProps> = ({ extraClass }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Don't render if no items
  if (!clientCarouselData?.items || clientCarouselData.items.length === 0) {
    return null;
  }

  const settings = {
    items: Math.min(5, clientCarouselData.items.length),
    gutter: 65,
    loop: clientCarouselData.items.length > 1,
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
    <div
      className={`client-carousel wow fadeInUp ${extraClass ? extraClass : ""}`}
      data-wow-duration='1500ms'
      data-wow-delay='500ms'
    >
      <div className='container'>
        <h6 className='client-carousel__title'>{clientCarouselData.title}</h6>

        <TinySlider
          settings={settings}
          className='client-carousel__one gotur-owl__carousel owl-theme owl-carousel'
        >
          {clientCarouselData.items.map((item) => (
            <div className='item' key={item.id}>
              <div className='client-carousel__one__item'>
                <Image
                  src={item.image}
                  alt='gotur'
                  className='client-carousel__one__image'
                />
                <Image
                  src={item.hoverImage}
                  alt='gotur hover'
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
