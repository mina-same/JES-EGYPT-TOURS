"use client";
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";
import { Container, Accordion } from "react-bootstrap";
import Image from "next/image";
import Masonry from "react-masonry-css";
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery";
import { Calendar, Headphones, Tag, Star, Zap, ChevronDown, HelpCircle } from "lucide-react";
import TourListingDetailsOneSkeleton from "./TourListingDetailsOneSkeleton";
import Link from "next/link";

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
import { MobileStickyBookingBar } from "./components/MobileStickyBookingBar";
import TourReviews2 from "../TourListingDetailsTwo/TourReviews2";
import FeatureTwo from "../FeatureTwo/FeatureTwo";
import ClientCarousel from "../ClientCarousel/ClientCarousel";

const TourListingOneDetails: React.FC<TourListingOneDetailsProps> = ({ id }) => {
  const { tourData, loading, error, moreTours, relatedBlogs } = useTourData(id);
  console.log("DEBUG [TourListingDetailsOne]: moreTours state:", moreTours);
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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [faqActiveKey, setFaqActiveKey] = useState<string | null>("0");
  const [isMobile, setIsMobile] = useState(false);

  const params = useParams() as { locale: string };
  const { t, i18n } = useTranslation("tours");

  useEffect(() => {
    if (params?.locale && i18n.resolvedLanguage !== params.locale) {
      i18n.changeLanguage(params.locale);
    }
  }, [params?.locale, i18n]);

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
    setIsMobile(window.innerWidth < 992);
    const handleResize = () => {
      updateNavHeight();
      updateSidebarBounds();
      setIsMobile(window.innerWidth < 992);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const updateFixedState = () => {
      // Disable sticky navigation tabs on mobile
      if (window.innerWidth < 992) {
        setIsNavFixed(false);
        return;
      }
      
      const el = navPlaceholderRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      setIsNavFixed(top <= 0);
    };

    const updateSidebarFixed = () => {
      // Only run sticky logic on desktop (>= 992px)
      if (window.innerWidth < 992) {
        setIsSidebarFixed(false);
        return;
      }

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
      const sections = ['description', 'tour-plan', 'map', 'amenities', 'pricing', 'gallery', 'download-pdf', 'faqs', 'honest-reviews', 'reviews'];

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

      alert(t("tourDetails.reviewSuccess"));
    } catch (error) {
      console.error("Error submitting review:", error);
      alert(t("tourDetails.reviewFail"));
    }
  };

  if (loading) {
    return <TourListingDetailsOneSkeleton />;
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
        {/* Header Section - Commented out */}
        {/* <TourHeader title={title} reviews={reviews} location={location} /> */}

        <PhotoSwipeGallery>
        {/* Carousel Section */}
        <TourCarousel sliderImages={sliderImages} title={title} />

        {/* Tour Key Facts - Screen Reader Only */}
        <h2 className="sr-only">Tour Key Facts</h2>

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
                <h2 className="sec__title" style={{ color: '#1a1a1a', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '10px' }}>{t("tourDetails.bookConfidence")}</h2>
                <p className="sec__desc" style={{ color: '#666', fontWeight: '400', letterSpacing: '0px', marginBottom: '0' }}>{t("tourDetails.bookConfidenceDesc")}</p>
              </div>
            </div>
            <div className="col-lg-8">
              <div className="d-flex justify-content-center align-items-center flex-wrap" style={{ gap: '20px' }}>
                {[
                  { title: t("tourDetails.features.monthly"), icon: Calendar },
                  { title: t("tourDetails.features.support"), icon: Headphones },
                  { title: t("tourDetails.features.prices"), icon: Tag },
                  { title: t("tourDetails.features.rating"), icon: Star },
                  { title: t("tourDetails.features.fast"), icon: Zap }
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
              <a href="#description" className={`tour-nav-link ${activeSection === 'description' ? 'active' : ''}`}>{t("tourDetails.nav.description")}</a>
              <a href="#tour-plan" className={`tour-nav-link ${activeSection === 'tour-plan' ? 'active' : ''}`}>{t("tourDetails.nav.tourPlan")}</a>
              <a href="#map" className={`tour-nav-link ${activeSection === 'map' ? 'active' : ''}`}>{t("tourDetails.nav.map")}</a>
              <a href="#amenities" className={`tour-nav-link ${activeSection === 'amenities' ? 'active' : ''}`}>{t("tourDetails.nav.amenities")}</a>
              <a href="#pricing" className={`tour-nav-link ${activeSection === 'pricing' ? 'active' : ''}`}>{t("tourDetails.nav.pricing")}</a>
              <a href="#gallery" className={`tour-nav-link ${activeSection === 'gallery' ? 'active' : ''}`}>{t("tourDetails.nav.gallery")}</a>
              <a href="#download-pdf" className={`tour-nav-link ${activeSection === 'download-pdf' ? 'active' : ''}`}>{t("tourDetails.nav.brochure")}</a>
              <a href="#faqs" className={`tour-nav-link ${activeSection === 'faqs' ? 'active' : ''}`}>{t("tourDetails.nav.faq")}</a>
              {hasReviewVideos ? (
                <a href="#honest-reviews" className={`tour-nav-link ${activeSection === 'honest-reviews' ? 'active' : ''}`}>
                  {t("tourDetails.nav.honestReviews")}
                  <span className="review-count">{reviewVideos?.length || 0}</span>
                </a>
              ) : null}
              <a href="#reviews" className={`tour-nav-link ${activeSection === 'reviews' ? 'active' : ''}`}>
                {t("tourDetails.nav.reviews")}
                <span className="review-count">{reviews}</span>
              </a>
            </nav>
          </div>

          <div style={{ height: (isNavFixed && !isMobile) ? (navHeight || 0) + 40 : 0 }} />

          <div className='row gutter-y-30 tour-details-row' ref={sidebarRowRef}>
            {/* Main Content */}
            <div className='col-lg-9'>
              <div className='tour-listing-details__content'>

                {/* Description Section */}
                <section id="description" className="tour-section mb-5">
                  <div className='tour-listing-details__content__item border-0 p-0 shadow-none'>
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <div style={{ width: '5px', height: '32px', borderRadius: '4px', backgroundColor: '#b79c5c' }}></div>
                      <h2 className='tour-listing-details__title m-0' style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-0.02em' }}>
                        {overviewTitle}
                      </h2>
                    </div>
                    
                    <div className={`tour-description-wrapper ${isMobile && !isDescriptionExpanded ? 'collapsed' : ''}`}>
                      <div
                        className='tour-listing-details__text mb-4'
                        style={{ color: '#444', fontSize: '1rem', lineHeight: '1.8' }}
                        dangerouslySetInnerHTML={{ __html: overview }}
                      />
                      
                      {tourData.whatYouWillLoveHtml && (
                        <div className="tour-listing-details__what-you-love mt-5 p-5 rounded-4 shadow-sm" style={{ 
                          background: 'linear-gradient(135deg, rgba(183, 156, 92, 0.08) 0%, rgba(183, 156, 92, 0.03) 100%)', 
                          border: '1px solid rgba(183, 156, 92, 0.15)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          {/* Premium Background Element */}
                          <div style={{ 
                            position: 'absolute', 
                            top: '-20px', 
                            right: '-20px', 
                            fontSize: '160px', 
                            opacity: '0.04',
                            transform: 'rotate(-15deg)',
                            userSelect: 'none',
                            pointerEvents: 'none'
                          }}>💎</div>
                          
                          <div className="d-flex align-items-center gap-4 mb-4">
                            <div className="bg-white p-2 rounded-3 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '54px', height: '54px' }}>
                              <i className="icon-star" style={{ fontSize: '24px', color: '#b79c5c' }}></i>
                            </div>
                            <div>
                               <h4 className="m-0 fs-5 fw-bold text-dark" style={{ letterSpacing: '0.01em' }}>
                                 {t("tourDetails.whatYouWillLove", "What You Will Love about this tour?")}
                               </h4>
                               <div style={{ width: '40px', height: '3px', borderRadius: '2px', backgroundColor: '#b79c5c', marginTop: '4px' }}></div>
                            </div>
                          </div>

                          <div
                            className='tour-listing-details__text'
                            style={{ 
                              color: '#333', 
                              lineHeight: '1.9',
                              fontSize: '1rem',
                              fontWeight: '400'
                            }}
                            dangerouslySetInnerHTML={{ __html: tourData.whatYouWillLoveHtml }}
                          />
                        </div>
                      )}
                    </div>
                    {isMobile && (
                      <button 
                        className="tour-read-more-btn"
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      >
                        {isDescriptionExpanded ? t("tourDetails.readLess", "Read Less") : t("tourDetails.readMore", "Read More")}
                      </button>
                    )}
                  </div>

                  {/* Tour Highlights Section */}
                  <div className='tour-listing-details__content__item border-0 p-0 mb-5'>
                    <div className="d-flex align-items-center gap-2 mb-4">
                      <div style={{ width: '4px', height: '24px', backgroundColor: '#b79c5c' }}></div>
                      <h2 className='tour-listing-details__title m-0' style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                        {t("tourDetails.highlightList")}
                      </h2>
                    </div>
                    <ul className="list-unstyled row gutter-y-20" style={{ paddingLeft: 0 }}>
                      {highlightList.map((item, index) => (
                        <li key={index} className="col-md-6 col-lg-4 mb-3">
                          <div className="d-flex align-items-start gap-3">
                            <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ 
                              width: '26px', 
                              height: '26px', 
                              backgroundColor: 'rgba(183, 156, 92, 0.1)',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}>
                              <i className='icon-check-star' style={{ color: '#b79c5c', fontSize: '12px' }}></i>
                            </div>
                            <span className="text-dark fw-medium" style={{ fontSize: '0.93rem' }}>{item}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                <section id="tour-plan" className="tour-section">
                  <TourPlan itinerary={itinerary} />
                </section>

                <section id="map" className="tour-section">
                  {map && (
                    <div className='tour-listing-details__content__item'>
                      <h4 className='tour-listing-details__title'>{t("tourDetails.mapTitle")}</h4>
                      <div className="tour-listing-details__map-box" style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                        <iframe
                          title='Google Map'
                          src={map}
                          allowFullScreen
                          className='w-100'
                          height='450'
                          style={{ border: 0 }}
                        />
                      </div>
                    </div>
                  )}
                </section>

                {/* Amenities Section */}
                <section id="amenities" className="tour-section">
                  {(amenities && amenities.trim().length > 0) || (amenitiesTwo && amenitiesTwo.trim().length > 0) ? (
                    <div className='tour-listing-details__content__item border-0 p-0 mb-5'>
                      <h2 className='tour-listing-details__title mb-4' style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                        {t("tourDetails.amenitiesTitle")}
                      </h2>
                      <div className="row g-4">
                        {amenities && amenities.trim().length > 0 && (
                          <div className="col-lg-6">
                            <div className="p-4 rounded-4 h-100" style={{ border: '1px solid #f0f0f0', backgroundColor: '#fff' }}>
                              <h3 className='m-0 fs-6 fw-bold text-dark mb-4' style={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                {t("tourDetails.included")}
                              </h3>
                              <div
                                className="tour-html-content"
                                style={{ fontSize: '0.9rem', color: '#555' }}
                                dangerouslySetInnerHTML={{ __html: amenities }}
                              />
                            </div>
                          </div>
                        )}
                        {amenitiesTwo && amenitiesTwo.trim().length > 0 && (
                          <div className="col-lg-6">
                            <div className="p-4 rounded-4 h-100" style={{ border: '1px solid #f0f0f0', backgroundColor: '#fff' }}>
                              <h3 className='m-0 fs-6 fw-bold text-dark mb-4' style={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                {t("tourDetails.notIncluded")}
                              </h3>
                              <div
                                className="tour-html-content"
                                style={{ fontSize: '0.9rem', color: '#555' }}
                                dangerouslySetInnerHTML={{ __html: amenitiesTwo }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      title={t("tourDetails.empty.amenitiesTitle")}
                      description={t("tourDetails.empty.amenitiesDesc")}
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
                        <h2 className='tour-listing-details__title mb-2'>{t("tourDetails.pricingTitle")}</h2>
                        <p className="tour-reviews-subtitle">{t("tourDetails.pricingSubtitle")}</p>
                      </div>
                      <PricingPlans pricingPlans={pricingPlans} />
                    </div>
                  ) : (
                    <EmptyState
                      title={t("tourDetails.empty.pricingTitle")}
                      description={t("tourDetails.empty.pricingDesc")}
                      icon="file"
                      size="medium"
                    />
                  )}
                </section>
                
                {/* What to Pack Section */}
                {tourData.whatToPack && tourData.whatToPack.length > 0 && (
                  <section id="what-to-pack" className="tour-section mt-4">
                    <div className='tour-listing-details__content__item p-3 p-md-4 rounded-3 shadow-sm' style={{ 
                      backgroundColor: 'rgba(183, 156, 92, 0.02)', 
                      border: '1px solid rgba(183, 156, 92, 0.1)',
                      borderRight: '4px solid #b79c5c'
                    }}>
                      <div className="mb-3 d-flex align-items-center justify-content-between">
                        <h4 className='tour-listing-details__title m-0 d-flex align-items-center gap-2' style={{ fontSize: '1.2rem' }}>
                          <i className="fas fa-suitcase text-primary" style={{ color: '#b79c5c', fontSize: '1rem' }}></i>
                          {t("tourDetails.whatToPack", "What to Pack")}
                        </h4>
                      </div>
                      <div className="row g-2">
                        {tourData.whatToPack.map((item, index) => (
                          <div key={index} className="col-md-6 col-lg-4 mb-2">
                            <div className="d-flex align-items-center gap-2">
                               <div style={{ width: '5px', height: '5px', backgroundColor: '#b79c5c', borderRadius: '50%' }}></div>
                               <span className="text-dark" style={{ fontSize: '0.9rem' }}>{item}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {/* Important Notes Section */}
                {tourData.notes && tourData.notes.length > 0 && (
                  <section id="important-notes" className="tour-section mt-4 pt-3 border-top">
                    <div className="mb-4 d-flex align-items-center gap-2">
                      <div style={{ width: '3px', height: '18px', backgroundColor: '#b79c5c' }}></div>
                      <h4 className='tour-listing-details__title m-0' style={{ fontSize: '1.15rem' }}>
                        {t("tourDetails.importantNotes", "Important Notes")}
                      </h4>
                    </div>
                    <div className="d-flex flex-column gap-3">
                      {tourData.notes?.map((note, index) => (
                        <div key={index} className="tour-note-item">
                          {note.title && (
                            <div className="mb-1">
                              <span className="fw-bold fs-7 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.05em', color: '#b79c5c' }}>
                                {note.title}
                              </span>
                            </div>
                          )}
                          <div 
                            className="text-muted tour-listing-details__text" 
                            style={{ 
                              fontSize: '0.925rem', 
                              lineHeight: '1.6',
                              color: '#555 !important'
                            }}
                            dangerouslySetInnerHTML={{ __html: note.text }}
                          />
                          {index < (tourData.notes?.length || 0) - 1 && (
                            <hr className="mt-3 mb-0 opacity-10" />
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Gallery Section */}
                <section id="gallery" className="tour-section">
                  {images && images.length > 0 ? (
                    <div className='tour-listing-details__content__item tour-listing-details__thumb'>
                      <div className="mb-4">
                        <h4 className='tour-listing-details__title mb-2'>{t("tourDetails.galleryTitle")}</h4>
                        <p className="tour-reviews-subtitle">{t("tourDetails.gallerySubtitle")}</p>
                      </div>
                      
                      {isMobile && (
                        <div className="mobile-swipeable-gallery">
                          {images.map((img, idx) => {
                            const imgUrl = typeof img === 'string' ? img : (img as any).url || (img as any).src;
                            const imageTitle = (typeof img === 'object' && (img as any).title) ? (img as any).title : "";
                            const imgAlt = (img as any).alt || imageTitle || `${title} gallery ${idx + 1}`;
                            return (
                              <Item
                                key={`mobile-img-${idx}`}
                                original={imgUrl}
                                thumbnail={imgUrl}
                                width="1200"
                                height="800"
                                caption={imageTitle || imgAlt}
                              >
                                {({ ref, open }) => (
                                  <a
                                    href={imgUrl}
                                    ref={ref as unknown as React.Ref<HTMLAnchorElement>}
                                    onClick={(e) => { e.preventDefault(); open(e); }}
                                    className="mobile-gallery-link"
                                    title={imageTitle}
                                  >
                                    <div className='tour-gallery-item h-100'>
                                      <div className='tour-gallery-image-wrapper h-100'>
                                        <Image
                                          src={imgUrl}
                                          alt={imgAlt}
                                          title={imageTitle}
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
                            );
                          })}
                        </div>
                      )}
                      
                      {!isMobile && (
                        <Masonry
                          breakpointCols={{ default: 3, 1100: 2, 700: 1 }}
                          className="tour-gallery-masonry"
                          columnClassName="tour-gallery-masonry-column"
                        >
                          {images.map((img, idx) => {
                            const imgUrl = typeof img === 'string' ? img : (img as any).url || (img as any).src;
                            const imageTitle = (typeof img === 'object' && (img as any).title) ? (img as any).title : "";
                            const imgAlt = (img as any).alt || imageTitle || `${title} gallery ${idx + 1}`;
                            return (
                              <Item
                                key={`desk-img-${idx}`}
                                original={imgUrl}
                                thumbnail={imgUrl}
                                width="1200"
                                height="800"
                                caption={imageTitle || imgAlt}
                              >
                                {({ ref, open }) => (
                                  <a
                                    href={imgUrl}
                                    ref={ref as unknown as React.Ref<HTMLAnchorElement>}
                                    onClick={(e) => { e.preventDefault(); open(e); }}
                                    title={imageTitle}
                                    style={{ display: 'block' }}
                                  >
                                    <div className='tour-gallery-item'>
                                      <div className='tour-gallery-image-wrapper'>
                                        <Image
                                          src={imgUrl}
                                          alt={imgAlt}
                                          title={imageTitle}
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
                      )}
                    </div>
                  ) : (
                    <EmptyState
                      title={t("tourDetails.empty.galleryTitle")}
                      description={t("tourDetails.empty.galleryDesc")}
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
                        <h2 className='tour-listing-details__title mb-2'>{t("tourDetails.faqTitle")}</h2>
                        <p className="tour-reviews-subtitle">{t("tourDetails.faqSubtitle")}</p>
                      </div>
                      <div className="faq-accordion gotur-accordion" data-grp-name="gotur-accordion">
                        <Accordion 
                          defaultActiveKey="0"
                          activeKey={faqActiveKey || undefined}
                          onSelect={(k) => setFaqActiveKey(k as string)}
                          className="wow fadeInUp"
                          data-wow-duration="1500ms"
                          data-wow-delay="500ms"
                        >
                          {faqs.map((faq, index) => {
                            const eventKey = String(index);
                            const isOpen = faqActiveKey === eventKey;
                            return (
                              <Accordion.Item eventKey={eventKey} key={index}>
                                <div className="accordion-header">
                                  <Accordion.Button className="bg-transparent border-0 w-100 shadow-none p-0">
                                    <div className="faq-header-content d-flex align-items-center gap-3 w-100" style={{ padding: '20px' }}>
                                      <div className="faq-icon-box">
                                        <HelpCircle size={20} />
                                      </div>
                                      <div className="faq-question-box text-start flex-grow-1">
                                        <h3 className="faq-question-title" style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{faq.question}</h3>
                                      </div>
                                      <div 
                                        className="faq-chevron"
                                        style={{ 
                                          transition: 'transform 0.3s ease',
                                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                                        }}
                                      >
                                        <ChevronDown size={18} />
                                      </div>
                                    </div>
                                  </Accordion.Button>
                                </div>
                                <Accordion.Body>
                                  <div className="accordion-content">
                                    <div className="inner">
                                      <div className="inner__text" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                                    </div>
                                  </div>
                                </Accordion.Body>
                              </Accordion.Item>
                            );
                          })}
                        </Accordion>
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      title={t("tourDetails.empty.faqTitle")}
                      description={t("tourDetails.empty.faqDesc")}
                      icon="file"
                      size="medium"
                    />
                  )}
                </section>

                {hasReviewVideos ? (
                  <section id="honest-reviews" className="tour-section">
                    <div className='tour-listing-details__content__item'>
                      <div className="mb-4">
                        <h4 className='tour-listing-details__title mb-2'>{t("tourDetails.honestReviewsTitle")}</h4>
                        <p className="tour-reviews-subtitle">{t("tourDetails.honestReviewsSubtitle")}</p>
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
                                  {t("tourDetails.openYoutube")}
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
                  <div className="mb-4">
                    <h2 className='tour-listing-details__title mb-2'>{t("tourDetails.reviewsTitle", "Reviews")}</h2>
                    <p className="tour-reviews-subtitle">{t("tourDetails.reviewsSubtitle", "See what our travelers say")}</p>
                  </div>
                  <TourReviews2
                    comments={comments}
                    tourId={id || ""}
                    onSubmit={handleCommentSubmit}
                    totalReviews={reviews}
                    averageRating={4.9}
                  />
                </section>

              </div>
            </div>

            {/* Sidebar - Booking Form */}
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
                <BookingForm tourId={String(tourData.id || '')} onSubmit={handleBookingSubmit} />
              </div>
            </div>
          </div>
        </Container>

        {/* ── Related Tours (max 3, curated) ── */}
        {relatedTours.length > 0 && (
          <section id="related-tours" className="section-space-top pb-5" style={{ borderTop: '1px solid #eee' }}>
            <Container>
                <div className="sec-title text-center mb-5">
                  <h2 className='sec-title__title'>{t("tourDetails.relatedTours.title", "Related Tours")}</h2>
                  <h6 className='sec-title__tagline'>{t("tourDetails.relatedTours.tagline", "Curated Selection")}</h6>
                </div>
                <div className="row gutter-y-30">
                  {relatedTours.map((tour: any, index: number) => (
                    <div key={tour.id} className="col-lg-4 col-md-6">
                      <article 
                        className="tour-listing-one__item wow fadeInUp"
                        data-wow-duration='1500ms'
                        data-wow-delay={`${100 * (index + 1)}ms`}
                      >
                        <div className="tour-listing-one__image">
                          <Image
                            src={tour.image}
                            alt={tour.imageAlt || tour.title || "Tour Image"}
                            title={tour.imageTitle || tour.title || "Tour Image"}
                            width={500}
                            height={350}
                            className="img-fluid"
                            style={{ height: '280px', objectFit: 'cover' }}
                          />
                          <Link href={tour.link} className="tour-listing-one__image__link">
                            <span className="sr-only">{tour.title}</span>
                          </Link>
                        </div>
                        <div className="tour-listing-one__content">
                          <h3 className="tour-listing-one__title text-center">
                            <Link href={tour.link}>{tour.title}</Link>
                          </h3>
                          <div className="text-center mt-2">
                            <Link href={tour.link} className="gotur-btn gotur-btn--base py-2 px-4" style={{ fontSize: '14px' }}>
                              View Details
                            </Link>
                          </div>
                        </div>
                      </article>
                    </div>
                  ))}
                </div>
            </Container>
          </section>
        )}

        {/* ── Related Blogs (max 3, curated or featured fallback) ── */}
        {relatedBlogs.length > 0 && (
          <div className="section-space-top section-space-bottom" style={{ background: '#f8f9fb' }}>
            <Container>
                <div className="sec-title text-center mb-5">
                  <h6 className='sec-title__tagline'>{t("tourDetails.relatedBlogs.tagline", "Travel Stories")}</h6>
                  <h3 className='sec-title__title'>{t("tourDetails.relatedBlogs.title", "Related Blogs")}</h3>
                </div>
                <div className="row gutter-y-30">
                  {relatedBlogs.map((blog: any, index: number) => (
                    <div key={blog.id} className="col-lg-4 col-md-6">
                      <div
                        className='blog-card-two blog-card-two--one wow fadeInUp'
                        data-wow-duration='1500ms'
                        data-wow-delay={`${100 * (index + 1)}ms`}
                      >
                        <div className='blog-card-two__image'>
                          {blog.image ? (
                            <Image
                              src={blog.image}
                              alt={blog.imageAlt || blog.title || "Blog Image"}
                              title={blog.imageTitle || blog.title || "Blog Image"}
                              className="img-fluid"
                              width={600}
                              height={450}
                              style={{ width: "100%", height: "260px", objectFit: "cover" }}
                            />
                          ) : (
                            <div style={{ width: "100%", height: "260px", background: "#eee" }} />
                          )}
                          <div className='blog-card-two__date'>
                            <span className='blog-card-two__date__day'>{new Date(blog.date).getDate()}</span>
                            <span className='blog-card-two__date__month'>
                              {new Date(blog.date).toLocaleString('default', { month: 'short' })}
                            </span>
                          </div>
                          <Link href={blog.link} className='blog-card-two__image__link'>
                            <span className='sr-only'>{blog.title}</span>
                          </Link>
                        </div>
                        <div className='blog-card-two__content'>
                          <ul className='list-unstyled blog-card-two__meta'>
                            <li>
                              <Link href={blog.link}>
                                <span className='blog-card-two__meta__icon'>
                                  <i className='icon-user'></i>
                                </span>{" "}
                                {t("tourDetails.relatedBlogs.by", "By")} {blog.author}
                              </Link>
                            </li>
                            {blog.category && (
                              <li>
                                <Link href={blog.link}>
                                  <span className='blog-card-two__meta__icon'>
                                    <i className='icon-price-tag'></i>
                                  </span>{" "}
                                  {blog.category}
                                </Link>
                              </li>
                            )}
                          </ul>
                          <h3 className='blog-card-two__title'>
                            <Link href={blog.link}>{blog.title}</Link>
                          </h3>
                          <Link
                            href={blog.link}
                            className='blog-card-two__content__btn'
                          >
                            {t("tourDetails.relatedBlogs.readMore", "Read More")} <i className='icon-arrow-right'></i>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            </Container>
          </div>
        )}

        {/* ── More Tours from Same Category (full-width carousel) ── */}
        {moreTours.length > 0 && (
          <FeatureTwo
            extraClass="section-space-top"
            itemsPerRow={4}
            homeThree={false}
            showShape={false}
            tours={moreTours}
            title={t("tourDetails.moreTours.title", "More")}
            titleSpan={t("tourDetails.moreTours.span", "Tours")}
            subtitle={t("tourDetails.moreTours.subtitle", "More tours from this category")}
            uniqueId="more-tours"
          />
        )}

        {/* ── Trusted Partners / Brands ── */}
        <ClientCarousel extraClass="section-space-top section-space-bottom" />

      </PhotoSwipeGallery>
      </section>

      {/* Mobile Sticky Booking Bar */}
      <MobileStickyBookingBar tourId={id || ""} price={price} />
    </>
  );
};

export default TourListingOneDetails;