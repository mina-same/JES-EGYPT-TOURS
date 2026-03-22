/**
 * Tour Seeds Data
 * Professional seed data for Tour Categories, Subcategories, and Tours
 * 
 * Usage:
 * - Run: npm run seed:tours
 * - Or: ts-node src/seeds/tourSeeder.ts
 */

export const tourCategorySeed = {
  name: { en: 'Adventure Tours', de: 'Abenteuertouren', it: 'Tour Avventura', es: 'Tours de Aventura' },
  slug: { en: 'adventure-tours', de: 'abenteuertouren', it: 'tour-avventura', es: 'tours-aventura' },
  description: {
    en: '<div class="category-description"><h2>Discover Thrilling Adventures</h2><p>Embark on high-energy adventure tours across the Middle East and North Africa. From exhilarating desert safaris to challenging mountain treks, our adventure tours are designed for thrill-seekers and nature enthusiasts.</p><ul><li>Expert-guided expeditions</li><li>Safety-first approach</li><li>Small group experiences</li><li>Sustainable tourism practices</li></ul></div>',
    de: '<div class="category-description"><h2>Entdecke aufregende Abenteuer</h2><p>Begib dich auf energiereiche Abenteuertouren durch den Nahen Osten und Nordafrika.</p></div>',
    it: '<div class="category-description"><h2>Scopri Avventure Emozionanti</h2><p>Intraprendi tour avventurosi ad alta energia attraverso il Medio Oriente e il Nord Africa.</p></div>',
    es: '<div class="category-description"><h2>Descubre Aventuras Emocionantes</h2><p>Embárcate en tours de aventura por el Medio Oriente y el Norte de África.</p></div>',
  },
  image: {
    url: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1200&h=800&fit=crop',
    fileName: 'adventure-main.jpg',
    title: { en: 'Adventure Tours Category', de: 'Abenteuertour Kategorie', it: 'Categoria Tour Avventura', es: 'Categoría Tours Aventura' },
    alt: { en: 'Exciting adventure activities in desert and mountains', de: 'Aufregende Abenteueraktivitäten', it: 'Attività avventurose emozionanti', es: 'Actividades de aventura emocionantes' },
  },
  metaTitle: { en: 'Adventure Tours - Middle East & North Africa Experiences', de: 'Abenteuertouren - Naher Osten & Nordafrika', it: 'Tour Avventura - Medio Oriente e Nord Africa', es: 'Tours de Aventura - Oriente Medio y Norte de África' },
  metaDescription: { en: 'Explore adventure tours: desert safaris, mountain treks, diving trips. Book your next adventure with expert guides today.', de: 'Entdecken Sie Abenteuertouren: Wüstensafaris, Bergwanderungen, Tauchausflüge.', it: 'Esplora tour avventura: safari nel deserto, trekking montano, immersioni.', es: 'Explora tours de aventura: safaris en el desierto, senderismo en montaña, buceo.' },
  isActive: true,
};

export const tourSubcategorySeed = {
  // category will be populated with the created category ID
  name: { en: 'Desert Safari', de: 'Wüstensafari', it: 'Safari nel Deserto', es: 'Safari en el Desierto' },
  slug: { en: 'desert-safari', de: 'wuestensafari', it: 'safari-deserto', es: 'safari-desierto' },
  description: {
    en: '<div class="subcategory-description"><h3>Unforgettable Desert Safari Experiences</h3><p>Experience the magic of the desert with our carefully curated safari packages. Whether you\'re seeking adrenaline-pumping dune bashing or a peaceful sunset camel ride, we offer both shared and private experiences with optional luxury add-ons.</p></div>',
    de: '<div class="subcategory-description"><h3>Unvergessliche Wüstensafari-Erlebnisse</h3><p>Erleben Sie die Magie der Wüste mit unseren sorgfältig zusammengestellten Safaripaketen.</p></div>',
    it: '<div class="subcategory-description"><h3>Esperienze di Safari nel Deserto Indimenticabili</h3><p>Vivi la magia del deserto con i nostri pacchetti safari accuratamente curati.</p></div>',
    es: '<div class="subcategory-description"><h3>Experiencias de Safari en el Desierto Inolvidables</h3><p>Experimenta la magia del desierto con nuestros paquetes de safari cuidadosamente elaborados.</p></div>',
  },
  image: {
    url: 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=1200&h=800&fit=crop',
    fileName: 'desert-safari-main.jpg',
    title: { en: 'Desert Safari Adventures', de: 'Wüstensafari Abenteuer', it: 'Avventure Safari Deserto', es: 'Aventuras Safari Desierto' },
    alt: { en: 'Golden desert dunes at sunset with 4x4 vehicles', de: 'Goldene Wüstendünen bei Sonnenuntergang', it: 'Dune dorate del deserto al tramonto', es: 'Dunas doradas del desierto al atardecer' },
  },
  metaTitle: { en: 'Desert Safari Tours - Premium Desert Experiences', de: 'Wüstensafari-Touren - Premium Wüstenerlebnisse', it: 'Tour Safari Deserto - Esperienze Premium nel Deserto', es: 'Tours Safari Desierto - Experiencias Premium en el Desierto' },
  metaDescription: { en: 'Book exciting desert safari experiences with dune bashing, camel rides, BBQ dinner, and live entertainment. Private and group options available.', de: 'Buchen Sie aufregende Wüstensafari-Erlebnisse mit Dünenfahrten, Kamelreiten, BBQ-Abendessen.', it: 'Prenota emozionanti esperienze di safari nel deserto con dune bashing, gite in cammello, cena BBQ.', es: 'Reserva emocionantes experiencias de safari en el desierto con dune bashing, paseos en camello, cena BBQ.' },
  isActive: true,
};


