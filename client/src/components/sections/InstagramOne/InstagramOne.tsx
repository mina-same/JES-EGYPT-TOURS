"use client";

import React from "react";
import Image from "next/image";

import { instagramOneData } from "@/data/instagramOne";
import { Container } from "react-bootstrap";
import { TinySliderWrapper as TinySlider } from "@/components/common/TinySliderWrapper";
import { useTranslation } from "react-i18next";
interface InstagramItem {
  id: number;
  image: string;
  alt: string;
  title: string;
  link: string;
}

interface InstagramOneData {
  title: string;
  items: InstagramItem[];
}
interface InstragramOneProps {
  extraClass?: string;
}

const InstagramOne: React.FC<InstragramOneProps> = ({ extraClass = "" }) => {
  // `extraClass` had no default, so the rendered class list literally read
  // "instagram-one section-space undefined".
  const { t } = useTranslation("common");
  const { items }: InstagramOneData = instagramOneData;

  return (
    <div className={`instagram-one section-space ${extraClass}`.trim()}>
      <div className='instagram-one__top'>
        <Container>
          {/* h2, not h5: every other section on the page is h2, so this
              skipped two heading levels in the document outline. */}
          <h2 className='instagram-one__title'>{t("instagram.title")}</h2>
        </Container>
      </div>

      <Container fluid>
        <div className='instagram-one__carousel'>
          {/* tiny-slider, not Swiper: this and the blog carousel were the only
              two things pulling a second carousel engine into the homepage
              bundle alongside the five sections already on tiny-slider. */}
          <TinySlider
            placeholderClassName='instagram-one__carousel tns-placeholder-single'
            settings={{
              items: 1,
              gutter: 30,
              loop: true,
              speed: 700,
              autoplay: true,
              autoplayTimeout: 2500,
              autoplayButtonOutput: false,
              // Stop the band cycling while the visitor is looking at it.
              autoplayHoverPause: true,
              nav: false,
              controls: false,
              mouseDrag: true,
              responsive: {
                0: { items: 1 },
                500: { items: 2 },
                768: { items: 3 },
                992: { items: 3 },
                1080: { items: 4 },
                1200: { items: 5 },
                1400: { items: 6 },
              },
            }}
          >
            {items.map((item) => (
              <div key={item.id}>
                <div className='instagram-one__item'>
                  <Image src={item.image} alt={item.alt} title={item.title} width={400} height={400} style={{ objectFit: 'cover' }} />
                  <div className='instagram-one__item__overly'>
                    <div className='instagram-one__item__overly__icon'>
                      <i className='fab fa-instagram' aria-hidden='true'></i>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </TinySlider>
        </div>
      </Container>
    </div>
  );
};

export default InstagramOne;
