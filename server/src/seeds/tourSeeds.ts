/**
 * Tour Seeds Data
 * Professional seed data for Tour Categories, Subcategories, and Tours
 * 
 * Usage:
 * - Run: npm run seed:tours
 * - Or: ts-node src/seeds/tourSeeder.ts
 */

export const tourCategorySeed = {
  name: 'Adventure Tours',
  slug: 'adventure-tours',
  description: `
    <div class="category-description">
      <h2>Discover Thrilling Adventures</h2>
      <p>Embark on high-energy adventure tours across the Middle East and North Africa. From exhilarating desert safaris to challenging mountain treks, our adventure tours are designed for thrill-seekers and nature enthusiasts.</p>
      <ul>
        <li>Expert-guided expeditions</li>
        <li>Safety-first approach</li>
        <li>Small group experiences</li>
        <li>Sustainable tourism practices</li>
      </ul>
    </div>
  `,
  image: {
    url: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1200&h=800&fit=crop',
    fileName: 'adventure-main.jpg',
    title: 'Adventure Tours Category',
    alt: 'Exciting adventure activities in desert and mountains',
  },
  seo: {
    metaTitle: 'Adventure Tours - Middle East & North Africa Experiences',
    metaDescription: 'Explore adventure tours: desert safaris, mountain treks, diving trips. Book your next adventure with expert guides today.',
    metaKeywords: ['adventure tours', 'desert safari', 'mountain trekking', 'outdoor activities', 'adventure travel'],
    metaImage: {
      url: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=1200&h=630&fit=crop',
      fileName: 'adventure-category-seo.jpg',
      title: 'Adventure Tours SEO Image',
      alt: 'Adventure travel experiences',
    },
  },
  isActive: true,
};

export const tourSubcategorySeed = {
  // category will be populated with the created category ID
  name: 'Desert Safari',
  slug: 'desert-safari',
  description: `
    <div class="subcategory-description">
      <h3>Unforgettable Desert Safari Experiences</h3>
      <p>Experience the magic of the desert with our carefully curated safari packages. Whether you're seeking adrenaline-pumping dune bashing or a peaceful sunset camel ride, we offer both shared and private experiences with optional luxury add-ons.</p>
      <div class="highlights">
        <h4>What Makes Our Desert Safaris Special:</h4>
        <ul>
          <li>Professional drivers with 10+ years experience</li>
          <li>Modern, well-maintained 4x4 vehicles</li>
          <li>Authentic Bedouin-style camps</li>
          <li>Gourmet dining options</li>
          <li>Cultural entertainment and activities</li>
        </ul>
      </div>
    </div>
  `,
  image: {
    url: 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=1200&h=800&fit=crop',
    fileName: 'desert-safari-main.jpg',
    title: 'Desert Safari Adventures',
    alt: 'Golden desert dunes at sunset with 4x4 vehicles',
  },
  seo: {
    metaTitle: 'Desert Safari Tours - Premium Desert Experiences',
    metaDescription: 'Book exciting desert safari experiences with dune bashing, camel rides, BBQ dinner, and live entertainment. Private and group options available.',
    metaKeywords: ['desert safari', 'dune bashing', 'camel ride', 'desert camp', 'desert adventure'],
    metaImage: {
      url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200&h=630&fit=crop',
      fileName: 'desert-safari-seo.jpg',
      title: 'Desert Safari SEO Image',
      alt: 'Desert safari adventure',
    },
  },
  isActive: true,
};

