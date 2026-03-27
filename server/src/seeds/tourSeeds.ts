/**
 * Tour Seeds Data
 * Professional seed data for Tour Categories, Subcategories, and Tours
 * 
 * Usage:
 * - Run: npm run seed:tours
 * - Or: ts-node src/seeds/tourSeeder.ts
 */

export const tourCategorySeed = {
  name: { en: 'Egypt Ultimate Excursions', de: 'Ägypten Ultimate Excursions', it: 'Escursioni Supreme Egitto', es: 'Excursiones Supreme Egipto' },
  slug: { en: 'egypt-ultimate-excursions', de: 'aegypten-ultimate-excursions', it: 'escursioni-supreme-egitto', es: 'excursiones-supreme-egipto' },
  description: {
    en: '<div class="category-description"><h2>Discover the Magic of Egypt</h2><p>Embark on an unforgettable journey through the land of the Pharaohs. From the majestic Pyramids of Giza to the serene waters of the Nile, our Egypt tours offer a perfect blend of history, culture, and luxury.</p><ul><li>Expert Egyptologist guides</li><li>Premium accommodations</li><li>Private and small group options</li><li>Hassle-free transfers</li></ul></div>',
    de: '<div class="category-description"><h2>Entdecken Sie die Magie Ägyptens</h2><p>Begeben Sie sich auf eine unvergessliche Reise durch das Land der Pharaonen.</p></div>',
    it: '<div class="category-description"><h2>Scopri la Magia dell\'Egitto</h2><p>Intraprendi un viaggio indimenticabile attraverso la terra dei Faraoni.</p></div>',
    es: '<div class="category-description"><h2>Descubre la Magia de Egipto</h2><p>Embárcate en un viaje inolvidable por la tierra de los Faraones.</p></div>',
  },
  images: [
    {
      url: 'https://images.unsplash.com/photo-1539667468225-eebb663053e6?w=1200&h=800&fit=crop',
      fileName: 'egypt-main.jpg',
      title: { en: 'Pyramids of Giza', de: 'Pyramiden von Gizeh', it: 'Piramidi di Giza', es: 'Pirámides de Guiza' },
      alt: { en: 'Majestic Pyramids of Giza at sunset', de: 'Majestätische Pyramiden bei Sonnenuntergang', it: 'Maestose Piramidi di Giza al tramonto', es: 'Majestuosas Pirámides de Guiza al atardecer' },
    }
  ],
  seo: {
    metaTitle: { en: 'Book Egypt Tours & Vacation Packages - JES Egypt Tours', de: 'Ägypten Touren & Urlaubspakete - JES Egypt Tours', it: 'Prenota Tour e Pacchetti Vacanza in Egitto - JES Egypt Tours', es: 'Reserva Tours y Paquetes Vacacionales a Egipto - JES Egypt Tours' },
    metaDescription: { en: 'Explore the best Egypt tours including Pyramids, Nile Cruises, and Luxury Vacations. Book your dream trip to Egypt today with expert guides.', de: 'Entdecken Sie die besten Ägypten-Touren.', it: 'Esplora i migliori tour in Egitto.', es: 'Explora los mejores tours por Egipto.' }
  },
  sectionHeader: {
    isEnabled: true,
    title: { en: 'Welcome to the Land of Pharaohs', de: 'Willkommen im Land der Pharaonen', it: 'Benvenuti nella Terra dei Faraoni', es: 'Bienvenidos a la Tierra de los Faraones' },
    description: { en: '<p>Experience the timeless wonders of Egypt with our carefully crafted tour packages designed for ultimate comfort and discovery.</p>', de: '', it: '', es: '' },
    button: {
      label: { en: 'Explore All Destinations', de: 'Alle Reiseziele erkunden', it: 'Esplora tutte le destinazioni', es: 'Explorar todos los destinos' },
      href: '/destinations',
      newTab: false
    }
  },
  subcategorySectionTitle: { en: 'Popular Egypt Destinations', de: 'Beliebte Reiseziele in Ägypten', it: 'Destinazioni Popolari in Egitto', es: 'Destinos Populares en Egipto' },
  toursSectionTitle: { en: 'Top Rated Egypt Tours', de: 'Bestbewertete Ägypten Touren', it: 'Tour in Egitto più Votati', es: 'Tours por Egipto Mejor Valorados' },
  faqs: [
    {
      question: { en: 'When is the best time to visit Egypt?', de: 'Wann ist die beste Zeit, um Ägypten zu besuchen?', it: 'Qual è il periodo migliore per visitare l\'Egitto?', es: '¿Cuál es la mejor época para visitar Egipto?' },
      answer: { en: '<p>The best time to visit Egypt is from October to April when the weather is cooler and more pleasant for sightseeing. The peak tourist season is between December and February.</p>', de: '<p>Die beste Zeit für einen Besuch in Ägypten ist von Oktober bis April.</p>', it: '<p>Il periodo migliore per visitare l\'Egitto va da ottobre ad aprile.</p>', es: '<p>La mejor época para visitar Egipto es de octubre a abril.</p>' }
    },
    {
      question: { en: 'Do I need a visa for Egypt?', de: 'Brauche ich ein Visum für Ägypten?', it: 'Ho bisogno di un visto per l\'Egitto?', es: '¿Necesito una visa para Egipto?' },
      answer: { en: '<p>Yes, most travelers require a visa. You can obtain an e-Visa online before arrival or get a visa on arrival at major airports for valid passports.</p>', de: '<p>Ja, die meisten Reisenden benötigen ein Visum.</p>', it: '<p>Sì, la maggior parte dei viaggiatori necessita di un visto.</p>', es: '<p>Sí, la mayoría de los viajeros requieren una visa.</p>' }
    }
  ],
  bottomSection: {
    isEnabled: true,
    title: { en: 'Ready to Explore Egypt?', de: 'Bereit, Ägypten zu erkunden?', it: 'Pronto per esplorare l\'Egitto?', es: '¿Listo para explorar Egipto?' },
    description: { en: '<p>Contact our dedicated travel experts to customize your perfect Egyptian adventure today.</p>', de: '<p>Kontaktieren Sie unsere Reiseexperten.</p>', it: '<p>Contatta i nostri esperti di viaggio.</p>', es: '<p>Contacta a nuestros expertos en viajes.</p>' },
    button: {
      label: { en: 'Get a Free Quote', de: 'Kostenloses Angebot anfordern', it: 'Richiedi un Preventivo Gratuito', es: 'Obtén una Cotización Gratis' },
      href: '/contact'
    }
  },
  isActive: true,
};

