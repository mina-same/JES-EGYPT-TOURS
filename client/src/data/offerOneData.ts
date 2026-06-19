import { StaticImageData } from 'next/image';
import offer1Img from '@/assets/images/resources/offer-1-1.jpg';
import offer2Img from '@/assets/images/resources/offer-1-2.jpg';
import element from '@/assets/images/resources/about-3-1.png';

export interface OfferCard {
  id: number;
  tagline: string;
  title: string;
  image: StaticImageData;
  link: string;
  alignment: 'left' | 'right';
  buttonStyle?: 'primary' | 'default';
}

export interface OfferOneData {
  sectionTagline: string;
  sectionTitle: string;
  element: StaticImageData;
  offers: OfferCard[];
}

export const offerOneData: OfferOneData = {
  sectionTagline: 'Tailor-Made Tours',
  sectionTitle: 'Your Journey \nYour Way',
  element: element,
  offers: [
    {
      id: 1,
      tagline: 'Tailor-Made',
      title: 'Design Your Perfect \nEgypt Experience',
      image: offer1Img,
      link: 'tailorMade',
      alignment: 'left',
      buttonStyle: 'default',
    },
    {
      id: 2,
      tagline: 'Personalized Tours',
      title: 'Every Detail \nCrafted For You',
      image: offer2Img,
      link: 'tailorMade',
      alignment: 'right',
      buttonStyle: 'primary',
    },
  ],
};
