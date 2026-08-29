import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import TourCategory from '../models/TourCategory';
import TourSubcategory from '../models/TourSubcategory';
import Tour from '../models/Tour';
import { SEED_IMAGE_PLACEHOLDER } from './seedImages';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg: string) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

const detailedTour = {
  heading: 'The Grand Heritage: 12-Day Signature Egypt Explorer',
  slug: 'grand-heritage-12-day-signature-egypt-explorer',
  idExternal: 'TOUR-SIGNATURE-001',
  Description: {
    header: 'A Masterpiece Journey Through the Cradle of Civilization',
    text: `
      <h3>Discover the soul of Egypt on this meticulously crafted 12-day journey.</h3>
      <p>Our Signature Egypt Explorer is more than just a tour; it's an immersion into the history, culture, and luxury that only Egypt can offer. From the whispering sands of the Giza Plateau to the crystal-clear depths of the Red Sea, every moment is designed to leave you breathless.</p>
      <p>Experience the ultimate in travel excellence with our expert Egyptologists who bring ancient legends to life. This tour combines the iconic wonders of the Pharaohs with hidden gems and exclusive cultural encounters that few travelers ever witness.</p>
      <h4>Why Choose the Signature Explorer?</h4>
      <ul>
        <li><strong>Elite Guiding:</strong> Accompanied by our most senior, multi-lingual Egyptologists.</li>
        <li><strong>Curated Accommodations:</strong> Hand-picked 5-star standard, gold, and diamond luxury options.</li>
        <li><strong>Seamless Travel:</strong> Private VIP transfers, internal flights, and dedicated guest relations support.</li>
        <li><strong>Authentic Flavors:</strong> Gourmet dining experiences featuring traditional Egyptian and international cuisine.</li>
      </ul>
    `
  },
  images: [
    { url: SEED_IMAGE_PLACEHOLDER, fileName: 'pyramids-main.jpg', title: 'Grand Pyramids of Giza', alt: 'The Great Pyramids at Sunset' },
    { url: SEED_IMAGE_PLACEHOLDER, fileName: 'nile-cruise.jpg', title: 'Luxury Nile Cruise', alt: 'A luxury cruise ship sailing the Nile' },
    { url: SEED_IMAGE_PLACEHOLDER, fileName: 'cairo-evening.jpg', title: 'Cairo Skyline', alt: 'Cairo city at night' }
  ],
  gallery: [
    { url: SEED_IMAGE_PLACEHOLDER, fileName: 'luxor-temple.jpg', title: 'Luxor Temple', alt: 'Illuminated Luxor Temple columns' },
    { url: SEED_IMAGE_PLACEHOLDER, fileName: 'aswan-felucca.jpg', title: 'Felucca on the Nile', alt: 'Traditional sailing boat in Aswan' },
    { url: SEED_IMAGE_PLACEHOLDER, fileName: 'red-sea.jpg', title: 'Red Sea Coast', alt: 'Turquoise waters of the Red Sea' },
    { url: SEED_IMAGE_PLACEHOLDER, fileName: 'hatshepsut.jpg', title: 'Temple of Hatshepsut', alt: 'The Mortuary Temple of Hatshepsut' }
  ],
  tourLocation: 'Cairo, Luxor, Aswan, Abu Simbel, Hurghada',
  tourAvailability: 'Every Day (Year Round)',
  pickupAndDropOff: 'VIP Meet & Assist service at Cairo International Airport with private transfers throughout.',
  tourType: 'Private VIP Luxury Tour',
  tourStyle: 'History, Culture & Relaxation',
  tourHighlights: [
    'Private VIP tour of the Giza Pyramids and the mysterious Sphinx',
    'Exclusive access to the Grand Egyptian Museum (GEM) and its treasures',
    '4-Night Luxury Nile Cruise from Aswan to Luxor on a 5-star vessel',
    'Private sunrise excursion to the majestic Abu Simbel Temples',
    'In-depth exploration of the Valley of the Kings, including Tutankhamun’s tomb',
    'Private dinner cruise on the Nile with traditional live performance',
    '3-Night luxury beach stay in Hurghada with private snorkeling safari',
    'Traditional Felucca sailing around the islands of Aswan at sunset'
  ],
  inclusion: [
    'International VIP Meet & Assist at Cairo Airport upon arrival/departure',
    'Egypt Entry Visa for all nationalities',
    'All ground transportation in private, late-model air-conditioned vehicles',
    'Domestic flights within Egypt (Cairo/Aswan - Luxor/Hurghada - Hurghada/Cairo)',
    '4 Nights in Cairo at a selected luxury 5-star hotel (Bed & Breakfast)',
    '4 Nights on a 5-star Luxury Nile Cruise (Full Board)',
    '3 Nights in Hurghada at a 5-star Luxury Resort (All-Inclusive)',
    'All sightseeing tours mentioned in the itinerary (Private)',
    'Licensed expert English-speaking Egyptologist (Senior Level)',
    'All entrance fees to the sites mentioned in the itinerary',
    'Bottled water and soft drinks during tours and transfers',
    'All service charges and government taxes'
  ],
  exclusion: [
    'International airfare to/from Egypt',
    'Personal expenses (laundry, telephone calls, etc.)',
    'Optional tours and activities not mentioned',
    'Gratuities (Tipping) for guides, drivers, and cruise staff'
  ],
  pricingPlans: [
    {
      planName: 'AFFORDABLE',
      seasons: [
        {
          seasonName: 'Peak Season (Winter)',
          startDate: new Date('2025-10-01'),
          endDate: new Date('2026-04-30'),
          prices: { solo: 2899, pax_2_4: 2450, pax_5_8: 2200, pax_9_16: 1950 }
        },
        {
          seasonName: 'Summer Season',
          startDate: new Date('2025-05-01'),
          endDate: new Date('2025-09-30'),
          prices: { solo: 2499, pax_2_4: 2150, pax_5_8: 1950, pax_9_16: 1750 }
        }
      ]
    },
    {
      planName: 'GOLD (5 STAR STANDARD)',
      seasons: [
        {
          seasonName: 'Annual Rate',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          prices: { solo: 3850, pax_2_4: 3400, pax_5_8: 3100, pax_9_16: 2850 }
        }
      ]
    },
    {
      planName: 'DIAMOND (5 STAR LUXURY)',
      seasons: [
        {
          seasonName: 'Annual Rate',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          prices: { solo: 5500, pax_2_4: 4950, pax_5_8: 4600, pax_9_16: 4200 }
        }
      ]
    }
  ],
  priceStartingFrom: 1750,
  duration: '12 Days / 11 Nights',
  meetingPoint: 'Cairo International Airport (Arrival Hall)',
  cancellationPolicy: 'Free cancellation up to 30 days before arrival. 50% refund between 15-29 days. No refund within 14 days.',
  tags: ['Luxury', 'Signature', 'VIP', 'Family', 'Nile Cruise', 'Red Sea', 'Cairo', 'History'],
  notes: [
    { title: 'Visa Requirements', text: 'Visa is included in your package. Our representative will handle the process for you upon arrival.' },
    { title: 'Tipping Culture', text: 'Tipping is customary in Egypt. We recommend a general budget of $15-20 per person per day for various services.' }
  ],
  whatToPack: [
    'Light breathable cotton clothing',
    'Comfortable walking shoes (closed-toe recommended)',
    'Swimwear for the cruise and Hurghada',
    'Sunglasses and high-SPF sunscreen',
    'A light jacket or sweater for cool evenings',
    'Universal power adapter (Type C/E)',
    'Personal medications and a basic first-aid kit'
  ],
  whatYouWillLoveHtml: `
    <div class="love-section">
      <h3>What Makes This Tour Extraordinary</h3>
      <ul>
        <li><strong>The Pharaoh's View:</strong> Witnessing the sunrise over the Giza Plateau while sipping traditional Egyptian tea.</li>
        <li><strong>Nile Serenity:</strong> The gentle rocking of your luxury cruise as you watch thousands of years of history pass by on the banks.</li>
        <li><strong>Culinary Magic:</strong> A private cooking class with a local family in a Nubian village in Aswan.</li>
        <li><strong>Underwater Paradise:</strong> Swimming alongside sea turtles in the protected reefs of the Red Sea.</li>
      </ul>
    </div>
  `,
  tourMapIframe: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3454.218671424601!2d31.131707615114755!3d29.976484881907722!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14584587ac8f2ad1%3A0x333325da7227498c!2sThe%20Great%20Pyramid%20of%20Giza!5e0!3m2!1sen!2seg!4v1625654321000!5m2!1sen!2seg" width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>',
  mapSchema: {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Tour Itinerary Map',
    description: 'Key stops of the 12-Day Signature Egypt Explorer',
    itemListOrder: 'Sequential',
    itemListElement: [
      {
        '@type': 'TouristAttraction',
        position: 1,
        name: 'Giza Pyramids',
        description: 'The iconic pyramids of Khufu, Khafre, and Menkaure.',
        geo: { '@type': 'GeoCoordinates', latitude: '29.9792', longitude: '31.1342' },
        address: { '@type': 'PostalAddress', addressLocality: 'Giza', addressCountry: 'Egypt' }
      },
      {
        '@type': 'TouristAttraction',
        position: 2,
        name: 'Egyptian Museum',
        description: 'Home to the world\'s most extensive collection of pharaonic antiquities.',
        geo: { '@type': 'GeoCoordinates', latitude: '30.0478', longitude: '31.2336' },
        address: { '@type': 'PostalAddress', addressLocality: 'Cairo', addressCountry: 'Egypt' }
      },
       {
        '@type': 'TouristAttraction',
        position: 3,
        name: 'Philae Temple',
        description: 'The beautiful island temple of goddess Isis in Aswan.',
        geo: { '@type': 'GeoCoordinates', latitude: '24.0322', longitude: '32.8844' },
        address: { '@type': 'PostalAddress', addressLocality: 'Aswan', addressCountry: 'Egypt' }
      },
      {
        '@type': 'TouristAttraction',
        position: 4,
        name: 'Abu Simbel Temples',
        description: 'The colossal rock temples of Ramses II and Nefertari.',
        geo: { '@type': 'GeoCoordinates', latitude: '22.3372', longitude: '31.6258' },
        address: { '@type': 'PostalAddress', addressLocality: 'Abu Simbel', addressCountry: 'Egypt' }
      },
      {
        '@type': 'TouristAttraction',
        position: 5,
        name: 'Valley of the Kings',
        description: 'The burial site of New Kingdom pharaohs including Tutankhamun.',
        geo: { '@type': 'GeoCoordinates', latitude: '25.7402', longitude: '32.6014' },
        address: { '@type': 'PostalAddress', addressLocality: 'Luxor', addressCountry: 'Egypt' }
      },
      {
        '@type': 'TouristAttraction',
        position: 6,
        name: 'Karnak Temple',
        description: 'The largest religious complex ever built in the ancient world.',
        geo: { '@type': 'GeoCoordinates', latitude: '25.7188', longitude: '32.6573' },
        address: { '@type': 'PostalAddress', addressLocality: 'Luxor', addressCountry: 'Egypt' }
      },
      {
        '@type': 'TouristAttraction',
        position: 7,
        name: 'Hurghada Red Sea',
        description: 'Tropical paradise known for its crystal waters and vibrant marine life.',
        geo: { '@type': 'GeoCoordinates', latitude: '27.2579', longitude: '33.8116' },
        address: { '@type': 'PostalAddress', addressLocality: 'Hurghada', addressCountry: 'Egypt' }
      }
    ]
  },
  itinerary: {
    generalDescription: 'A comprehensive 12-day journey covering the essential wonders and hidden treasures of Egypt.',
    days: [
      {
        day: 1,
        title: 'Arrival in the Land of Pharaohs',
        description: 'Your journey begins with a VIP welcome in Cairo.',
        activities: [
          {
            heading: 'Arrival & VIP Assist',
            description: 'Meet our luxury travel representative at Cairo International Airport for VIP assistance with visa and customs. Transfer via private Mercedes-Benz to your 5-star hotel.',
            image: { url: SEED_IMAGE_PLACEHOLDER, fileName: 'cairo-arrival.jpg' }
          }
        ]
      },
      {
        day: 2,
        title: 'Wonders of Giza and Ancient Memphis',
        description: 'Stand before the only surviving Wonder of the Ancient World.',
        activities: [
          {
            heading: 'Giza Plateau Exploration',
            description: 'Experience the majesty of the Great Pyramids and the Sphinx. Enjoy a private camel trek across the plateau for the best panoramic views.',
            image: { url: SEED_IMAGE_PLACEHOLDER, fileName: 'giza-pyramids.jpg' }
          },
          {
            heading: 'Memphis & Saqqara',
            description: 'Visit the first capital of Egypt and the Step Pyramid of Djoser, the oldest stone structure in history.',
            image: { url: SEED_IMAGE_PLACEHOLDER, fileName: 'saqqara.jpg' }
          }
        ]
      },
      {
        day: 3,
        title: 'The Treasures of Cairo',
        description: 'Dive deep into Cairo\'s rich layers of history.',
        activities: [
          {
            heading: 'Grand Egyptian Museum (GEM)',
            description: 'Be among the first to explore the world\'s largest archaeological museum, featuring the full Tutankhamun collection.',
            image: { url: SEED_IMAGE_PLACEHOLDER, fileName: 'museum.jpg' }
          },
          {
            heading: 'Islamic & Coptic Cairo',
            description: 'Walk through Al-Muizz Street and visit the Citadel of Saladin before exploring the historic Hanging Church.',
            image: { url: SEED_IMAGE_PLACEHOLDER, fileName: 'old-cairo.jpg' }
          }
        ]
      },
      {
        day: 4,
        title: 'Flight to Aswan & The Temple of Isis',
        description: 'Journey south to the pearl of the Nile.',
        activities: [
          {
            heading: 'Philae Temple at Sunset',
            description: 'Take a boat to the Agilkia Island to visit the romantic Philae Temple, saved from the rising waters of the Nile.',
            image: { url: SEED_IMAGE_PLACEHOLDER, fileName: 'philae-temple.jpg' }
          }
        ]
      },
      {
        day: 5,
        title: 'The Miraculous Abu Simbel',
        description: 'A sunrise visit to the most impressive temples in all of Egypt.',
        activities: [
          {
            heading: 'Abu Simbel Sun Festival Experience',
            description: 'Private transfer to the colossal temples of Ramses II and Nefertari, carved directly into the mountain side.',
            image: { url: SEED_IMAGE_PLACEHOLDER, fileName: 'abusimbel.jpg' }
          },
          {
            heading: 'Cruise Embarkation',
            description: 'Board your 5-star luxury Nile Cruise and enjoy lunch as we begin our voyage downstream.',
            image: { url: SEED_IMAGE_PLACEHOLDER, fileName: 'cruise-life.jpg' }
          }
        ]
      },
      {
        day: 6,
        title: 'Sailing Down the Nile',
        description: 'Relax as the timeless landscape of the Nile unfolds.',
        activities: [
          {
            heading: 'Kom Ombo & Edfu',
            description: 'Visit the unique double temple of Kom Ombo and the incredibly well-preserved Temple of Horus in Edfu by horse-drawn carriage.',
            image: { url: SEED_IMAGE_PLACEHOLDER, fileName: 'kom-ombo.jpg' }
          }
        ]
      },
      {
        day: 7,
        title: 'The West Bank Treasures of Luxor',
        description: 'Cross the Nile to the City of the Dead.',
        activities: [
          {
            heading: 'Valley of the Kings',
            description: 'Explore the elaborate underground tombs of the New Kingdom pharaohs, including the legendary Tutankhamun.',
            image: { url: SEED_IMAGE_PLACEHOLDER, fileName: 'vok-tomb.jpg' }
          },
          {
            heading: 'Mortuary Temple of Hatshepsut',
            description: 'Visit the stunning three-tiered temple of Egypt\'s most famous female pharaoh, built into the limestone cliffs.',
            image: { url: SEED_IMAGE_PLACEHOLDER, fileName: 'hatshepsut-temple.jpg' }
          }
        ]
      },
      {
        day: 8,
        title: 'The Grand Temples of Luxor',
        description: 'Walk through the corridors of time in the East Bank.',
        activities: [
          {
            heading: 'Karnak Temple Complex',
            description: 'Wander through the massive Hypostyle Hall with its 134 towering columns, the largest religious site in Antiquity.',
            image: { url: SEED_IMAGE_PLACEHOLDER, fileName: 'karnak-hall.jpg' }
          },
          {
            heading: 'Luxor Temple',
            description: 'Visit the majestic Luxor Temple as it lights up at dusk, connected once to Karnak by the Avenue of Sphinxes.',
            image: { url: SEED_IMAGE_PLACEHOLDER, fileName: 'luxor-by-night.jpg' }
          }
        ]
      },
      {
        day: 9,
        title: 'Journey to the Red Sea',
        description: 'From the desert history to the tropical coast.',
        activities: [
          {
            heading: 'Transfer to Hurghada',
            description: 'Private transfer through the Eastern Desert to the Red Sea coast. Check-in to your luxury all-inclusive resort.',
            image: { url: SEED_IMAGE_PLACEHOLDER, fileName: 'hurghada-resort.jpg' }
          }
        ]
      },
      {
        day: 10,
        title: 'Azure Waters & Coral Gardens',
        description: 'A day of relaxation and underwater discovery.',
        activities: [
          {
            heading: 'Private Snorkeling Safari',
            description: 'Board a private yacht for a day of snorkeling in the protected reefs of the Red Sea. Enjoy a fresh seafood lunch on board.',
            image: { url: SEED_IMAGE_PLACEHOLDER, fileName: 'snorkeling-red-sea.jpg' }
          }
        ]
      },
      {
        day: 11,
        title: 'Hurghada Leisure & Return to Cairo',
        description: 'Enjoy your final morning by the sea before flying back to the capital.',
        activities: [
          {
            heading: 'Leisure Morning',
            description: 'Free time for spa treatments or more beach relaxation. Late afternoon flight back to Cairo.',
            image: { url: SEED_IMAGE_PLACEHOLDER, fileName: 'cairo-return.jpg' }
          }
        ]
      },
      {
        day: 12,
        title: 'Final Farewell',
        description: 'Departure from Egypt with memories for a lifetime.',
        activities: [
          {
            heading: 'Departure Transfer',
            description: 'Private transfer to Cairo International Airport for your flight home.',
            image: { url: SEED_IMAGE_PLACEHOLDER, fileName: 'departure.jpg' }
          }
        ]
      }
    ]
  },
  faqs: [
    {
      question: 'Do I need a visa before I arrive in Egypt?',
      answer: 'Most nationalities can obtain a visa on arrival. For this Signature Tour, we include the visa and our representative will handle the paperwork for you at the airport.'
    },
    {
      question: 'What is the best time of year for this tour?',
      answer: 'The ideal time is from October to April when the weather is pleasantly warm. However, our summer departures (May-September) offer the same luxury at a better value and with fewer crowds.'
    },
    {
      question: 'Is this tour suitable for families with children?',
      answer: 'Absolutely! We can customize the activities to be more engaging for children, and the Red Sea portion is always a highlight for families.'
    },
    {
      question: 'Are there many stairs or long walks involved?',
      answer: 'Egypt involves some walking on uneven terrain. However, as this is a private tour, we can pace the day according to your comfort level and provide assistance where needed.'
    }
  ],
  seo: {
    metaTitle: '12-Day Signature Egypt Explorer | Luxury Private Tour',
    metaDescription: 'Experience the ultimate luxury journey through Egypt. Private Giza tour, 5-star Nile Cruise, and Red Sea relaxation. Book your dream Egyptian holiday.',
    metaKeywords: ['Luxury Egypt Tour', 'Private Egypt VIP', 'Signature Egypt Explorer', 'Nile Cruise Luxury', 'Cairo Luxor Aswan Hurghada']
  },
  isActive: true,
  isFeatured: true
};