export const tourSubcategorySeed = {
  // category will be populated with the created category ID
  name: { en: 'Ultimate Nile Journeys', de: 'Ultimate Nilkreuzfahrten', it: 'Viaggi Spremi Nilo', es: 'Viajes Supremos Nilo' },
  slug: { en: 'ultimate-nile-journeys', de: 'ultimate-nilkreuzfahrten', it: 'viaggi-supremi-nilo', es: 'viajes-supremos-nilo' },
  description: {
    en: '<div class="subcategory-description"><h3>Luxurious Journeys on the Nile</h3><p>Sail through the heart of Egypt on our premium Nile Cruises. Experience the timeless beauty of ancient temples and lush landscapes from the comfort of a luxury floating hotel between Luxor and Aswan.</p></div>',
    de: '<div class="subcategory-description"><h3>Luxuriöse Reisen auf dem Nil</h3><p>Segeln Sie durch das Herz Ägyptens.</p></div>',
    it: '<div class="subcategory-description"><h3>Viaggi Lussuosi sul Nilo</h3><p>Naviga nel cuore dell\'Egitto.</p></div>',
    es: '<div class="subcategory-description"><h3>Viajes Lujosos por el Nilo</h3><p>Navega por el corazón de Egipto.</p></div>',
  },
  images: [
    {
      url: 'https://images.unsplash.com/photo-1600010991959-19bd948270f2?w=1200&h=800&fit=crop',
      fileName: 'nile-cruise-main.jpg',
      title: { en: 'Luxury Nile Cruise', de: 'Luxus Nilkreuzfahrt', it: 'Crociera di Lusso sul Nilo', es: 'Crucero de Lujo por el Nilo' },
      alt: { en: 'Luxury cruise ship sailing on the Nile river', de: 'Luxuskreuzfahrtschiff auf dem Nil', it: 'Nave da crociera di lusso sul Nilo', es: 'Crucero de lujo navegando por el río Nilo' },
    }
  ],
  seo: {
    metaTitle: { en: 'Luxury Nile Cruises - Luxor to Aswan Voyages', de: 'Luxus Nilkreuzfahrten - Luxor nach Assuan', it: 'Crociere di Lusso sul Nilo - Viaggi Luxor Assuan', es: 'Cruceros de Lujo por el Nilo - Viajes Lúxor Asuán' },
    metaDescription: { en: 'Experience the magic of Ancient Egypt on a luxury Nile Cruise. Visit Valley of the Kings, Karnak Temple, and more beautiful sights.', de: 'Erleben Sie die Magie des alten Ägyptens.', it: 'Vivi la magia dell\'Antico Egitto.', es: 'Experimenta la magia del Antiguo Egipto.' }
  },
  sectionHeader: {
    isEnabled: true,
    title: { en: 'Sail the Historic Waters', de: 'Segeln Sie auf historischen Gewässern', it: 'Naviga nelle Acque Storiche', es: 'Navega por las Aguas Históricas' },
    description: { en: '<p>A Nile Cruise is the quintessential Egyptian experience. Choose from our curated selection of 5-star standard and ultra-luxury cruise lines.</p>', de: '', it: '', es: '' },
    button: {
      label: { en: 'View Cruise Offers', de: 'Kreuzfahrtangebote ansehen', it: 'Vedi Offerte Crociere', es: 'Ver Ofertas de Cruceros' },
      href: '/offers'
    }
  },
  subcategorySectionTitle: { en: 'Cruise Types', de: 'Kreuzfahrttypen', it: 'Tipi di Crociera', es: 'Tipos de Cruceros' },
  toursSectionTitle: { en: 'Top Rated Nile Cruises', de: 'Bestbewertete Nilkreuzfahrten', it: 'Crociere sul Nilo più Votate', es: 'Cruceros por el Nilo Mejor Valorados' },
  faqs: [
    {
      question: { en: 'Is there a dress code on Nile Cruises?', de: 'Gibt es eine Kleiderordnung auf Nilkreuzfahrten?', it: 'C\'è un codice di abbigliamento sulle Crociere sul Nilo?', es: '¿Hay código de vestimenta en los Cruceros por el Nilo?' },
      answer: { en: '<p>Casual, comfortable clothing is ideal for daytime excursions. For dinner onboard, smart casual attire is recommended.</p>', de: '<p>Legere Kleidung für den Tag, Smart Casual für das Abendessen.</p>', it: '<p>Abbigliamento casual di giorno, smart casual a cena.</p>', es: '<p>Ropa casual de día, elegante casual para la cena.</p>' }
    }
  ],
  bottomSection: {
    isEnabled: true,
    title: { en: 'Limited Time Cruise Discounts', de: 'Kreuzfahrtrabatte für begrenzte Zeit', it: 'Sconti Crociere a Tempo Limitato', es: 'Descuentos en Cruceros por Tiempo Limitado' },
    description: { en: '<p>Book your winter Nile Cruise today and enjoy up to 20% off plus an upgraded cabin.</p>', de: '<p>Buchen Sie heute und sparen Sie bis zu 20%.</p>', it: '<p>Prenota oggi e risparmia fino al 20%.</p>', es: '<p>Reserva hoy y ahorra hasta un 20%.</p>' },
    button: {
      label: { en: 'Claim Discount', de: 'Rabatt sichern', it: 'Richiedi Sconto', es: 'Reclamar Descuento' },
      href: '/discounts'
    }
  },
  isActive: true,
};

