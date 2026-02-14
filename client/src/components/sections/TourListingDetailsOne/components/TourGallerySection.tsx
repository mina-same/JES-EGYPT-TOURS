import React from "react";
import Image from "next/image";
import Masonry from "react-masonry-css";
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery";
import EmptyState from "@/components/common/EmptyState/EmptyState";

interface TourGallerySectionProps {
  images: any[];
}

export const TourGallerySection: React.FC<TourGallerySectionProps> = ({ images }) => {
  if (!images || images.length === 0) {
    return (
      <EmptyState
        title="No Gallery Images"
        description="This tour currently has no gallery images available."
        icon="inbox"
        size="medium"
      />
    );
  }

  return (
    <div className='tour-listing-details__content__item tour-listing-details__thumb'>
      <div className="mb-4">
        <h4 className='tour-listing-details__title mb-2'>Tour Gallery</h4>
        <p className="tour-reviews-subtitle">A visual journey through the amazing places you will visit.</p>
      </div>
      <PhotoSwipeGallery>
        <Masonry
          breakpointCols={{
            default: 3,
            1100: 2,
            700: 1
          }}
          className="tour-gallery-masonry"
          columnClassName="tour-gallery-masonry-column"
        >
          {images.map((img, idx) => {
            const imgUrl = typeof img === 'string' 
              ? img 
              : (img as any).url || (img as any).src;
            
            const imgAlt = (typeof img === 'object' && (img as any).alt) 
              ? (img as any).alt 
              : `Tour gallery image ${idx + 1}`;
            
            return (
              <Item
                key={idx}
                original={imgUrl}
                thumbnail={imgUrl}
                width="1200"
                height="800"
              >
                {({ ref, open }) => (
                  <a
                    href={imgUrl}
                    ref={ref as unknown as React.Ref<HTMLAnchorElement>}
                    onClick={(e) => {
                      e.preventDefault();
                      open(e);
                    }}
                    className="tour-gallery-link"
                    style={{ display: 'block' }}
                  >
                    <div className='tour-gallery-item'>
                      <div className='tour-gallery-image-wrapper' style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', height: '280px' }}>
                        <Image
                          src={imgUrl}
                          alt={imgAlt}
                          fill
                          className="tour-gallery-image object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                    </div>
                  </a>
                )}
              </Item>
            );
          })}
        </Masonry>
      </PhotoSwipeGallery>
    </div>
  );
};
