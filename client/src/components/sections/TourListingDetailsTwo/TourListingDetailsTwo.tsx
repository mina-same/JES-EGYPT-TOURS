"use client";
import React, { FormEvent, useState } from "react";
import DatePicker from "react-datepicker"; // Date range picker
import Image, { StaticImageData } from "next/image"; // Import the Image component from Next.js
import tourDetailsOneData, { mapEmbedUrl } from "@/data/tourDetailsOneData";
import { Accordion, Col, Container } from "react-bootstrap";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery";
import { contactFormFields } from "@/data/contactData";
import FullWidthCalendar from "../Calender/Calender";
import Slider from "react-slick";
import Link from "next/link";
interface ContactFormField {
  name: string;
  label: string;
  placeholder: string;
  type: "text" | "email" | "textarea";
}
// ... imports
// Remove local Metadata interface if it conflicts
import { Item as TourItem } from "../TourListingDetailsOne/types";

interface TourDetailsOneData {
  title: string;
  // ... (rest of interface)
}
// Actually, TourDetailsOneData is also imported from types?
// No, it was defined locally. 
// I should rely on the one from useTourData/types.

// Let's just remove the local interfaces that conflict.

interface Metadata {
  id: number;
  title: string;
  icon: string;
}
interface TourDetailsOneData {
  title: string;
  titleTwo: string;
  overview: string;
  reviews: number;
  location: string;
  activitiesType: string;
  traveler: number;
  activateDay: string;
  price: number;
  overviewTitle: string;
  topDestinations: string;
  sliderImages: StaticImageData[];
  highlightList: string[];
  amenities: string[];
  amenitiesTwo: string[];
  relatedTours: TourItem[];
  comments: Comment[];
  images: StaticImageData[];
  faqs: { question: string; answer: string }[];
}

interface Comment {
  name: string;
  date: string;
  text: string;
  avatar: StaticImageData;
}
import { useParams } from "next/navigation";
import TourReviews2 from "./TourReviews2";
import { useTourData } from "../TourListingDetailsOne/useTourData";
import { reviewsAPI } from "@/lib/api/reviews";


// ... (keep interfaces if needed, or import them)

