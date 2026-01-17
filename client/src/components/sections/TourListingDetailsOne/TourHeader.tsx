import React from "react";
import { Container } from "react-bootstrap";
import Link from "next/link";

interface TourHeaderProps {
  title: string;
  reviews: number;
  location: string;
}

export const TourHeader: React.FC<TourHeaderProps> = ({ title, reviews, location }) => {
  return (
    <div
      className='tour-listing-details__destination wow fadeInUp animated'
      data-wow-duration='1500ms'
      data-wow-delay='500ms'
    >
      <Container style={{ maxWidth: '1400px', padding: '0 20px' }} fluid>
        <div className='tour-listing-details__destination__inner'>
          <div className='tour-listing-details__destination__left'>
            <h4 className='tour-listing-details__destination__title'>
              {title}
            </h4>
            <div className='tour-listing-details__destination__revue'>
              <div className='tour-listing-details__destination__ratings-box'>
                <span>({reviews} Review)</span>
                {[...Array(5)].map((_, index) => (
                  <i key={index} className='icon-star' style={{ color: '#b79c5c' }}></i>
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
  );
};
