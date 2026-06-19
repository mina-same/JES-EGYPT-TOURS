"use client";

import React from "react";
import Image from "next/image";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { instagramOneData } from "@/data/instagramOne";
import { Container } from "react-bootstrap";
import { Autoplay } from "swiper/modules";
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

const InstagramOne: React.FC<InstragramOneProps> = ({ extraClass }) => {
  const { title, items }: InstagramOneData = instagramOneData;

  return (
    <div
      className={`instagram-one section-space ${extraClass} wow fadeInUp`}
      data-wow-duration='1500ms'
      data-wow-delay='300ms'
    >
      <div className='instagram-one__top'>
        <Container>
          <h5 className='instagram-one__title'>{title}</h5>
        </Container>
      </div>

      <Container fluid>
        <div className='instagram-one__carousel'>
          <Swiper
            spaceBetween={30}
            loop={false}
            speed={700}
            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
            }}
            modules={[Autoplay]}
            breakpoints={{
              0: { slidesPerView: 1 },
              500: { slidesPerView: 2 },
              768: { slidesPerView: 3 },
              992: { slidesPerView: 3 },
              1080: { slidesPerView: 4 },
              1200: { slidesPerView: 5 },
              1400: { slidesPerView: 6 },
            }}
          >
            {items.map((item) => (
              <SwiperSlide key={item.id}>
                <div className='instagram-one__item'>
                  <Image src={item.image} alt={item.alt} title={item.title} width={400} height={400} style={{ objectFit: 'cover' }} />
                  <div className='instagram-one__item__overly'>
                    <div className='instagram-one__item__overly__icon'>
                      <i className='fab fa-instagram'></i>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </Container>
    </div>
  );
};

export default InstagramOne;
