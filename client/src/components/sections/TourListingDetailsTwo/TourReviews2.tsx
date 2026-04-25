import React, { useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { Star, ChevronRight, ChevronLeft } from 'lucide-react';

// Interface for Props
interface TourReviews2Props {
  comments: any[];
  tourId: string;
  onSubmit: (data: any) => Promise<void>;
  averageRating?: number;
  totalReviews?: number;
}

const TourReviews2: React.FC<TourReviews2Props> = ({ comments, tourId, onSubmit, averageRating = 4.96, totalReviews = 0 }) => {
  const brandColor = '#b79c5c';
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Custom navigation state
  const [prevEl, setPrevEl] = useState<HTMLElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLElement | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ ...formData, rating, tourId });
      setFormData({ name: '', email: '', comment: '' });
      setRating(5);
      // Alert handled by parent or just show simple success here if needed
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section>
      <div className="container">
        {/* Section Header */}
        <div className="row mb-5">
          <div className="col-12">
            <h4 className="tour-listing-details__title mb-2">Our Travelers Testimonials</h4>
            <p className="tour-reviews-subtitle">See how we’ve made every journey exceptional — straight from those who’ve traveled with us.</p>
          </div>
        </div>

        {/* Content Row */}
        <div className="row">
          {/* Featured Image (Left) */}
          <div className="col-lg-4 mb-4 mb-lg-0">
            <div className="tour-reviews-featured-image">
               <Image 
                 src="https://res.cloudinary.com/ddjuftfy2/image/upload/f_webp,c_fill,q_auto/memphis/theme/Com2025/img/reviews.webp" 
                 alt="Our Travelers Testimonials"
                 fill
                 sizes="(max-width: 768px) 100vw, 370px"
                 className="object-cover"
                 unoptimized
               />
            </div>
          </div>

          {/* Right Column: Stats + Slider + Platforms */}
          <div className="col-lg-8 pl-lg-5">
            
            {/* Header: Count and Stars */}
            <div className="tour-reviews-stats-header">
                <h3 className="tour-reviews-count">{totalReviews || comments.length} Reviews</h3>
                <div className="tour-reviews-rating-wrapper">
                  <span className="tour-reviews-avg-rating">{averageRating.toFixed(2)}</span>
                  <div className="tour-reviews-stars" style={{ color: brandColor }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={18} fill="currentColor" stroke="none" />
                    ))}
                  </div>
                </div>
            </div>

            {/* Gray Testimonial Box */}
            <div className="tour-reviews-testimonial-box">
              
              {/* Quote Icon */}
              <div className="tour-reviews-quote-icon">
                 <svg width="48" height="38" viewBox="0 0 66 54" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.042 0.792969C8.026 8.56897 0.25 21.313 0.25 35.353C0.25 46.801 7.162 53.497 15.154 53.497C22.714 53.497 28.33 47.449 28.33 40.321C28.33 33.193 23.362 28.009 16.882 28.009C15.586 28.009 13.858 28.225 13.426 28.441C14.506 21.097 21.418 12.457 28.33 8.13697L19.042 0.792969ZM56.194 0.792969C45.394 8.56897 37.618 21.313 37.618 35.353C37.618 46.801 44.53 53.497 52.522 53.497C59.866 53.497 65.698 47.449 65.698 40.321C65.698 33.193 60.514 28.009 54.034 28.009C52.738 28.009 51.226 28.225 50.794 28.441C51.874 21.097 58.57 12.457 65.482 8.13697L56.194 0.792969Z" fill={brandColor}></path>
                 </svg>
              </div>

              <Swiper
                modules={[Autoplay, Navigation]}
                spaceBetween={30}
                slidesPerView={1}
                navigation={{
                    prevEl,
                    nextEl,
                }}
                autoplay={{ delay: 6000 }}
                style={{ width: '100%' }}
                className="reviewsSwiper"
                onSwiper={(swiper) => {
                  setIsBeginning(swiper.isBeginning);
                  setIsEnd(swiper.isEnd);
                }}
                onSlideChange={(swiper) => {
                  setIsBeginning(swiper.isBeginning);
                  setIsEnd(swiper.isEnd);
                }}
              >
                {comments.length > 0 ? comments.map((comment, index) => (
                  <SwiperSlide key={index}>
                    <div className="review-content">
                      <p className="tour-reviews-text">
                        {comment.text || comment.comment}
                      </p>
                      <div className="d-flex align-items-center gap-3">
                        {comment.avatar && (
                           <div className="flex-shrink-0" style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
                                <Image 
                                  src={comment.avatar} 
                                  alt={comment.name} 
                                  fill 
                                  className="object-cover"
                                  unoptimized // Since we don't know the domain
                                />
                           </div>
                        )}
                        <div>
                           <h4 className="tour-reviews-name">{comment.name}</h4>
                           <p className="tour-reviews-verified">Verified Traveler</p> 
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                )) : (
                  <SwiperSlide>
                     <div className="py-4">
                        <p className="text-[#697488]">No reviews yet.</p>
                     </div>
                  </SwiperSlide>
                )}
              </Swiper>
              
              {/* Navigation Buttons */}
              <div className="tour-reviews-nav-buttons">
                <button
                  type="button"
                  ref={(node) => setPrevEl(node)}
                  className="tour-reviews-nav-btn tour-reviews-nav-prev"
                  disabled={isBeginning}
                  aria-disabled={isBeginning}
                >
                  <ChevronLeft size={24} strokeWidth={1.5} color={brandColor} />
                </button>
                <button
                  type="button"
                  ref={(node) => setNextEl(node)}
                  className="tour-reviews-nav-btn tour-reviews-nav-next"
                  style={{ backgroundColor: brandColor }}
                  disabled={isEnd}
                  aria-disabled={isEnd}
                >
                  <ChevronRight size={24} strokeWidth={1.5} color="#ffffff" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add Review Form */}
        <div className="justify-content-center w-full" >
            <div style={{ width: '100%', marginTop: '50px' }} >
               <div className="contact-page__contact">
                  <h2 className="tour-listing-details__title">Add a Review</h2>
                  
                  <div className="product-details__form-ratings">
                    <p className="product-details__form-ratings__label">Your Rating*</p>
                    <div className="flex gap-1" style={{ display: 'inline-flex' }}>
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = star <= (hoverRating || rating);
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
                            style={{
                              cursor: 'pointer',
                              padding: 0,
                              border: 'none',
                              background: 'transparent',
                              lineHeight: 0,
                            }}
                          >
                            <Star
                              size={18}
                              stroke={brandColor}
                              fill={active ? brandColor : 'none'}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <form onSubmit={handleFormSubmit} className="comments-form__form contact-form-validated product-details__form__form form-one">
                     <div className="form-one__group">
                        <div className="form-one__control">
                           <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Your Name" />
                        </div>
                        <div className="form-one__control">
                           <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Your Email" />
                        </div>
                        <div className="form-one__control form-one__control--full">
                           <textarea
                             required
                             value={formData.comment}
                             onChange={e => setFormData({ ...formData, comment: e.target.value })}
                             placeholder="Write Message"
                             style={{ backgroundColor: 'rgba(183, 156, 92, 0.08)' }}
                           ></textarea>
                        </div>
                        <div className="form-one__control form-one__control--full">
                           <button type="submit" disabled={isSubmitting} className="gotur-btn gotur-btn--base">
                              {isSubmitting ? 'Submitting...' : 'Submit Review'}
                           </button>
                        </div>
                     </div>
                  </form>
               </div>
            </div>
        </div>

      </div>
    </section>
  );
};

export default TourReviews2;