/**
 * Connect to MongoDB
 */
const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }
    
    await mongoose.connect(mongoURI);
    log.success('Connected to MongoDB');
  } catch (error: any) {
    log.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Run seeder
 */
const runSeeder = async (): Promise<void> => {
  try {
    log.header('🚀 STARTING DETAILED TOUR SEEDER');
    
    await connectDB();
    
    // Find or create category
    let category = await TourCategory.findOne({ slug: 'egypt-tours' });
    if (!category) {
      category = await TourCategory.create({
        name: 'Egypt Tours',
        slug: 'egypt-tours',
        description: 'Explore the wonders of ancient Egypt',
        isActive: true
      });
      log.success('Created category: Egypt Tours');
    }
    
    // Find or create subcategory
    let subcategory = await TourSubcategory.findOne({ slug: 'signature-tours' });
    if (!subcategory) {
      subcategory = await TourSubcategory.create({
        name: 'Signature Tours',
        slug: 'signature-tours',
        category: category._id,
        description: 'Our most exclusive and detailed luxury itineraries',
        isActive: true,
        image: { url: detailedTour.images[0].url, fileName: 'signature-thumb.jpg', title: 'Signature Tours', alt: 'Signature Tours Thumbnail' }
      });
      log.success('Created subcategory: Signature Tours');
    }
    
    // Delete existing version of this tour if it exists
    await Tour.deleteOne({ slug: detailedTour.slug });
    log.info(`Cleared existing tour with slug: ${detailedTour.slug}`);
    
    // Create the detailed tour
    const tour = new Tour({
      ...detailedTour,
      subcategory: subcategory._id
    });
    
    await tour.save();
    log.success(`SUCCESSFULLY SEEDED: ${detailedTour.heading}`);
    
    log.header('📊 SEEDING SUMMARY');
    log.info(`Tour Name: ${tour.heading}`);
    log.info(`Slug: ${tour.slug}`);
    log.info(`Itinerary Days: ${tour.itinerary?.days.length}`);
    log.info(`Pricing Plans: ${tour.pricingPlans.length}`);
    log.info(`Images: ${tour.images.length + (tour.gallery?.length || 0)}`);
    log.info(`Status: ACTIVE ✅`);
    
    mongoose.connection.close();
    log.success('Database connection closed');
    
  } catch (error: any) {
    log.error(`SEEDING FAILED: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

runSeeder();
