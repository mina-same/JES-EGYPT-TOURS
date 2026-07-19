'use client';
import React, { useState, useRef } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getLocalizedValue } from '@/lib/localize';
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import { aboutOneData } from "@/data/aboutOne";
import { useTranslation } from "react-i18next";

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
    <section className={`about-one section-space mt-5 ${extraclass}`} id='about' style={{ background: '#f8f9fa' }}>
      <Container>
        <Row className='gutter-y-40'>
          <Col lg={6}>
            <div
              className='about-one__thumb wow fadeInLeft'
              data-wow-duration='1500ms'
              data-wow-delay='300ms'
              >
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
                  <TextAnimation text={promoTitle} animationType='left' />
                </h2>
              </div>

              <div className="relative group mb-4">
                <div 
                  ref={descriptionRef}
                  className={`about-one__top__text wow fadeInUp transition-all duration-700 ease-in-out prose max-w-none ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}
                  data-wow-duration='1500ms'
                  data-wow-delay='300ms'
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
      <style jsx global>{`
        .about-one {
          position: relative;
          overflow: hidden;
        }
        .about-one__element-one, .about-one__element-two {
          display: block !important;
          z-index: 0;
        }
        .about-one__element-one img {
          filter: brightness(0) grayscale(1);
          opacity: 0.1; /* Usually these shapes look better with low opacity if black */
        }
        @media (max-width: 991px) {
          .about-one {
            padding-top: 60px;
            padding-bottom: 60px;
          }
          .about-one__right {
            text-align: center;
          }
          .about-one__right .sec-title {
            justify-content: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .about-one__right .sec-title__title {
            margin-left: auto;
            margin-right: auto;
          }
          .about-one__top__text {
            text-align: center;
          }
          .about-one__right .flex.justify-start {
            justify-content: center !important;
          }
          .about-one__feature-list {
            text-align: left;
            display: inline-block;
          }
          .about-one__feature-vestion {
            text-align: left;
          }
          .about-one__button {
            justify-content: center;
            align-items: center;
          }
        }
        
        /* Ensure images and links in description are responsive and styled */
        .about-one__top__text img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 1.5rem 0;
        }

        .about-one__top__text {
          font-size: 16px;
          line-height: 1.8;
          color: #666;
          scrollbar-width: thin;
          scrollbar-color: #b79c5c #f1f1f1;
        }

        .about-one__top__text.is-expanded {
          max-height: 400px !important;
          overflow-y: auto !important;
          padding-right: 15px;
        }

        .about-one__top__text.is-collapsed {
          max-height: 250px !important;
          overflow-y: hidden !important;
          padding-right: 0;
        }

        .about-one__top__text a {
            color: #b79c5c !important;
            text-decoration: underline !important;
            font-weight: 600 !important;
            transition: color 0.3s ease !important;
        }

        .about-one__top__text a:hover {
            color: #1d231f !important;
            text-decoration: none !important;
        }

        .about-one__top__text h1, 
        .about-one__top__text h2, 
        .about-one__top__text h3, 
        .about-one__top__text h4, 
        .about-one__top__text h5, 
        .about-one__top__text h6 {
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          color: #1d231f;
          font-weight: 700;
        }

        .about-one__top__text p {
          margin-bottom: 1.25rem;
        }

        .about-one__top__text ul, 
        .about-one__top__text ol {
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
          list-style-position: outside;
        }

        .about-one__top__text ul {
          list-style-type: disc;
        }

        .about-one__top__text ol {
          list-style-type: decimal;
        }

        .about-one__top__text li {
          margin-bottom: 0.5rem;
        }

        .about-one__top__text strong, 
        .about-one__top__text b {
          color: #1d231f;
          font-weight: 700;
        }

        /* Custom Scrollbar for expanded text */
        .about-one__top__text::-webkit-scrollbar {
          width: 5px;
        }
        .about-one__top__text::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .about-one__top__text::-webkit-scrollbar-thumb {
          background: #b79c5c;
          border-radius: 10px;
        }
        .about-one__top__text::-webkit-scrollbar-thumb:hover {
          background: #1d231f;
        }
      `}</style>
    </section>
  );
};

export default ListingPromo;
