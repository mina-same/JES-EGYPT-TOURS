"use client";
import React, { useState, useEffect, useRef } from "react";
import { Container, Accordion } from "react-bootstrap";
import Image from "next/image";
import Masonry from "react-masonry-css";
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery";
import { Loader2, Calendar, Headphones, Tag, Star, Zap } from "lucide-react";

import EmptyState from "@/components/common/EmptyState/EmptyState";
import { reviewsAPI } from "@/lib/api/reviews";

// Import types
import { TourListingOneDetailsProps } from "./types";

// Import custom hook
import { useTourData } from "./useTourData";

// Import sub-components
import { TourHeader } from "./components/TourHeader";
import { TourInfoBar } from "./components/TourInfoBar"; 
import { BookingForm } from "./components/BookingForm";
import { TourPlan } from "./components/TourPlan";
import { PricingPlans } from "./components/PricingPlans";
import { TourCarousel } from "./components/TourCarousel";
import { DownloadPdfBrochure } from "./components/DownloadPdfBrochure";
import TourReviews2 from "../TourListingDetailsTwo/TourReviews2";
import FeatureTwo from "../FeatureTwo/FeatureTwo";

const TourListingOneDetails: React.FC<TourListingOneDetailsProps> = ({ id }) => {
  const { tourData, loading, error } = useTourData(id);
  const [activeSection, setActiveSection] = useState("description");
  const navRef = useRef<HTMLDivElement>(null);
  const navPlaceholderRef = useRef<HTMLDivElement>(null);
  const [navHeight, setNavHeight] = useState(0);
  const [isNavFixed, setIsNavFixed] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const sidebarRowRef = useRef<HTMLDivElement>(null);
  const [isSidebarFixed, setIsSidebarFixed] = useState(false);
  const [sidebarLeft, setSidebarLeft] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(0);

  useEffect(() => {
    const updateNavHeight = () => {
      const h = navRef.current?.getBoundingClientRect().height || 0;
      setNavHeight(h);
    };

    const updateSidebarBounds = () => {
      const sidebar = sidebarRef.current;
      const row = sidebarRowRef.current;
      if (!sidebar || !row) return;
      const rowRect = row.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();
      setSidebarLeft(sidebarRect.left);
      setSidebarWidth(sidebarRect.width);
    };

    updateNavHeight();
    updateSidebarBounds();
    const handleResize = () => {
      updateNavHeight();
      updateSidebarBounds();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const updateFixedState = () => {
      const el = navPlaceholderRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      setIsNavFixed(top <= 0);
    };

    const updateSidebarFixed = () => {
      const row = sidebarRowRef.current;
      if (!row) return;
      const rowRect = row.getBoundingClientRect();
      const fixedNavHeight = isNavFixed ? navHeight : 0;
      const threshold = fixedNavHeight + 20;
      const shouldFix = rowRect.top <= threshold && rowRect.bottom > window.innerHeight;
      setIsSidebarFixed(shouldFix);
    };

    const onScroll = () => {
      updateFixedState();
      updateSidebarFixed();
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true } as any);
    return () => window.removeEventListener("scroll", onScroll as any);
  }, [isNavFixed, navHeight]);

  // Handle scroll spy and smooth scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['description', 'tour-plan', 'amenities', 'pricing', 'gallery', 'download-pdf', 'faqs', 'honest-reviews', 'reviews'];

      // Find the current active section
      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Check if section is in viewport (considering header offset)
          const y = (isNavFixed ? (navHeight || 0) : 0) + 20;
          if (rect.top <= y && rect.bottom >= y) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Handle click on nav link or its children
      const link = target.closest('.tour-nav-link');
      if (link) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          const sectionId = href.substring(1);
          const element = document.getElementById(sectionId);
          if (element) {
            // Calculate position with offset for sticky header
            const headerOffset = (isNavFixed ? (navHeight || 0) : 0) + 20;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });

            // Immediately set active section
            setActiveSection(sectionId);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick);
    };
  }, [navHeight, isNavFixed]);

  const {
    title,
    overview,
    overviewTitle,
    reviews,
    location,
    activitiesType,
    activateDay,
    traveler,
    price,
    comments,
    relatedTours,
    sliderImages,
    amenities,
    amenitiesTwo,
    highlightList,
    images,
    faqs,
    map,
    itinerary,
    pricingPlans,
    reviewVideos,
  } = tourData;

  const hasReviewVideos = (reviewVideos || []).length > 0;

  const handleBookingSubmit = (data: any) => {
    console.log("Booking Submitted:", data);
    // You could send bookingData to your API here
  };

  const handleCommentSubmit = async (data: any) => {
    if (!id) {
      console.error("No tour ID found");
      return;
    }

    try {
      await reviewsAPI.submitReview({
        tourId: id,
        name: data.name,
        email: data.email,
        rating: Number(data.rating),
        comment: data.comment
      });

      alert("Review submitted successfully! It will appear after approval.");
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review.");
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
        <Loader2 className="animate-spin" style={{ width: '2rem', height: '2rem' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex align-items-center justify-content-center text-danger" style={{ minHeight: '400px' }}>
        {error}
      </div>
    );
  }

  return (
    <>
      <section className='tour-listing-details section-space'>
        {/* Header Section */}
        <TourHeader title={title} reviews={reviews} location={location} />

        <PhotoSwipeGallery>
        {/* Carousel Section */}
        <TourCarousel sliderImages={sliderImages} title={title} />

        {/* Info Bar Section */}
        <TourInfoBar
          location={location}
          activitiesType={activitiesType}
          activateDay={activateDay}
          traveler={traveler}
          price={price}
        />

        <Container
          fluid
          style={{ maxWidth: '1400px', padding: '0 20px' }}
          className="info-area info-bg pb-3 py-4"
        >
          <div className="row align-items-center">
            <div className="col-lg-4">
              <div className="section-heading" style={{ marginBottom: '0' }}>
                <h2 className="sec__title" style={{ color: '#1a1a1a', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '10px' }}>Book With Confidence</h2>
                <p className="sec__desc" style={{ color: '#666', fontWeight: '400', letterSpacing: '0px', marginBottom: '0' }}>Your trusted partner for unforgettable Egyptian adventures</p>
              </div>
            </div>
            <div className="col-lg-8">
              <div className="d-flex justify-content-center align-items-center flex-wrap" style={{ gap: '20px' }}>
                {[
                  { title: 'Pay Monthly', icon: Calendar },
                  { title: '24/7 Support', icon: Headphones },
                  { title: 'Best Prices', icon: Tag },
                  { title: 'Rated 5* Stars', icon: Star },
                  { title: 'Fast Booking', icon: Zap }
                ].map((item, idx) => (
                  <div key={idx} className="text-center" style={{ minWidth: '120px' }}>
                    <div className="info-icon flex-shrink-0 bg-white shadow-sm mx-auto mb-2" style={{
                      width: '70px',
                      height: '70px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      border: '1.5px solid #b79c5c',
                      transition: 'transform 0.3s ease',
                      boxShadow: '0 8px 16px rgba(183, 156, 92, 0.15)'
                    }}>
                      <item.icon size={35} color="#b79c5c" />
                    </div>
                    <h4 className="info__title" style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: '600', margin: '0' }}>{item.title}</h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>

        {/* Section Separator */}
        <div className="section-separator" style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, #e0e0e0, transparent)',
          margin: '40px 0'
        }}></div>

        <Container fluid style={{ maxWidth: '1400px', padding: '0 20px' }}>
          {/* Navigation Bar */}
          <div ref={navPlaceholderRef} />
          <div
            ref={navRef}
            className="tour-details-nav-wrapper bg-white"
            style={{
              position: isNavFixed ? 'fixed' : 'relative',
              top: isNavFixed ? 0 : undefined,
              left: isNavFixed ? 0 : undefined,
              right: isNavFixed ? 0 : undefined,
              zIndex: isNavFixed ? 1100 : undefined,
              background: '#fff',
              borderBottom: '2px solid #f0f0f0',
              width: '100%',
            }}
          >
            <nav className="tour-details-nav">
              <a href="#description" className={`tour-nav-link ${activeSection === 'description' ? 'active' : ''}`}>Description</a>
              <a href="#tour-plan" className={`tour-nav-link ${activeSection === 'tour-plan' ? 'active' : ''}`}>Tour Plan</a>
              <a href="#amenities" className={`tour-nav-link ${activeSection === 'amenities' ? 'active' : ''}`}>Tour Amenities</a>
              <a href="#pricing" className={`tour-nav-link ${activeSection === 'pricing' ? 'active' : ''}`}>Pricing Plans</a>
              <a href="#gallery" className={`tour-nav-link ${activeSection === 'gallery' ? 'active' : ''}`}>Tour Gallery</a>
              <a href="#download-pdf" className={`tour-nav-link ${activeSection === 'download-pdf' ? 'active' : ''}`}>Download Brochure</a>
              <a href="#faqs" className={`tour-nav-link ${activeSection === 'faqs' ? 'active' : ''}`}>Tour FAQ</a>
              {hasReviewVideos ? (
                <a href="#honest-reviews" className={`tour-nav-link ${activeSection === 'honest-reviews' ? 'active' : ''}`}>
                  Reflective & Honest Reviews
                  <span className="review-count">{reviewVideos?.length || 0}</span>
                </a>
              ) : null}
              <a href="#reviews" className={`tour-nav-link ${activeSection === 'reviews' ? 'active' : ''}`}>
                Tour Reviews
                <span className="review-count">{comments.length}</span>
              </a>
            </nav>
          </div>

          <div style={{ height: isNavFixed ? (navHeight || 0) + 40 : 0 }} />

          <div className='row gutter-y-30 tour-details-row' ref={sidebarRowRef}>
            {/* Sidebar */}
            <div className='col-lg-3'>
              {/* Spacer to prevent layout jump when sidebar is fixed */}
              {isSidebarFixed && (
                <div style={{ height: sidebarRef.current?.getBoundingClientRect().height || 0 }} />
              )}
              <div
                ref={sidebarRef}
                className='tour-listing-details__sidebar'
                style={{
                  position: isSidebarFixed ? 'fixed' : 'relative',
                  left: isSidebarFixed ? sidebarLeft : undefined,
                  width: isSidebarFixed ? sidebarWidth : undefined,
                  top: isSidebarFixed ? (isNavFixed ? navHeight : 0) + 20 : undefined,
                  zIndex: isSidebarFixed ? 1000 : undefined,
                  alignSelf: 'flex-start',
                  height: 'fit-content',
                }}
              >
                <BookingForm tourId={id || ''} onSubmit={handleBookingSubmit} />

                <div
                  className='tour-listing-details__sidebar__item tour-listing-details__sidebar__item-location wow fadeInUp animated'
                  data-wow-delay='0.4s'
                  data-wow-duration='1500ms'
                >
                  <div className='tour-listing-details__sidebar__item-box'>
                    {map && (
                      <iframe
                        title='Google Map'
                        src={map}
                        allowFullScreen
                        className='w-100'
                        height='300'
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className='col-lg-9'>
              <div className='tour-listing-details__content'>

                {/* Description Section */}
                <section id="description" className="tour-section">
                  <div className='tour-listing-details__content__item tour-listing-details__content__text'>
                    <h4 className='tour-listing-details__title'>
                      {overviewTitle}
                    </h4>
                    <div
                      className='tour-listing-details__text'
                      dangerouslySetInnerHTML={{ __html: overview }}
                    />
                    {tourData.whatYouWillLoveHtml && (
                      <div
                        className="tour-listing-details__what-you-love"
                        dangerouslySetInnerHTML={{ __html: tourData.whatYouWillLoveHtml }}
                      />
                    )}
                  </div>

                  {/* Highlight List Section */}
                  {/* Highlight List Section */}
                  <div className='tour-listing-details__content__item tour-listing-details__list'>
                    <h4 className='tour-listing-details__title'>
                      Highlight List
                    </h4>
                    <ul className='tour-listing-details__content__list'>
                      {highlightList.map((item, index) => (
                        <li key={index}>
                          <i className='icon-check-star'></i> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                <section id="tour-plan" className="tour-section">
                  <TourPlan itinerary={itinerary} />
                </section>

                {/* Amenities Section */}
                <section id="amenities" className="tour-section">
                  {(amenities && amenities.length > 0) || (amenitiesTwo && amenitiesTwo.length > 0) ? (
                    <div className='tour-listing-details__content__item tour-listing-details__amenities'>
                      <div className="mb-4">
                        <h4 className='tour-listing-details__title mb-2'>Tour Amenities</h4>
                        <p className="tour-reviews-subtitle">Comprehensive list of what&apos;s provided for your comfortable journey.</p>
                      </div>
                      <div className="row gutter-y-30">
                        {amenities && amenities.length > 0 && (
                          <div className="col-lg-6">
                            <div className="amenities-card inclusion-card">
                              <div className="amenities-card-header">
                                <div className="amenities-icon-wrapper inclusion-icon">
                                  <i className="fas fa-check-circle"></i>
                                </div>
                                <h4 className='amenities-card-title'>What&apos;s Included</h4>
                              </div>
                              <ul className='amenities-card-list'>
                                {amenities.map((amenity, index) => (
                                  <li key={index} className="amenities-card-item">
                                    <i className='fas fa-check'></i>
                                    <span>{amenity}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                        {amenitiesTwo && amenitiesTwo.length > 0 && (
                          <div className="col-lg-6">
                            <div className="amenities-card exclusion-card">
                              <div className="amenities-card-header">
                                <div className="amenities-icon-wrapper exclusion-icon">
                                  <i className="fas fa-times-circle"></i>
                                </div>
                                <h4 className='amenities-card-title'>What&apos;s Not Included</h4>
                              </div>
                              <ul className='amenities-card-list'>
                                {amenitiesTwo.map((amenity, index) => (
                                  <li key={index} className="amenities-card-item">
                                    <i className='fas fa-times'></i>
                                    <span>{amenity}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      title="No Amenities Information"
                      description="There are currently no amenities or inclusions/exclusions listed for this tour."
                      icon="file"
                      size="medium"
                    />
                  )}
                </section>

                {/* Pricing Section */}
                <section id="pricing" className="tour-section">
                  {pricingPlans && pricingPlans.length > 0 ? (
                    <div className='tour-listing-details__content__item tour-listing-details__pricing'>
                      <div className="mb-4">
                        <h4 className='tour-listing-details__title mb-2'>Tour Pricing</h4>
                        <p className="tour-reviews-subtitle">Find the perfect package that suits your budget and preferences.</p>
                      </div>
                      <PricingPlans pricingPlans={pricingPlans} />
                    </div>
                  ) : (
                    <EmptyState
                      title="No Pricing Plans Available"
                      description="There are currently no pricing plans available for this tour."
                      icon="file"
                      size="medium"
                    />
                  )}
                </section>

                {/* Gallery Section */}
                <section id="gallery" className="tour-section">
                  {images && images.length > 0 ? (
                    <div className='tour-listing-details__content__item tour-listing-details__thumb'>
                      <div className="mb-4">
                        <h4 className='tour-listing-details__title mb-2'>Tour Gallery</h4>
                        <p className="tour-reviews-subtitle">A visual journey through the amazing places you will visit.</p>
                      </div>
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
                            const imgUrl = typeof img === 'string' ? img : img.src;
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
                                    style={{ display: 'block' }}
                                  >
                                    <div className='tour-gallery-item'>
                                      <div className='tour-gallery-image-wrapper'>
                                        <Image
                                          src={typeof img === 'string' ? img : img}
                                          alt={`Tour gallery image ${idx + 1}`}
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
                            );
                          })}
                        </Masonry>
                    </div>
                  ) : (
                    <EmptyState
                      title="No Gallery Images"
                      description="This tour currently has no gallery images available."
                      icon="inbox"
                      size="medium"
                    />
                  )}
                </section>

                {/* Download Section */}
                <section id="download-pdf" className="tour-section">
                  <DownloadPdfBrochure tour={tourData} />
                </section>

                {/* FAQs Section */}
                <section id="faqs" className="tour-section">
                  {faqs && faqs.length > 0 ? (
                    <div className='tour-listing-details__content__item tour-listing-details__faqs'>
                      <div className="mb-4">
                        <h4 className='tour-listing-details__title mb-2'>Frequently Asked Questions</h4>
                        <p className="tour-reviews-subtitle">Common questions and answers to help you prepare.</p>
                      </div>
                      <div className="faq-accordion gotur-accordion" data-grp-name="gotur-accordion">
                        <Accordion
                          defaultActiveKey="0"
                          className="wow fadeInUp"
                          data-wow-duration="1500ms"
                          data-wow-delay="500ms"
                        >
                          {faqs.map((faq, index) => (
                            <Accordion.Item eventKey={String(index)} key={index}>
                              <Accordion.Header>
                                <div className="accordion-title">
                                  <h4 className="accordion-title__text">
                                    {faq.question}
                                    <span className="accordion-title__icon"></span>
                                  </h4>
                                </div>
                              </Accordion.Header>
                              <Accordion.Body>
                                <div className="accordion-content">
                                  <div className="inner">
                                    <div className="inner__text" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                                  </div>
                                </div>
                              </Accordion.Body>
                            </Accordion.Item>
                          ))}
                        </Accordion>
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      title="No FAQs Available"
                      description="There are currently no frequently asked questions for this tour."
                      icon="file"
                      size="medium"
                    />
                  )}
                </section>

                {hasReviewVideos ? (
                  <section id="honest-reviews" className="tour-section">
                    <div className='tour-listing-details__content__item'>
                      <div className="mb-4">
                        <h4 className='tour-listing-details__title mb-2'>Reflective & Honest Reviews</h4>
                        <p className="tour-reviews-subtitle">Watch real experiences from travelers on YouTube.</p>
                      </div>
                      <div className="row gutter-y-30">
                        {(reviewVideos || []).map((v, idx) => (
                          <div className="col-lg-6" key={`${v.videoId}-${idx}`}>
                            <div
                              className="bg-white border rounded-3 overflow-hidden"
                              style={{ boxShadow: '0 8px 18px rgba(0,0,0,0.06)' }}
                            >
                              <div className="p-3 border-bottom">
                                <div className="fw-semibold" style={{ color: '#1a1a1a' }}>{v.title || 'Review'}</div>
                              </div>
                              <div className="ratio ratio-16x9">
                                <iframe
                                  src={`https://www.youtube-nocookie.com/embed/${v.videoId}`}
                                  title={v.title || 'YouTube review'}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                />
                              </div>
                              <div className="p-3">
                                <a href={v.url} target="_blank" rel="noreferrer" className="text-decoration-none">
                                  Open on YouTube
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                ) : null}

                {/* Reviews Section */}
                <section id="reviews" className="tour-section">
                  <TourReviews2
                    comments={comments}
                    tourId={id || ""}
                    onSubmit={handleCommentSubmit}
                    totalReviews={comments.length}
                    averageRating={4.9}
                  />
                </section>

                {/* Related Tours Section */}
                <FeatureTwo 
                  tours={relatedTours} 
                  itemsPerRow={3} 
                  homeThree={false}
                  showShape={false}
                  extraClass="section-space-top"
                  title="Related Tours"
                  titleSpan="Tours"
                  subtitle="You might also like those tour"
                  uniqueId="related-tours"
                  headerStyle="testimonials"
                />
              </div>
            </div>
          </div>
        </Container>

        {/* Full-width Related Tours Carousel */}
        <FeatureTwo 
          extraClass="section-space-top" 
          itemsPerRow={4}
          homeThree={false}
          showShape={false}
          title="More"
          titleSpan="Tours"
          subtitle="Discover more amazing experiences"
          uniqueId="more-tours"
          showPartners={true}
          partners={[
            {
              id: 1,
              name: "Egypt Tourism",
              logo: "https://placehold.co/120x60/4A90E2/FFFFFF?text=Egypt+Tourism",
              link: "https://egypt.tourism"
            },
            {
              id: 2,
              name: "Cairo Tours",
              logo: "https://placehold.co/120x60/50C878/FFFFFF?text=Cairo+Tours",
              link: "https://cairo.tours"
            },
            {
              id: 3,
              name: "Luxor Travel",
              logo: "https://placehold.co/120x60/F5A623/FFFFFF?text=Luxor+Travel",
              link: "https://luxor.travel"
            },
            {
              id: 4,
              name: "Aswan Adventures",
              logo: "https://placehold.co/120x60/E74C3C/FFFFFF?text=Aswan+Adv",
              link: "https://aswan.adventures"
            }
          ]}
          partnersTitle="Our Travel Partners"
          partnersSubtitle="We collaborate with trusted local and international travel partners"
        />
      </PhotoSwipeGallery>
      </section>
      
    </>
  );
};

export default TourListingOneDetails;
