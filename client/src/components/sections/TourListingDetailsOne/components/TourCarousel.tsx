import React from "react";
import Image from "next/image";
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery";
import { TinySliderWrapper as TinySlider } from "@/components/common/TinySliderWrapper";

interface TourCarouselProps {
  sliderImages: any[];
  title: string;
}

export const TourCarousel: React.FC<TourCarouselProps> = ({ sliderImages, title }) => {
  const settings = {
    items: 3,
    gutter: 30,
    center: true,
    loop: true,
    nav: false,
    controls: false,
    autoplay: false,
    mouseDrag: true,
    speed: 700,
    edgePadding: 230,
    responsive: {
      0: { items: 1, edgePadding: 30 },
      576: { items: 2, edgePadding: 30 },
      768: { items: 2, edgePadding: 100 },
      992: { items: 2, edgePadding: 70 },
      1199: { items: 2, edgePadding: 230 },
      1400: { items: 3, edgePadding: 230 },
    },
  };

  return (
    <div className='tour-one section-space-top'>
      <div className='tour-one__carousel tour-two__carousel gotur-owl__carousel tns-ovh'>
        <PhotoSwipeGallery>
          <TinySlider settings={settings}>
            {sliderImages.map((img, idx) => {
              const imageUrl = typeof img === 'string' 
                ? img 
                : (img as any).url || (img as any).src;
              
              const imageAlt = (typeof img === 'object' && (img as any).alt) 
                ? (img as any).alt 
                : `${title} - Image ${idx + 1}`;
              
              return (
                <div key={idx}>
                  <div className='item'>
                    <Item 
                      original={imageUrl} 
                      thumbnail={imageUrl} 
                      width='1600' 
                      height='1000'
                    >
                      {({ ref, open }) => (
                        <div 
                          className='tour-one__item' 
                          ref={ref as unknown as React.Ref<HTMLDivElement>}
                          onClick={(e) => {
                            e.preventDefault();
                            open(e);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <Image
                            src={imageUrl}
                            alt={imageAlt}
                            width={800}
                            height={600}
                            className="object-cover w-full"
                            style={{ height: '395px' }}
                            priority={idx === 0}
                          />
                        </div>
                      )}
                    </Item>
                  </div>
                </div>
              );
            })}
          </TinySlider>
        </PhotoSwipeGallery>
      </div>
    </div>
  );
};
