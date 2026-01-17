"use client";
import React, { useState } from "react";
import { Container, Tabs, Tab, Accordion } from "react-bootstrap";
import Image from "next/image";
import Slider from "react-slick";
import { Loader2, Calendar, Headphones, Tag, Star, Zap } from "lucide-react";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import EmptyState from "@/components/common/EmptyState/EmptyState";
import FullWidthCalendar from "../Calender/Calender";

// Import types
import { TourListingOneDetailsProps } from "./types";

// Import custom hook
import { useTourData } from "./useTourData";

// Import sub-components
import { TourHeader } from "./TourHeader";
import { TourInfoBar } from "./TourInfoBar";
import { BookingForm } from "./BookingForm";
import { TourPlan } from "./TourPlan";
import { PricingPlans } from "./PricingPlans";
import { RelatedTours } from "./RelatedTours";
import { ReviewsSection } from "./ReviewsSection";

const TourListingOneDetails: React.FC<TourListingOneDetailsProps> = ({ id }) => {
  const { tourData, loading, error } = useTourData(id);
  const [isOpen, setOpen] = useState(false);
  const [videoId, setVideoId] = useState("");

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
  } = tourData;

  const settings = {
    className: "center",
    centerMode: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    gutter: 30,
    loop: false,
    nav: false,
    autoplay: false,
    controls: false,
    mouseDrag: true,
    centerPadding: "230px",

    responsive: [
      {
        breakpoint: 1199,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: true,
          centerPadding: "230px",
        },
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          centerPadding: "70px",
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          centerPadding: "100px",
        },
      },
      {
        breakpoint: 575,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          centerPadding: "30px",
        },
      },
    ],
  };

  const handleBookingSubmit = (data: any) => {
    console.log("Booking Submitted:", data);
    // You could send bookingData to your API here
  };

  const handleCommentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });
    console.log("Form Submitted:", data);
  };

  const handleVideoClick = (vId: string) => {
    setOpen(true);
    setVideoId(vId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-500">
        {error}
      </div>
    );
  }

  return (
    <>
      <section className='tour-listing-details section-space'>
        {/* Header Section */}
        <TourHeader title={title} reviews={reviews} location={location} />

        {/* Carousel Section */}
        <div
          className='tour-one section-space-top wow fadeInUp animated'
          data-wow-duration='1500ms'
          data-wow-delay='500ms'
        >
          <div className='tour-one__carousel tour-two__carousel gotur-owl__carousel owl-carousel owl-theme owl-loaded owl-drag'>
            <Slider {...settings}>
              {sliderImages.map((img, idx) => (
                <div key={idx}>
                  <div className='item'>
                    <div className='tour-one__item'>
                      <div className="relative w-full" style={{ height: '320px' }}>
                        <Image
                          src={typeof img === "string" ? img : img}
                          alt='destination'
                          fill
                          sizes="100vw"
                          className="object-cover"
                          priority={idx === 0}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </div>

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
          <div className='row gutter-y-30'>
            {/* Sidebar */}
            <div className='col-lg-3'>
              <div className='tour-listing-details__sidebar'>
                <BookingForm tourId={id} onSubmit={handleBookingSubmit} />

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
                <Tabs defaultActiveKey="description" id="tour-details-tabs" className="tour-details-tabs mb-4">
                  {/* Description Tab */}
                  <Tab eventKey="description" title="Description">
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
                          className="tour-listing-details__what-you-love mt-4 p-4 rounded-lg bg-yellow-50 border-1 border-yellow-200"
                          dangerouslySetInnerHTML={{ __html: tourData.whatYouWillLoveHtml }}
                        />
                      )}
                    </div>
                    <hr className='tour-listing-details__separator' />

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

                    {/* Tour Plan */}
                    <TourPlan itinerary={itinerary} />
                  </Tab>

                  {/* Pricing Tab */}
                  <Tab eventKey="pricing" title="Pricing Plans">
                    {pricingPlans && pricingPlans.length > 0 ? (
                      <div className='tour-listing-details__content__item tour-listing-details__pricing'>
                        <h4 className='tour-listing-details__title'>Tour Pricing</h4>
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
                  </Tab>

                  {/* Amenities Tab */}
                  <Tab eventKey="amenities" title="Tour Amenities">
                    {(amenities && amenities.length > 0) || (amenitiesTwo && amenitiesTwo.length > 0) ? (
                      <div className='tour-listing-details__content__item tour-listing-details__amenities'>
                        <h4 className='tour-listing-details__title'>Tour Amenities</h4>
                        <div className="flex-col flex-wrap gap-10">
                          {amenities && amenities.length > 0 && (
                            <div className="">
                              <div className="amenities-box inclusion-box">
                                <h4 className='amenities-title inclusion-title'>
                                  <i className="fas fa-check-circle" style={{ color: '#b79c5c' }}></i> Inclusion
                                </h4>
                                <ul className='amenities-list'>
                                  {amenities.map((amenity, index) => (
                                    <li key={index} className="amenities-list-item inclusion-item">
                                      <i className='fas fa-check' style={{ color: '#b79c5c' }}></i> {amenity}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                          {amenitiesTwo && amenitiesTwo.length > 0 && (
                            <div className="">
                              <div className="amenities-box exclusion-box">
                                <h4 className='amenities-title exclusion-title'>
                                  <i className="fas fa-times-circle"></i> Exclusion
                                </h4>
                                <ul className='amenities-list'>
                                  {amenitiesTwo.map((amenity, index) => (
                                    <li key={index} className="amenities-list-item exclusion-item">
                                      <i className='fas fa-times'></i> {amenity}
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
                  </Tab>

                  {/* Gallery Tab */}
                  <Tab eventKey="gallery" title="Tour Gallery">
                    {images && images.length > 0 ? (
                      <div className='tour-listing-details__content__item tour-listing-details__thumb'>
                        <div className='row gutter-y-30'>
                          {images.map((img, idx) => (
                            <div className='col-md-6' key={idx}>
                              <div className='destination-details__content__thumb__item'>
                                <Image
                                  src={typeof img === 'string' ? img : img}
                                  alt='destination'
                                  width={370}
                                  height={250}
                                  className="object-cover w-full h-[250px]"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <EmptyState 
                        title="No Gallery Images"
                        description="This tour currently has no gallery images available."
                        icon="inbox"
                        size="medium"
                      />
                    )}
                  </Tab>

                  {/* FAQs Tab */}
                  <Tab eventKey="faqs" title="Tour FAQ">
                    {faqs && faqs.length > 0 ? (
                      <div className='tour-listing-details__content__item tour-listing-details__faqs'>
                        <h4 className='tour-listing-details__title'>
                          Frequently Asked Questions
                        </h4>
                        <Accordion defaultActiveKey="0" className="tour-listing-details__faqs-accordion">
                          {faqs.map((faq, index) => (
                            <Accordion.Item eventKey={String(index)} key={index}>
                              <Accordion.Header>{faq.question}</Accordion.Header>
                              <Accordion.Body>
                                <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
                              </Accordion.Body>
                            </Accordion.Item>
                          ))}
                        </Accordion>
                      </div>
                    ) : (
                      <EmptyState 
                        title="No FAQs Available"
                        description="There are currently no frequently asked questions for this tour."
                        icon="file"
                        size="medium"
                      />
                    )}
                  </Tab>

                  {/* Reviews Tab */}
                  <Tab eventKey="reviews" title={
                    <div className="d-flex align-items-center gap-2">
                      Tour Reviews
                      <span className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle" style={{ width: '24px', height: '24px', fontSize: '12px' }}>
                        {comments.length}
                      </span>
                    </div>
                  }>
                    <ReviewsSection comments={comments} onSubmit={handleCommentSubmit} />
                  </Tab>
                </Tabs>

                {/* Related Tours Section */}
                <RelatedTours relatedTours={relatedTours} onVideoClick={handleVideoClick} />
              </div>
            </div>
          </div>
        </Container>
      </section>
      <VideoModal isOpen={isOpen} setOpen={setOpen} id={videoId} />
    </>
  );
};

export default TourListingOneDetails;