export const tourSeed = {
  // subcategory will be populated with the created subcategory ID
  idExternal: 'ADV-DS-2026-001',
  heading: { 
    en: 'Premium Desert Safari Experience in Dubai',
    de: 'Premium-Wüstensafari-Erlebnis in Dubai',
    it: 'Esperienza Safari nel Deserto Premium a Dubai',
    es: 'Experiencia Premium de Safari en el Desierto en Dubái'
  },
  slug: { 
    en: 'premium-desert-safari-dubai',
    de: 'premium-wuestensafari-dubai',
    it: 'safari-deserto-premium-dubai',
    es: 'safari-desierto-premium-dubai'
  },
  Description: {
    header: { 
      en: 'Luxury Desert Safari with Gourmet Dinner & Live Entertainment',
      de: 'Luxus-Wüstensafari mit Gourmet-Abendessen & Live-Unterhaltung',
      it: 'Safari nel deserto di lusso con cena gourmet e intrattenimento dal vivo',
      es: 'Safari de Lujo en el Desierto con Cena Gourmet y Entretenimiento en Vivo'
    },
    text: { 
      en: `
        <div class="tour-description">
          <p class="lead">Experience the ultimate luxury desert safari adventure just outside Dubai. This premium package combines adrenaline-pumping activities with authentic Arabian hospitality.</p>
        </div>
      `,
      de: `
        <div class="tour-description">
          <p class="lead">Erleben Sie das ultimative Luxus-Wüstensafari-Abenteuer direkt vor den Toren Dubais. Dieses Premium-Paket kombiniert adrenalingeladene Aktivitäten mit authentischer arabischer Gastfreundschaft.</p>
        </div>
      `,
      it: `
        <div class="tour-description">
          <p class="lead">Vivi l'ultima avventura safari nel deserto di lusso appena fuori Dubai. Questo pacchetto premium combina attività adrenaliniche con l'autentica ospitalità araba.</p>
        </div>
      `,
      es: `
        <div class="tour-description">
          <p class="lead">Experimente la aventura definitiva de safari de lujo en el desierto a las afueras de Dubái. Este paquete premium combina actividades de adrenalina con la auténtica hospitalidad árabe.</p>
        </div>
      `
    },
  },
  images: [
    {
      url: 'https://images.unsplash.com/photo-1583221863947-e6df7c2e8a3e?w=1200&h=800&fit=crop',
      fileName: 'main.jpg',
      title: { en: 'Premium Desert Safari Main View', de: 'Hauptansicht Premium-Wüstensafari', it: 'Vista principale Safari nel deserto Premium', es: 'Vista Principal del Safari Premium en el Desierto' },
      alt: { en: 'Luxury 4x4 vehicle on Dubai desert dunes at sunset', de: 'Luxus-4x4-Fahrzeug in den Wüstendünen von Dubai bei Sonnenuntergang', it: 'Veicolo 4x4 di lusso sulle dune del deserto di Dubai al tramonto', es: 'Vehículo 4x4 de lujo en las dunas del desierto de Dubái al atardecer' },
    },
  ],
  gallery: [
    {
      url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200&h=800&fit=crop',
      fileName: 'sunset.jpg',
      title: { en: 'Desert Sunset', de: 'Wüstensonnenuntergang', it: 'Tramonto nel deserto', es: 'Atardecer en el Desierto' },
      alt: { en: 'Breathtaking desert sunset with golden dunes', de: 'Atemberaubender Wüstensonnenuntergang mit goldenen Dünen', it: 'Mozzafiato tramonto nel deserto con dune dorate', es: 'Impresionante atardecer en el desierto con dunas doradas' },
    },
  ],
  tourLocation: { 
    en: 'Dubai Desert Conservation Reserve, United Arab Emirates',
    de: 'Dubai Desert Conservation Reserve, Vereinigte Arabische Emirate',
    it: 'Dubai Desert Conservation Reserve, Emirati Arabi Uniti',
    es: 'Reserva de Conservación del Desierto de Dubái, Emiratos Árabes Unidos'
  },
  tourAvailability: { 
    en: 'Daily departures',
    de: 'Tägliche Abfahrten',
    it: 'Partenze giornaliere',
    es: 'Salidas diarias'
  },
  pickupAndDropOff: { 
    en: 'Complimentary hotel pickup and drop-off within Dubai city limits.',
    de: 'Kostenlose Abholung und Rückfahrt vom Hotel innerhalb der Stadtgrenzen von Dubai.',
    it: 'Ritiro e riconsegna in hotel gratuiti entro i limiti della città di Dubai.',
    es: 'Recogida y regreso al hotel de cortesía dentro de los límites de la ciudad de Dubái.'
  },
  tourType: { 
    en: 'Private & Shared Group Options',
    de: 'Private & Gemeinsame Gruppenoptionen',
    it: 'Opzioni per gruppi privati ​​e condivisi',
    es: 'Opciones de Grupos Privados y Compartidos'
  },
  tourStyle: { 
    en: 'Luxury Cultural Adventure',
    de: 'Luxuriöses kulturelles Abenteuer',
    it: 'Avventura culturale di lusso',
    es: 'Aventura Cultural de Lujo'
  },
  tourHighlights: [
    { 
      en: 'Private 4x4 dune bashing session',
      de: 'Private 4x4 Dünen-Bashing-Session',
      it: 'Sessione di dune bashing 4x4 privata',
      es: 'Sesión privada de dune bashing en 4x4'
    },
    { 
      en: 'Traditional camel riding experience',
      de: 'Traditionelles Kamelreit-Erlebnis',
      it: 'Esperienza tradizionale di gita in cammello',
      es: 'Experiencia tradicional de paseo en camello'
    },
  ],
  inclusion: [
    { 
      en: 'Round-trip hotel transfers',
      de: 'Hin- und Rücktransfer zum Hotel',
      it: 'Trasferimenti da e per l\'hotel',
      es: 'Traslados de ida y vuelta al hotel'
    },
    { 
      en: 'Gourmet BBQ buffet dinner',
      de: 'Gourmet-BBQ-Buffet-Abendessen',
      it: 'Cena a buffet barbecue gourmet',
      es: 'Cena buffet de barbacoa gourmet'
    },
  ],
  exclusion: [
    { 
      en: 'Alcoholic beverages',
      de: 'Alkoholische Getränke',
      it: 'Bevande alcoliche',
      es: 'Bebidas alcohólicas'
    },
    { 
      en: 'Personal expenses',
      de: 'Persönliche Ausgaben',
      it: 'Spese personali',
      es: 'Gastos personales'
    },
  ],
  pricingPlans: [
    {
      planName: 'AFFORDABLE',
      seasons: [
        {
          seasonName: 'Autumn Season (Oct - Dec 2025)',
          startDate: new Date('2025-10-01T00:00:00.000Z'),
          endDate: new Date('2025-12-19T23:59:59.999Z'),
          prices: {
            solo: 120,
            pax_2_4: 80,
            pax_5_8: 65,
            pax_9_16: 60,
          },
          notes: [
            {
              title: { en: 'Booking Fee' },
              text: { en: '<p>A non-refundable booking fee of $5 USD applies per reservation.</p>' },
            },
            {
              title: { en: 'Group Discount' },
              text: { en: '<p>Groups of 9+ receive complimentary group photo package.</p>' },
            },
          ],
        },
        {
          seasonName: 'Winter Season (Jan - Mar 2026)',
          startDate: new Date('2026-01-06T00:00:00.000Z'),
          endDate: new Date('2026-03-24T23:59:59.999Z'),
          prices: {
            solo: 130,
            pax_2_4: 90,
            pax_5_8: 70,
            pax_9_16: 65,
          },
          notes: [],
        },
        {
          seasonName: 'Summer Season (Apr - Sep 2026)',
          startDate: new Date('2026-04-16T00:00:00.000Z'),
          endDate: new Date('2026-09-30T23:59:59.999Z'),
          prices: {
            solo: 100,
            pax_2_4: 70,
            pax_5_8: 58,
            pax_9_16: 52,
          },
          notes: [
            {
              title: { en: 'Summer Special' },
              text: { en: '<p>Complimentary upgrade to evening safari with extended entertainment.</p>' },
            },
          ],
        },
        {
          seasonName: 'Peak Holiday Season',
          startDate: new Date('2025-12-20T00:00:00.000Z'),
          endDate: new Date('2026-01-05T23:59:59.999Z'),
          prices: {
            solo: 180,
            pax_2_4: 130,
            pax_5_8: 110,
            pax_9_16: 100,
          },
          notes: [
            {
              title: { en: 'Peak Season Surcharge' },
              text: { en: '<p>Peak season rates apply automatically. Advanced booking recommended.</p>' },
            },
          ],
        },
        {
          seasonName: 'Spring Holiday Season',
          startDate: new Date('2026-03-25T00:00:00.000Z'),
          endDate: new Date('2026-04-15T23:59:59.999Z'),
          prices: {
            solo: 160,
            pax_2_4: 120,
            pax_5_8: 100,
            pax_9_16: 90,
          },
          notes: [],
        },
      ],
    },
    {
      planName: 'GOLD (5 STAR STANDARD)',
      seasons: [
        {
          seasonName: 'Autumn Season (Oct - Dec 2025)',
          startDate: new Date('2025-10-01T00:00:00.000Z'),
          endDate: new Date('2025-12-19T23:59:59.999Z'),
          prices: {
            solo: 220,
            pax_2_4: 150,
            pax_5_8: 120,
            pax_9_16: 110,
          },
          notes: [
            {
              title: { en: 'Gold Package Inclusions' },
              text: { en: '<p>Includes premium seating area, complimentary shisha, and priority service.</p>' },
            },
          ],
        },
        {
          seasonName: 'Winter Season (Jan - Mar 2026)',
          startDate: new Date('2026-01-06T00:00:00.000Z'),
          endDate: new Date('2026-03-24T23:59:59.999Z'),
          prices: {
            solo: 240,
            pax_2_4: 165,
            pax_5_8: 130,
            pax_9_16: 115,
          },
          notes: [],
        },
        {
          seasonName: 'Summer Season (Apr - Sep 2026)',
          startDate: new Date('2026-04-16T00:00:00.000Z'),
          endDate: new Date('2026-09-30T23:59:59.999Z'),
          prices: {
            solo: 200,
            pax_2_4: 140,
            pax_5_8: 115,
            pax_9_16: 100,
          },
          notes: [],
        },
        {
          seasonName: 'Peak Holiday Season',
          startDate: new Date('2025-12-20T00:00:00.000Z'),
          endDate: new Date('2026-01-05T23:59:59.999Z'),
          prices: {
            solo: 310,
            pax_2_4: 230,
            pax_5_8: 190,
            pax_9_16: 170,
          },
          notes: [],
        },
        {
          seasonName: 'Spring Holiday Season',
          startDate: new Date('2026-03-25T00:00:00.000Z'),
          endDate: new Date('2026-04-15T23:59:59.999Z'),
          prices: {
            solo: 280,
            pax_2_4: 200,
            pax_5_8: 165,
            pax_9_16: 145,
          },
          notes: [],
        },
      ],
    },
    {
      planName: 'DIAMOND (5 STAR LUXURY)',
      seasons: [
        {
          seasonName: 'Autumn Season (Oct - Dec 2025)',
          startDate: new Date('2025-10-01T00:00:00.000Z'),
          endDate: new Date('2025-12-19T23:59:59.999Z'),
          prices: {
            solo: 420,
            pax_2_4: 300,
            pax_5_8: 260,
            pax_9_16: 240,
          },
          notes: [
            {
              title: { en: 'Diamond Luxury Package' },
              text: { en: '<p>Includes private vehicle, VIP seating, luxury welcome pack, premium beverages, and dedicated personal guide.</p>' },
            },
          ],
        },
        {
          seasonName: 'Winter Season (Jan - Mar 2026)',
          startDate: new Date('2026-01-06T00:00:00.000Z'),
          endDate: new Date('2026-03-24T23:59:59.999Z'),
          prices: {
            solo: 450,
            pax_2_4: 320,
            pax_5_8: 275,
            pax_9_16: 250,
          },
          notes: [],
        },
        {
          seasonName: 'Summer Season (Apr - Sep 2026)',
          startDate: new Date('2026-04-16T00:00:00.000Z'),
          endDate: new Date('2026-09-30T23:59:59.999Z'),
          prices: {
            solo: 380,
            pax_2_4: 285,
            pax_5_8: 250,
            pax_9_16: 225,
          },
          notes: [],
        },
        {
          seasonName: 'Peak Holiday Season',
          startDate: new Date('2025-12-20T00:00:00.000Z'),
          endDate: new Date('2026-01-05T23:59:59.999Z'),
          prices: {
            solo: 520,
            pax_2_4: 400,
            pax_5_8: 350,
            pax_9_16: 320,
          },
          notes: [],
        },
        {
          seasonName: 'Spring Holiday Season',
          startDate: new Date('2026-03-25T00:00:00.000Z'),
          endDate: new Date('2026-04-15T23:59:59.999Z'),
          prices: {
            solo: 480,
            pax_2_4: 360,
            pax_5_8: 310,
            pax_9_16: 280,
          },
          notes: [],
        },
      ],
    },
  ],
  notes: [
    {
      title: { en: 'Child Policy' },
      text: { en: '<p>Children under 3 years travel free. Children aged 3-11 years receive 50% discount when sharing with adults.</p>' },
    },
    {
      title: { en: 'Accessibility' },
      text: { en: '<p>Please note that dune bashing and camel riding may not be suitable for pregnant women, individuals with back problems, or those with heart conditions. Alternative activities can be arranged.</p>' },
    },
    {
      title: { en: 'Cancellation Policy' },
      text: { en: '<p>Free cancellation up to 24 hours before the tour. Cancellations within 24 hours are subject to 100% charge.</p>' },
    },
    {
      title: { en: 'Weather Policy' },
      text: { en: '<p>Tours operate in all weather conditions. In case of extreme weather, we reserve the right to reschedule or provide a full refund.</p>' },
    },
  ],
  whatToPack: [
    { en: 'Light, comfortable clothing (long pants recommended for camel riding)' },
    { en: 'Sunscreen (SPF 30+) and lip balm' },
    { en: 'Sunglasses and hat/cap' },
    { en: 'Closed-toe shoes (sandals not recommended for dune activities)' },
    { en: 'Camera or smartphone for photos' },
    { en: 'Light jacket or shawl for evening (winter months)' },
    { en: 'Personal medications if required' },
    { en: 'Small backpack or bag' },
  ],
  tourMapIframe: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d462560.68284598546!2d54.94757907265869!3d25.076280430177422!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f43496ad9c645%3A0xbde66e5084295162!2sDubai%20-%20United%20Arab%20Emirates!5e0!3m2!1sen!2s!4v1234567890123!5m2!1sen!2s" width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
  mapSchema: {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Premium Desert Safari Route Map',
    description: 'Route and key attractions covered during the Premium Desert Safari Experience',
    itemListOrder: 'Sequential',
    itemListElement: [
      {
        '@type': 'TouristAttraction',
        position: 1,
        name: 'Dubai Desert Conservation Reserve Entry',
        description: '<p>Begin your journey at the entrance to the protected desert conservation area.</p>',
        geo: {
          '@type': 'GeoCoordinates',
          latitude: '24.8607',
          longitude: '55.7233',
        },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Dubai Desert Conservation Reserve',
          addressCountry: 'AE',
        },
      },
      {
        '@type': 'TouristAttraction',
        position: 2,
        name: 'Dune Bashing Area',
        description: '<p>Experience thrilling dune bashing on the highest sand dunes in the region.</p>',
        geo: {
          '@type': 'GeoCoordinates',
          latitude: '24.8950',
          longitude: '55.6800',
        },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Dubai Desert',
          addressCountry: 'AE',
        },
      },
      {
        '@type': 'TouristAttraction',
        position: 3,
        name: 'Sunset Viewpoint',
        description: '<p>Panoramic viewpoint for stunning desert sunset photography.</p>',
        geo: {
          '@type': 'GeoCoordinates',
          latitude: '24.9100',
          longitude: '55.6500',
        },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Dubai Desert',
          addressCountry: 'AE',
        },
      },
      {
        '@type': 'TouristAttraction',
        position: 4,
        name: 'Premium Desert Camp',
        description: '<p>Luxury Bedouin-style camp featuring gourmet dining and live entertainment.</p>',
        geo: {
          '@type': 'GeoCoordinates',
          latitude: '24.8800',
          longitude: '55.6200',
        },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Dubai Desert',
          addressCountry: 'AE',
        },
      },
    ],
  },
  whatYouWillLoveHtml: { en: `
    <div class="what-you-will-love">
      <h3>Why Our Guests Love This Experience</h3>
      <div class="love-points">
        <div class="love-point">
          <h4>Detailed Desert Adventure</h4>
          <p>From adrenaline-filled dune rides to peaceful camel treks, experience the desert in all its glory. Our expert drivers ensure maximum thrills while maintaining complete safety.</p>
        </div>
        <div class="love-point">
          <h4>Culinary Excellence</h4>
          <p>Savor a gourmet BBQ dinner under the stars featuring both international favorites and authentic Arabian cuisine. Our chefs use only the freshest ingredients to create memorable dining experiences.</p>
        </div>
        <div class="love-point">
          <h4>Cultural Immersion</h4>
          <p>Witness mesmerizing traditional performances including the hypnotic Tanoura dance and spectacular fire shows. Try henna painting and dress in traditional costumes for unforgettable photos.</p>
        </div>
        <div class="love-point">
          <h4>Premium Service</h4>
          <p>Our dedicated team ensures every moment is comfortable and memorable. From the moment we pick you up until we drop you back, expect nothing but excellence.</p>
        </div>
      </div>
    </div>
  ` },
  itinerary: {
    generalDescription: { en: '<p>This evening desert safari typically lasts 6-7 hours, offering the perfect blend of adventure, culture, and relaxation. The itinerary is flexible and can be adjusted based on group preferences and weather conditions.</p>' },
    days: [
      {
        day: 1,
        title: { en: 'Hotel Pickup & Desert Drive' },
        description: { en: '<p>Your adventure begins with a comfortable pickup from your Dubai hotel. Relax in our air-conditioned 4x4 as we journey into the golden desert landscape.</p>' },
        activities: [
          {
            heading: { en: 'Hotel Pickup (3:00 PM - 3:30 PM)' },
            description: { en: '<p>Our professional driver will collect you from your hotel lobby in a premium air-conditioned 4x4 vehicle. Please be ready 10 minutes before your scheduled pickup time.</p>' },
            image: {
              url: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=800&h=600&fit=crop',
              fileName: 'pickup.jpg',
              title: { en: 'Hotel Pickup Service' },
              alt: { en: 'Luxury 4x4 vehicle for hotel pickup' },
            },
          },
          {
            heading: { en: 'Scenic Desert Drive (45 minutes)' },
            description: { en: '<p>Enjoy the changing landscape as we leave the city behind and enter the vast Arabian Desert. Your guide will share interesting facts about the desert ecosystem and local culture.</p>' },
            image: {
              url: 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=800&h=600&fit=crop',
              fileName: 'drive.jpg',
              title: { en: 'Desert Drive' },
              alt: { en: 'Driving through Dubai desert landscape' },
            },
          },
        ],
      },
      {
        day: 2,
        title: { en: 'Dune Bashing & Desert Activities' },
        description: { en: '<p>Experience the thrill of dune bashing followed by traditional desert activities including camel riding and sandboarding.</p>' },
        activities: [
          {
            heading: { en: 'Dune Bashing Adventure (20-25 minutes)' },
            description: { en: `
              <p>Hold on tight for an exhilarating roller-coaster ride over the sand dunes! Our expert drivers will take you on an unforgettable journey across the towering dunes.</p>
              <ul>
                <li>Professional drivers with 10+ years experience</li>
                <li>Modern, well-maintained 4x4 vehicles</li>
                <li>All safety equipment provided</li>
                <li>Photo opportunities during stops</li>
              </ul>
            ` },
            image: {
              url: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&h=600&fit=crop',
              fileName: 'dune-bashing.jpg',
              title: { en: 'Dune Bashing Experience' },
              alt: { en: '4x4 vehicle performing dune bashing on high sand dunes' },
            },
          },
          {
            heading: { en: 'Sunset Photography Stop (15 minutes)' },
            description: { en: '<p>Capture the magical moment as the sun sets over the desert dunes. This is the perfect opportunity for stunning photographs and to simply enjoy the serene beauty of the desert.</p>' },
            image: {
              url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&h=600&fit=crop',
              fileName: 'sunset.jpg',
              title: { en: 'Sunset Photography' },
              alt: { en: 'Beautiful desert sunset with golden dunes' },
            },
          },
          {
            heading: { en: 'Camel Riding (15 minutes)' },
            description: { en: '<p>Experience traditional desert transportation with a camel ride. Our gentle camels are perfect for both beginners and experienced riders.</p>' },
            image: {
              url: 'https://images.unsplash.com/photo-1583221863947-e6df7c2e8a3e?w=800&h=600&fit=crop',
              fileName: 'camel.jpg',
              title: { en: 'Camel Riding' },
              alt: { en: 'Tourist riding camel in Dubai desert' },
            },
          },
          {
            heading: { en: 'Sandboarding (Optional)' },
            description: { en: '<p>Try your hand at sandboarding down the dunes! Equipment is provided, and our team will give you basic instructions.</p>' },
            image: {
              url: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=800&h=600&fit=crop',
              fileName: 'sandboarding.jpg',
              title: { en: 'Sandboarding Activity' },
              alt: { en: 'Person sandboarding down desert dune' },
            },
          },
        ],
      },
      {
        day: 3,
        title: { en: 'Desert Camp Experience & Entertainment' },
        description: { en: '<p>Arrive at our premium desert camp to enjoy traditional hospitality, gourmet dining, and captivating entertainment.</p>' },
        activities: [
          {
            heading: { en: 'Welcome to Desert Camp (6:30 PM)' },
            description: { en: `
              <p>Arrive at our beautifully decorated Bedouin-style camp and receive a warm welcome with traditional Arabic coffee and dates.</p>
              <p>Take time to explore the camp facilities:</p>
              <ul>
                <li>Henna painting station</li>
                <li>Traditional costume photo area</li>
                <li>Shisha lounge (Gold & Diamond packages)</li>
                <li>Comfortable seating areas</li>
              </ul>
            ` },
            image: {
              url: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=600&fit=crop',
              fileName: 'camp-arrival.jpg',
              title: { en: 'Desert Camp Arrival' },
              alt: { en: 'Traditional Bedouin-style desert camp' },
            },
          },
          {
            heading: { en: 'Cultural Activities (7:00 PM - 8:00 PM)' },
            description: { en: `
              <p>Immerse yourself in Arabian culture with various activities:</p>
              <ul>
                <li><strong>Henna Painting:</strong> Get beautiful traditional henna designs</li>
                <li><strong>Traditional Costumes:</strong> Dress in authentic Arabian attire for photos</li>
                <li><strong>Falconry Display:</strong> Meet and photograph majestic falcons</li>
                <li><strong>Shisha Experience:</strong> Try traditional water pipe (optional)</li>
              </ul>
            ` },
            image: {
              url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop',
              fileName: 'activities.jpg',
              title: { en: 'Cultural Activities' },
              alt: { en: 'Henna painting and traditional activities' },
            },
          },
          {
            heading: { en: 'Gourmet BBQ Dinner (8:00 PM - 9:00 PM)' },
            description: { en: `
              <div class="dinner-description">
                <p>Indulge in an extensive BBQ buffet featuring:</p>
                <h5>Appetizers & Salads</h5>
                <ul>
                  <li>Hummus, Moutabel, Tabbouleh</li>
                  <li>Fresh garden salad bar</li>
                  <li>Arabic mezze selection</li>
                </ul>
                <h5>Main Course</h5>
                <ul>
                  <li>Grilled chicken, lamb, and beef</li>
                  <li>Fresh fish (seasonal)</li>
                  <li>Vegetarian options: grilled vegetables, pasta, rice dishes</li>
                  <li>Traditional Arabic dishes</li>
                </ul>
                <h5>Desserts</h5>
                <ul>
                  <li>International and Arabic sweets</li>
                  <li>Fresh fruits</li>
                  <li>Traditional Umm Ali (bread pudding)</li>
                </ul>
                <h5>Beverages</h5>
                <ul>
                  <li>Unlimited soft drinks, water, tea, and coffee</li>
                  <li>Fresh juices</li>
                </ul>
              </div>
            ` },
            image: {
              url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
              fileName: 'dinner.jpg',
              title: { en: 'Gourmet BBQ Dinner' },
              alt: { en: 'Delicious BBQ buffet spread at desert camp' },
            },
          },
          {
            heading: { en: 'Live Entertainment Shows (9:00 PM - 10:00 PM)' },
            description: { en: `
              <p>Enjoy spectacular live performances under the starlit desert sky:</p>
              <ul>
                <li><strong>Tanoura Dance:</strong> Mesmerizing spinning dance with colorful costumes</li>
                <li><strong>Fire Show:</strong> Breathtaking fire performance by skilled artists</li>
                <li><strong>Belly Dance:</strong> Traditional Arabic dance performance (optional)</li>
              </ul>
              <p>All performances are family-friendly and showcase authentic Arabian culture.</p>
            ` },
            image: {
              url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
              fileName: 'entertainment.jpg',
              title: { en: 'Live Entertainment' },
              alt: { en: 'Tanoura dance and fire show performances' },
            },
          },
          {
            heading: { en: 'Return Journey (10:00 PM - 10:30 PM)' },
            description: { en: '<p>After an unforgettable evening, relax on the comfortable drive back to your hotel. Your driver will ensure you arrive safely, concluding your premium desert safari experience.</p>' },
            image: {
              url: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=800&h=600&fit=crop',
              fileName: 'return.jpg',
              title: { en: 'Return Journey' },
              alt: { en: 'Night drive back to Dubai' },
            },
          },
        ],
      },
    ],
  },
  faqs: [
    {
      question: { en: 'What should I wear for the desert safari?' },
      answer: { en: `
        <div class="faq-answer">
          <p>We recommend wearing comfortable, light clothing suitable for outdoor activities. Here are some specific suggestions:</p>
          <ul>
            <li><strong>Clothing:</strong> Light, breathable fabrics like cotton. Long pants are recommended for camel riding.</li>
            <li><strong>Footwear:</strong> Closed-toe shoes or sneakers (avoid sandals for dune activities)</li>
            <li><strong>Evening:</strong> Bring a light jacket or shawl for cooler evening temperatures (especially October-March)</li>
            <li><strong>Sun Protection:</strong> Hat, sunglasses, and sunscreen are essential</li>
          </ul>
          <p>Avoid wearing white clothing as the desert sand can be dusty.</p>
        </div>
      ` },
    },
    {
      question: { en: 'Is the desert safari suitable for children and elderly people?' },
      answer: { en: `
        <div class="faq-answer">
          <p>Yes, our desert safari is family-friendly and suitable for most age groups with some considerations:</p>
          <h5>Children:</h5>
          <ul>
            <li>Children under 3 years travel free</li>
            <li>Children aged 3-11 receive 50% discount</li>
            <li>Child seats available upon request</li>
            <li>All activities are supervised and safe for children</li>
          </ul>
          <h5>Elderly Guests:</h5>
          <ul>
            <li>Dune bashing can be intense - please inform us if you prefer a gentler ride</li>
            <li>Alternative activities available if needed</li>
            <li>Comfortable seating areas at the camp</li>
          </ul>
          <p><strong>Note:</strong> Dune bashing and camel riding are not recommended for pregnant women or individuals with back/heart conditions.</p>
        </div>
      ` },
    },
    {
      question: { en: 'What is included in the tour price?' },
      answer: { en: `
        <div class="faq-answer">
          <p>Your tour package includes comprehensive services to ensure a memorable experience:</p>
          <h5>Transportation:</h5>
          <ul>
            <li>Round-trip hotel transfers in premium 4x4 vehicles</li>
            <li>Professional English-speaking driver/guide</li>
          </ul>
          <h5>Activities:</h5>
          <ul>
            <li>20-25 minute dune bashing session</li>
            <li>Camel riding experience</li>
            <li>Sandboarding equipment</li>
            <li>Sunset photography stop</li>
          </ul>
          <h5>Dining:</h5>
          <ul>
            <li>Gourmet BBQ buffet dinner (vegetarian options available)</li>
            <li>Unlimited soft drinks, water, tea, and coffee</li>
            <li>Welcome refreshments</li>
          </ul>
          <h5>Entertainment & Culture:</h5>
          <ul>
            <li>Live Tanoura dance and fire show</li>
            <li>Henna painting service</li>
            <li>Traditional costume photos</li>
          </ul>
          <p>All taxes and service charges are included. <strong>Not included:</strong> Quad biking ($50 extra), alcoholic beverages, and personal expenses.</p>
        </div>
      ` },
    },
    {
      question: { en: 'What is your cancellation policy?' },
      answer: { en: `
        <div class="faq-answer">
          <p>We offer a flexible cancellation policy to accommodate your travel plans:</p>
          <ul>
            <li><strong>Free Cancellation:</strong> Cancel up to 24 hours before the tour start time for a full refund</li>
            <li><strong>Within 24 Hours:</strong> Cancellations within 24 hours of the tour are subject to 100% charge</li>
            <li><strong>No-Show:</strong> No refund for no-shows</li>
            <li><strong>Weather Cancellations:</strong> In case of extreme weather conditions, we reserve the right to reschedule or provide a full refund</li>
          </ul>
          <p>To cancel, please contact us via email or phone. Refunds are processed within 5-7 business days.</p>
        </div>
      ` },
    },
    {
      question: { en: 'Can I book a private desert safari?' },
      answer: { en: `
        <div class="faq-answer">
          <p>Absolutely! We offer both shared group and private safari options:</p>
          <h5>Private Safari Benefits:</h5>
          <ul>
            <li>Exclusive vehicle for your group only</li>
            <li>Flexible timing and pickup</li>
            <li>Personalized attention from your guide</li>
            <li>Customizable itinerary</li>
            <li>VIP seating area at the camp (Diamond package)</li>
          </ul>
          <p>Private safaris are available for all three packages (Affordable, Gold, and Diamond). The price varies based on group size and selected package. Contact us for a customized quote.</p>
          <p><strong>Recommended for:</strong> Families, couples celebrating special occasions, or groups wanting a more intimate experience.</p>
        </div>
      ` },
    },
    {
      question: { en: 'Do you provide vegetarian or special dietary meal options?' },
      answer: { en: `
        <div class="faq-answer">
          <p>Yes! We cater to various dietary requirements and preferences:</p>
          <h5>Available Options:</h5>
          <ul>
            <li><strong>Vegetarian:</strong> Extensive vegetarian buffet options including grilled vegetables, salads, pasta, and rice dishes</li>
            <li><strong>Vegan:</strong> Vegan options available upon advance request</li>
            <li><strong>Halal:</strong> All our meat is 100% halal certified</li>
            <li><strong>Gluten-Free:</strong> Gluten-free options available upon request</li>
            <li><strong>Allergies:</strong> Please inform us of any food allergies when booking</li>
          </ul>
          <p><strong>Important:</strong> Please notify us of any dietary requirements at least 24 hours before your tour to ensure we can accommodate your needs properly.</p>
        </div>
      ` },
    },
    {
      question: { en: 'How long does the desert safari last?' },
      answer: { en: `
        <div class="faq-answer">
          <p>The complete desert safari experience typically lasts 6-7 hours from pickup to drop-off:</p>
          <h5>Typical Timeline:</h5>
          <ul>
            <li><strong>3:00 PM - 3:30 PM:</strong> Hotel pickup</li>
            <li><strong>3:30 PM - 4:15 PM:</strong> Drive to desert</li>
            <li><strong>4:15 PM - 5:00 PM:</strong> Dune bashing and activities</li>
            <li><strong>5:00 PM - 5:30 PM:</strong> Sunset photography and camel riding</li>
            <li><strong>5:30 PM - 6:30 PM:</strong> Arrival at camp, cultural activities</li>
            <li><strong>6:30 PM - 8:00 PM:</strong> Dinner</li>
            <li><strong>8:00 PM - 9:30 PM:</strong> Live entertainment shows</li>
            <li><strong>9:30 PM - 10:30 PM:</strong> Return to hotel</li>
          </ul>
          <p><strong>Note:</strong> Timings are approximate and may vary based on traffic, weather, and group preferences. We ensure you have ample time to enjoy each activity.</p>
        </div>
      ` },
    },
    {
      question: { en: 'Is dune bashing safe? What safety measures do you have?' },
      answer: { en: `
        <div class="faq-answer">
          <p>Safety is our top priority. We maintain the highest safety standards for all our activities:</p>
          <h5>Safety Measures:</h5>
          <ul>
            <li><strong>Expert Drivers:</strong> All drivers have 10+ years of desert driving experience and are professionally trained</li>
            <li><strong>Vehicle Maintenance:</strong> Our 4x4 vehicles undergo regular safety inspections and maintenance</li>
            <li><strong>Safety Equipment:</strong> All vehicles equipped with roll cages, seat belts, and first aid kits</li>
            <li><strong>Insurance:</strong> Comprehensive insurance coverage for all passengers</li>
            <li><strong>Communication:</strong> Vehicles equipped with GPS and communication devices</li>
            <li><strong>Medical Support:</strong> First aid trained staff and emergency protocols in place</li>
          </ul>
          <h5>Who Should Avoid Dune Bashing:</h5>
          <ul>
            <li>Pregnant women</li>
            <li>Individuals with back, neck, or heart problems</li>
            <li>Recent surgery patients</li>
          </ul>
          <p>If you have any health concerns, please consult with us before booking. Alternative activities can be arranged.</p>
        </div>
      ` },
    },
  ],
  blogReferences: [
    {
      id: 'blog-desert-safari-guide',
      title: 'Ultimate Guide to Desert Safaris in Dubai',
    },
    {
      id: 'blog-what-to-wear-desert',
      title: 'What to Wear on a Desert Safari: Complete Packing Guide',
    },
    {
      id: 'blog-desert-photography-tips',
      title: 'Photography Tips for Capturing the Perfect Desert Sunset',
    },
    {
      id: 'blog-arabian-culture',
      title: 'Understanding Arabian Culture and Traditions',
    },
  ],
  relatedTours: [
    {
      id: 'tour-morning-desert-safari',
      title: 'Morning Desert Safari with Breakfast',
    },
    {
      id: 'tour-overnight-desert-camping',
      title: 'Overnight Desert Camping Experience',
    },
    {
      id: 'tour-private-vip-desert',
      title: 'Private VIP Desert Safari',
    },
  ],
  reviews: [
    {
      type: 'youtube',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: { en: 'Amazing Desert Safari Experience - Guest Review' },
    },
    {
      type: 'youtube',
      url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
      title: { en: 'Family Desert Safari Adventure - Full Experience' },
    },
  ],
  seo: {
    metaTitle: { en: 'Premium Desert Safari Dubai - Dinner & Shows Experience' },
    metaDescription: { en: 'Book premium desert safari in Dubai. Dune bashing, camel rides, BBQ dinner & live shows. Private and group options from $60.' },
    metaKeywords: { en: [
      'dubai desert safari',
      'premium desert safari',
      'dune bashing dubai',
      'desert camp dubai',
      'camel ride dubai',
      'desert safari with dinner',
      'luxury desert experience',
      'dubai adventure tours',
    ] },
    metaImage: {
      url: 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=1200&h=630&fit=crop',
      fileName: 'premium-desert-safari-dubai-seo.jpg',
      title: { en: 'Premium Desert Safari Dubai SEO Image' },
      alt: { en: 'Luxury desert safari experience in Dubai with 4x4 vehicles' },
    },
    mapSchema: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Premium Desert Safari Route Map',
      description: 'Route and key attractions covered during the Premium Desert Safari Experience',
      itemListOrder: 'Sequential',
      itemListElement: [
        {
          '@type': 'TouristAttraction',
          position: 1,
          name: 'Dubai Desert Conservation Reserve Entry',
          description: '<p>Begin your journey at the entrance to the protected desert conservation area.</p>',
          geo: {
            '@type': 'GeoCoordinates',
            latitude: '24.8607',
            longitude: '55.7233',
          },
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Dubai Desert Conservation Reserve',
            addressCountry: 'AE',
          },
        },
        {
          '@type': 'TouristAttraction',
          position: 2,
          name: 'Premium Desert Camp',
          description: '<p>Luxury Bedouin-style camp featuring gourmet dining and live entertainment.</p>',
          geo: {
            '@type': 'GeoCoordinates',
            latitude: '24.8800',
            longitude: '55.6200',
          },
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Dubai Desert',
            addressCountry: 'AE',
          },
        },
      ],
    },
  },
  isActive: true,
  isFeatured: true,
  viewCount: 0,
};
