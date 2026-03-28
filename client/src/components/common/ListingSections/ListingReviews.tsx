'use client';

import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { getLocalizedValue } from '@/lib/localize';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface ListingReviewsProps {
  reviews: any[];
  title?: string;
  sectionTitle?: any;
  locale: string;
}

const ListingReviews: React.FC<ListingReviewsProps> = ({ reviews, title, sectionTitle, locale }) => {
  const { t } = useTranslation('common');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!reviews || reviews.length === 0) return null;

  const displayTitle = sectionTitle && getLocalizedValue(sectionTitle, locale)
    ? getLocalizedValue(sectionTitle, locale)
    : (title || t('whatOurTravelersSay', { defaultValue: 'What Our Travelers Say' }));

  return (
    <section className="listing-reviews section-space" style={{ background: '#fff', position: 'relative', overflow: 'hidden' }}>
      <div className="listing-reviews__bg-shape"></div>
      <Container>
        <div className="sec-title text-center mb-5">
          <span className="sec-title__tagline">{t('reviewsTagline', { defaultValue: 'Testimonials' })}</span>
          <h2 className="sec-title__title">{displayTitle}</h2>
        </div>

        {!mounted ? (
          <div className="flex items-center justify-center p-5 min-h-[300px]">
            <div className="w-8 h-8 rounded-full border-4 border-[#b79c5c] border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            spaceBetween={30}
            slidesPerView={1}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true, el: '.reviews-pagination' }}
            breakpoints={{
              768: { slidesPerView: 2 },
              1200: { slidesPerView: 3 }
            }}
            className="reviews-swiper"
          >
            {reviews.filter(r => r.status !== 'rejected').map((review, idx) => (
              <SwiperSlide key={idx}>
                <div className="review-card h-100 p-4 p-md-5 rounded-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white d-flex flex-column">
                  <div className="review-card__stars mb-3 d-flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <i 
                        key={i} 
                        className={`icon-star ${i < (review.rating || 5) ? 'text-warning' : 'text-gray-200'}`}
                        style={{ color: i < (review.rating || 5) ? '#ffab01' : '#e5e7eb' }}
                      ></i>
                    ))}
                  </div>
                  
                  <p className="review-card__text mb-4 flex-grow-1 italic text-gray-600" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                    "{getLocalizedValue(review.comment, locale)}"
                  </p>

                  <div className="review-card__author d-flex align-items-center gap-3 pt-3 border-t border-gray-50">
                    <div className="review-card__avatar relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#b79c5c]/20">
                      <Image
                        src={review.avatar || 'https://placehold.co/100x100?text=User'}
                        alt={review.name || 'Traveler'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="review-card__info">
                      <h4 className="review-card__name mb-0 font-bold" style={{ fontSize: '1rem' }}>{review.name || 'Anonymous'}</h4>
                      <span className="review-card__designation text-muted" style={{ fontSize: '0.85rem' }}>{t('verifiedTraveler', { defaultValue: 'Verified Traveler' })}</span>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
        
        <div className="reviews-pagination mt-5 d-flex justify-center"></div>
      </Container>

      <style jsx global>{`
        .listing-reviews__bg-shape {
          position: absolute;
          top: -10%;
          right: -5%;
          width: 40%;
          height: 40%;
          background: radial-gradient(circle, rgba(183, 156, 92, 0.05) 0%, rgba(255, 255, 255, 0) 70%);
          z-index: 0;
          pointer-events: none;
        }
        .review-card {
          border: 1px solid #f1f1f1;
        }
        .review-card__text {
          font-family: inherit;
          font-style: italic;
        }
        .reviews-pagination .swiper-pagination-bullet-active {
          background: #b79c5c !important;
        }
        @media (max-width: 768px) {
           .sec-title__title { font-size: 28px !important; }
           .section-space { padding: 50px 0; }
           .review-card { padding: 30px !important; }
        }
      `}</style>
    </section>
  );
};

export default ListingReviews;
