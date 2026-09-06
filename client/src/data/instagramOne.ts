export interface InstagramItem {
  id: number;
  image: string;
  alt: string;
  /**
   * The file's own pixels, per image — they are not all the same shape:
   * thirteen are 1359x1158, one is 1358x1159 and the single JPEG is square
   * at 1254x1254. The component declared a flat 400x400 for all fifteen,
   * which reserved a square box that then collapsed to the real ratio once
   * the image arrived (a 53px jump per tile on a phone).
   */
  width: number;
  height: number;
}

export interface InstagramOneData {
  title: string;
  items: InstagramItem[];
}

/* No `link` field. Every item used to carry the same profile URL, which the
   component never rendered; the strip is deliberately not clickable. */
export const instagramOneData: InstagramOneData = {
  title: 'Follow Instagram',
  items: [
    {
      id: 1,
      image: '/images/instragarm/giza-pyramids-couple-camel-tour-egypt.webp',
      alt: 'Couple on camels at the Giza Pyramids',
      width: 1359,
      height: 1158,
    },
    {
      id: 2,
      image: '/images/instragarm/luxor-hot-air-balloon-ride-sunrise-egypt.webp',
      alt: 'Hot air balloon ride over Luxor at sunrise',
      width: 1359,
      height: 1158,
    },
    {
      id: 3,
      image: '/images/instragarm/valley-of-the-kings-tomb-luxor-tour-egypt.webp',
      alt: 'Valley of the Kings royal tombs tour Luxor',
      width: 1359,
      height: 1158,
    },
    {
      id: 4,
      image: '/images/instragarm/siwa-oasis-salt-lake-swimming-tour-egypt.webp',
      alt: 'Swimming in Siwa Oasis salt lakes Egypt',
      width: 1359,
      height: 1158,
    },
    {
      id: 5,
      image: '/images/instragarm/sharm-el-sheikh-red-sea-resort-beach-egypt.webp',
      alt: 'Red Sea beach resort in Sharm El Sheikh Egypt',
      width: 1359,
      height: 1158,
    },
    {
      id: 6,
      image: '/images/instragarm/mount-sinai-sunrise-hike-saint-catherine-egypt.webp',
      alt: 'Sunrise hike to the top of Mount Sinai Egypt',
      width: 1359,
      height: 1158,
    },
    {
      id: 7,
      image: '/images/instragarm/hatshepsut-temple-luxor-group-tour-egypt.webp',
      alt: 'Group tour at Hatshepsut Temple Luxor Egypt',
      width: 1359,
      height: 1158,
    },
    {
      id: 8,
      image: '/images/instragarm/hatshepsut-temple-luxor-private-group-tour-jes-egypt-tours.webp',
      alt: 'Private group tour at Hatshepsut Temple Luxor',
      width: 1358,
      height: 1159,
    },
    {
      id: 9,
      image: '/images/instragarm/giza-pyramids-family-friendly-tour-jes-egypt-tours.webp',
      alt: 'Family-friendly private tour at the Giza Pyramids',
      width: 1359,
      height: 1158,
    },
    {
      id: 10,
      image: '/images/instragarm/giza-pyramids-private-guided-tour-jes-egypt-tours.webp',
      alt: 'Private guided tour at the Giza Pyramids',
      width: 1359,
      height: 1158,
    },
    {
      id: 11,
      image: '/images/instragarm/giza-pyramids-private-tour-travelers-jes-egypt-tours.webp',
      alt: 'Travelers on a private Giza Pyramids tour',
      width: 1359,
      height: 1158,
    },
    {
      id: 12,
      image: '/images/instragarm/saqqara-step-pyramid-group-tour-jes-egypt-tours.webp',
      alt: 'Group tour at the Saqqara Step Pyramid Egypt',
      width: 1359,
      height: 1158,
    },
    {
      id: 13,
      image: '/images/instragarm/qaitbay-citadel-alexandria-private-tour-jes-egypt-tours.webp',
      alt: 'Private tour at Qaitbay Citadel Alexandria Egypt',
      width: 1359,
      height: 1158,
    },
    {
      id: 14,
      image: '/images/instragarm/fayoum-wadi-el-rayan-lakes-tour-egypt.webp',
      alt: 'Wadi El Rayan lakes tour in Fayoum Egypt',
      width: 1359,
      height: 1158,
    },
    {
      id: 15,
      image: '/images/instragarm/alexandrina-alexandria-corniche-tour-egypt.jpg',
      alt: 'Bibliotheca Alexandrina on the Alexandria Corniche tour',
      width: 1254,
      height: 1254,
    },
  ],
};
