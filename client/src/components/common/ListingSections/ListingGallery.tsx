'use client';
import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '@/lib/localize';

interface ListingGalleryProps {
  images: any[];
  title?: string;
  sectionTitle?: any; // localized object from backend, overrides title
  locale: string;
}

const ListingGallery: React.FC<ListingGalleryProps> = ({ images, title, sectionTitle, locale }) => {
  const { t } = useTranslation('common');
  if (!images || images.length === 0) return null;

  const displayTitle = sectionTitle && getLocalizedValue(sectionTitle, locale)
    ? getLocalizedValue(sectionTitle, locale)
    : (title || t('exploreVisuals'));

  return (
    <section className="section-space">
      <Container>
        <div className="sec-title text-center mb-5">
          <h6 className="sec-title__tagline">{t('gallery')}</h6>
          <h3 className="sec-title__title">{displayTitle}</h3>
        </div>
        <Row className="gutter-y-30">
          {images.slice(0, 6).map((img, idx) => (
            <Col lg={4} md={6} key={idx}>
              <div className="gallery-card rounded-4 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300" style={{ height: '300px', position: 'relative' }}>
                <Image 
                  src={img.url} 
                  alt={img.alt?.[locale] || img.title?.[locale] || displayTitle || `Gallery image ${idx + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default ListingGallery;
