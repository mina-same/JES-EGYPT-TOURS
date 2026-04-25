import React, { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery";
import { TinySliderWrapper as TinySlider } from "@/components/common/TinySliderWrapper";

interface TourCarouselProps {
  sliderImages: any[];
  title: string;
}

export const TourCarousel: React.FC<TourCarouselProps> = ({ sliderImages, title }) => {
  const sliderRef = useRef<any>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const refreshTimeoutRef = useRef<number | null>(null);

  const refreshSliderLayout = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (refreshTimeoutRef.current !== null) {
      window.clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = window.setTimeout(() => {
      refreshTimeoutRef.current = null;

      const slider = sliderRef.current?.slider;
      if (!slider) {
        return;
      }

      try {
        slider.refresh?.();
        slider.updateSliderHeight?.();
      } catch (error) {
        console.debug("Tour carousel refresh handled:", error);
      }
    }, 60);
  }, []);

  useEffect(() => {
    refreshSliderLayout();

    const lateRefreshId = window.setTimeout(() => {
      refreshSliderLayout();
    }, 250);

    return () => {
      window.clearTimeout(lateRefreshId);

      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [refreshSliderLayout, sliderImages.length]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined" || !carouselRef.current) {
      return;
    }

    const observer = new ResizeObserver(() => {
      refreshSliderLayout();
    });

    observer.observe(carouselRef.current);

    return () => observer.disconnect();
  }, [refreshSliderLayout]);

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
      <div
        ref={carouselRef}
        className='tour-one__carousel tour-two__carousel gotur-owl__carousel tns-ovh'
      >
        <PhotoSwipeGallery>
          <TinySlider
            ref={sliderRef}
            settings={settings}
            onInit={refreshSliderLayout}
          >
            {sliderImages.map((img, idx) => {
              const imageUrl = typeof img === 'string' 
                ? img 
                : (img as any).url || (img as any).src;
              
              const imageTitle = (typeof img === 'object' && (img as any).title) 
                ? (img as any).title 
                : (typeof img === 'object' && (img as any).alt) ? (img as any).alt : "";

              const imageAlt = (typeof img === 'object' && (img as any).alt) 
                ? (img as any).alt 
                : (imageTitle || `${title} - Image ${idx + 1}`);
              
              return (
                <div key={idx}>
                  <div className='item'>
                    <Item 
                      original={imageUrl} 
                      thumbnail={imageUrl} 
                      width='1600' 
                      height='1000'
                      caption={imageTitle || imageAlt}
                    >
                      {({ ref, open }) => (
                        <div 
                          className='tour-one__item tour-one__slide-frame' 
                          ref={ref as unknown as React.Ref<HTMLDivElement>}
                          onClick={(e) => {
                            e.preventDefault();
                            open(e);
                          }}
                          title={imageTitle}
                          style={{ cursor: 'pointer' }}
                        >
                          <Image
                            src={imageUrl}
                            alt={imageAlt}
                            title={imageTitle}
                            fill
                            sizes="(max-width: 575px) calc(100vw - 80px), (max-width: 767px) calc(100vw - 160px), (max-width: 1399px) 420px, 360px"
                            className="tour-one__slide-image"
                            priority={idx === 0}
                            onLoad={refreshSliderLayout}
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
