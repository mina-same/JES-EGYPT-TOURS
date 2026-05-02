'use client';

import React from 'react';
import { Container } from 'react-bootstrap';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '@/lib/localize';
import Masonry from 'react-masonry-css';
import { Gallery as PhotoSwipeGallery, Item } from 'react-photoswipe-gallery';
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
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 992);
    };

    checkMobile();
    setMounted(true);
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  if (!images || images.length === 0) return null;

  const displayTitle = sectionTitle && getLocalizedValue(sectionTitle, locale)
    ? getLocalizedValue(sectionTitle, locale)
    : (title || t('exploreVisuals', { defaultValue: 'Explore the Magic of Egypt' }));

  const breakpointColumnsObj = {
    default: 3,
    1100: 2,
    700: 1
  };

  const galleryImages = images
    .map((img, idx) => {
      const imgUrl = typeof img === 'string' ? img : img?.url || img?.src;
      if (!imgUrl) return null;

      const imageTitle = typeof img === 'object' ? getLocalizedValue(img.title, locale) : '';
      const imgAlt = typeof img === 'object'
        ? getLocalizedValue(img.alt, locale) || imageTitle || `${displayTitle} gallery ${idx + 1}`
        : `${displayTitle} gallery ${idx + 1}`;

      return {
        url: imgUrl,
        title: imageTitle,
        alt: imgAlt,
      };
    })
    .filter(Boolean) as Array<{ url: string; title: string; alt: string }>;

  if (galleryImages.length === 0) return null;

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
          <PhotoSwipeGallery>
            {isMobile ? (
              <div className="mobile-swipeable-gallery">
                {galleryImages.map((img, idx) => (
                  <Item
                    key={`listing-mobile-img-${idx}-${img.url}`}
                    original={img.url}
                    thumbnail={img.url}
                    width="1200"
                    height="800"
                    caption={img.title || img.alt}
                  >
                    {({ ref, open }) => (
                      <a
                        href={img.url}
                        ref={ref as unknown as React.Ref<HTMLAnchorElement>}
                        onClick={(e) => { e.preventDefault(); open(e); }}
                        className="mobile-gallery-link"
                        title={img.title}
                      >
                        <div className='tour-gallery-item h-100'>
                          <div className='tour-gallery-image-wrapper h-100'>
                            <Image
                              src={img.url}
                              alt={img.alt}
                              title={img.title}
                              width={400}
                              height={300}
                              className="tour-gallery-image"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        </div>
                      </a>
                    )}
                  </Item>
                ))}
              </div>
            ) : (
              <Masonry
                breakpointCols={breakpointColumnsObj}
                className="tour-gallery-masonry"
                columnClassName="tour-gallery-masonry-column"
              >
                {galleryImages.map((img, idx) => (
                  <Item
                    key={`listing-desk-img-${idx}-${img.url}`}
                    original={img.url}
                    thumbnail={img.url}
                    width="1200"
                    height="800"
                    caption={img.title || img.alt}
                  >
                    {({ ref, open }) => (
                      <a
                        href={img.url}
                        ref={ref as unknown as React.Ref<HTMLAnchorElement>}
                        onClick={(e) => { e.preventDefault(); open(e); }}
                        title={img.title}
                        style={{ display: 'block' }}
                      >
                        <div className='tour-gallery-item'>
                          <div className='tour-gallery-image-wrapper'>
                            <Image
                              src={img.url}
                              alt={img.alt}
                              title={img.title}
                              width={400}
                              height={300}
                              className="tour-gallery-image"
                              style={{ width: '100%', height: 'auto' }}
                            />
                          </div>
                        </div>
                      </a>
                    )}
                  </Item>
                ))}
              </Masonry>
            )}
          </PhotoSwipeGallery>
        )}
      </Container>
      <style jsx global>{`
        @media (max-width: 768px) {
           .sec-title__title { font-size: 28px !important; }
           .section-space { padding: 50px 0; }
        }
      `}</style>
    </section>
  );
};

export default ListingGallery;
