'use client';
import React, { useState, useRef } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import Image from 'next/image';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getLocalizedValue } from '@/lib/localize';
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import { aboutOneData } from "@/data/aboutOne";
import { useTranslation } from "react-i18next";
import "./ListingSections.css";

interface ListingPromoProps {
  title?: any;
  description?: any;
  subtitle?: any;
  button?: any;
  image1?: any;
  image2?: any;
  images?: any[];
  mission?: {
    icon?: string;
    title?: any;
    text?: any;
  };
  features?: Array<{
    icon?: string;
    text?: any;
  }>;
  locale: string;
  extraclass?: string;
}

const ListingPromo: React.FC<ListingPromoProps> = ({
  title,
  description,
  image1,
  image2,
  images = [],
  locale,
  extraclass = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation("common");

  const handleToggle = () => {
    const wasExpanded = isExpanded;
    setIsExpanded(!isExpanded);
    
    // If we are expanding, scroll to make sure the content is visible
    if (!wasExpanded) {
      setTimeout(() => {
        if (descriptionRef.current) {
          const yOffset = -100; // Small offset for top bar
          const element = descriptionRef.current;
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 400); // Slightly faster trigger
    }
  };
  
  if (!title && !description) return null;

  const promoTitle = getLocalizedValue(title, locale) || t("about.title");
  const promoDesc = getLocalizedValue(description, locale);

  // Images logic
  const getImageUrl = (item: any) => {
    if (!item) return null;
    if (typeof item === 'string') return item;
    return item.url || null;
  };

  const getImageTitle = (item: any, fallback: string) => {
    if (!item || typeof item === 'string') return fallback;
    return getLocalizedValue(item.title, locale) || getLocalizedValue(item.alt, locale) || fallback;
  };

  const mainImg = getImageUrl(image1) || getImageUrl(images[0]) || aboutOneData.images.mainImage;
  const smallImg = getImageUrl(image2) || getImageUrl(images[1]) || aboutOneData.images.smallImage;
  const mainImgTitle = getImageTitle(image1 || images[0], promoTitle);
  const smallImgTitle = getImageTitle(image2 || images[1], promoTitle);
  const shape1 = aboutOneData.images.shape1;

  const shouldShowReadMore = promoDesc && promoDesc.length > 800;

  return (
    <section className={`about-one section-space mt-5 listing-promo ${extraclass}`} id='about' style={{ background: '#f8f9fa' }}>
      <Container>
        <Row className='gutter-y-40'>
          <Col lg={6}>
            <div className='about-one__thumb'>
              <div className='about-one__thumb__item'>
                <Image src={mainImg} alt={mainImgTitle} title={mainImgTitle} width={600} height={700} style={{ borderRadius: '12px', objectFit: 'cover' }} />
              </div>
              <div className='about-one__thumb__item-small'>
                <Image src={smallImg} alt={smallImgTitle} title={smallImgTitle} width={250} height={250} style={{ borderRadius: '12px', objectFit: 'cover' }} />
              </div>
            </div>
          </Col>
          <Col lg={6}>
            <div className='about-one__right'>
              <div className='sec-title'>
                <h2
                  className='sec-title__title bw-split-in-left'
                  style={{ maxWidth: "555px" }}
                >
                  <TextAnimation text={promoTitle} animationType='left' semantic />
                </h2>
              </div>

              <div className="relative group mb-4">
                <div 
                  ref={descriptionRef}
                  className={`about-one__top__text transition-all duration-700 ease-in-out prose max-w-none ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}
                  style={{ 
                    scrollBehavior: 'smooth'
                  }}
                  dangerouslySetInnerHTML={{ __html: promoDesc }}
                />
                {!isExpanded && shouldShowReadMore && (
                  <div className="absolute bottom-0 left-0 w-full h-15 bg-gradient-to-t from-[#f8f9fa] to-transparent pointer-events-none transition-opacity duration-300" style={{ height: '60px' }} />
                )}
              </div>

              {shouldShowReadMore && (
                <div className="mt-2 mb-4 flex justify-center md:justify-start">
                  <button 
                    onClick={handleToggle}
                    className="group flex items-center gap-2 text-[#b79c5c] font-black uppercase text-[12px] tracking-widest border-b-2 border-[#b79c5c] pb-1 hover:text-[#1d231f] hover:border-[#1d231f] transition-all duration-300"
                  >
                    {isExpanded ? (
                      <>Show Less <ChevronUp size={16} className="group-hover:-translate-y-1 transition-transform" /></>
                    ) : (
                      <>Read More <ChevronDown size={16} className="group-hover:translate-y-1 transition-transform" /></>
                    )}
                  </button>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Container>
      <div className='about-one__element-one pointer-events-none'>
        <Image src={shape1} alt='element' width={293} height={155} />
      </div>
    </section>
  );
};

export default ListingPromo;
