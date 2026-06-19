export interface InstagramItem {
  id: number;
  image: string;
  alt: string;
  title: string;
  link: string;
}

export interface InstagramOneData {
  title: string;
  items: InstagramItem[];
}

const INSTAGRAM_URL = 'https://www.instagram.com/jesegypttours/';

const baseItems: Omit<InstagramItem, 'id'>[] = [
  {
    image: '/images/instragarm/insta-1-1.jpg',
    alt: 'Private Giza Pyramids tour with JES Egypt Tours',
    title: 'Exploring the Giza Pyramids — JES Egypt Tours',
    link: INSTAGRAM_URL,
  },
  {
    image: '/images/instragarm/insta-1-2.jpg',
    alt: 'Luxor Temple evening tour Egypt',
    title: 'Luxor Temple by Night — JES Egypt Tours',
    link: INSTAGRAM_URL,
  },
  {
    image: '/images/instragarm/insta-1-3.jpg',
    alt: 'Nile cruise sunset view Egypt',
    title: 'Nile River Sunset Cruise — JES Egypt Tours',
    link: INSTAGRAM_URL,
  },
  {
    image: '/images/instragarm/insta-1-4.jpg',
    alt: 'Valley of the Kings private guided tour Luxor',
    title: 'Valley of the Kings — JES Egypt Tours',
    link: INSTAGRAM_URL,
  },
  {
    image: '/images/instragarm/insta-1-5.jpg',
    alt: 'Abu Simbel temples private tour Egypt',
    title: 'Abu Simbel Temples — JES Egypt Tours',
    link: INSTAGRAM_URL,
  },
  {
    image: '/images/instragarm/insta-1-6.jpg',
    alt: 'Khan El Khalili bazaar Cairo shopping tour',
    title: 'Khan El Khalili Bazaar Cairo — JES Egypt Tours',
    link: INSTAGRAM_URL,
  },
];

export const instagramOneData: InstagramOneData = {
  title: 'Follow Instagram',
  items: [
    ...baseItems.map((item, i) => ({ id: i + 1, ...item })),
    ...baseItems.map((item, i) => ({ id: i + 7, ...item })),
  ],
};
