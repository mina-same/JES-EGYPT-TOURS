import React from "react";
import { Container } from "react-bootstrap";
import Link from "next/link";

interface TourInfoBarProps {
  location: string;
  activitiesType: string;
  activateDay: string;
  traveler: number;
  price: number;
}

export const TourInfoBar: React.FC<TourInfoBarProps> = ({
  location,
  activitiesType,
  activateDay,
  traveler,
  price
}) => {
  return (
    <div
      className='tour-listing-details__info-area wow fadeInUp'
      data-wow-duration='1500ms'
      data-wow-delay='500ms'
    >
      <Container fluid style={{ maxWidth: '1400px', padding: '0 20px' }}>
        <ul className='tour-listing-details__info-area__info list-unstyled'>
          <li>
            <div className='tour-listing-details__info-area__icon'>
              <i className='icon-location' style={{ color: '#b79c5c' }}></i>
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
              <i className='icon-travel-and-tourism' style={{ color: '#b79c5c' }}></i>
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
              <i className='icon-clock' style={{ color: '#b79c5c' }}></i>
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
              <i className='icon-group' style={{ color: '#b79c5c' }}></i>
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
              Price starts from ${price}
            </Link>
          </li>
        </ul>
      </Container>
    </div>
  );
};