export const tourSeed = {
  // subcategory will be populated with the created subcategory ID
  idExternal: 'EGY-NC-2026-001',
  heading: { 
    en: 'Luxury 4-Day Nile Cruise from Aswan to Luxor',
    de: 'Luxuriöse 4-Tage Nilkreuzfahrt von Assuan nach Luxor',
    it: 'Crociera sul Nilo di Lusso di 4 Giorni da Assuan a Luxor',
    es: 'Lujoso Crucero de 4 Días por el Nilo de Asuán a Lúxor'
  },
  slug: { 
    en: 'luxury-4-day-nile-ultimate-cruise',
    de: 'luxus-4-tage-nilkreuzfahrt-ultimate',
    it: 'crociera-nilo-lusso-4-giorni-ultimate',
    es: 'lujoso-crucero-4-dias-nilo-ultimate'
  },
  Description: {
    header: { 
      en: 'Experience the 5-Star Sonesta St. George',
      de: 'Erleben Sie die 5-Sterne Sonesta St. George',
      it: 'Vivi il Sonesta St. George a 5 Stelle',
      es: 'Experimenta el Sonesta St. George de 5 Estrellas'
    },
    text: { 
      en: `
        <div class="tour-description">
          <p class="lead">Step aboard the ultra-luxury Sonesta St. George Nile Cruise. Enjoy sweeping views of the Nile from panoramic windows, savor gourmet meals, and discover the magnificent temples of Kom Ombo, Edfu, and Luxor with our expert Egyptologist.</p>
        </div>
      `,
      de: `<div class="tour-description"><p class="lead">Kommen Sie an Bord der ultra-luxuriösen Sonesta St. George.</p></div>`,
      it: `<div class="tour-description"><p class="lead">Sali a bordo dell'ultra-lussuosa Sonesta St. George.</p></div>`,
      es: `<div class="tour-description"><p class="lead">Sube a bordo del ultra-lujoso Sonesta St. George.</p></div>`
    },
  },
  images: [
    {
      url: 'https://images.unsplash.com/photo-1600010991959-19bd948270f2?w=1200&h=800&fit=crop',
      fileName: 'sonesta-main.jpg',
      title: { en: 'Luxury Nile Cruise Ship', de: 'Luxus-Kreuzfahrtschiff', it: 'Nave Lussuosa', es: 'Lujoso Barco' },
      alt: { en: '5-star cruise ship on the Nile river', de: '5-Sterne Schiff', it: 'Nave a 5 stelle', es: 'Barco de 5 estrellas' },
    },
  ],
  gallery: [
    {
      url: 'https://images.unsplash.com/photo-1599839619722-39751411ea63?w=1200&h=800&fit=crop',
      fileName: 'karnak.jpg',
      title: { en: 'Karnak Temple', de: '', it: '', es: '' },
      alt: { en: 'Karnak Temple Pillars', de: '', it: '', es: '' },
    },
  ],
  tourLocation: { 
    en: 'Aswan, Kom Ombo, Edfu, Luxor',
    de: 'Assuan, Kom Ombo, Edfu, Luxor',
    it: 'Assuan, Kom Ombo, Edfu, Luxor',
    es: 'Asuán, Kom Ombo, Edfu, Lúxor'
  },
  tourAvailability: { 
    en: 'Weekly Departures (Fridays)',
    de: 'Wöchentliche Abfahrten (Freitags)',
    it: 'Partenze Settimanali (Venerdì)',
    es: 'Salidas Semanales (Viernes)'
  },
  pickupAndDropOff: { 
    en: 'Included from Aswan Airport/Train Station and to Luxor Airport/Train Station.',
    de: 'Inklusive von Assuan und nach Luxor.',
    it: 'Incluso da Assuan a Luxor.',
    es: 'Incluido de Asuán a Lúxor.'
  },
  tourType: { 
    en: 'Shared Cruise, Private Guided Tours',
    de: 'Gruppenkreuzfahrt, Private Touren',
    it: 'Crociera, Tour Privati',
    es: 'Crucero Compartido, Tours Privados'
  },
  tourStyle: { 
    en: 'Luxury Cultural & Historical',
    de: 'Luxus & Kultur',
    it: 'Lusso & Cultura',
    es: 'Lujo y Cultura'
  },
  tourHighlights: [
    { 
      en: 'Explore the majestic Philae Temple and High Dam in Aswan',
      de: 'Erkunden Sie den Philae-Tempel',
      it: 'Esplora il Tempio di Philae',
      es: 'Explora el majestuoso Templo de Filae'
    },
    { 
      en: 'Marvel at the Valley of the Kings and Hatshepsut Temple in Luxor',
      de: 'Tal der Könige',
      it: 'Valle dei Re',
      es: 'Valle de los Reyes'
    },
  ],
  inclusion: [
    { 
      en: '3 Nights accommodation on a 5-star Luxury Nile Cruise (Full Board)',
      de: '3 Nächte 5-Sterne-Kreuzfahrt (Vollpension)',
      it: '3 Notti Crociera 5 stelle (Pensione Completa)',
      es: '3 Noches en Crucero 5 estrellas (Pensión Completa)'
    },
    { 
      en: 'Private Egyptologist Tour Guide during all sightseeing',
      de: 'Privater Reiseführer',
      it: 'Guida privata',
      es: 'Guía privado'
    },
  ],
  exclusion: [
    { 
      en: 'International and Domestic Flights',
      de: 'Flüge',
      it: 'Voli',
      es: 'Vuelos'
    },
    { 
      en: 'Entrance fees to historical sites (paid on spot approx. $80 total)',
      de: 'Eintrittsgelder',
      it: 'Biglietti d\'ingresso',
      es: 'Tickets de entrada'
    },
  ],
  pricingPlans: [
    {
      planName: 'GOLD (5 STAR STANDARD)' as any,
      seasons: [
        {
          seasonName: 'Winter High Season (Oct - Apr)',
          startDate: new Date('2025-10-01T00:00:00.000Z'),
          endDate: new Date('2026-04-30T23:59:59.999Z'),
          prices: {
            solo: 850,
            pax_2_4: 650,
            pax_5_8: 620,
            pax_9_16: 600,
          },
          notes: []
        },
      ],
    },
  ],
  notes: [
    {
      title: { en: 'Cabin Upgrades' },
      text: { en: '<p>Suite upgrades are available upon request, subject to availability.</p>' },
    }
  ],
  whatToPack: [
    { en: 'Modest clothing for visiting temples (shoulders and knees covered)' },
    { en: 'Comfortable walking shoes' },
    { en: 'Sun hats and high-SPF sunscreen' },
  ],
  tourMapIframe: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d113426.65793084366!2d32.559388062607186!3d25.70034293801262!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14496eaa732b13ed%3A0x6331a6d713bd7cf3!2sLuxor%2C%20Luxor%20City%2C%20Luxor%20Governorate%2C%20Egypt!5e0!3m2!1sen!2s!4v1717329438012!5m2!1sen!2s" width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>',
  whatYouWillLoveHtml: { en: `
    <div class="what-you-will-love">
      <h3>Experience 5-Star River Cruising</h3>
      <p>A Nile Cruise offers a magnificent blend of leisurely sailing, world-class dining, and daily guided excursions to some of the world's most spectacular ancient monuments. It's truly a journey back in time, paired with absolute modern luxury.</p>
    </div>
  ` },
  itinerary: {
    generalDescription: { en: '<p>Our 4-day itinerary covers everything you need to see between Aswan and Luxor, carefully paced for maximum enjoyment.</p>' },
    days: [
      {
        day: 1,
        title: { en: 'Arrival in Aswan & High Dam' },
        description: { en: '<p>Meet and assist at Aswan Airport/Station. Board the cruise, have lunch, and visit the Aswan High Dam and majestic Philae Temple in the afternoon.</p>' },
        activities: [],
      },
      {
        day: 2,
        title: { en: 'Kom Ombo & Edfu Temples' },
        description: { en: '<p>Sail to Kom Ombo to visit the twin temple dedicated to Sobek and Haroeris. Then sail to Edfu to visit the remarkably preserved Temple of Horus. Overnight in Esna/Luxor.</p>' },
        activities: [],
      },
      {
        day: 3,
        title: { en: 'West Bank of Luxor' },
        description: { en: '<p>Cross to the West Bank to explore the Valley of the Kings, the Temple of Queen Hatshepsut, and the Colossi of Memnon. Evening at leisure.</p>' },
        activities: [],
      },
      {
        day: 4,
        title: { en: 'East Bank & Disembarkation' },
        description: { en: '<p>After breakfast onboard, visit the immense Karnak Temple complex and Luxor Temple. Transfer to Luxor Airport or Train Station.</p>' },
        activities: [],
      },
    ],
  },
  faqs: [
    {
      question: { en: 'Are drinks included on the cruise?' },
      answer: { en: `<p>Full board includes breakfast, lunch, and dinner. However, drinks (including water, soft drinks, and alcoholic beverages) are not included and should be paid directly on board.</p>` },
    }
  ],
  priceStartingFrom: 650,
  oldPrice: 850,
  rating: 4.9,
  viewCount: 15320,
  reviewsCount: 345,
  isFeatured: true,
};
