import React from "react";
import { Container } from "react-bootstrap";
import Image, { StaticImageData } from "next/image";
import dynamic from "next/dynamic";

const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});

interface TourCarouselProps {
  sliderImages: (StaticImageData | string)[];
}

export const TourCarousel: React.FC<TourCarouselProps> = ({ sliderImages }) => {
  return (
    <div
      className='tour-listing-details__carousel wow fadeInUp animated'
      data-wow-duration='1500ms'
      data-wow-delay='500ms'
    >
      <Container>
        <div className='destination-carousel'>
          <div className='destination-carousel__inner gotur-owl__carousel gotur-owl__carousel--basic-nav owl-carousel owl-theme owl-loaded owl-drag'>
            <TinySlider
              settings={{
                items: 1,
                gutter: 30,
                loop: false,
                nav: false,
                autoplay: false,
                controls: true,
                mouseDrag: true,
                controlsContainer: ".owl-nav",
              }}
            >
              {sliderImages.map((img, idx) => (
                <div key={idx}>
                  <div className='item'>
                    <div className='destination-carousel__item'>
                      <div className="relative w-full" style={{ height: '500px' }}>
                        <Image 
                          src={typeof img === 'string' ? img : img} 
                          alt='destination' 
                          fill
                          sizes="100vw"
                          className="object-cover"
                          priority={idx === 0}
                        />
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
          </div>
        </div>
      </Container>
    </div>
  );
};