export const tourSeed = {
  // subcategory will be populated with the created subcategory ID
  idExternal: 'ADV-DS-2026-001',
  heading: 'Premium Desert Safari Experience in Dubai',
  slug: 'premium-desert-safari-dubai',
  Description: {
    header: 'Luxury Desert Safari with Gourmet Dinner & Live Entertainment',
    text: `
      <div class="tour-description">
        <p class="lead">Experience the ultimate luxury desert safari adventure just outside Dubai. This premium package combines adrenaline-pumping activities with authentic Arabian hospitality.</p>
        
        <div class="experience-overview">
          <h3>What to Expect</h3>
          <p>Your journey begins with a comfortable hotel pickup in our premium air-conditioned 4x4 vehicles. As we venture into the golden dunes of the Dubai Desert Conservation Reserve, you'll witness the stunning transformation of the landscape.</p>
          
          <p>Hold on tight for an exhilarating 20-minute dune bashing session with our expert drivers, followed by a serene sunset photo stop at the most picturesque location. Experience traditional camel riding before arriving at our exclusive desert camp.</p>
          
          <p>Indulge in a gourmet BBQ dinner featuring both international and local cuisine, with dedicated vegetarian options. As you dine under the stars, enjoy captivating live performances including traditional Tanoura dance and mesmerizing fire shows.</p>
        </div>
        
        <div class="why-choose">
          <h3>Why Choose This Experience</h3>
          <ul>
            <li><strong>Expert Guides:</strong> Professional drivers and storytellers with extensive desert knowledge</li>
            <li><strong>Premium Comfort:</strong> Modern vehicles with climate control and comfortable seating</li>
            <li><strong>Gourmet Dining:</strong> High-quality food prepared by experienced chefs</li>
            <li><strong>Authentic Culture:</strong> Genuine Arabian entertainment and hospitality</li>
            <li><strong>Safety First:</strong> All safety equipment provided and maintained to highest standards</li>
          </ul>
        </div>
      </div>
    `,
  },
  images: [
    {
      url: 'https://images.unsplash.com/photo-1583221863947-e6df7c2e8a3e?w=1200&h=800&fit=crop',
      fileName: 'main.jpg',
      title: 'Premium Desert Safari Main View',
      alt: 'Luxury 4x4 vehicle on Dubai desert dunes at sunset',
    },
    {
      url: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=1200&h=800&fit=crop',
      fileName: 'vehicle.jpg',
      title: 'Safari 4x4 Vehicle',
      alt: 'Modern 4x4 vehicle used for desert safari',
    },
    {
      url: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1200&h=800&fit=crop',
      fileName: 'camp.jpg',
      title: 'Desert Camp',
      alt: 'Traditional Bedouin-style desert camp setup',
    },
  ],
  gallery: [
    {
      url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200&h=800&fit=crop',
      fileName: 'sunset.jpg',
      title: 'Desert Sunset',
      alt: 'Breathtaking desert sunset with golden dunes',
    },
    {
      url: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=1200&h=800&fit=crop',
      fileName: 'dune-bashing.jpg',
      title: 'Dune Bashing Action',
      alt: '4x4 vehicle performing dune bashing on high sand dunes',
    },
    {
      url: 'https://images.unsplash.com/photo-1583221863947-e6df7c2e8a3e?w=1200&h=800&fit=crop',
      fileName: 'camel-ride.jpg',
      title: 'Camel Riding Experience',
      alt: 'Tourists enjoying camel ride in Dubai desert',
    },
    {
      url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&h=800&fit=crop',
      fileName: 'dinner.jpg',
      title: 'Gourmet BBQ Dinner',
      alt: 'Delicious BBQ buffet spread at desert camp',
    },
    {
      url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&h=800&fit=crop',
      fileName: 'entertainment.jpg',
      title: 'Live Entertainment',
      alt: 'Traditional Tanoura dance performance',
    },
    {
      url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=800&fit=crop',
      fileName: 'fire-show.jpg',
      title: 'Fire Show',
      alt: 'Spectacular fire show performance at desert camp',
    },
  ],
  tourLocation: 'Dubai Desert Conservation Reserve, United Arab Emirates',
  tourAvailability: 'Daily departures (subject to availability and weather conditions)',
  pickupAndDropOff: 'Complimentary hotel pickup and drop-off within Dubai city limits including Dubai Marina, Downtown Dubai, and Palm Jumeirah. Additional charges apply for pickups from Ras Al Khaimah, Fujairah, and Ibn Battuta areas.',
  tourType: 'Private & Shared Group Options',
  tourStyle: 'Luxury Cultural Adventure',
  tourHighlights: [
    'Private 4x4 dune bashing session (20-25 minutes)',
    'Professional photography at stunning sunset viewpoint',
    'Traditional camel riding experience',
    'Gourmet BBQ dinner with international and local cuisine',
    'Live cultural entertainment: Tanoura dance, fire show, and belly dance (optional)',
    'Henna painting and traditional costume photo opportunities',
    'Unlimited soft drinks, tea, and Arabic coffee',
    'Sandboarding equipment provided',
  ],
  inclusion: [
    'Round-trip hotel transfers in premium air-conditioned 4x4 vehicles',
    'Professional English-speaking driver/guide',
    '20-25 minute dune bashing experience',
    'Camel riding session',
    'Sunset photography stop',
    'Welcome refreshments at desert camp',
    'Gourmet BBQ buffet dinner (vegetarian and halal options)',
    'Unlimited soft drinks, water, tea, and coffee',
    'Live entertainment shows (Tanoura, fire show)',
    'Henna painting service',
    'Traditional costume for photos',
    'Sandboarding equipment',
    'All applicable taxes and service charges',
  ],
  exclusion: [
    'Quad biking (available as optional paid activity - $50 per person)',
    'Alcoholic beverages',
    'Personal expenses and gratuities',
    'Travel insurance',
    'Any items not mentioned in inclusions',
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
              title: 'Booking Fee',
              text: '<p>A non-refundable booking fee of $5 USD applies per reservation.</p>',
            },
            {
              title: 'Group Discount',
              text: '<p>Groups of 9+ receive complimentary group photo package.</p>',
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
              title: 'Summer Special',
              text: '<p>Complimentary upgrade to evening safari with extended entertainment.</p>',
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
              title: 'Peak Season Surcharge',
              text: '<p>Peak season rates apply automatically. Advanced booking recommended.</p>',
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
              title: 'Gold Package Inclusions',
              text: '<p>Includes premium seating area, complimentary shisha, and priority service.</p>',
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
              title: 'Diamond Luxury Package',
              text: '<p>Includes private vehicle, VIP seating, luxury welcome pack, premium beverages, and dedicated personal guide.</p>',
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
      title: 'Child Policy',
      text: '<p>Children under 3 years travel free. Children aged 3-11 years receive 50% discount when sharing with adults.</p>',
    },
    {
      title: 'Accessibility',
      text: '<p>Please note that dune bashing and camel riding may not be suitable for pregnant women, individuals with back problems, or those with heart conditions. Alternative activities can be arranged.</p>',
    },
    {
      title: 'Cancellation Policy',
      text: '<p>Free cancellation up to 24 hours before the tour. Cancellations within 24 hours are subject to 100% charge.</p>',
    },
    {
      title: 'Weather Policy',
      text: '<p>Tours operate in all weather conditions. In case of extreme weather, we reserve the right to reschedule or provide a full refund.</p>',
    },
  ],
  whatToPack: [
    'Light, comfortable clothing (long pants recommended for camel riding)',
    'Sunscreen (SPF 30+) and lip balm',
    'Sunglasses and hat/cap',
    'Closed-toe shoes (sandals not recommended for dune activities)',
    'Camera or smartphone for photos',
    'Light jacket or shawl for evening (winter months)',
    'Personal medications if required',
    'Small backpack or bag',
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
  whatYouWillLoveHtml: `
    <div class="what-you-will-love">
      <h3>Why Our Guests Love This Experience</h3>
      <div class="love-points">
        <div class="love-point">
          <h4>🏜️ Authentic Desert Adventure</h4>
          <p>From adrenaline-filled dune rides to peaceful camel treks, experience the desert in all its glory. Our expert drivers ensure maximum thrills while maintaining complete safety.</p>
        </div>
        <div class="love-point">
          <h4>🍽️ Culinary Excellence</h4>
          <p>Savor a gourmet BBQ dinner under the stars featuring both international favorites and authentic Arabian cuisine. Our chefs use only the freshest ingredients to create memorable dining experiences.</p>
        </div>
        <div class="love-point">
          <h4>🎭 Cultural Immersion</h4>
          <p>Witness mesmerizing traditional performances including the hypnotic Tanoura dance and spectacular fire shows. Try henna painting and dress in traditional costumes for unforgettable photos.</p>
        </div>
        <div class="love-point">
          <h4>⭐ Premium Service</h4>
          <p>Our dedicated team ensures every moment is comfortable and memorable. From the moment we pick you up until we drop you back, expect nothing but excellence.</p>
        </div>
      </div>
    </div>
  `,
  itinerary: {
    generalDescription: '<p>This evening desert safari typically lasts 6-7 hours, offering the perfect blend of adventure, culture, and relaxation. The itinerary is flexible and can be adjusted based on group preferences and weather conditions.</p>',
    days: [
      {
        day: 1,
        title: 'Hotel Pickup & Desert Drive',
        description: '<p>Your adventure begins with a comfortable pickup from your Dubai hotel. Relax in our air-conditioned 4x4 as we journey into the golden desert landscape.</p>',
        activities: [
          {
            heading: 'Hotel Pickup (3:00 PM - 3:30 PM)',
            description: '<p>Our professional driver will collect you from your hotel lobby in a premium air-conditioned 4x4 vehicle. Please be ready 10 minutes before your scheduled pickup time.</p>',
            image: {
              url: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=800&h=600&fit=crop',
              fileName: 'pickup.jpg',
              title: 'Hotel Pickup Service',
              alt: 'Luxury 4x4 vehicle for hotel pickup',
            },
          },
          {
            heading: 'Scenic Desert Drive (45 minutes)',
            description: '<p>Enjoy the changing landscape as we leave the city behind and enter the vast Arabian Desert. Your guide will share interesting facts about the desert ecosystem and local culture.</p>',
            image: {
              url: 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=800&h=600&fit=crop',
              fileName: 'drive.jpg',
              title: 'Desert Drive',
              alt: 'Driving through Dubai desert landscape',
            },
          },
        ],
      },
      {
        day: 2,
        title: 'Dune Bashing & Desert Activities',
        description: '<p>Experience the thrill of dune bashing followed by traditional desert activities including camel riding and sandboarding.</p>',
        activities: [
          {
            heading: 'Dune Bashing Adventure (20-25 minutes)',
            description: `
              <p>Hold on tight for an exhilarating roller-coaster ride over the sand dunes! Our expert drivers will take you on an unforgettable journey across the towering dunes.</p>
              <ul>
                <li>Professional drivers with 10+ years experience</li>
                <li>Modern, well-maintained 4x4 vehicles</li>
                <li>All safety equipment provided</li>
                <li>Photo opportunities during stops</li>
              </ul>
            `,
            image: {
              url: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&h=600&fit=crop',
              fileName: 'dune-bashing.jpg',
              title: 'Dune Bashing Experience',
              alt: '4x4 vehicle performing dune bashing on high sand dunes',
            },
          },
          {
            heading: 'Sunset Photography Stop (15 minutes)',
            description: '<p>Capture the magical moment as the sun sets over the desert dunes. This is the perfect opportunity for stunning photographs and to simply enjoy the serene beauty of the desert.</p>',
            image: {
              url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&h=600&fit=crop',
              fileName: 'sunset.jpg',
              title: 'Sunset Photography',
              alt: 'Beautiful desert sunset with golden dunes',
            },
          },
          {
            heading: 'Camel Riding (15 minutes)',
            description: '<p>Experience traditional desert transportation with a camel ride. Our gentle camels are perfect for both beginners and experienced riders.</p>',
            image: {
              url: 'https://images.unsplash.com/photo-1583221863947-e6df7c2e8a3e?w=800&h=600&fit=crop',
              fileName: 'camel.jpg',
              title: 'Camel Riding',
              alt: 'Tourist riding camel in Dubai desert',
            },
          },
          {
            heading: 'Sandboarding (Optional)',
            description: '<p>Try your hand at sandboarding down the dunes! Equipment is provided, and our team will give you basic instructions.</p>',
            image: {
              url: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=800&h=600&fit=crop',
              fileName: 'sandboarding.jpg',
              title: 'Sandboarding Activity',
              alt: 'Person sandboarding down desert dune',
            },
          },
        ],
      },
      {
        day: 3,
        title: 'Desert Camp Experience & Entertainment',
        description: '<p>Arrive at our premium desert camp to enjoy traditional hospitality, gourmet dining, and captivating entertainment.</p>',
        activities: [
          {
            heading: 'Welcome to Desert Camp (6:30 PM)',
            description: `
              <p>Arrive at our beautifully decorated Bedouin-style camp and receive a warm welcome with traditional Arabic coffee and dates.</p>
              <p>Take time to explore the camp facilities:</p>
              <ul>
                <li>Henna painting station</li>
                <li>Traditional costume photo area</li>
                <li>Shisha lounge (Gold & Diamond packages)</li>
                <li>Comfortable seating areas</li>
              </ul>
            `,
            image: {
              url: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=600&fit=crop',
              fileName: 'camp-arrival.jpg',
              title: 'Desert Camp Arrival',
              alt: 'Traditional Bedouin-style desert camp',
            },
          },
          {
            heading: 'Cultural Activities (7:00 PM - 8:00 PM)',
            description: `
              <p>Immerse yourself in Arabian culture with various activities:</p>
              <ul>
                <li><strong>Henna Painting:</strong> Get beautiful traditional henna designs</li>
                <li><strong>Traditional Costumes:</strong> Dress in authentic Arabian attire for photos</li>
                <li><strong>Falconry Display:</strong> Meet and photograph majestic falcons</li>
                <li><strong>Shisha Experience:</strong> Try traditional water pipe (optional)</li>
              </ul>
            `,
            image: {
              url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop',
              fileName: 'activities.jpg',
              title: 'Cultural Activities',
              alt: 'Henna painting and traditional activities',
            },
          },
          {
            heading: 'Gourmet BBQ Dinner (8:00 PM - 9:00 PM)',
            description: `
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
            `,
            image: {
              url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
              fileName: 'dinner.jpg',
              title: 'Gourmet BBQ Dinner',
              alt: 'Delicious BBQ buffet spread at desert camp',
            },
          },
          {
            heading: 'Live Entertainment Shows (9:00 PM - 10:00 PM)',
            description: `
              <p>Enjoy spectacular live performances under the starlit desert sky:</p>
              <ul>
                <li><strong>Tanoura Dance:</strong> Mesmerizing spinning dance with colorful costumes</li>
                <li><strong>Fire Show:</strong> Breathtaking fire performance by skilled artists</li>
                <li><strong>Belly Dance:</strong> Traditional Arabic dance performance (optional)</li>
              </ul>
              <p>All performances are family-friendly and showcase authentic Arabian culture.</p>
            `,
            image: {
              url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
              fileName: 'entertainment.jpg',
              title: 'Live Entertainment',
              alt: 'Tanoura dance and fire show performances',
            },
          },
          {
            heading: 'Return Journey (10:00 PM - 10:30 PM)',
            description: '<p>After an unforgettable evening, relax on the comfortable drive back to your hotel. Your driver will ensure you arrive safely, concluding your premium desert safari experience.</p>',
            image: {
              url: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=800&h=600&fit=crop',
              fileName: 'return.jpg',
              title: 'Return Journey',
              alt: 'Night drive back to Dubai',
            },
          },
        ],
      },
    ],
  },
  faqs: [
    {
      question: 'What should I wear for the desert safari?',
      answer: `
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
      `,
    },
    {
      question: 'Is the desert safari suitable for children and elderly people?',
      answer: `
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
      `,
    },
    {
      question: 'What is included in the tour price?',
      answer: `
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
      `,
    },
    {
      question: 'What is your cancellation policy?',
      answer: `
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
      `,
    },
    {
      question: 'Can I book a private desert safari?',
      answer: `
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
      `,
    },
    {
      question: 'Do you provide vegetarian or special dietary meal options?',
      answer: `
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
      `,
    },
    {
      question: 'How long does the desert safari last?',
      answer: `
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
      `,
    },
    {
      question: 'Is dune bashing safe? What safety measures do you have?',
      answer: `
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
      `,
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
      title: 'Amazing Desert Safari Experience - Guest Review',
    },
    {
      type: 'youtube',
      url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
      title: 'Family Desert Safari Adventure - Full Experience',
    },
  ],
  seo: {
    metaTitle: 'Premium Desert Safari Dubai - Dinner & Shows Experience',
    metaDescription: 'Book premium desert safari in Dubai. Dune bashing, camel rides, BBQ dinner & live shows. Private and group options from $60.',
    metaKeywords: [
      'dubai desert safari',
      'premium desert safari',
      'dune bashing dubai',
      'desert camp dubai',
      'camel ride dubai',
      'desert safari with dinner',
      'luxury desert experience',
      'dubai adventure tours',
    ],
    metaImage: {
      url: 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=1200&h=630&fit=crop',
      fileName: 'premium-desert-safari-dubai-seo.jpg',
      title: 'Premium Desert Safari Dubai SEO Image',
      alt: 'Luxury desert safari experience in Dubai with 4x4 vehicles',
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
