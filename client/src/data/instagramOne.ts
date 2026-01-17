import { StaticImageData } from 'next/image';
import insta1 from '@/assets/images/instragarm/insta-1-1.jpg';
import insta2 from '@/assets/images/instragarm/insta-1-2.jpg';
import insta3 from '@/assets/images/instragarm/insta-1-3.jpg';
import insta4 from '@/assets/images/instragarm/insta-1-4.jpg';
import insta5 from '@/assets/images/instragarm/insta-1-5.jpg';
import insta6 from '@/assets/images/instragarm/insta-1-6.jpg';

export interface InstagramItem {
  id: number;
  image: StaticImageData;
  link: string;
}

export interface InstagramOneData {
  title: string;
  items: InstagramItem[];
}

export const instagramOneData: InstagramOneData = {
  title: 'Follow Instagram',
  items: [
    { id: 1, image: insta1, link: 'https://www.instagram.com/' },
    { id: 2, image: insta2, link: 'https://www.instagram.com/' },
    { id: 3, image: insta3, link: 'https://www.instagram.com/' },
    { id: 4, image: insta4, link: 'https://www.instagram.com/' },
    { id: 5, image: insta5, link: 'https://www.instagram.com/' },
    { id: 6, image: insta6, link: 'https://www.instagram.com/' },
    { id: 7, image: insta1, link: 'https://www.instagram.com/' },
    { id: 8, image: insta2, link: 'https://www.instagram.com/' },
    { id: 9, image: insta3, link: 'https://www.instagram.com/' },
    { id: 10, image: insta4, link: 'https://www.instagram.com/' },
    { id: 11, image: insta5, link: 'https://www.instagram.com/' },
    { id: 12, image: insta6, link: 'https://www.instagram.com/' },
  ],
};
