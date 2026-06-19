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

const URL = 'https://www.instagram.com/jesegypttours/';

export const instagramOneData: InstagramOneData = {
  title: 'Follow Instagram',
  items: [
    { id: 1,  image: '/images/instragarm/giza-pyramids-couple-camel-tour-egypt.webp',                       alt: 'Couple on camels at the Giza Pyramids',                        title: 'Giza Pyramids Camel Tour — JES Egypt Tours',                   link: URL },
    { id: 2,  image: '/images/instragarm/luxor-hot-air-balloon-ride-sunrise-egypt.webp',                   alt: 'Hot air balloon ride over Luxor at sunrise',                   title: 'Luxor Hot Air Balloon Sunrise — JES Egypt Tours',              link: URL },
    { id: 3,  image: '/images/instragarm/valley-of-the-kings-tomb-luxor-tour-egypt.webp',                  alt: 'Valley of the Kings royal tombs tour Luxor',                   title: 'Valley of the Kings Luxor — JES Egypt Tours',                  link: URL },
    { id: 4,  image: '/images/instragarm/siwa-oasis-salt-lake-swimming-tour-egypt.webp',                   alt: 'Swimming in Siwa Oasis salt lakes Egypt',                       title: 'Siwa Oasis Salt Lake Tour — JES Egypt Tours',                  link: URL },
    { id: 5,  image: '/images/instragarm/sharm-el-sheikh-red-sea-resort-beach-egypt.webp',                 alt: 'Red Sea beach resort in Sharm El Sheikh Egypt',                title: 'Sharm El Sheikh Red Sea Beach — JES Egypt Tours',              link: URL },
    { id: 6,  image: '/images/instragarm/mount-sinai-sunrise-hike-saint-catherine-egypt.webp',             alt: 'Sunrise hike to the top of Mount Sinai Egypt',                 title: 'Mount Sinai Sunrise Hike — JES Egypt Tours',                   link: URL },
    { id: 7,  image: '/images/instragarm/hatshepsut-temple-luxor-group-tour-egypt.webp',                   alt: 'Group tour at Hatshepsut Temple Luxor Egypt',                  title: 'Hatshepsut Temple Luxor Group Tour — JES Egypt Tours',         link: URL },
    { id: 8,  image: '/images/instragarm/hatshepsut-temple-luxor-private-group-tour-jes-egypt-tours.webp', alt: 'Private group tour at Hatshepsut Temple Luxor',                title: 'Hatshepsut Temple Private Tour — JES Egypt Tours',             link: URL },
    { id: 9,  image: '/images/instragarm/giza-pyramids-family-friendly-tour-jes-egypt-tours.webp',         alt: 'Family-friendly private tour at the Giza Pyramids',            title: 'Giza Pyramids Family Tour — JES Egypt Tours',                  link: URL },
    { id: 10, image: '/images/instragarm/giza-pyramids-private-guided-tour-jes-egypt-tours.webp',          alt: 'Private guided tour at the Giza Pyramids',                     title: 'Giza Pyramids Private Guided Tour — JES Egypt Tours',          link: URL },
    { id: 11, image: '/images/instragarm/giza-pyramids-private-tour-travelers-jes-egypt-tours.webp',       alt: 'Travelers on a private Giza Pyramids tour',                    title: 'Giza Pyramids Private Tour Travelers — JES Egypt Tours',       link: URL },
    { id: 12, image: '/images/instragarm/saqqara-step-pyramid-group-tour-jes-egypt-tours.webp',            alt: 'Group tour at the Saqqara Step Pyramid Egypt',                 title: 'Saqqara Step Pyramid Group Tour — JES Egypt Tours',            link: URL },
    { id: 13, image: '/images/instragarm/qaitbay-citadel-alexandria-private-tour-jes-egypt-tours.webp',   alt: 'Private tour at Qaitbay Citadel Alexandria Egypt',              title: 'Qaitbay Citadel Alexandria Private Tour — JES Egypt Tours',    link: URL },
    { id: 14, image: '/images/instragarm/fayoum-wadi-el-rayan-lakes-tour-egypt.webp',                     alt: 'Wadi El Rayan lakes tour in Fayoum Egypt',                     title: 'Fayoum Wadi El Rayan Lakes Tour — JES Egypt Tours',            link: URL },
    { id: 15, image: '/images/instragarm/bibliotheca-alexandrina-alexandria-corniche-tour-egypt.webp',     alt: 'Bibliotheca Alexandrina on the Alexandria Corniche tour',       title: 'Bibliotheca Alexandrina Alexandria Tour — JES Egypt Tours',    link: URL },
  ],
};
