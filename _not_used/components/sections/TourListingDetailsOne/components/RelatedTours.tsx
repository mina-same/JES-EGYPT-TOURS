import React from "react";
import { Col } from "react-bootstrap";
import Image from "next/image";
import Link from "next/link";
import { Gallery as PhotoSwipeGallery, Item as PhotoSwipeItem } from "react-photoswipe-gallery";
import { Item } from "./types";

interface RelatedToursProps {
  relatedTours: Item[];
  onVideoClick: (videoId: string) => void;
}

export const RelatedTours: React.FC<RelatedToursProps> = ({ relatedTours, onVideoClick }) => {
  if (!relatedTours || relatedTours.length === 0) {
    return null;
  }

  return (
    <div className='tour-listing-details__content__item tour-listing-details__ture-list'>
      <h4 className='tour-listing-details__title'>
        Related Tour List
      </h4>
      <PhotoSwipeGallery>
        <div className='row'>
          {relatedTours.map((item: Item, index) => (
            <Col lg={6} md={6} key={index}>
              <div
                className='listing-card-four wow fadeInUp'
                data-wow-duration='1500ms'
              >
                <div className='listing-card-four__image'>
                  <div className="relative w-full" style={{ height: '257px' }}>
                    <Image 
                      src={item.image} 
                      alt={item.title} 
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
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
                      <PhotoSwipeItem
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
                      </PhotoSwipeItem>

                      <Link
                        className='video-popup'
                        href='https://www.youtube.com/watch?v=0MuL8fd3pb8'
                        onClick={(e) => {
                          e.preventDefault();
                          onVideoClick(item.videoId);
                        }}
                      >
                        <span className='icon-video'></span>
                      </Link>
                    </div>
                  </div>
                  <ul className='listing-card-four__meta list-unstyled'>
                    {item.meta.map((meta) => (
                      <li key={meta.id}>
                        <Link href='tour-listing-details-2'>
                          <span className='listing-card-four__meta__icon'>
                            <i className={meta.icon}></i>
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
                        <i className='icon-right'></i>
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
  );
};
