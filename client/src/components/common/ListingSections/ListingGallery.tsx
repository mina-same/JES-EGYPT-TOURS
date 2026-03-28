'use client';

import React from 'react';
import { Container } from 'react-bootstrap';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '@/lib/localize';
import Masonry from 'react-masonry-css';
import { Gallery, Item } from 'react-photoswipe-gallery';
import 'photoswipe/dist/photoswipe.css';

interface ListingGalleryProps {
  images: any[];
  title?: string;
  sectionTitle?: any; // localized object from backend, overrides title
  locale: string;
}

const ListingGallery: React.FC<ListingGalleryProps> = ({ images, title, sectionTitle, locale }) => {
  const { t } = useTranslation('common');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!images || images.length === 0) return null;

  const displayTitle = sectionTitle && getLocalizedValue(sectionTitle, locale)
    ? getLocalizedValue(sectionTitle, locale)
    : (title || t('exploreVisuals', { defaultValue: 'Explore the Magic of Egypt' }));

  const breakpointColumnsObj = {
    default: 3,
    1100: 3,
    700: 2,
    500: 1
  };

  return (
    <section className="listing-gallery section-space" style={{ background: '#fafafa' }}>
      <Container>
        <div className="sec-title text-center mb-5">
          <span className="sec-title__tagline">{t('galleryTagline', { defaultValue: 'Moments Captured' })}</span>
          <h2 className="sec-title__title">{displayTitle}</h2>
        </div>

        {!mounted ? (
          <div className="flex items-center justify-center p-5 min-h-[300px]">
            <div className="w-8 h-8 rounded-full border-4 border-[#b79c5c] border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <Gallery>
            <Masonry
              breakpointCols={breakpointColumnsObj}
              className="my-masonry-grid"
              columnClassName="my-masonry-grid_column"
            >
              {images.map((img, idx) => (
                <Item
                  key={idx}
                  original={img.url}
                  thumbnail={img.url}
                  width="1600"
                  height="1066"
                  alt={getLocalizedValue(img.alt, locale) || getLocalizedValue(img.title, locale) || `${displayTitle} ${idx + 1}`}
                >
                  {({ ref, open }) => (
                    <div 
                      className="gallery-item-wrapper mb-4 group cursor-pointer overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500"
                      onClick={open}
                    >
                      <div className="relative overflow-hidden aspect-[4/5]" style={{ minHeight: idx % 2 === 0 ? '300px' : '400px' }}>
                        <Image
                          ref={ref as any}
                          src={img.url}
                          alt={getLocalizedValue(img.alt, locale) || getLocalizedValue(img.title, locale) || `${displayTitle} ${idx + 1}`}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                           <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 transform scale-50 group-hover:scale-100 transition-transform duration-500">
                              <i className="icon-plus text-white text-xl"></i>
                           </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Item>
              ))}
            </Masonry>
          </Gallery>
        )}
      </Container>
      <style jsx global>{`
        .my-masonry-grid {
          display: -webkit-box;
          display: -ms-flexbox;
          display: flex;
          margin-left: -24px;
          width: auto;
        }
        .my-masonry-grid_column {
          padding-left: 24px;
          background-clip: padding-box;
        }
        
        @media (max-width: 768px) {
           .sec-title__title { font-size: 28px !important; }
           .section-space { padding: 50px 0; }
        }
      `}</style>
    </section>
  );
};

export default ListingGallery;
