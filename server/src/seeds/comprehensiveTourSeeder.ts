import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import TourCategory from '../models/TourCategory';
import TourSubcategory from '../models/TourSubcategory';
import Tour from '../models/Tour';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Comprehensive Tour Seeder with Multiple Tours
 * Seeds categories, subcategories, and 10+ sample tours
 */

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
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg: string) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

// Sample image URLs (using placeholder service)
const sampleImages = {
  pyramids: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800',
  nile: 'https://images.unsplash.com/photo-1539768942893-daf53e448371?w=800',
  luxor: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800',
  aswan: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800',
  cairo: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800',
  redSea: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
  desert: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800',
  sphinx: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=800',
  temple: 'https://images.unsplash.com/photo-1539768942893-daf53e448371?w=800',
  cruise: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
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
 * Clear existing data
 */
const clearData = async (): Promise<void> => {
  try {
    log.info('Clearing existing tour data...');
    
    await Promise.all([
      Tour.deleteMany({}),
      TourSubcategory.deleteMany({}),
      TourCategory.deleteMany({}),
    ]);
    
    log.success('Existing tour data cleared');
  } catch (error: any) {
    log.error(`Error clearing data: ${error.message}`);
    throw error;
  }
};

/**
 * Seed categories
 */
const seedCategories = async (): Promise<Map<string, mongoose.Types.ObjectId>> => {
  try {
    log.info('Seeding tour categories...');
    
    const categories = [
      {
        name: 'Egypt Tours',
        slug: 'egypt-tours',
        description: 'Explore the wonders of ancient Egypt',
        isActive: true,
      },
      {
        name: 'Nile Cruises',
        slug: 'nile-cruises',
        description: 'Luxury cruises along the Nile River',
        isActive: true,
      },
      {
        name: 'Desert Adventures',
        slug: 'desert-adventures',
        description: 'Experience the Egyptian deserts',
        isActive: true,
      },
    ];

    const categoryMap = new Map<string, mongoose.Types.ObjectId>();
    
    for (const cat of categories) {
      const category = await TourCategory.create(cat);
      categoryMap.set(cat.slug, category._id);
      log.success(`Category created: ${category.name}`);
    }
    
    return categoryMap;
  } catch (error: any) {
    log.error(`Error seeding categories: ${error.message}`);
    throw error;
  }
};

/**
 * Seed subcategories
 */
const seedSubcategories = async (
  categoryMap: Map<string, mongoose.Types.ObjectId>
): Promise<Map<string, mongoose.Types.ObjectId>> => {
  try {
    log.info('Seeding tour subcategories...');
    
    const subcategories = [
      {
        name: 'Cairo Tours',
        slug: 'cairo-tours',
        category: categoryMap.get('egypt-tours')!,
        description: 'Discover the capital city',
        image: { url: sampleImages.cairo, fileName: 'cairo.jpg', title: 'Cairo', alt: 'Cairo cityscape' },
        isActive: true,
      },
      {
        name: 'Luxor Tours',
        slug: 'luxor-tours',
        category: categoryMap.get('egypt-tours')!,
        description: 'Ancient temples and tombs',
        image: { url: sampleImages.luxor, fileName: 'luxor.jpg', title: 'Luxor', alt: 'Luxor temples' },
        isActive: true,
      },
      {
        name: 'Aswan Tours',
        slug: 'aswan-tours',
        category: categoryMap.get('egypt-tours')!,
        description: 'Nubian culture and monuments',
        image: { url: sampleImages.aswan, fileName: 'aswan.jpg', title: 'Aswan', alt: 'Aswan monuments' },
        isActive: true,
      },
      {
        name: 'Luxury Cruises',
        slug: 'luxury-cruises',
        category: categoryMap.get('nile-cruises')!,
        description: '5-star Nile cruise experiences',
        image: { url: sampleImages.cruise, fileName: 'cruise.jpg', title: 'Cruise', alt: 'Luxury cruise' },
        isActive: true,
      },
      {
        name: 'Red Sea Tours',
        slug: 'red-sea-tours',
        category: categoryMap.get('egypt-tours')!,
        description: 'Beach and diving adventures',
        image: { url: sampleImages.redSea, fileName: 'redsea.jpg', title: 'Red Sea', alt: 'Red Sea beach' },
        isActive: true,
      },
    ];

    const subcategoryMap = new Map<string, mongoose.Types.ObjectId>();
    
    for (const subcat of subcategories) {
      const subcategory = await TourSubcategory.create(subcat);
      subcategoryMap.set(subcat.slug, subcategory._id);
      log.success(`Subcategory created: ${subcategory.name}`);
    }
    
    return subcategoryMap;
  } catch (error: any) {
    log.error(`Error seeding subcategories: ${error.message}`);
    throw error;
  }
};

/**
 * Seed tours
 */
const seedTours = async (subcategoryMap: Map<string, mongoose.Types.ObjectId>): Promise<void> => {
  try {
    log.info('Seeding tours...');
    
    const tours = [
      // 1. Pyramids of Giza and Sphinx Day Tour
      {
        subcategory: subcategoryMap.get('cairo-tours')!,
        idExternal: 'TOUR-001',
        heading: 'Private Pyramids of Giza, Sphinx, and Saqqara Day Tour',
        slug: 'pyramids-giza-sphinx-saqqara-private-tour',
        Description: {
          header: 'The Ultimate Ancient Egypt Experience in One Day',
          text: `
            <h3>Overview</h3>
            <p>Embark on an unforgettable journey through 5,000 years of history on this comprehensive private day tour. From the colossal Pyramids of Giza to the ancient necropolis of Saqqara, you will witness the evolution of pyramid construction and the grandeur of the Old Kingdom.</p>
            <p>Your expert Egyptologist guide will lead you through the Giza Plateau, where you'll stand in awe of the Great Pyramid of Khufu, the only surviving wonder of the ancient world. Encounter the enigmatic Sphinx, the guardian of the plateau, before traveling to Saqqara to see the Step Pyramid of Djoser, the oldest stone structure in history.</p>
            <h3>Why This Tour?</h3>
            <ul>
              <li><strong>Private & Flexible:</strong> Enjoy a personalized experience with a private vehicle and guide.</li>
              <li><strong>Expert Knowledge:</strong> Learn deep historical context from a licensed Egyptologist.</li>
              <li><strong>All-Inclusive comfort:</strong> Door-to-door transfers and a high-quality local lunch included.</li>
            </ul>
          `,
        },
        images: [
          { url: sampleImages.pyramids, fileName: 'pyramids-hero.jpg', title: 'The Great Pyramids at Sunrise', alt: 'Panoramic view of Giza Pyramids' },
          { url: sampleImages.sphinx, fileName: 'sphinx-profile.jpg', title: 'The Great Sphinx', alt: 'Side profile of the Sphinx with pyramids in background' },
          { url: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800', fileName: 'camel-ride.jpg', title: 'Camel Ride at Giza', alt: 'Tourist riding camel with pyramids view' },
        ],
        gallery: [
          { url: sampleImages.pyramids, fileName: 'pyramid-detail.jpg', title: 'Pyramid Limestone Blocks', alt: 'Close up of massive stones' },
          { url: sampleImages.sphinx, fileName: 'sphinx-front.jpg', title: 'Sphinx Front View', alt: 'Frontal view of Sphinx' },
          { url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', fileName: 'saqqara-step.jpg', title: 'Step Pyramid of Saqqara', alt: 'Djoser Step Pyramid' },
        ],
        tourLocation: 'Giza & Saqqara, Egypt',
        tourAvailability: 'Every Day (8:00 AM Start)',
        pickupAndDropOff: 'Complimentary pickup and drop-off from any Cairo or Giza hotel.',
        tourType: 'Private Day Tour',
        tourStyle: 'History & Culture',
        tourHighlights: [
          'Stand at the foot of the Great Pyramid of Khufu',
          'Take iconic photos at the Giza Panorama Point',
          'Visit the Valley Temple of Khafre',
          'Get up close to the paws of the Great Sphinx',
          'Explore the ancient Step Pyramid of Djoser at Saqqara',
          'Enter a noble tomb in Saqqara to see vibrant limestone reliefs',
        ],
        inclusion: [
          'Private air-conditioned vehicle for all transfers',
          'Professional English-speaking Egyptologist guide',
          'Entrance fees to Giza Plateau and Saqqara Area',
          'Delicious lunch at a quality local restaurant (BBQ or Koshary)',
          'Bottled water throughout the day',
          'All taxes and service charges',
        ],
        exclusion: [
          'Entrance inside the Great Pyramid (extra ticket)',
          'Camel or Horse ride (optional)',
          'Beverages during lunch',
          'Gratuities (Tipping) for guide and driver',
        ],
        pricingPlans: [
          {
            planName: 'AFFORDABLE',
            seasons: [
              {
                seasonName: 'All Year',
                startDate: new Date('2025-01-01'),
                endDate: new Date('2025-12-31'),
                prices: { solo: 120, pax_2_4: 85, pax_5_8: 70, pax_9_16: 60 },
              },
            ],
          },
        ],
        priceStartingFrom: 60,
        duration: '8-9 Hours',
        meetingPoint: 'Hotel Lobby',
        cancellationPolicy: 'Free cancellation up to 24 hours before the tour start time.',
        tags: ['Pyramids', 'Giza', 'Saqqara', 'History', 'Private Tour', 'Must-See'],
        itinerary: {
          generalDescription: '<p>A full day itinerary beginning with the Giza Plateau and ending in the ancient necropolis of Saqqara.</p>',
          days: [
            {
              day: 1,
              title: 'Giza Plateau & Saqqara Necropolis',
              description: '<p>Start your day with the most famous monuments in the world before journeying south to the birthplace of pyramid architecture.</p>',
              activities: [
                {
                  heading: 'The Great Pyramids',
                  description: '<p>Visit the three pyramids of Cheops, Chephren, and Mycerinus. Your guide will explain the engineering theories and history behind these massive structures.</p>',
                  image: { url: sampleImages.pyramids, fileName: 'giza-pyramids.jpg' },
                },
                {
                  heading: 'The Great Sphinx & Valley Temple',
                  description: '<p>Walk through the Valley Temple where King Chephren was mummified, then ascend the causeway to stand face-to-face with the Sphinx.</p>',
                  image: { url: sampleImages.sphinx, fileName: 'sphinx-face.jpg' },
                },
                {
                  heading: 'Lunch',
                  description: '<p>Enjoy a traditional Egyptian lunch at a restaurant with a view of the pyramids or a garden setting in Saqqara.</p>',
                },
                {
                  heading: 'Saqqara Step Pyramid',
                  description: '<p>Explore the complex of King Djoser and see the first stone building in history. You will also visit the Teti Pyramid (available to enter) and the mastaba tombs of nobles.</p>',
                  image: { url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', fileName: 'step-pyramid.jpg' },
                },
              ],
            },
          ],
        },
        faqs: [
          {
            question: 'Is it safe to go inside the pyramids?',
            answer: '<p>Yes, but it is a narrow and steep climb. Not recommended for those with claustrophobia or back issues.</p>',
          },
          {
            question: 'What should I wear?',
            answer: '<p>Comfortable walking shoes are a must. Modest clothing is respectful and protects from the sun. Bring a hat and sunglasses.</p>',
          },
          {
            question: 'Are there toilets available?',
            answer: '<p>Yes, there are facilities at the entrance of the Giza Plateau and near the Saqqara museum.</p>',
          }
        ],
        notes: [
          { title: 'Physical Level', text: '<p>Moderate walking is involved, often on sand or uneven surfaces.</p>' }
        ],
        whatToPack: ['Sunscreen', 'Hat', 'Sunglasses', 'Camera', 'Small Backpack', 'Comfortable Shoes'],
        seo: {
          metaTitle: 'Private Giza Pyramids & Saqqara Day Tour | Cairo Best Tours',
          metaDescription: 'Book the best private day tour to Giza Pyramids and Saqqara. Includes expert guide, lunch, and private transfer. Explore the Sphinx and Step Pyramid.',
          metaKeywords: ['Giza Pyramids', 'Saqqara', 'Sphinx', 'Private Tour Cairo', 'Egypt Day Trips'],
        },
        isFeatured: true,
        isActive: true,
      },

      // 2. Luxor East and West Bank
      {
        subcategory: subcategoryMap.get('luxor-tours')!,
        idExternal: 'TOUR-002',
        heading: 'Luxor Highlights: Valley of the Kings & Karnak Temple',
        slug: 'luxor-full-day-east-west-bank',
        Description: {
          header: 'The World\'s Greatest Open-Air Museum',
          text: `
            <p>Immerse yourself in the grandeur of ancient Thebes. This full-day tour covers the essential highlights of Luxor, split by the Nile River. On the West Bank, you'll delve into the afterlife beliefs of the Pharaohs. On the East Bank, you'll walk among the colossal columns of temples dedicated to the gods.</p>
            <p>This is the perfect tour for travelers who want to see it all in one day with the comfort of a private air-conditioned vehicle and a knowledgeable guide.</p>
          `,
        },
        images: [
          { url: sampleImages.luxor, fileName: 'karnak-hall.jpg', title: 'Great Hypostyle Hall', alt: 'Columns of Karnak' },
          { url: sampleImages.temple, fileName: 'hatshepsut.jpg', title: 'Temple of Hatshepsut', alt: 'Mortuary Temple of Hatshepsut' },
        ],
        tourLocation: 'Luxor, Egypt',
        tourAvailability: 'Daily',
        pickupAndDropOff: 'Included from any Luxor Hotel or Cruise Ship',
        tourType: 'Private Day Tour',
        tourStyle: 'Historical',
        tourHighlights: [
          'Explore three royal tombs in the Valley of the Kings',
          'Marvel at the terraced Temple of Queen Hatshepsut',
          'See the towering Colossi of Memnon',
          'Walk the Avenue of Sphinxes at Karnak Temple',
          'Visit the majestic Luxor Temple',
        ],
        inclusion: [
          'Hotel/Cruise pickup and drop-off',
          'Private transport',
          'Egyptologist guide',
          'Lunch at a local restaurant',
          'Entrance fees to all mentioned sites',
          'River Nile motorboat crossing (optional)',
        ],
        exclusion: ['Tutankhamun Tomb ticket', 'Drinks', 'Tips'],
        pricingPlans: [
          {
            planName: 'AFFORDABLE',
            seasons: [
              {
                seasonName: 'All Year',
                startDate: new Date('2025-01-01'),
                endDate: new Date('2025-12-31'),
                prices: { solo: 140, pax_2_4: 100, pax_5_8: 90, pax_9_16: 80 },
              },
            ],
          },
        ],
        priceStartingFrom: 80,
        duration: '8-10 Hours',
        meetingPoint: 'Reception',
        cancellationPolicy: 'Free cancellation 24h prior.',
        tags: ['Luxor', 'Karnak', 'Valley of Kings', 'Thebes'],
        itinerary: {
          generalDescription: '<p>A balanced day starting with the West Bank\'s necropolis and ending with the East Bank\'s temples.</p>',
          days: [
            {
              day: 1,
              title: 'Luxor Discovery',
              description: '<p>Detailed exploration of Thebes.</p>',
              activities: [
                {
                  heading: 'Valley of the Kings',
                  description: '<p>Descend into the painted tombs of New Kingdom pharaohs. Your ticket allows entry into 3 tombs.</p>',
                  image: { url: sampleImages.luxor, fileName: 'tomb-art.jpg' },
                },
                {
                  heading: 'Temple of Hatshepsut',
                  description: '<p>Visit this unique temple built into the cliffs of Deir el-Bahari.</p>',
                  image: { url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', fileName: 'hatshepsut-temple.jpg' },
                },
                {
                  heading: 'Karnak Temple',
                  description: '<p>The largest religious complex ever built. See the Hypostyle Hall and the Sacred Lake.</p>',
                  image: { url: sampleImages.temple, fileName: 'karnak-lake.jpg' },
                },
              ],
            },
          ],
        },
        seo: {
          metaTitle: 'Luxor Full Day Tour: Valley of Kings & Karnak',
          metaDescription: 'Complete Luxor day tour visiting West and East banks. See Valley of the Kings, Hatshepsut, and Karnak Temple with a private guide.',
        },
        isFeatured: true,
        isActive: true,
      },

      // 3. 14 Days Best of Egypt
      {
        subcategory: subcategoryMap.get('cairo-tours')!,
        idExternal: 'TOUR-003',
        heading: '14 Days Trip to the Best of Egypt',
        slug: '14-days-trip-best-egypt',
        Description: {
          header: 'Live the True Adventure',
          text: `
            <h3>Overview</h3>
            <p>Live the true adventure through our 14 days trip to the best of Egypt and discover the most attractive places in Egypt. You will explore the Giza Pyramids complex, the Egyptian Museum, the Citadel of Salah El Din, Memphis city, the Step Pyramid in Cairo.</p>
            <p>Then move to check the Nubian culture in Aswan and witness the greatness of the High Dam, the Unfinished Obelisk, and Philae Temple. Board your 5-star Nile Cruise to visit Kom Ombo, Edfu, Luxor, and Karnak temples, plus the Valley of the Kings. Finally, experience the tropical beauty of the Red Sea in Hurghada before returning to Cairo.</p>
          `,
        },
        images: [
          { url: sampleImages.pyramids, fileName: 'giza-pano.jpg', title: 'Giza Pyramids', alt: 'Giza Pyramids Panorama' },
          { url: sampleImages.nile, fileName: 'nile-cruise.jpg', title: 'Nile Cruise', alt: 'Luxury Nile Cruise' },
          { url: sampleImages.redSea, fileName: 'hurghada-beach.jpg', title: 'Hurghada Red Sea', alt: 'Red Sea Beach' },
        ],
        tourLocation: 'Cairo - Luxor - Aswan - Hurghada',
        tourAvailability: 'Every Day',
        pickupAndDropOff: 'Airport transfers included',
        tourType: 'Private Tour Package',
        tourStyle: 'Culture & Relaxation',
        tourHighlights: [
          'Visit the Giza Pyramids & Sphinx',
          'Explore the Egyptian Museum and Old Cairo',
          'Experience a 5-Star Nile Cruise accommodation',
          'Visit Abu Simbel Temples',
          'Relax on the Red Sea beaches in Hurghada',
          'Discover Luxor and Karnak Temples',
          'Enter the Valley of the Kings',
        ],
        inclusion: [
          'Meet and assist service at airports',
          'Assistance of our guest relations during your stay',
          'Entry Visa for Egypt',
          'All transfers by private air-conditioned vehicle',
          'Domestic flights (Cairo/Aswan - Hurghada/Cairo)',
          '5 Nights hotel accommodation in Cairo',
          '3 Nights on 5-star Nile Cruise',
          '4 Nights hotel accommodation in Hurghada',
          'All sightseeing tours in Cairo, Luxor, Aswan',
          'English speaking expert tour guide',
          'Entrance fees to all sites as indicated',
          'All taxes and service charge',
        ],
        exclusion: [
          'International Airfare',
          'Tipping',
          'Optional tours (Balloon ride, etc)',
          'Personal expenses',
        ],
        pricingPlans: [
          {
            planName: 'AFFORDABLE',
            seasons: [
              {
                seasonName: 'All Year',
                startDate: new Date('2025-01-01'),
                endDate: new Date('2025-12-31'),
                prices: { solo: 2046, pax_2_4: 1950, pax_5_8: 1850, pax_9_16: 1800 },
              },
            ],
          },
        ],
        priceStartingFrom: 2046,
        duration: '14 Days / 13 Nights',
        meetingPoint: 'Cairo International Airport',
        cancellationPolicy: 'Free cancellation up to 14 days before arrival.',
        tags: ['Best of Egypt', 'Pyramids', 'Nile Cruise', 'Red Sea', 'Hurghada', 'Family'],
        itinerary: {
          generalDescription: '<p>A complete 2-week journey covering the history, culture, and nature of Egypt.</p>',
          days: [
            {
              day: 1,
              title: 'Arrival in Cairo',
              description: '<p>Welcome to Egypt! Our representative will meet you at Cairo International Airport and assist with customs. Transfer to your 5-star hotel in Cairo for check-in and overnight.</p>',
              activities: [
                { heading: 'Arrival', description: '<p>Transfer to hotel.</p>', image: { url: sampleImages.cairo, fileName: 'cairo-airport.jpg' } } 
              ]
            },
            {
              day: 2,
              title: 'Pyramids & Egyptian Museum',
              description: '<p>Breakfast at the hotel. Visit the Giza Pyramids, Sphinx, and the Valley Temple. Lunch at a local restaurant. Proceed to the Egyptian Museum.</p>',
              activities: [
                { heading: 'Giza Plateau', description: '<p>See the Great Pyramids and Sphinx.</p>', image: { url: sampleImages.pyramids, fileName: 'sphinx.jpg' } },
                { heading: 'Egyptian Museum', description: '<p>View the treasures of Tutankhamun.</p>', image: { url: sampleImages.cairo, fileName: 'museum.jpg' } } 
              ]
            },
            {
              day: 3,
              title: 'Old Cairo & The Citadel',
              description: '<p>Visit the Salah El Din Citadel and Mohamed Ali Mosque. Explore Old Cairo (Coptic Cairo) including the Hanging Church. End at Khan El Khalili Bazaar.</p>',
               activities: [
                { heading: 'Saladin Citadel', description: '<p>Panoramic views of Cairo.</p>', image: { url: sampleImages.cairo, fileName: 'citadel.jpg' } },
                { heading: 'Khan El Khalili', description: '<p>Shopping in the historic bazaar.</p>', image: { url: sampleImages.cairo, fileName: 'old-cairo.jpg' } } 
              ]
            },
            {
              day: 4,
              title: 'Fly to Aswan - Nile Cruise',
              description: '<p>Transfer to Cairo Airport for flight to Aswan. Meet your guide and visit the High Dam and Philae Temple. Embark on your Nile Cruise.</p>',
              activities: [
                 { heading: 'Philae Temple', description: '<p>Temple of Isis on an island.</p>', image: { url: sampleImages.aswan, fileName: 'philae.jpg' } }
              ]
            },
            {
              day: 5,
              title: 'Abu Simbel & Kom Ombo',
              description: '<p>Early morning trip to Abu Simbel (optional/included depending on package). Sail to Kom Ombo and visit the dual temple. Sail to Edfu.</p>',
              activities: [
                 { heading: 'Abu Simbel', description: '<p>The gigantic temples of Ramses II.</p>', image: { url: sampleImages.aswan, fileName: 'abusimbel.jpg' } }
              ]
            },
            {
              day: 6,
              title: 'Edfu Temple & Sail to Luxor',
              description: '<p>Visit the Temple of Horus in Edfu. Sail to Luxor via Esna Lock. Arrive in Luxor late afternoon.</p>',
               activities: [
                 { heading: 'Edfu Temple', description: '<p>Best preserved temple in Egypt.</p>', image: { url: 'https://images.unsplash.com/photo-1539768942893-daf53e448371?w=800', fileName: 'edfu.jpg' } }
              ]
            },
            {
              day: 7,
              title: 'Luxor West Bank',
              description: '<p>Disembark after breakfast. Visit the Valley of the Kings, Hatshepsut Temple, and Colossi of Memnon. Transfer to Luxor East Bank hotel.</p>',
               activities: [
                 { heading: 'Valley of the Kings', description: '<p>Royal tombs of ancient Pharaohs.</p>', image: { url: sampleImages.luxor, fileName: 'vok.jpg' } }
              ]
            },
            {
              day: 8,
              title: 'Luxor East Bank - Transfer to Hurghada',
              description: '<p>Visit Karnak Temple and Luxor Temple. In the afternoon, transfer by private vehicle to Hurghada on the Red Sea coast.</p>',
               activities: [
                 { heading: 'Karnak Temple', description: '<p>The largest religious complex.</p>', image: { url: sampleImages.temple, fileName: 'karnak.jpg' } }
              ]
            },
            {
              day: 9,
              title: 'Hurghada Free Day',
              description: '<p>Relax on the beach or enjoy water sports at your resort.</p>',
               activities: [
                 { heading: 'Red Sea Relaxation', description: '<p>Sun, sand, and sea.</p>', image: { url: sampleImages.redSea, fileName: 'beach.jpg' } }
              ]
            },
            {
              day: 10,
              title: 'Hurghada Snorkeling',
              description: '<p>Optional snorkeling trip to Giftun Island to see coral reefs.</p>',
               activities: [
                 { heading: 'Snorkeling', description: '<p>Explore the underwater world.</p>', image: { url: sampleImages.redSea, fileName: 'snorkeling.jpg' } }
              ]
            },
            {
              day: 11,
              title: 'Hurghada Desert Safari',
              description: '<p>Optional desert safari by Quad Bike. Free time at the hotel.</p>',
               activities: [
                 { heading: 'Desert Sunset', description: '<p>Safari adventure.</p>', image: { url: sampleImages.desert, fileName: 'safari.jpg' } }
              ]
            },
            {
              day: 12,
              title: 'Fly to Cairo',
              description: '<p>Breakfast at hotel. Transfer to Hurghada Airport for flight back to Cairo. Transfer to hotel.</p>',
               activities: [
                 { heading: 'Return to Cairo', description: '<p>Flight and transfer.</p>', image: { url: sampleImages.cairo, fileName: 'cairo-city.jpg' } }
              ]
            },
            {
              day: 13,
              title: 'Alexandria Day Trip',
              description: '<p>Drive to Alexandria to visit the Library, Catacombs, and Qaitbay Citadel. Seafood lunch. Return to Cairo.</p>',
               activities: [
                 { heading: 'Bibliotheca Alexandrina', description: '<p>The modern library.</p>', image: { url: sampleImages.cairo, fileName: 'library.jpg' } }
              ]
            },
            {
              day: 14,
              title: 'Final Departure',
              description: '<p>Breakfast. Transfer to Cairo International Airport for your final departure flight.</p>',
               activities: [
                 { heading: 'Departure', description: '<p>Safe travels!</p>', image: { url: sampleImages.cairo, fileName: 'airport.jpg' } }
              ]
            },
          ],
        },
        seo: {
          metaTitle: '14 Days Trip to the Best of Egypt',
          metaDescription: 'Live the true adventure through our 14 days trip to the best of Egypt and discover the most attractive places in Egypt.',
          metaKeywords: ['14 Days in Egypt', 'Egypt Tour 14 Days', 'Best of Egypt'],
        },
        isActive: true,
        isFeatured: true,
      },

      // 4. Hurghada Snorkeling
      {
        subcategory: subcategoryMap.get('red-sea-tours')!,
        idExternal: 'TOUR-004',
        heading: 'Giftun Island Snorkeling Trip with Lunch',
        slug: 'hurghada-giftun-island-snorkeling',
        Description: {
          header: 'Paradise Island Adventure',
          text: '<p>Escape to the crystal clear waters of the Red Sea. Board a comfortable boat and sail to Giftun Island National Park. Swim with colorful fish, explore vibrant coral reefs, and relax on the white sandy beach.</p>',
        },
        images: [
          { url: sampleImages.redSea, fileName: 'details-coral.jpg', title: 'Red Sea Corals', alt: 'Colorful coral reef' },
          { url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', fileName: 'yacht-deck.jpg', title: 'Boat Deck', alt: 'Relaxing on boat' },
        ],
        tourLocation: 'Hurghada',
        tourAvailability: 'Daily',
        pickupAndDropOff: 'Hotel pickup included',
        tourType: 'Day Trip',
        tourStyle: 'Water Sports',
        tourHighlights: [
            'Snorkel in the crystal clear waters of the Red Sea',
            'Visit the beautiful Giftun Island National Park',
            'Enjoy a delicious buffet lunch on board',
            'Relax on the white sandy beaches',
            'Sailing boat experience'
        ],
        inclusion: [
            'Hotel pickup and drop-off',
            'Boat trip and snorkeling equipment',
            'Lunch and soft drinks',
            'National park fees',
            'Guide assistance'
        ],
        exclusion: [
            'Tips',
            'Personal expenses',
            'DVD or photos taken by the cameraman'
        ],
        pricingPlans: [{ planName: 'AFFORDABLE', seasons: [{ seasonName: 'All Year', startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), prices: { solo: 45, pax_2_4: 35, pax_5_8: 30, pax_9_16: 25 } }] }],
        priceStartingFrom: 25,
        duration: '7 Hours',
        tags: ['Snorkeling', 'Red Sea', 'Family Friendly'],
        itinerary: {
          generalDescription: '<p>A full day of sun, sea, and snorkeling in the Red Sea.</p>',
          days: [{ 
            day: 1, 
            title: 'Red Sea Adventure', 
            description: '<p>Board your yacht and sail to the national park.</p>', 
            activities: [
              { heading: 'Snorkeling Stop 1', description: '<p>Jump in for a guided snorkeling session at a prime coral reef spot.</p>', image: { url: sampleImages.redSea, fileName: 'snorkeling.jpg' } },
              { heading: 'Lunch on Board', description: '<p>Enjoy a fresh buffet lunch prepared by the crew.</p>', image: { url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800', fileName: 'lunch-boat.jpg' } },
              { heading: 'Giftun Island Beach', description: '<p>Relax on the white sands of Giftun Island, swim or sunbathe.</p>', image: { url: sampleImages.redSea, fileName: 'beach.jpg' } } 
            ] 
          }]
        },
        whatToPack: ['Swimwear', 'Towel', 'Sunscreen', 'Sunglasses'],
        seo: { metaTitle: 'Hurghada Snorkeling Trip to Giftun Island', metaDescription: 'Full day boat trip to Giftun Island with snorkeling and lunch.' },
        isActive: true,
        isFeatured: false,
      },

      // 5. Islamic Cairo
      {
        subcategory: subcategoryMap.get('cairo-tours')!,
        idExternal: 'TOUR-005',
        heading: 'Old Cairo & Islamic Heritage Walking Tour',
        slug: 'islamic-coptic-cairo-private-tour',
        Description: {
          header: 'A Walk Through Medieval History',
          text: '<p>Explore the stunning architecture of Islamic Cairo (Al-Muizz Street) and the spiritual depth of Coptic Cairo. Visit the Hanging Church, Citadel of Saladin, and Khan El Khalili Bazaar.</p>',
        },
        images: [
          { url: sampleImages.cairo, fileName: 'muizz-street.jpg', title: 'Al-Muizz Street', alt: 'Historic street Cairo' },
        ],
        tourLocation: 'Cairo',
        pricingPlans: [{ planName: 'AFFORDABLE', seasons: [{ seasonName: 'All Year', startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), prices: { solo: 80, pax_2_4: 55, pax_5_8: 45, pax_9_16: 40 } }] }],
        tourType: 'Cultural Walking Tour',
        duration: '6-7 Hours',
        tourHighlights: [
            'Visit the Citadel of Saladin',
            'Explore the Alabaster Mosque of Mohamed Ali',
            'Walk through Old Cairo (Coptic Cairo)',
            'See the Hanging Church',
            'Shop at Khan El Khalili Bazaar'
        ],
        inclusion: [
            'Private guide and vehicle',
            'Entrance fees',
            'Lunch',
            'Bottled water',
            'Hotel pickup and drop-off'
        ],
        exclusion: [
            'Tips',
            'Personal items',
            'Drinks during lunch'
        ],
        itinerary: { 
          generalDescription: '<p>Discover the diverse religious history of Cairo.</p>',
          days: [{ 
            day: 1, 
            title: 'Historic Cairo', 
            description: '<p>Visit the most iconic religious sites in the city.</p>', 
            activities: [
              { heading: 'Citadel of Saladin', description: '<p>Visit the alabaster mosque of Mohamed Ali and enjoy panoramic city views.</p>', image: { url: sampleImages.cairo, fileName: 'citadel.jpg' } },
              { heading: 'Coptic Cairo', description: '<p>Walk the narrow ancient lanes to see the Hanging Church and Abu Serga Church.</p>', image: { url: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800', fileName: 'coptic.jpg' } },
              { heading: 'Khan el-Khalili', description: '<p>End the day at the famous old bazaar.</p>', image: { url: sampleImages.cairo, fileName: 'bazaar.jpg' } }
            ] 
          }] 
        },
        isActive: true,
        isFeatured: false,
        seo: { metaTitle: 'Islamic and Coptic Cairo Private Tour', metaDescription: 'Discover the Citadel, Hanging Church, and Khan El Khalili.' },
      },

      // 6. Aswan Abu Simbel
      {
        subcategory: subcategoryMap.get('aswan-tours')!,
        idExternal: 'TOUR-006',
        heading: 'Aswan & Abu Simbel Private Day Tour',
        slug: 'aswan-abu-simbel-day-tour',
        Description: {
          header: 'Giants of the South',
          text: '<p>A long but rewarding day. Drive south to Abu Simbel to see the massive temples of Ramses II. Return to Aswan to visit the High Dam and Philae Temple.</p>',
        },
        images: [
          { url: sampleImages.aswan, fileName: 'abusimbel-main.jpg', title: 'Abu Simbel Facade', alt: 'Four statues of Ramses' },
        ],
        tourLocation: 'Aswan/Abu Simbel',
        pricingPlans: [{ planName: 'AFFORDABLE', seasons: [{ seasonName: 'All Year', startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), prices: { solo: 180, pax_2_4: 130, pax_5_8: 115, pax_9_16: 100 } }] }],
        tourType: 'Private Tour',
        duration: '10-11 Hours',
        tourHighlights: [
            'Visit the Abu Simbel Temples',
            'Explore Philae Temple on Isis Island',
            'See the Aswan High Dam',
            'Private air-conditioned transport',
            'Expert Egyptologist guide'
        ],
        inclusion: [
            'All transfers by private vehicle',
            'Private guide',
            'Entrance fees',
            'Lunch in Aswan',
            'Bottled water'
        ],
        exclusion: [
            'Tips',
            'Personal expenses',
            'Drinks'
        ],
        itinerary: { 
          generalDescription: '<p>A combo tour of the most impressive southern monuments.</p>',
          days: [{ 
            day: 1, 
            title: 'Abu Simbel & Aswan', 
            description: '<p>Early morning drive to Abu Simbel followed by Aswan sightseeing.</p>', 
            activities: [
              { heading: 'Abu Simbel Temples', description: '<p>Explore the Great Temple of Ramses II and the Temple of Nefertari.</p>', image: { url: sampleImages.aswan, fileName: 'abusimbel.jpg' } },
              { heading: 'Philae Temple', description: '<p>Return to Aswan to visit the beautiful island temple of Isis.</p>', image: { url: sampleImages.aswan, fileName: 'philae.jpg' } },
              { heading: 'Aswan High Dam', description: '<p>See the modern engineering marvel that controls the Nile.</p>', image: { url: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800', fileName: 'dam.jpg' } } 
            ] 
          }] 
        },
        whatToPack: ['Breakfast box from hotel', 'Comfortable clothes', 'Water'],
        isActive: true,
        isFeatured: true,
        seo: { metaTitle: 'Abu Simbel Tour from Aswan', metaDescription: 'Private day trip to Abu Simbel and Philae Temple from Aswan.' },
      },

      // 7. White Desert
      {
        subcategory: subcategoryMap.get('cairo-tours')!,
        idExternal: 'TOUR-007',
        heading: '2-Day White Desert Camping Adventure',
        slug: 'white-desert-camping-2-days',
        Description: {
          header: 'A Night Under the Galaxy',
          text: '<p>Leave the chaos of the city for the serenity of the White Desert. See the Mushroom Rock, Crystal Mountain, and camp under a blanket of stars.</p>',
        },
        images: [
          { url: sampleImages.desert, fileName: 'white-desert-night.jpg', title: 'Camping under stars', alt: 'Tent in White Desert' },
        ],
        tourLocation: 'Bahariya Oasis',
        tourType: 'Adventure/Camping',
        pricingPlans: [{ planName: 'AFFORDABLE', seasons: [{ seasonName: 'All Year', startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), prices: { solo: 250, pax_2_4: 160, pax_5_8: 140, pax_9_16: 130 } }] }],
        tourHighlights: ['4x4 Dune Bashing', 'Camping', 'BBQ Dinner', 'Hot Springs'],
        duration: '2 Days / 1 Night',
        inclusion: [
            'transfers from Cairo to Bahariya',
            '4x4 Jeep for desert safari',
            'Camping equipment (tents, sleeping bags)',
            'All meals (Breakfast, Lunch, Dinner)',
            'Guide and driver'
        ],
        exclusion: [
            'Tips',
            'Personal beverages',
            'Travel insurance'
        ],
        itinerary: { 
          generalDescription: '<p>A thrilling desert safari and overnight camping experience.</p>',
          days: [
            { 
              day: 1, 
              title: 'Cairo to the White Desert', 
              description: 'Drive to Bahariya, transfer to 4x4, and head into the surreal landscapes.', 
              activities: [
                { heading: 'Black Desert', description: '<p>Stop at the volcanic Black Desert and climb the English Mountain.</p>', image: { url: sampleImages.desert, fileName: 'black-desert.jpg' } },
                { heading: 'Crystal Mountain', description: '<p>See the sparkling quartz crystals.</p>', image: { url: sampleImages.desert, fileName: 'crystal.jpg' } },
                { heading: 'Camping & BBQ', description: '<p>Set up camp among the white chalk formations and enjoy a BBQ dinner.</p>', image: { url: sampleImages.desert, fileName: 'camp.jpg' } }
              ] 
            }, 
            { 
              day: 2, 
              title: 'Sunrise & Return', 
              description: 'Wake up to a magical sunrise before returning to Cairo.', 
              activities: [
                 { heading: 'Sunrise Photography', description: '<p>Capture the desert in the soft morning light.</p>', image: { url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800', fileName: 'sunrise-desert.jpg' } },
                 { heading: 'Return Drive', description: '<p>Drive back to Bahariya for lunch, then to Cairo.</p>', image: { url: sampleImages.desert, fileName: 'jeep.jpg' } }
              ] 
            }
          ] 
        },
        isActive: true,
        isFeatured: false,
        seo: { metaTitle: 'White Desert Camping Tour from Cairo', metaDescription: 'Overnight camping trip to the White Desert.' },
      },

      // 8. Alexandria
      {
        subcategory: subcategoryMap.get('cairo-tours')!,
        idExternal: 'TOUR-008',
        heading: 'Alexandria Day Trip: The Pearl of the Mediterranean',
        slug: 'alexandria-day-tour-from-cairo',
        Description: {
          header: 'Greco-Roman History by the Sea',
          text: '<p>Drive north to Alexandria. Visit the Catacombs, Pompey\'s Pillar, Qaitbay Citadel (outside), and the modern Library of Alexandria. Enjoy a fresh seafood lunch.</p>',
        },
        images: [
          { url: sampleImages.cairo, fileName: 'alex-citadel.jpg', title: 'Qaitbay Citadel', alt: 'Fortress by the sea' },
        ],
        tourLocation: 'Alexandria',
        pricingPlans: [{ planName: 'AFFORDABLE', seasons: [{ seasonName: 'All Year', startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), prices: { solo: 130, pax_2_4: 90, pax_5_8: 80, pax_9_16: 70 } }] }],
        tourType: 'Private Day Trip',
        duration: '10-11 Hours',
        tourHighlights: [
            'Visit the Bibliotheca Alexandrina',
            'See the Catacombs of Kom El Shoqafa',
            'View the Citadel of Qaitbay',
            'Enjoy a seafood lunch with sea view',
            'Private transportation'
        ],
        inclusion: [
            'Private vehicle transfers',
            'Professional guide',
            'Entrance fees',
            'Seafood lunch',
            'Bottled water'
        ],
        exclusion: [
            'Tips',
            'Personal expenses',
            'Drinks during lunch'
        ],
        itinerary: { 
          generalDescription: '<p>Explore the city founded by Alexander the Great.</p>',
          days: [{ 
            day: 1, 
            title: 'Alexandria Highlights', 
            description: 'Full day sightseeing in the Mediterranean city.', 
            activities: [
               { heading: 'Catacombs of Kom El Shoqafa', description: '<p>Descend into the largest Roman burial site in Egypt.</p>', image: { url: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800', fileName: 'catacombs.jpg' } },
               { heading: 'Qaitbay Citadel', description: '<p>Built on the site of the ancient Lighthouse of Alexandria.</p>', image: { url: sampleImages.cairo, fileName: 'qaitbay.jpg' } },
               { heading: 'Bibliotheca Alexandrina', description: '<p>Visit the modern library and its museums.</p>', image: { url: sampleImages.cairo, fileName: 'library.jpg' } } 
            ] 
          }] 
        },
        isActive: true,
        isFeatured: false,
        seo: { metaTitle: 'Alexandria Day Trip from Cairo', metaDescription: 'Private tour to Alexandria visiting Library, Catacombs, and Citadel.' },
      },

      // 9. Memphis Saqqara
      {
        subcategory: subcategoryMap.get('cairo-tours')!,
        idExternal: 'TOUR-009',
        heading: 'Half-Day Saqqara & Memphis Tour',
        slug: 'saqqara-memphis-half-day',
        Description: {
          header: 'Short Trip to Ancient Origins',
          text: '<p>Perfect for those with limited time. Visit the Step Pyramid complex and the open-air museum of Memphis.</p>',
        },
        images: [
          { url: sampleImages.pyramids, fileName: 'memphis-statue.jpg', title: 'Ramses II Statue', alt: 'Colossus of Ramses' },
        ],
        tourLocation: 'Giza',
        pricingPlans: [{ planName: 'AFFORDABLE', seasons: [{ seasonName: 'All Year', startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), prices: { solo: 70, pax_2_4: 50, pax_5_8: 45, pax_9_16: 40 } }] }],
        tourType: 'Private Half-Day',
        duration: '5 Hours',
        tourHighlights: [
            'See the Step Pyramid of Djoser',
            'Visit the ancient capital of Memphis',
            'See the colossal statue of Ramses II',
            'Short and convenient tour'
        ],
        inclusion: [
            'Private vehicle and driver',
            'Expert guide',
            'Entrance fees',
            'Bottled water',
            'Hotel pickup/drop-off'
        ],
        exclusion: [
            'Tips',
            'Meals',
            'Personal spending'
        ],
        itinerary: { 
          generalDescription: '<p>A journey to the earliest capitals of Egypt.</p>',
          days: [{ 
            day: 1, 
            title: 'Saqqara & Memphis', 
            description: 'Visit the Step Pyramid and the Memphis Open Air Museum.', 
            activities: [
               { heading: 'Step Pyramid of Djoser', description: '<p>See the first stone pyramid ever built.</p>', image: { url: sampleImages.pyramids, fileName: 'step-pyr.jpg' } },
               { heading: 'Memphis Museum', description: '<p>Marvel at the colossal statue of Ramses II.</p>', image: { url: sampleImages.pyramids, fileName: 'memphis-colossus.jpg' } }
            ] 
          }] 
        },
        isActive: true,
        isFeatured: false,
        seo: { metaTitle: 'Saqqara and Memphis Half Day Tour', metaDescription: 'Visit the Step Pyramid of Djoser and Memphis City.' },
      },

      // 10. Felucca
      {
        subcategory: subcategoryMap.get('aswan-tours')!,
        idExternal: 'TOUR-010',
        heading: 'Sunset Felucca Ride & Nubian Village',
        slug: 'aswan-felucca-nubian-culture',
        Description: {
          header: 'Sail and Smile',
          text: '<p>Enjoy a peaceful sailboat ride on the Nile at sunset. Visit a Nubian family house, see the crocodiles, and enjoy tea.</p>',
        },
        images: [
          { url: sampleImages.nile, fileName: 'nubian-house.jpg', title: 'Nubian House', alt: 'Colorful Nubian village' },
        ],
        tourLocation: 'Aswan',
        pricingPlans: [{ planName: 'AFFORDABLE', seasons: [{ seasonName: 'All Year', startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), prices: { solo: 45, pax_2_4: 30, pax_5_8: 25, pax_9_16: 20 } }] }],
        tourType: 'Experience',
        duration: '3-4 Hours',
        tourHighlights: [
            'Sailing on a traditional Felucca',
            'Beautiful sunset views',
            'Visit a local Nubian family',
            'Experience Nubian culture and hospitality'
        ],
        inclusion: [
            'Hotel/Cruise pickup and drop-off',
            'Felucca boat ride',
            'Motorboat to Nubian village',
            'Tea/Coffee hospitality',
            'Guide assistance'
        ],
        exclusion: [
            'Tips',
            'Personal purchases'
        ],
        itinerary: { 
          generalDescription: '<p>A cultural experience on the Nile.</p>',
          days: [{ 
            day: 1, 
            title: 'Felucca & Nubian Culture', 
            description: 'Relaxing sailing followed by cultural immersion.', 
            activities: [
               { heading: 'Felucca Ride', description: '<p>Let the wind guide you along the Nile at sunset.</p>', image: { url: sampleImages.nile, fileName: 'felucca-sunset.jpg' } },
               { heading: 'Nubian Village', description: '<p>Meet locals, see the colorful houses, and drink mint tea.</p>', image: { url: sampleImages.nile, fileName: 'nubian.jpg' } } 
            ] 
          }] 
        },
        isActive: true,
        isFeatured: false,
        seo: { metaTitle: 'Felucca Ride to Nubian Village Aswan', metaDescription: 'Sail the Nile and visit a Nubian Village in Aswan.' },
      }
    ];

    let createdCount = 0;
    for (const tourData of tours) {
      const tour = await Tour.create(tourData);
      createdCount++;
      log.success(`Tour ${createdCount}/${tours.length}: ${tour.heading}`);
    }
    
    log.success(`Created ${createdCount} tours successfully`);
  } catch (error: any) {
    log.error(`Error seeding tours: ${error.message}`);
    throw error;
  }
};

/**
 * Display summary
 */
const displaySummary = async (): Promise<void> => {
  try {
    const [categoryCount, subcategoryCount, tourCount] = await Promise.all([
      TourCategory.countDocuments(),
      TourSubcategory.countDocuments(),
      Tour.countDocuments(),
    ]);
    
    log.header('📊 SEEDING SUMMARY');
    console.log(`  Categories:     ${categoryCount}`);
    console.log(`  Subcategories:  ${subcategoryCount}`);
    console.log(`  Tours:          ${tourCount}`);
    console.log('');
  } catch (error: any) {
    log.error(`Error displaying summary: ${error.message}`);
  }
};

/**
 * Main seeder function
 */
const runSeeder = async (): Promise<void> => {
  try {
    log.header('🌱 COMPREHENSIVE TOUR DATABASE SEEDER');
    
    await connectDB();
    await clearData();
    
    const categoryMap = await seedCategories();
    const subcategoryMap = await seedSubcategories(categoryMap);
    await seedTours(subcategoryMap);
    
    await displaySummary();
    
    log.success('Tour seeding completed successfully!');
    process.exit(0);
  } catch (error: any) {
    log.error(`Seeding failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

// Run seeder
if (require.main === module) {
  runSeeder();
}

export default runSeeder;
