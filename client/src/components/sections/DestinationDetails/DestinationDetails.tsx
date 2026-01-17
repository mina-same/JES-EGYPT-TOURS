// components/DestinationDetails.tsx
"use client";

import { useState } from "react";
import { Accordion, Card } from "react-bootstrap";
import Image, { StaticImageData } from "next/image";

import destinationDetailsData from "@/data/destinationDetailsData";
import dynamic from "next/dynamic";
import destinationInfo, { mapEmbedUrl } from "@/data/destinationInfoData";
const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});

interface DestinationDetailsData {
  title: string;
  titleTwo: string;
  overview: string;
  topDestinations: string;
  sliderImages: StaticImageData[];
  images: StaticImageData[];
  faqs: { question: string; answer: string }[];
}

const DestinationDetails = () => {
  const data: DestinationDetailsData = destinationDetailsData;
  const [activeKey, setActiveKey] = useState<string | null>("0");

  return (
    <section className='destination-details section-space'>
      <div className='container'>
        <div className='destination-carousel'>
          <div className='destination-carousel__inner gotur-owl__carousel gotur-owl__carousel--basic-nav owl-carousel owl-theme owl-loaded owl-drag'>
            <TinySlider
              settings={{
                items: 1,
                gutter: 30,
                loop: false,
                nav: false,
                autoplay: false,
                controls: true,
                mouseDrag: true,
                controlsContainer: ".owl-nav",
              }}
            >
              {data?.sliderImages.map((img, idx) => (
                <div key={idx}>
                  <div className='item'>
                    <div className='destination-carousel__item'>
                      <Image src={img} alt='destination' />
                    </div>
                  </div>
                </div>
              ))}
            </TinySlider>
            <div className='owl-nav'>
              <button
                type='button'
                role='presentation'
                className='owl-prev'
                aria-label='carousel button'
              >
                <span className='icon-arrow-left'></span>
              </button>
              <button
                type='button'
                role='presentation'
                className='owl-next'
                aria-label='carousel button'
              >
                <span className='icon-arrow-right'></span>
              </button>
            </div>
          </div>
        </div>
        <div className='row gutter-y-30'>
          <div className='col-lg-8'>
            <div className='destination-details__content'>
              <div className='destination-details__content__item'>
                <h3
                  className='destination-details__title wow fadeInUp animated'
                  data-wow-duration='1500ms'
                  data-wow-delay='500ms'
                >
                  {data.title}
                </h3>
                <p
                  className='destination-details__text wow fadeInUp animated'
                  data-wow-duration='1500ms'
                  data-wow-delay='500ms'
                >
                  {data.overview}
                </p>
              </div>
              <div className='destination-details__content__item'>
                <h3
                  className='destination-details__title wow fadeInUp animated'
                  data-wow-duration='1500ms'
                  data-wow-delay='500ms'
                >
                  {data.titleTwo}
                </h3>
                <p
                  className='destination-details__text wow fadeInUp animated'
                  data-wow-duration='1500ms'
                  data-wow-delay='500ms'
                >
                  {data.topDestinations}
                </p>
              </div>
              <div className='destination-details__content__thumb'>
                <div className='row gutter-y-30'>
                  {data.images.map((img, idx) => (
                    <div className='col-md-6' key={idx}>
                      <div className='destination-details__content__thumb__item'>
                        <Image src={img} alt='destination' />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className='destination-details__content__faq'>
                <h3
                  className='destination-details__title wow fadeInUp animated'
                  data-wow-duration='1500ms'
                  data-wow-delay='500ms'
                >
                  Free Ask Question?
                </h3>
                <div className='faq-page__accordion faq-accordion gotur-accordion'>
                  <Accordion
                    defaultActiveKey='0'
                    //    onSelect={(k) => setActiveKey(k)}
                  >
                    {data.faqs.map((faq, idx) => (
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
            </div>
          </div>

          <div className='col-lg-4'>
            <aside className='destination-details__sidebar'>
              <div className='destination-details__sidebar__item destination-details__sidebar__item-list wow fadeInUp'>
                <h4 className='destination-details__sidebar__title'>
                  Some Information
                </h4>
                <ul className='destination-details__sidebar__list'>
                  {destinationInfo.map((item, index) => (
                    <li key={index}>
                      <p className='destination-details__sidebar__text'>
                        <i className='icon-check-star'></i> {item.label}:
                      </p>
                      <span>{item.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className='destination-details__sidebar__item destination-details__sidebar__item-map wow fadeInUp'>
                <iframe
                  title='Google Map'
                  src={mapEmbedUrl}
                  allowFullScreen
                  className='w-100'
                  height='300'
                />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DestinationDetails;