const TourListingTwoDetails: React.FC = () => {
  const params = useParams();
  const id = params?.id as string;
  const { tourData, loading } = useTourData(id);

  const [startDate, setStartDate] = useState<Date | null>();
  const [startTime, setStartTime] = useState<Date | null>();
  const [isOpen, setOpen] = useState(false);
  const [videoId, setVideoId] = useState("");
  const formFields = contactFormFields as ContactFormField[];
  
  // Rating state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);

  const {
    title,
    titleTwo,
    overview,
    overviewTitle,
    reviews,
    location,
    activitiesType,
    activateDay,
    traveler,
    price,
    comments,
    topDestinations,
    relatedTours,
    sliderImages, // Changed from slider2Images
    amenities,
    amenitiesTwo,
    highlightList,
    images,
    faqs,
  } = tourData;


  // handleCommentSubmit logic...
  const handleCommentSubmit = async (data: any) => {
    // data struct: { name, email, rating, comment, tourId }
    if (!id) return;

    try {
        await reviewsAPI.submitReview({
            tourId: id,
            name: data.name,
            email: data.email,
            rating: data.rating,
            comment: data.comment // TourReviews2 sends 'comment', old one sent 'message' from form name? TourReviews2 uses 'comment'
        });
        // alert handled in TourReviews2 if needed, or here. 
        // TourReviews2 handles success alert/reset.
        // We can just return logic here.
    } catch (error) {
        console.error("Failed to submit review", error);
        throw error; // Let child handle error if it wants
    }
  };

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

  const [extraBooking, setExtraBooking] = useState({
    perBooking: false,
    perPerson: false,
  });

  // Optional: dynamic ticket message
  const [ticketMessage, setTicketMessage] = useState(
    "Please, Select Date First"
  );

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;
    setExtraBooking((prev) => ({
      ...prev,
      perBooking: id === "check8" ? checked : prev.perBooking,
      perPerson: id === "check9" ? checked : prev.perPerson,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!startDate || !startTime) {
      alert("Please select both date and time.");
      return;
    }

    const bookingData = {
      date: startDate.toISOString(),
      time: startTime.toISOString(),
      extras: extraBooking,
      tickets: ticketMessage,
    };

    console.log("Booking Submitted:", bookingData);

    // You could send bookingData to your API here
  };

  const handleComment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    console.log("Form Submitted:", data);
  };
  return (
    <>
      {/* Carousel Section */}
      <div
        className='tour-one section-space-top wow fadeInUp animated'
        data-wow-duration='1500ms'
        data-wow-delay='500ms'
      >
        <div className='tour-one__carousel tour-two__carousel gotur-owl__carousel owl-carousel owl-theme owl-loaded owl-drag'>
          <Slider {...settings}>
            {sliderImages.map((img: any, idx: number) => (
              <div key={idx}>
                <div className='item'>
                  <div className='tour-one__item'>
                    <Image src={img} alt='destination' width={370} height={250} />
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </div>
      <section className='tour-listing-details section-space-bottom'>
        {/* Destination Section */}
        <div
          className='tour-listing-details__destination wow fadeInUp animated'
          data-wow-duration='1500ms'
          data-wow-delay='500ms'
        >
          <Container>
            <div className='tour-listing-details__destination__inner'>
              <div className='tour-listing-details__destination__left'>
                <h4 className='tour-listing-details__destination__title'>
                  {title}
                </h4>
                <div className='tour-listing-details__destination__revue'>
                  <div className='tour-listing-details__destination__ratings-box'>
                    <span>({reviews} Review)</span>
                    {[...Array(5)].map((_, index) => (
                      <i key={index} className='icon-star'></i>
                    ))}
                  </div>
                  <div className='tour-listing-details__destination__posted'>
                    <i className='icon-pin1'></i>
                    <p className='tour-listing-details__destination__posted-text'>
                      {location}
                    </p>
                  </div>
                </div>
              </div>
              <div className='tour-listing-details__destination__right'>
                <Link
                  href='javascript:void(0)'
                  className='tour-listing-details__destination__btn gotur-btn'
                >
                  Share <i className='icon-share'></i>
                </Link>
                <div className='tour-listing-details__destination__social__list'>
                  <Link href='https://twitter.com'>
                    <i className='fab fa-twitter' aria-hidden='true'></i>
                  </Link>
                  <Link href='https://facebook.com'>
                    <i className='fab fa-facebook' aria-hidden='true'></i>
                  </Link>
                  <Link href='https://pinterest.com'>
                    <i className='fab fa-pinterest-p' aria-hidden='true'></i>
                  </Link>
                  <Link href='https://instagram.com'>
                    <i className='fab fa-instagram' aria-hidden='true'></i>
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </div>

        {/* Info Section */}
        <div
          className='tour-listing-details__info-area wow fadeInUp'
          data-wow-duration='1500ms'
          data-wow-delay='500ms'
        >
          <Container>
            <ul className='tour-listing-details__info-area__info list-unstyled'>
              <li>
                <div className='tour-listing-details__info-area__icon'>
                  <i className='icon-location'></i>
                </div>
                <div className='tour-listing-details__info-area__content'>
                  <h5 className='tour-listing-details__info-area__title'>
                    Location
                  </h5>
                  <p className='tour-listing-details__info-area__text'>
                    {location}
                  </p>
                </div>
              </li>
              <li>
                <div className='tour-listing-details__info-area__icon'>
                  <i className='icon-travel-and-tourism'></i>
                </div>
                <div className='tour-listing-details__info-area__content'>
                  <h5 className='tour-listing-details__info-area__title'>
                    Activities Type
                  </h5>
                  <p className='tour-listing-details__info-area__text'>
                    {activitiesType}
                  </p>
                </div>
              </li>
              <li>
                <div className='tour-listing-details__info-area__icon'>
                  <i className='icon-clock'></i>
                </div>
                <div className='tour-listing-details__info-area__content'>
                  <h5 className='tour-listing-details__info-area__title'>
                    Activate Day
                  </h5>
                  <p className='tour-listing-details__info-area__text'>
                    {activateDay}
                  </p>
                </div>
              </li>
              <li>
                <div className='tour-listing-details__info-area__icon'>
                  <i className='icon-group'></i>
                </div>
                <div className='tour-listing-details__info-area__content'>
                  <h5 className='tour-listing-details__info-area__title'>
                    Traveler
                  </h5>
                  <p className='tour-listing-details__info-area__text'>
                    {traveler}
                  </p>
                </div>
              </li>
              <li>
                <Link href='' className='gotur-btn'>
                  ${price}/Per Person
                </Link>
              </li>
            </ul>
          </Container>
        </div>

        <Container>
          <div className='row gutter-y-30'>
            <div className='col-lg-8'>
              <div className='tour-listing-details__content'>
                <div
                  className='tour-listing-details__content__item tour-listing-details__content__text wow fadeInUp animated'
                  data-wow-duration='1500ms'
                  data-wow-delay='500ms'
                >
                  <h4 className='tour-listing-details__title'>
                    {overviewTitle}
                  </h4>
                  <p className='tour-listing-details__text'>{overview}</p>
                </div>
                {/* Highlight List Section */}
                <div
                  className='tour-listing-details__content__item tour-listing-details__list wow fadeInUp'
                  data-wow-duration='1500ms'
                  data-wow-delay='500ms'
                >
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

                {/* Tour Amenities Section */}
                <div
                  className='tour-listing-details__content__item tour-listing-details__amenities wow fadeInUp'
                  data-wow-duration='1500ms'
                  data-wow-delay='500ms'
                >
                  <h4 className='tour-listing-details__title'>
                    Tour Amenities
                  </h4>
                  <div className='tour-listing-details__amenities__inner gap-4'>
                    <ul className='tour-listing-details__amenities__list'>
                      {amenities.map((amenity, index) => (
                        <li key={index}>
                          <i className='fas fa-check'></i> {amenity}
                        </li>
                      ))}
                    </ul>
                    <ul className='tour-listing-details__amenities__list tour-listing-details__amenities__list--two'>
                      {amenitiesTwo.map((amenity, index) => (
                        <li key={index}>
                          <i className='fas fa-times'></i> {amenity}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div
                  className='tour-listing-details__content__item tour-listing-details__thumb wow fadeInUp animated'
                  data-wow-duration='1500ms'
                  data-wow-delay='500ms'
                >
                  <div className='row gutter-y-30'>
                    {images.map((img, idx) => (
                      <div className='col-md-6' key={idx}>
                        <div className='destination-details__content__thumb__item'>
                          <Image src={img} alt='destination' />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tour Plan */}

                <div className='tour-listing-details__content__item tour-listing-details__ture-plan'>
                  <h4 className='tour-listing-details__title'>Tour Plan</h4>
                  <div className='faq-page__accordion faq-accordion gotur-accordion'>
                    <Accordion
                      defaultActiveKey='0'
                      //    onSelect={(k) => setActiveKey(k)}
                    >
                      {faqs.map((faq, idx) => (
                        <Accordion.Item eventKey={idx.toString()} key={idx}>
                          <Accordion.Header>
                            <div className='accordion-title'>
                              <h4 className='accordion-title__text'>
                                {faq.question}
                                <span className='accordion-title__icon'></span>
                              </h4>
                            </div>
                          </Accordion.Header>
                          <Accordion.Body>
                            <div className='accordion-content'>
                              <div className='inner'>
                                <p className='inner__text'>{faq.answer}</p>
                              </div>
                            </div>
                          </Accordion.Body>
                        </Accordion.Item>
                      ))}
                    </Accordion>
                  </div>
                </div>
                {/* Related Tours Section */}
                <div className='tour-listing-details__content__item tour-listing-details__ture-list'>
                  <h4 className='tour-listing-details__title'>
                    Related Tour List
                  </h4>
                  <PhotoSwipeGallery>
                    <div className='row'>
                      {relatedTours.map((item: TourItem, index) => (
                        <Col lg={6} md={6} key={index}>
                          <div
                            className='listing-card-four wow fadeInUp'
                            data-wow-duration='1500ms'
                          >
                            <div className='listing-card-four__image'>
                              <Image src={item.image} alt={item.title} />
                              <div className='listing-card-four__btn-group'>
                                {item.discount && (
                                  <div className='listing-card-four__discount'>
                                    -{item.discount}% off
                                  </div>
                                )}
                                <div className='listing-card-four__featured'>
                                  Featured
                                </div>
                              </div>
                              <div className='listing-card-four__btns'>
                                <Link href='#'>
                                  <i className='far fa-heart'></i>
                                </Link>
                                <div className='listing-card-four__btns__hover'>
                                  <Item
                                    original={typeof item.image === 'string' ? item.image : item.image.src}
                                    thumbnail={typeof item.image === 'string' ? item.image : item.image.src}
                                    width='370'
                                    height='257'
                                  >
                                    {({ ref, open }) => (
                                      <Link
                                        href='#'
                                        className='listing-card-four__popup card__popup'
                                        ref={ref}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          open(e);
                                        }}
                                      >
                                        <span className='icon-image'></span>
                                      </Link>
                                    )}
                                  </Item>

                                  <Link
                                    className='video-popup'
                                    href='https://www.youtube.com/watch?v=0MuL8fd3pb8'
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setOpen(true);
                                      setVideoId(item.videoId);
                                    }}
                                  >
                                    <span className='icon-video'></span>
                                  </Link>
                                </div>
                              </div>
                              <ul className='listing-card-four__meta list-unstyled'>
                                {item.meta.map((meta: Metadata) => (
                                  <li key={meta.id}>
                                    <Link href='tour-listing-details-2'>
                                      {" "}
                                      <span className='listing-card-four__meta__icon'>
                                        {" "}
                                        <i className={meta.icon}></i>{" "}
                                      </span>
                                      {meta.title}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className='listing-card-four__content'>
                              <div className='listing-card-four__rating'>
                                <span>({item.reviews} Review)</span>
                                {[...Array(item.rating)].map((_, i) => (
                                  <i key={i} className='icon-star'></i>
                                ))}
                              </div>
                              <h3 className='listing-card-four__title'>
                                <Link href={item.link}>{item.title}</Link>
                              </h3>

                              <div className='listing-card-four__content__btn'>
                                <div className='listing-card-four__price'>
                                  <span className='listing-card-four__price__sub'>
                                    Per Day
                                  </span>
                                  <span className='listing-card-four__price__number'>
                                    {item.price}
                                  </span>
                                </div>
                                <Link
                                  href={item.link}
                                  className='listing-card-four__btn gotur-btn'
                                >
                                  Book Now{" "}
                                  <span className='icon'>
                                    <i className='icon-right'></i>{" "}
                                  </span>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </Col>
                      ))}
                    </div>
                  </PhotoSwipeGallery>
                </div>
                <div
                  className='tour-listing-details__content__item tour-listing-details__calender wow fadeInUp animated'
                  data-wow-duration='1500ms'
                  data-wow-delay='500ms'
                >
                  <h4
                    className='tour-listing-details__title wow fadeInUp animated'
                    data-wow-duration='1500ms'
                    data-wow-delay='500ms'
                  >
                    Calendar Price
                  </h4>
                  <FullWidthCalendar />
                </div>
                <TourReviews2 
                  comments={comments} 
                  tourId={id} 
                  onSubmit={handleCommentSubmit} 
                  totalReviews={comments.length}
                  averageRating={4.9} // You might want to calculate this dynamically
                />
              </div>
            </div>
            <div className='col-lg-4 fixed'>
              <div className='tour-listing-details__sidebar'>
                <div
                  className='tour-listing-details__sidebar__item tour-listing-details__sidebar__item-form wow fadeInUp animated'
                  data-wow-delay='0.4s'
                  data-wow-duration='1500ms'
                >
                  <h4 className='tour-listing-details__sidebar__title'>
                    Book This Tour
                  </h4>
                  <div className='sidebar-two__form'>
                    <form
                      className='sidebar-two__form__inner contact-form-validated'
                      onSubmit={handleSubmit}
                    >
                      <div className='sidebar-two__form__control'>
                        <label htmlFor='checkin'>From:</label>

                        <DatePicker
                          selected={startDate}
                          onChange={(date) => setStartDate(date)}
                        />
                        <i className='icon-calendar'></i>
                      </div>
                      <div className='sidebar-two__form__control'>
                        <label htmlFor='checkout'>Time:</label>
                        <DatePicker
                          selected={startTime}
                          onChange={(date) => setStartTime(date)}
                        />
                      </div>
                      <div className='sidebar-two__form__control'>
                        <label htmlFor='checkout'>Tickets:</label>
                        <input
                          id='checkout'
                          type='text'
                          name='checkout'
                          placeholder='Please, Select Date Fist'
                        />
                      </div>
                      <div className='sidebar-two__form__control sidebar-two__form__control--two'>
                        <label
                          className='sidebar-two__form__control--title'
                          htmlFor='guests'
                        >
                          Add Extra:
                        </label>
                        <ul className='list-unstyled sidebar-two__form__checkbox'>
                          <li>
                            <input type='checkbox' name='check8' id='check8' />
                            <label htmlFor='check8'>
                              {" "}
                              <span> Services per booking</span>
                            </label>
                          </li>
                          <li>
                            <input type='checkbox' name='check9' id='check9' />
                            <label htmlFor='check9'>
                              <span>Services per person</span>
                            </label>
                          </li>
                        </ul>
                      </div>
                      <ul className='list-unstyled sidebar-two__form__add-list'>
                        <li>
                          <div className='sidebar-two__form__add'>
                            Adult:<span>$20.00</span>
                          </div>
                        </li>
                        <li>
                          <div className='sidebar-two__form__add'>
                            Youth: <span>$16.00</span>
                          </div>
                        </li>
                      </ul>
                      <div className='sidebar-two__form__total'>
                        Total:<span>$36.00</span>
                      </div>
                      <button
                        type='submit'
                        className='gotur-btn gotur-btn--base'
                      >
                        Book Now <i className='icon-right'></i>
                      </button>
                    </form>
                  </div>
                </div>

                <div
                  className='tour-listing-details__sidebar__item tour-listing-details__sidebar__item-location wow fadeInUp animated'
                  data-wow-delay='0.4s'
                  data-wow-duration='1500ms'
                >
                  <div className='tour-listing-details__sidebar__item-box'>
                    <iframe
                      title='Google Map'
                      src={mapEmbedUrl}
                      allowFullScreen
                      className='w-100'
                      height='300'
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
      <VideoModal isOpen={isOpen} setOpen={setOpen} id={videoId} />
    </>
  );
};

export default TourListingTwoDetails;
