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
        name: { en: 'Egypt Tours', de: 'Ägypten Touren', it: 'Tour in Egitto' },
        slug: 'egypt-tours',
        description: {
          en: '<div class="category-description"><h2>Wonders of Ancient Egypt</h2><p>With over 10 years of experience, we provide the most authentic Egyptian experiences.</p></div>',
          de: '<div class="category-description"><h2>Wunder des alten Ägyptens</h2><p>Mit über 10 Jahren Erfahrung bieten wir die authentischsten ägyptischen Erlebnisse.</p></div>',
          it: '<div class="category-description"><h2>Meraviglie dell\'antico Egitto</h2><p>Con oltre 10 anni di esperienza, offriamo le esperienze egiziane più autentiche.</p></div>'
        },
        faqs: [
          {
            question: { en: 'What is the best time to visit Egypt?', de: 'Was ist die beste Reisezeit für Ägypten?', it: 'Qual è il momento migliore per visitare l\'Egitto?' },
            answer: {
              en: '<p>The best time to visit Egypt is from October to April when the temperatures are cooler.</p>',
              de: '<p>Die beste Reisezeit für Ägypten ist von Oktober bis April, wenn die Temperaturen kühler sind.</p>',
              it: '<p>Il periodo migliore per visitare l\'Egitto è da ottobre ad aprile, quando le temperature sono più fresche.</p>'
            }
          }
          ],
          seo: {
            metaTitle: { en: 'Egypt Tours 2026 - Best Ancient Egypt Experiences', de: 'Ägypten Touren 2026 - Beste Erlebnisse im alten Ägypten', it: 'Tour in Egitto 2026 - Le migliori esperienze nell\'antico Egitto' },
            metaDescription: { en: 'Book your Egypt tour with 10+ years of expertise.', de: 'Buchen Sie Ihre Ägypten-Tour mit über 10 Jahren Erfahrung.', it: 'Prenota il tuo tour in Egitto con oltre 10 anni di esperienza.' },
            metaKeywords: { en: 'Egypt, Tours, 2026, Ancient Egypt', de: 'Ägypten, Touren, 2026, Altes Ägypten', it: 'Egitto, Tour, 2026, Antico Egitto' }
          },
        isActive: true,
      },
      {
        name: { en: 'Nile Cruises', de: 'Nilkreuzfahrten', it: 'Crociere sul Nilo' },
        slug: 'nile-cruises',
        description: {
          en: '<div class="category-description"><h2>Luxury Nile Cruises</h2><p>Experience the Nile like never before with our 10 years of expertise.</p></div>',
          de: '<div class="category-description"><h2>Luxus-Nilkreuzfahrten</h2><p>Erleben Sie den Nil wie nie zuvor mit unserer 10-jährigen Erfahrung.</p></div>',
          it: '<div class="category-description"><h2>Crociere di lusso sul Nilo</h2><p>Vivi il Nilo come mai prima d\'ora con i nostri 10 anni di esperienza.</p></div>'
        },
        faqs: [
          {
            question: { en: 'Are all meals included on the cruise?', de: 'Sind alle Mahlzeiten auf der Kreuzfahrt inbegriffen?', it: 'Tutti i pasti sono inclusi nella crociera?' },
            answer: {
              en: '<p>Yes, all our Nile cruises include full board (breakfast, lunch, and dinner).</p>',
              de: '<p>Ja, alle unsere Nilkreuzfahrten beinhalten Vollpension (Frühstück, Mittag- und Abendessen).</p>',
              it: '<p>Sì, tutte le nostre crociere sul Nilo includono la pensione completa (colazione, pranzo e cena).</p>'
            }
          }
          ],
          seo: {
            metaTitle: { en: 'Luxury Nile Cruises - 5-Star Experiences', de: 'Luxus-Nilkreuzfahrten - 5-Sterne-Erlebnisse', it: 'Crociere di lusso sul Nilo - Esperienze a 5 stelle' },
            metaDescription: { en: 'Experience the Nile with our 10+ years of excellence.', de: 'Erleben Sie den Nil mit unserer über 10-jährigen Exzellenz.', it: 'Vivi il Nilo con la nostra eccellenza decennale.' },
            metaKeywords: { en: 'Nile Cruise, Luxury, Egypt', de: 'Nilkreuzfahrt, Luxus, Ägypten', it: 'Crociera sul Nilo, Lusso, Egitto' }
          },
        isActive: true,
      },
      {
        name: { en: 'Desert Adventures', de: 'Wüstenabenteuer', it: 'Avventure nel deserto' },
        slug: 'desert-adventures',
        description: {
          en: '<div class="category-description"><h2>Thrilling Desert Safaris</h2><p>Unforgettable desert experiences backed by 10 years of professional guiding.</p></div>',
          de: '<div class="category-description"><h2>Spannende Wüstensafaris</h2><p>Unvergessliche Wüstenerlebnisse, unterstützt durch 10 Jahre professionelle Führung.</p></div>',
          it: '<div class="category-description"><h2>Emozionanti safari nel deserto</h2><p>Esperienze indimenticabili nel deserto, supportate da 10 anni di guida professionale.</p></div>'
        },
        faqs: [
          {
            question: { en: 'Is desert camping safe?', de: 'Ist Camping in der Wüste sicher?', it: 'Il campeggio nel deserto è sicuro?' },
            answer: {
              en: '<p>Yes, our expert guides with 10+ years experience ensure a safe and memorable desert stay.</p>',
              de: '<p>Ja, unsere erfahrenen Guides mit über 10 Jahren Erfahrung sorgen für einen sicheren und unvergesslichen Aufenthalt in der Wüste.</p>',
              it: '<p>Sì, le nostre guide esperte con oltre 10 anni di esperienza garantiscono un soggiorno nel deserto sicuro e memorabile.'
            }
          }
          ],
          seo: {
            metaTitle: { en: 'Desert Adventures Egypt - Safari & Camping', de: 'Wüstenabenteuer Ägypten - Safari & Camping', it: 'Avventure nel deserto Egitto - Safari e campeggio' },
            metaDescription: { en: 'Expert-led desert tours with 10 years of adventure expertise.', de: 'Von Experten geführte Wüstentouren mit 10 Jahren Abenteuererfahrung.', it: 'Tour nel deserto guidati da esperti con 10 anni di esperienza in avventure.' },
            metaKeywords: { en: 'Desert, Safari, Egypt, Camping', de: 'Wüste, Safari, Ägypten, Camping', it: 'Deserto, Safari, Egitto, Campeggio' }
          },
        isActive: true,
      },
    ];

    const categoryMap = new Map<string, mongoose.Types.ObjectId>();
    
    for (const cat of categories) {
      const category = await TourCategory.create(cat);
      categoryMap.set(cat.slug, category._id as mongoose.Types.ObjectId);
      log.success(`Category created: ${(category.name as any).en}`);
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
        name: { en: 'Cairo Tours', de: 'Kairo Touren', it: 'Tour del Cairo' },
        slug: 'cairo-tours',
        category: categoryMap.get('egypt-tours')!,
        description: {
          en: 'Discover the heart of Egypt with our expert Cairo guides (10+ years experience).',
          de: 'Entdecken Sie das Herz Ägyptens mit unseren erfahrenen Kairo-Guides (über 10 Jahre Erfahrung).',
          it: 'Scopri il cuore dell\'Egitto con le nostre esperte guide del Cairo (oltre 10 anni di esperienza).'
        },
        image: { url: sampleImages.cairo, fileName: 'cairo.jpg', title: { en: 'Cairo', de: 'Kairo', it: 'Il Cairo' }, alt: { en: 'Cairo cityscape', de: 'Stadtbild von Kairo', it: 'Panorama del Cairo' } },
        faqs: [
          {
            question: { en: 'How many days do I need for Cairo?', de: 'Wie viele Tage brauche ich für Kairo?', it: 'Quanti giorni mi servono per il Cairo?' },
            answer: {
              en: '<p>We recommend at least 2-3 days to see the main highlights like Pyramids, Museum, and Old Cairo.</p>',
              de: '<p>Wir empfehlen mindestens 2-3 Tage, um die wichtigsten Highlights wie die Pyramiden, das Museum und das alte Kairo zu sehen.</p>',
              it: '<p>Ti consigliamo almeno 2-3 giorni per vedere i principali punti di interesse come le Piramidi, il Museo e la Città Vecchia del Cairo.</p>'
            }
          }
        ],
        seo: {
          metaTitle: { en: 'Cairo Tours - Pyramids & Culture', de: 'Kairo Touren - Pyramiden & Kultur', it: 'Tour del Cairo - Piramidi e cultura' },
          metaDescription: { en: 'Expert Cairo tours with 10+ years of local knowledge.', de: 'Erfahrene Kairo-Touren mit über 10 Jahren lokalem Wissen.', it: 'Tour esperti del Cairo con oltre 10 anni di conoscenza locale.' },
          metaKeywords: { en: 'Cairo, Pyramids, Sphinx, Culture', de: 'Kairo, Pyramiden, Sphinx, Kultur', it: 'Il Cairo, Piramidi, Sfinge, Cultura' }
        },
        isActive: true,
      },
      {
        name: { en: 'Luxor Tours', de: 'Luxor Touren', it: 'Tour di Luxor' },
        slug: 'luxor-tours',
        category: categoryMap.get('egypt-tours')!,
        description: {
          en: 'Uncover the treasures of the world\'s greatest open-air museum.',
          de: 'Entdecken Sie die Schätze des weltgrößten Freilichtmuseums.',
          it: 'Scopri i tesori del più grande museo all\'aperto del mondo.'
        },
        image: { url: sampleImages.luxor, fileName: 'luxor.jpg', title: { en: 'Luxor', de: 'Luxor', it: 'Luxor' }, alt: { en: 'Luxor temples', de: 'Luxor Tempel', it: 'Templi di Luxor' } },
        faqs: [
          {
            question: { en: 'Is the Valley of the Kings included?', de: 'Ist das Tal der Könige inbegriffen?', it: 'La Valle dei Re è inclusa?' },
            answer: {
              en: '<p>Most of our Luxor tours include the Valley of the Kings with 3 tombs.</p>',
              de: '<p>Die meisten unserer Luxor-Touren beinhalten das Tal der Könige mit 3 Gräbern.</p>',
              it: '<p>La maggiorità dei nostri tour di Luxor include la Valle dei Re con 3 tombe.</p>'
            }
          }
        ],
        seo: {
          metaTitle: { en: 'Luxor Tours - Valley of the Kings & Temples', de: 'Luxor Touren - Tal der Könige & Tempel', it: 'Tour di Luxor - Valle dei Re e Templi' },
          metaDescription: { en: 'Explore ancient Thebes with 10+ years experienced guides.', de: 'Erkunden Sie das alte Theben mit erfahrenen Guides.', it: 'Esplora l\'antica Tebe con guide esperte.' },
          metaKeywords: { en: 'Luxor, Valley of the Kings, Karnak, Egypt', de: 'Luxor, Tal der Könige, Karnak, Ägypten', it: 'Luxor, Valle dei Re, Karnak, Egitto' }
        },
        isActive: true,
      },
      {
        name: { en: 'Aswan Tours', de: 'Assuan Touren', it: 'Tour di Assuan' },
        slug: 'aswan-tours',
        category: categoryMap.get('egypt-tours')!,
        description: {
          en: 'Experience the beauty and serenity of the Nile in Aswan.',
          de: 'Erleben Sie die Schönheit und Gelassenheit des Nils in Assuan.',
          it: 'Vivi la bellezza e la serenità del Nilo ad Assuan.'
        },
        image: { url: sampleImages.aswan, fileName: 'aswan.jpg', title: { en: 'Aswan', de: 'Assuan', it: 'Assuan' }, alt: { en: 'Aswan monuments', de: 'Assuan Monumente', it: 'Monumenti di Assuan' } },
        seo: {
          metaTitle: { en: 'Aswan Tours - Philae Temple & High Dam', de: 'Assuan Touren - Philae Tempel & Hochdamm', it: 'Tour di Assuan - Tempio di Philae e Alta Diga' },
          metaDescription: { en: 'Discover Aswan\'s charm with 10+ years local expertise.', de: 'Entdecken Sie den Charme Assuans mit lokaler Expertise.', it: 'Scopri il fascino di Assuan con esperti locali.' },
          metaKeywords: { en: 'Aswan, Philae, Abu Simbel, Nile, Egypt', de: 'Assuan, Philae, Abu Simbel, Nil, Ägypten', it: 'Assuan, Philae, Abu Simbel, Nilo, Egitto' }
        },
        isActive: true,
      },
      {
        name: { en: 'Luxury Cruises', de: 'Luxus-Kreuzfahrten', it: 'Crociere di lusso' },
        slug: 'luxury-cruises',
        category: categoryMap.get('nile-cruises')!,
        description: { en: '5-star Nile cruise experiences.', de: '5-Sterne-Nilkreuzfahrten.', it: 'Esperienze di crociera sul Nilo a 5 stelle.' },
        image: { url: sampleImages.cruise, fileName: 'cruise.jpg', title: { en: 'Cruise', de: 'Kreuzfahrt', it: 'Crociera' }, alt: { en: 'Luxury cruise', de: 'Luxus-Kreuzfahrt', it: 'Crociera di lusso' } },
        seo: {
          metaTitle: { en: 'Luxury Nile Cruises - 5-Star Experience', de: 'Luxus-Nilkreuzfahrten - 5-Sterne-Erlebnis', it: 'Crociere di lusso sul Nilo - Esperienza a 5 stelle' },
          metaDescription: { en: 'Book your luxury Nile cruise with 10+ years of expertise.', de: 'Buchen Sie Ihre Luxus-Nilkreuzfahrt mit über 10 Jahren Erfahrung.', it: 'Prenota la tua crociera di lusso sul Nilo con oltre 10 anni di esperienza.' },
          metaKeywords: { en: 'Luxury Cruise, Nile, Egypt, 5-Star', de: 'Luxuskreuzfahrt, Nil, Ägypten, 5-Sterne', it: 'Crociera di lusso, Nilo, Egitto, 5 stelle' }
        },
        isActive: true,
      },
      {
        name: { en: 'Red Sea Tours', de: 'Touren am Roten Meer', it: 'Tour del Mar Rosso' },
        slug: 'red-sea-tours',
        category: categoryMap.get('egypt-tours')!,
        description: { en: 'Beach and diving adventures.', de: 'Strand- und Tauchabenteuer.', it: 'Avventure in spiaggia e immersioni.' },
        image: { url: sampleImages.redSea, fileName: 'redsea.jpg', title: { en: 'Red Sea', de: 'Rotes Meer', it: 'Mar Rosso' }, alt: { en: 'Red Sea beach', de: 'Strand am Roten Meer', it: 'Spiaggia del Mar Rosso' } },
        seo: {
          metaTitle: { en: 'Red Sea Tours - Diving & Snorkeling', de: 'Rotes Meer Touren - Tauchen & Schnorcheln', it: 'Tour del Mar Rosso - Immersioni e Snorkeling' },
          metaDescription: { en: 'Explore the Red Sea with 10+ years experienced marine guides.', de: 'Erkunden Sie das Rote Meer mit erfahrenen Meeresführern.', it: 'Esplora il Mar Rosso con guide marine esperte.' },
          metaKeywords: { en: 'Red Sea, Diving, Snorkeling, Hurghada, Sharm El Sheikh', de: 'Rotes Meer, Tauchen, Schnorcheln, Hurghada, Sharm El Sheikh', it: 'Mar Rosso, Immersioni, Snorkeling, Hurghada, Sharm El Sheikh' }
        },
        isActive: true,
      },
    ];

    const subcategoryMap = new Map<string, mongoose.Types.ObjectId>();
    
    for (const subcat of subcategories) {
      const subcategory = await TourSubcategory.create(subcat);
      subcategoryMap.set(subcat.slug, subcategory._id as mongoose.Types.ObjectId);
      log.success(`Subcategory created: ${(subcategory.name as any).en}`);
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
        heading: {
          en: 'Private Pyramids of Giza, Sphinx, and Saqqara Day Tour',
          de: 'Private Gizeh-Pyramiden, Sphinx und Sakkara Tagesausflug',
          it: 'Tour privato delle Piramidi di Giza, della Sfinge e di Saqqara'
        },
        slug: 'pyramids-giza-sphinx-saqqara-private-tour',
        Description: {
          header: {
            en: 'The Ultimate Ancient Egypt Experience in One Day',
            de: 'Das ultimative Erlebnis des alten Ägyptens an einem Tag',
            it: 'L\'ultima esperienza dell\'antico Egitto in un giorno'
          },
          text: {
            en: `
              <h3>Overview</h3>
              <p>With over 10 years of experience, we take you on an unforgettable journey through 5,000 years of history. From the colossal Pyramids of Giza to the ancient necropolis of Saqqara, you will witness the evolution of pyramid construction and the grandeur of the Old Kingdom.</p>
              <p>Your expert Egyptologist guide will lead you through the Giza Plateau, where you'll stand in awe of the Great Pyramid of Khufu, the only surviving wonder of the ancient world.</p>
              <h3>Why This Tour?</h3>
              <ul>
                <li><strong>10+ Years Expertise:</strong> Our guides are selected for their deep knowledge and professional service.</li>
                <li><strong>Private & Flexible:</strong> Enjoy a personalized experience with a private vehicle and guide.</li>
                <li><strong>Expert Knowledge:</strong> Learn deep historical context from a licensed Egyptologist.</li>
              </ul>
            `,
            de: `
              <h3>Überblick</h3>
              <p>Mit über 10 Jahren Erfahrung nehmen wir Sie mit auf eine unvergessliche Reise durch 5.000 Jahre Geschichte. Von den kolossalen Pyramiden von Gizeh bis zur alten Nekropole von Sakkara werden Sie die Entwicklung des Pyramidenbaus und die Pracht des Alten Reiches erleben.</p>
              <p>Ihr erfahrener Ägyptologe führt Sie über das Gizeh-Plateau, wo Sie die Große Pyramide von Cheops bewundern können, das einzige erhaltene Weltwunder der Antike.</p>
            `,
            it: `
              <h3>Panoramica</h3>
              <p>Con oltre 10 anni di esperienza, ti accompagniamo in un viaggio indimenticabile attraverso 5.000 anni di storia. Dalle colossali Piramidi di Giza all'antica necropoli di Saqqara, testimonierai l'evoluzione della costruzione delle piramidi e la grandezza dell'Antico Regno.</p>
            `
          },
        },
        images: [
          { url: sampleImages.pyramids, fileName: 'pyramids-hero.jpg', title: { en: 'The Great Pyramids at Sunrise', de: 'Die Großen Pyramiden bei Sonnenaufgang', it: 'Le Grandi Piramidi all\'alba' }, alt: { en: 'Panoramic view of Giza Pyramids', de: 'Panoramablick auf die Pyramiden von Gizeh', it: 'Vista panoramica delle Piramidi di Giza' } },
          { url: sampleImages.sphinx, fileName: 'sphinx-profile.jpg', title: { en: 'The Great Sphinx', de: 'Die Große Sphinx', it: 'La Grande Sfinge' }, alt: { en: 'Side profile of the Sphinx with pyramids in background', de: 'Seitenprofil der Sphinx mit Pyramiden im Hintergrund', it: 'Profilo laterale della Sfinge con le piramidi sullo sfondo' } },
          { url: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800', fileName: 'camel-ride.jpg', title: { en: 'Camel Ride at Giza', de: 'Kamelritt in Gizeh', it: 'Giro in cammello a Giza' }, alt: { en: 'Tourist riding camel with pyramids view', de: 'Tourist reitet Kamel mit Blick auf die Pyramiden', it: 'Turista che cavalca un cammello con vista sulle piramidi' } },
        ],
        gallery: [
          { url: sampleImages.pyramids, fileName: 'pyramid-detail.jpg', title: { en: 'Pyramid Limestone Blocks', de: 'Pyramiden-Kalksteinblöcke', it: 'Blocchi di calcare della piramide' }, alt: { en: 'Close up of massive stones', de: 'Nahaufnahme von massiven Steinen', it: 'Primo piano di pietre massicce' } },
          { url: sampleImages.sphinx, fileName: 'sphinx-front.jpg', title: { en: 'Sphinx Front View', de: 'Sphinx Vorderansicht', it: 'Vista frontale della Sfinge' }, alt: { en: 'Frontal view of Sphinx', de: 'Frontalansicht der Sphinx', it: 'Vista frontale della Sfinge' } },
          { url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', fileName: 'saqqara-step.jpg', title: { en: 'Step Pyramid of Saqqara', de: 'Stufenpyramide von Sakkara', it: 'Piramide a gradoni di Saqqara' }, alt: { en: 'Djoser Step Pyramid', de: 'Djoser-Stufenpyramide', it: 'Piramide a gradoni di Djoser' } },
        ],
        tourLocation: { en: 'Giza & Saqqara, Egypt', de: 'Gizeh & Sakkara, Ägypten', it: 'Giza e Saqqara, Egitto' },
        tourAvailability: { en: 'Every Day (8:00 AM Start)', de: 'Jeden Tag (Beginn 08:00 Uhr)', it: 'Ogni giorno (inizio ore 8:00)' },
        pickupAndDropOff: { en: 'Complimentary pickup and drop-off from any Cairo or Giza hotel.', de: 'Kostenlose Abholung und Rückfahrt von jedem Hotel in Kairo oder Gizeh.', it: 'Ritiro e riconsegna gratuiti da qualsiasi hotel al Cairo o Giza.' },
        tourType: { en: 'Private Day Tour', de: 'Private Tagestour', it: 'Tour privato di un giorno' },
        tourStyle: { en: 'History & Culture', de: 'Geschichte & Kultur', it: 'Storia e cultura' },
        tourHighlights: [
          { en: 'Stand at the foot of the Great Pyramid of Khufu', de: 'Stehen Sie am Fuße der Großen Pyramide von Cheops', it: 'Sosta ai piedi della Grande Piramide di Cheope' },
          { en: '10+ Years experienced Egyptologist guide', de: 'Über 10 Jahre erfahrener Ägyptologe als Guide', it: 'Guida egittologa con oltre 10 anni di esperienza' },
          { en: 'Visit the Valley Temple of Khafre', de: 'Besuchen Sie den Taltempel von Chephren', it: 'Visita il Tempio della Valle di Chefren' },
        ],
        inclusion: [
          { en: 'Private air-conditioned vehicle', de: 'Privates klimatisiertes Fahrzeug', it: 'Veicolo privato con aria condizionata' },
          { en: 'Professional English-speaking guide', de: 'Professioneller deutschsprachiger Guide', it: 'Guida professionale parlante italiano' },
          { en: 'Lunch at local restaurant', de: 'Mittagessen in einem lokalen Restaurant', it: 'Pranzo in un ristorante locale' },
        ],
        exclusion: [
          { en: 'Tipping', de: 'Trinkgelder', it: 'Mance' },
          { en: 'Personal expenses', de: 'Persönliche Ausgaben', it: 'Spese personali' },
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
        duration: { en: '8-9 Hours', de: '8-9 Stunden', it: '8-9 ore' },
        meetingPoint: { en: 'Hotel Lobby', de: 'Hotel-Lobby', it: 'Lobby dell\'hotel' },
        cancellationPolicy: { en: 'Free cancellation up to 24 hours before.', de: 'Kostenlose Stornierung bis zu 24 Stunden vorher.', it: 'Cancellazione gratuita fino a 24 ore prima.' },
        tags: ['Pyramids', 'Giza', 'Saqqara', 'History', 'Private Tour', 'Must-See'],
        itinerary: {
          generalDescription: { en: '<p>A full day itinerary.</p>', de: '<p>Ein ganztägiger Reiseverlauf.</p>', it: '<p>Un itinerario di un\'intera giornata.</p>' },
          days: [
            {
              day: 1,
              title: { en: 'Giza & Saqqara', de: 'Gizeh & Sakkara', it: 'Giza e Saqqara' },
              description: { en: '<p>Explore the pyramids.</p>', de: '<p>Erkunden Sie die Pyramiden.</p>', it: '<p>Esplora le piramidi.</p>' },
              activities: [
                {
                  heading: { en: 'The Great Pyramids', de: 'Die Großen Pyramiden', it: 'Le Grandi Piramidi' },
                  description: { en: '<p>Visit Cheops, Chephren, and Mycerinus.</p>', de: '<p>Besuchen Sie Cheops, Chephren und Mykerinos.</p>', it: '<p>Visita Cheope, Chefren e Micerino.</p>' },
                  image: { url: sampleImages.pyramids, fileName: 'giza-pyramids.jpg' },
                },
              ],
            },
          ],
        },
        faqs: [
          {
            question: { en: 'Is it safe?', de: 'Ist es sicher?', it: 'È sicuro?' },
            answer: { en: '<p>Yes, very safe.</p>', de: '<p>Ja, sehr sicher.</p>', it: '<p>Sì, molto sicuro.</p>' },
          },
        ],
        seo: {
          metaTitle: { en: 'Private Giza Pyramids & Saqqara Day Tour | JES Egypt Tours', de: 'Private Gizeh-Pyramiden & Sakkara Tagesausflug | JES Egypt Tours', it: 'Tour privato delle Piramidi di Giza e Saqqara | JES Egypt Tours' },
          metaDescription: { en: 'Book the best private day tour to Giza Pyramids and Saqqara with 10+ years experience.', de: 'Buchen Sie den besten privaten Tagesausflug zu den Pyramiden von Gizeh und Sakkara mit über 10 Jahren Erfahrung.', it: 'Prenota il miglior tour privato di un giorno alle Piramidi di Giza e Saqqara con oltre 10 anni di esperienza.' },
            metaKeywords: { en: 'Pyramids, Giza, Sphinx, Saqqara, Private Tour', de: 'Pyramiden, Gizeh, Sphinx, Sakkara, Private Tour', it: 'Piramidi, Giza, Sfinge, Saqqara, Tour Privato' }
          },
        isFeatured: true,
        isActive: true,
      },

      // 2. Luxor East and West Bank
      {
        subcategory: subcategoryMap.get('luxor-tours')!,
        idExternal: 'TOUR-002',
        heading: {
          en: 'Luxor Highlights: Valley of the Kings & Karnak Temple',
          de: 'Luxor Highlights: Tal der Könige & Karnak Tempel',
          it: 'Punti salienti di Luxor: Valle dei Re e Tempio di Karnak'
        },
        slug: 'luxor-full-day-east-west-bank',
        Description: {
          header: {
            en: 'The World\'s Greatest Open-Air Museum',
            de: 'Das weltgrößte Freilichtmuseum',
            it: 'Il più grande museo all\'aperto del mondo'
          },
          text: {
            en: '<p>Immerse yourself in the grandeur of ancient Thebes with our expert team (10+ years of local experience).</p>',
            de: '<p>Tauchen Sie ein in die Pracht des alten Theben mit unserem Expertenteam (über 10 Jahre lokale Erfahrung).</p>',
            it: '<p>Immergiti nella grandezza dell\'antica Tebe con il nostro team di esperti (oltre 10 anni di esperienza locale).</p>'
          },
        },
        images: [
          { url: sampleImages.luxor, fileName: 'karnak-hall.jpg', title: { en: 'Great Hypostyle Hall', de: 'Große Säulenhalle', it: 'Grande sala ipostila' }, alt: { en: 'Columns of Karnak', de: 'Säulen von Karnak', it: 'Colonne di Karnak' } },
          { url: sampleImages.temple, fileName: 'hatshepsut.jpg', title: { en: 'Temple of Hatshepsut', de: 'Tempel der Hatschepsut', it: 'Tempio di Hatshepsut' }, alt: { en: 'Mortuary Temple of Hatshepsut', de: 'Totentempel der Hatschepsut', it: 'Tempio mortuario di Hatshepsut' } },
        ],
        tourLocation: { en: 'Luxor, Egypt', de: 'Luxor, Ägypten', it: 'Luxor, Egitto' },
        tourAvailability: { en: 'Daily', de: 'Täglich', it: 'Quotidiano' },
        pickupAndDropOff: { en: 'Included from any Luxor Hotel or Cruise Ship', de: 'Inbegriffen von jedem Hotel oder Kreuzfahrtschiff in Luxor', it: 'Incluso da qualsiasi hotel o nave da crociera a Luxor' },
        tourType: { en: 'Private Day Tour', de: 'Private Tagestour', it: 'Tour privato di un giorno' },
        tourStyle: { en: 'Historical', de: 'Historisch', it: 'Storico' },
        tourHighlights: [
          { en: 'Explore three royal tombs in the Valley of the Kings', de: 'Erkunden Sie drei Königsgräber im Tal der Könige', it: 'Esplora tre tombe reali nella Valle dei Re' },
          { en: '10+ Years of local expertise', de: 'Über 10 Jahre lokale Erfahrung', it: 'Oltre 10 anni di esperienza locale' },
        ],
        inclusion: [
          { en: 'Egyptologist guide', de: 'Ägyptologe als Guide', it: 'Guida egittologa' },
          { en: 'Private transport', de: 'Privater Transport', it: 'Trasporto privato' },
        ],
        exclusion: [
          { en: 'Tipping', de: 'Trinkgelder', it: 'Mance' },
          { en: 'Entry fees', de: 'Eintrittsgelder', it: 'Biglietti d\'ingresso' },
        ],
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
        duration: { en: '8-10 Hours', de: '8-10 Stunden', it: '8-10 ore' },
        itinerary: {
          generalDescription: { en: '<p>A balanced day.</p>', de: '<p>Ein ausgewogener Tag.</p>', it: '<p>Una giornata equilibrata.</p>' },
          days: [
            {
              day: 1,
              title: { en: 'Luxor Discovery', de: 'Luxor Entdeckung', it: 'Scoperta di Luxor' },
              description: { en: '<p>Detailed exploration.</p>', de: '<p>Detaillierte Erkundung.</p>', it: '<p>Esplorazione dettagliata.</p>' },
              activities: [
                {
                  heading: { en: 'Valley of the Kings', de: 'Tal der Könige', it: 'Valle dei Re' },
                  description: { en: '<p>See the painted tombs.</p>', de: '<p>Sehen Sie die bemalten Gräber.</p>', it: '<p>Vedi le tombe dipinte.</p>' },
                  image: { url: sampleImages.luxor, fileName: 'tomb-art.jpg' },
                },
              ],
            },
          ],
        },
        seo: {
          metaTitle: { en: 'Luxor Full Day Tour: Valley of Kings & Karnak', de: 'Luxor Ganztagestour: Tal der Könige & Karnak', it: 'Tour di un\'intera giornata a Luxor: Valle dei Re e Karnak' },
          metaDescription: { en: 'Complete Luxor day tour with 10+ years experience.', de: 'Komplette Luxor-Tagestour mit über 10 Jahren Erfahrung.', it: 'Tour completo di un giorno a Luxor con oltre 10 anni di esperienza.' },
          metaKeywords: { en: 'Luxor, Valley of the Kings, Karnak, Egypt, Tour', de: 'Luxor, Tal der Könige, Karnak, Ägypten, Tour', it: 'Luxor, Valle dei Re, Karnak, Egitto, Tour' }
        },
        isFeatured: true,
        isActive: true,
      },

      // 3. 14 Days Best of Egypt
      {
        subcategory: subcategoryMap.get('cairo-tours')!,
        idExternal: 'TOUR-003',
        heading: {
          en: '14 Days Trip to the Best of Egypt',
          de: '14 Tage Trip - Das Beste von Ägypten',
          it: 'Viaggio di 14 giorni nel meglio dell\'Egitto'
        },
        slug: '14-days-trip-best-egypt',
        Description: {
          header: {
            en: 'Live the True Adventure',
            de: 'Erleben Sie das wahre Abenteuer',
            it: 'Vivi la vera avventura'
          },
          text: {
            en: '<p>Experience the ultimate 2-week journey across Egypt with our 10+ years of local expertise. From the Pyramids to the Nile and the Red Sea.</p>',
            de: '<p>Erleben Sie die ultimative 2-wöchige Reise durch Ägypten mit unserer über 10-jährigen lokalen Erfahrung. Von den Pyramiden bis zum Nil und dem Roten Meer.</p>',
            it: '<p>Vivi l\'ultimo viaggio di 2 settimane in Egitto con la nostra oltre decennale esperienza locale. Dalle Piramidi al Nilo e al Mar Rosso.</p>'
          },
        },
        images: [
          { url: sampleImages.pyramids, fileName: 'giza-pano.jpg', title: { en: 'Giza Pyramids', de: 'Pyramiden von Gizeh', it: 'Piramidi di Giza' }, alt: { en: 'Giza Pyramids Panorama', de: 'Panorama der Pyramiden von Gizeh', it: 'Panorama delle Piramidi di Giza' } },
          { url: sampleImages.nile, fileName: 'nile-cruise.jpg', title: { en: 'Nile Cruise', de: 'Nilkreuzfahrt', it: 'Crociera sul Nilo' }, alt: { en: 'Luxury Nile Cruise', de: 'Luxuriöse Nilkreuzfahrt', it: 'Crociera di lusso sul Nilo' } },
          { url: sampleImages.redSea, fileName: 'hurghada-beach.jpg', title: { en: 'Hurghada Red Sea', de: 'Hurghada Rotes Meer', it: 'Hurghada Mar Rosso' }, alt: { en: 'Red Sea Beach', de: 'Strand am Roten Meer', it: 'Spiaggia del Mar Rosso' } },
        ],
        tourLocation: { en: 'Cairo - Luxor - Aswan - Hurghada', de: 'Kairo - Luxor - Assuan - Hurghada', it: 'Il Cairo - Luxor - Assuan - Hurghada' },
        tourAvailability: { en: 'Every Day', de: 'Täglich', it: 'Ogni giorno' },
        pickupAndDropOff: { en: 'Airport transfers included', de: 'Flughafentransfers inbegriffen', it: 'Trasferimenti aeroportuali inclusi' },
        tourType: { en: 'Private Tour Package', de: 'Private Rundreise', it: 'Pacchetto tour privato' },
        tourStyle: { en: 'Culture & Relaxation', de: 'Kultur & Entspannung', it: 'Cultura e relax' },
        tourHighlights: [
          { en: 'Visit the Giza Pyramids & Sphinx', de: 'Besuch der Pyramiden von Gizeh & Sphinx', it: 'Visita le Piramidi di Giza e la Sfinge' },
          { en: '10+ Years of excellence in guiding', de: 'Über 10 Jahre Exzellenz in der Führung', it: 'Oltre 10 anni di eccellenza nella guida' },
        ],
        inclusion: [
          { en: 'All transfers by private AC vehicle', de: 'Alle Transfers im privaten klimatisierten Fahrzeug', it: 'Tutti i trasferimenti con veicolo privato AC' },
          { en: 'Professional English/German/Italian guide', de: 'Professioneller Guide (D/E/I)', it: 'Guida professionale (I/E/T)' },
        ],
        exclusion: [
          { en: 'Flight tickets', de: 'Flugtickets', it: 'Biglietti aerei' },
          { en: 'Entry fees for main sites', de: 'Eintrittsgelder für Hauptstätten', it: 'Biglietti per i siti principali' },
        ],
        pricingPlans: [{ planName: 'AFFORDABLE', seasons: [{ seasonName: 'All Year', startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), prices: { solo: 2046, pax_2_4: 1950, pax_5_8: 1850, pax_9_16: 1800 } }] }],
        priceStartingFrom: 2046,
        duration: { en: '14 Days / 13 Nights', de: '14 Tage / 13 Nächte', it: '14 giorni / 13 notti' },
        itinerary: {
          generalDescription: { en: '<p>A complete 2-week journey.</p>', de: '<p>Eine komplette 2-wöchige Reise.</p>', it: '<p>Un viaggio completo di 2 settimane.</p>' },
          days: [{ day: 1, title: { en: 'Arrival', de: 'Ankunft', it: 'Arrivo' }, description: { en: '<p>Welcome to Cairo.</p>', de: '<p>Willkommen in Kairo.</p>', it: '<p>Benvenuti al Cairo.</p>' }, activities: [] }]
        },
        seo: {
          metaTitle: { en: '14 Days Best of Egypt Tour Package', de: '14 Tage Das Beste von Ägypten Reisepaket', it: 'Pacchetto tour 14 giorni il meglio dell\'Egitto' },
          metaDescription: { en: 'Experience Egypt for 2 weeks with our professional guides (10+ years).', de: 'Erleben Sie Ägypten für 2 Wochen mit unseren professionellen Guides.', it: 'Vivi l\'Egitto per 2 settimane con le nostre guide professioniste.' },
          metaKeywords: { en: 'Egypt, Cairo, Luxor, Aswan, Hurghada, 14 Days, Tour', de: 'Ägypten, Kairo, Luxor, Assuan, Hurghada, 14 Tage, Tour', it: 'Egitto, Il Cairo, Luxor, Assuan, Hurghada, 14 Giorni, Tour' }
        },
        isActive: true,
        isFeatured: true,
      },

      // 4. Hurghada Snorkeling
      {
        subcategory: subcategoryMap.get('red-sea-tours')!,
        idExternal: 'TOUR-004',
        heading: {
          en: 'Giftun Island Snorkeling Trip with Lunch',
          de: 'Giftun Island Schnorchelausflug mit Mittagessen',
          it: 'Escursione di snorkeling all\'isola di Giftun con pranzo'
        },
        slug: 'hurghada-giftun-island-snorkeling',
        Description: {
          header: {
            en: 'Paradise Island Adventure',
            de: 'Abenteuer auf der Paradiesinsel',
            it: 'Avventura sull\'isola del paradiso'
          },
          text: {
            en: '<p>Explore the Red Sea with our 10+ years experienced marine guides.</p>',
            de: '<p>Erkunden Sie das Rote Meer mit unseren über 10 Jahre erfahrenen Meeresguides.</p>',
            it: '<p>Esplora il Mar Rosso con le nostre guide marine con oltre 10 anni di esperienza.</p>'
          },
        },
        images: [
          { url: sampleImages.redSea, fileName: 'details-coral.jpg', title: { en: 'Red Sea Corals', de: 'Korallen im Roten Meer', it: 'Coralli del Mar Rosso' }, alt: { en: 'Colorful coral reef', de: 'Farbenfrohes Korallenriff', it: 'Barriera corallina colorata' } },
        ],
        tourLocation: { en: 'Hurghada', de: 'Hurghada', it: 'Hurghada' },
        tourAvailability: { en: 'Daily', de: 'Täglich', it: 'Ogni giorno' },
        pricingPlans: [{ planName: 'AFFORDABLE', seasons: [{ seasonName: 'All Year', startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), prices: { solo: 45, pax_2_4: 35, pax_5_8: 30, pax_9_16: 25 } }] }],
        priceStartingFrom: 25,
        duration: { en: '7 Hours', de: '7 Stunden', it: '7 ore' },
        inclusion: [
          { en: 'Snorkeling equipment', de: 'Schnorchelausrüstung', it: 'Attrezzatura da snorkeling' },
          { en: 'Lunch and soft drinks', de: 'Mittagessen und Erfrischungsgetränke', it: 'Pranzo e bevande analcoliche' },
        ],
        exclusion: [
          { en: 'Tipping', de: 'Trinkgelder', it: 'Mance' },
          { en: 'National Park fees ($5 per person)', de: 'Nationalpark-Gebühren ($5 pro Person)', it: 'Tasse del Parco Nazionale ($5 a persona)' },
        ],
        seo: {
          metaTitle: { en: 'Giftun Island Snorkeling | Hurghada Red Sea', de: 'Giftun Island Schnorcheln | Hurghada Rotes Meer', it: 'Snorkeling all\'isola di Giftun | Hurghada Mar Rosso' },
          metaDescription: { en: 'Discover Red Sea corals with experts (10+ years experience).', de: 'Entdecken Sie Korallen im Roten Meer mit Experten.', it: 'Scopri i coralli del Mar Rosso con esperti.' },
          metaKeywords: { en: 'Red Sea, Snorkeling, Hurghada, Giftun Island', de: 'Rotes Meer, Schnorcheln, Hurghada, Giftun Insel', it: 'Mar Rosso, Snorkeling, Hurghada, Isola di Giftun' }
        },
        isActive: true,
      },

      // 5. Islamic Cairo
      {
        subcategory: subcategoryMap.get('cairo-tours')!,
        idExternal: 'TOUR-005',
        heading: {
          en: 'Old Cairo & Islamic Heritage Walking Tour',
          de: 'Alt-Kairo & Islamischer Rundgang',
          it: 'Tour a piedi del Cairo Vecchio e dell\'eredità islamica'
        },
        slug: 'islamic-coptic-cairo-private-tour',
        Description: {
          header: { en: 'Medieval History', de: 'Mittelalterliche Geschichte', it: 'Storia medievale' },
          text: { en: '<p>Expert-led tour with 10 years experience.</p>', de: '<p>Von Experten geführte Tour mit 10 Jahren Erfahrung.</p>', it: '<p>Tour guidato da esperti con 10 anni di esperienza.</p>' },
        },
        images: [{ url: sampleImages.cairo, fileName: 'muizz-street.jpg', title: { en: 'Al-Muizz Street', de: 'Al-Muizz Straße', it: 'Via Al-Muizz' }, alt: { en: 'Historic street Cairo', de: 'Historische Straße Kairo', it: 'Strada storica del Cairo' } }],
        tourLocation: { en: 'Cairo', de: 'Kairo', it: 'Il Cairo' },
        inclusion: [
          { en: 'Expert guide', de: 'Experte als Guide', it: 'Guida esperta' },
          { en: 'Walking tour', de: 'Rundgang', it: 'Tour a piedi' },
        ],
        exclusion: [
          { en: 'Tipping', de: 'Trinkgelder', it: 'Mance' },
          { en: 'Entry fees', de: 'Eintrittsgelder', it: 'Biglietti d\'ingresso' },
        ],
        pricingPlans: [{ planName: 'AFFORDABLE', seasons: [{ seasonName: 'All Year', startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), prices: { solo: 80, pax_2_4: 55, pax_5_8: 45, pax_9_16: 40 } }] }],
        duration: { en: '6-7 Hours', de: '6-7 Stunden', it: '6-7 ore' },
        seo: {
          metaTitle: { en: 'Old Cairo & Islamic Heritage Walk', de: 'Alt-Kairo & Islamisches Erbe Rundgang', it: 'Passeggiata nel Cairo Vecchio e nell\'eredità islamica' },
          metaDescription: { en: 'Medieval Cairo history with 10 years experienced guides.', de: 'Geschichte des mittelalterlichen Kairo mit erfahrenen Guides.', it: 'Storia del Cairo medievale con guide esperte.' },
          metaKeywords: { en: 'Old Cairo, Islamic Cairo, Heritage, Walking Tour', de: 'Alt-Kairo, Islamisches Kairo, Erbe, Rundgang', it: 'Cairo Vecchio, Cairo Islamico, Eredità, Tour a piedi' }
        },
        isActive: true,
      },

      // 6. Aswan Abu Simbel
      {
        subcategory: subcategoryMap.get('aswan-tours')!,
        idExternal: 'TOUR-006',
        heading: {
          en: 'Aswan & Abu Simbel Private Day Tour',
          de: 'Privater Tagesausflug nach Assuan & Abu Simbel',
          it: 'Tour privato di un giorno ad Assuan e Abu Simbel'
        },
        slug: 'aswan-abu-simbel-day-tour',
        Description: {
          header: { en: 'Giants of the South', de: 'Giganten des Südens', it: 'Giganti del Sud' },
          text: { en: '<p>10+ years expertise in southern tours.</p>', de: '<p>Über 10 Jahre Erfahrung in südlichen Touren.</p>', it: '<p>Oltre 10 anni di esperienza nei tour del sud.</p>' },
        },
        images: [{ url: sampleImages.aswan, fileName: 'abusimbel-main.jpg', title: { en: 'Abu Simbel Facade', de: 'Abu Simbel Fassade', it: 'Facciata di Abu Simbel' }, alt: { en: 'Four statues of Ramses', de: 'Vier Statuen von Ramses', it: 'Quattro statue di Ramses' } }],
        tourLocation: { en: 'Aswan/Abu Simbel', de: 'Assuan/Abu Simbel', it: 'Assuan/Abu Simbel' },
        inclusion: [
          { en: 'Private transport', de: 'Privater Transport', it: 'Trasporto privato' },
          { en: 'Lunch', de: 'Mittagessen', it: 'Pranzo' },
        ],
        exclusion: [
          { en: 'Tipping', de: 'Trinkgelder', it: 'Mance' },
          { en: 'Entry fees', de: 'Eintrittsgelder', it: 'Biglietti d\'ingresso' },
        ],
        duration: { en: '10-11 Hours', de: '10-11 Stunden', it: '10-11 ore' },
        pricingPlans: [{ planName: 'AFFORDABLE', seasons: [{ seasonName: 'All Year', startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), prices: { solo: 180, pax_2_4: 130, pax_5_8: 115, pax_9_16: 100 } }] }],
        seo: {
          metaTitle: { en: 'Aswan & Abu Simbel Private Day Tour', de: 'Assuan & Abu Simbel Privattour', it: 'Tour privato di un giorno ad Assuan e Abu Simbel' },
          metaDescription: { en: 'Visit the giants of the south with 10+ years experts.', de: 'Besuchen Sie die Giganten des Südens mit Experten.', it: 'Visita i giganti del sud con esperti.' },
          metaKeywords: { en: 'Aswan, Abu Simbel, Private Tour, Egypt', de: 'Assuan, Abu Simbel, Privattour, Ägypten', it: 'Assuan, Abu Simbel, Tour Privato, Egitto' }
        },
        isActive: true,
        isFeatured: true,
      },

      // 7. White Desert
      {
        subcategory: subcategoryMap.get('cairo-tours')!,
        idExternal: 'TOUR-007',
        heading: {
          en: '2-Day White Desert Camping Adventure',
          de: '2-tägiges Wüstencamping-Abenteuer',
          it: 'Avventura in campeggio nel deserto bianco di 2 giorni'
        },
        slug: 'white-desert-camping-2-days',
        Description: {
          header: { en: 'A Night Under the Galaxy', de: 'Eine Nacht unter der Galaxie', it: 'Una notte sotto la galassia' },
          text: { en: '<p>Safely camp with guides having 10+ years experience.</p>', de: '<p>Sicher campen mit Guides, die über 10 Jahre Erfahrung haben.</p>', it: '<p>Campeggia in sicurezza con guide che hanno oltre 10 anni di esperienza.</p>' },
        },
        images: [{ url: sampleImages.desert, fileName: 'white-desert-night.jpg', title: { en: 'Camping under stars', de: 'Camping unter Sternen', it: 'Campeggio sotto le stelle' }, alt: { en: 'Tent in White Desert', de: 'Zelt in der Weißen Wüste', it: 'Tenda nel deserto bianco' } }],
        tourLocation: { en: 'Bahariya Oasis', de: 'Bahariya Oase', it: 'Oasi di Bahariya' },
        inclusion: [
          { en: 'Camping gear', de: 'Campingausrüstung', it: 'Attrezzatura da campeggio' },
          { en: 'Meals and water', de: 'Mahlzeiten und Wasser', it: 'Pasti e acqua' },
        ],
        exclusion: [
          { en: 'Tipping', de: 'Trinkgelder', it: 'Mance' },
          { en: 'National Park fees', de: 'Nationalpark-Gebühren', it: 'Tasse del Parco Nazionale' },
        ],
        duration: { en: '2 Days / 1 Night', de: '2 Tage / 1 Nacht', it: '2 giorni / 1 notte' },
        pricingPlans: [{ planName: 'AFFORDABLE', seasons: [{ seasonName: 'All Year', startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), prices: { solo: 250, pax_2_4: 160, pax_5_8: 140, pax_9_16: 130 } }] }],
        seo: {
          metaTitle: { en: 'White Desert Camping Adventure | 2-Day Tour', de: 'Wüstencamping-Abenteuer | 2-Tage-Tour', it: 'Avventura in campeggio nel deserto bianco | Tour di 2 giorni' },
          metaDescription: { en: 'Unforgettable camping in the White Desert with 10+ years experience.', de: 'Unvergessliches Camping in der Weißen Wüste.', it: 'Campeggio indimenticabile nel deserto bianco.' },
          metaKeywords: { en: 'White Desert, Camping, Bahariya Oasis, Adventure', de: 'Weiße Wüste, Camping, Oase Bahariya, Abenteuer', it: 'Deserto Bianco, Campeggio, Oasi di Bahariya, Avventura' }
        },
        isActive: true,
      },

      // 8. Alexandria
      {
        subcategory: subcategoryMap.get('cairo-tours')!,
        idExternal: 'TOUR-008',
        heading: {
          en: 'Alexandria Day Trip: The Pearl of the Mediterranean',
          de: 'Alexandria Tagesausflug: Perle des Mittelmeers',
          it: 'Escursione di un giorno ad Alessandria: la perla del Mediterraneo'
        },
        slug: 'alexandria-day-tour-from-cairo',
        Description: {
          header: { en: 'Greco-Roman History', de: 'Griechisch-römische Geschichte', it: 'Storia greco-romana' },
          text: { en: '<p>Discover Alexandria with our 10+ years experienced guides.</p>', de: '<p>Entdecken Sie Alexandria mit unseren Guides, die über 10 Jahre Erfahrung haben.', it: '<p>Scopri Alessandria con le nostre guide con oltre 10 anni di esperienza.' },
        },
        images: [{ url: sampleImages.cairo, fileName: 'alex-citadel.jpg', title: { en: 'Qaitbay Citadel', de: 'Qaitbay-Zitadelle', it: 'Cittadella di Qaitbay' }, alt: { en: 'Fortress by the sea', de: 'Festung am Meer', it: 'Fortezza sul mare' } }],
        tourLocation: { en: 'Alexandria', de: 'Alexandria', it: 'Alessandria' },
        inclusion: [
          { en: 'Private transport', de: 'Privater Transport', it: 'Trasporto privato' },
          { en: 'Expert guide', de: 'Experte als Guide', it: 'Guida esperta' },
        ],
        exclusion: [
          { en: 'Tipping', de: 'Trinkgelder', it: 'Mance' },
          { en: 'Lunch', de: 'Mittagessen', it: 'Pranzo' },
        ],
        duration: { en: '10-11 Hours', de: '10-11 Stunden', it: '10-11 ore' },
        pricingPlans: [{ planName: 'AFFORDABLE', seasons: [{ seasonName: 'All Year', startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), prices: { solo: 130, pax_2_4: 90, pax_5_8: 80, pax_9_16: 70 } }] }],
        seo: {
          metaTitle: { en: 'Alexandria Day Trip from Cairo', de: 'Alexandria Tagesausflug von Kairo', it: 'Escursione di un giorno ad Alessandria dal Cairo' },
          metaDescription: { en: 'Discover the Pearl of the Mediterranean with expert guides.', de: 'Entdecken Sie die Perle des Mittelmeers.', it: 'Scopri la perla del Mediterraneo.' },
          metaKeywords: { en: 'Alexandria, Cairo, Day Trip, History', de: 'Alexandria, Kairo, Tagesausflug, Geschichte', it: 'Alessandria, Il Cairo, Escursione, Storia' }
        },
        isActive: true,
      },

      // 9. Memphis Saqqara
      {
        subcategory: subcategoryMap.get('cairo-tours')!,
        idExternal: 'TOUR-009',
        heading: {
          en: 'Half-Day Saqqara & Memphis Tour',
          de: 'Halbtagesausflug Sakkara & Memphis',
          it: 'Tour di mezza giornata a Saqqara e Menfi'
        },
        slug: 'saqqara-memphis-half-day',
        Description: {
          header: { en: 'Ancient Origins', de: 'Antike Ursprünge', it: 'Origini antiche' },
          text: { en: '<p>Compact tour with professional expertise (10+ years).</p>', de: '<p>Kompakte Tour mit professioneller Kompetenz (über 10 Jahre).</p>', it: '<p>Tour compatto con competenza professionale (oltre 10 anni).</p>' },
        },
        images: [{ url: sampleImages.pyramids, fileName: 'memphis-statue.jpg', title: { en: 'Ramses II Statue', de: 'Ramses II Statue', it: 'Statua di Ramses II' }, alt: { en: 'Colossus of Ramses', de: 'Koloss von Ramses', it: 'Colosso di Ramses' } }],
        tourLocation: { en: 'Giza', de: 'Gizeh', it: 'Giza' },
        inclusion: [
          { en: 'Private transport', de: 'Privater Transport', it: 'Trasporto privato' },
          { en: 'Expert guide', de: 'Experte als Guide', it: 'Guida esperta' },
        ],
        exclusion: [
          { en: 'Tipping', de: 'Trinkgelder', it: 'Mance' },
          { en: 'Entry fees', de: 'Eintrittsgelder', it: 'Biglietti d\'ingresso' },
        ],
        duration: { en: '5 Hours', de: '5 Stunden', it: '5 ore' },
        pricingPlans: [{ planName: 'AFFORDABLE', seasons: [{ seasonName: 'All Year', startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), prices: { solo: 70, pax_2_4: 50, pax_5_8: 45, pax_9_16: 40 } }] }],
        seo: {
          metaTitle: { en: 'Saqqara & Memphis Half-Day Tour', de: 'Sakkara & Memphis Halbtagestour', it: 'Tour di mezza giornata a Saqqara e Menfi' },
          metaDescription: { en: 'Compact ancient Egypt tour with professional expertise.', de: 'Antike Ägypten-Tour mit professioneller Kompetenz.', it: 'Tour dell\'antico Egitto con competenza professionale.' },
          metaKeywords: { en: 'Saqqara, Memphis, Ancient Egypt, Half-Day Tour', de: 'Sakkara, Memphis, Altes Ägypten, Halbtagestour', it: 'Saqqara, Menfi, Antico Egitto, Tour di mezza giornata' }
        },
        isActive: true,
      },

      // 10. Felucca
      {
        subcategory: subcategoryMap.get('aswan-tours')!,
        idExternal: 'TOUR-010',
        heading: {
          en: 'Sunset Felucca Ride & Nubian Village',
          de: 'Sonnenuntergang Feluka-Fahrt & Nubisches Dorf',
          it: 'Giro in feluca al tramonto e villaggio nubiano'
        },
        slug: 'aswan-felucca-nubian-culture',
        Description: {
          header: { en: 'Sail and Smile', de: 'Segeln und Lächeln', it: 'Vela e sorriso' },
          text: { en: '<p>Traditional experience with 10+ years of excellence.</p>', de: '<p>Traditionelles Erlebnis mit über 10 Jahren Exzellenz.</p>', it: '<p>Esperienza tradizionale con oltre 10 anni di eccellenza.</p>' },
        },
        images: [{ url: sampleImages.nile, fileName: 'nubian-house.jpg', title: { en: 'Nubian House', de: 'Nubisches Haus', it: 'Casa nubiana' }, alt: { en: 'Colorful Nubian village', de: 'Buntes nubisches Dorf', it: 'Colorato villaggio nubiano' } }],
        tourLocation: { en: 'Aswan', de: 'Assuan', it: 'Assuan' },
        inclusion: [
          { en: 'Felucca ride', de: 'Felluckenfahrt', it: 'Giro in feluca' },
          { en: 'Village visit', de: 'Dorfbesuch', it: 'Visita al villaggio' },
        ],
        exclusion: [
          { en: 'Tipping', de: 'Trinkgelder', it: 'Mance' },
          { en: 'Drinks', de: 'Getränke', it: 'Bevande' },
        ],
        duration: { en: '3-4 Hours', de: '3-4 Stunden', it: '3-4 ore' },
        pricingPlans: [{ planName: 'AFFORDABLE', seasons: [{ seasonName: 'All Year', startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), prices: { solo: 45, pax_2_4: 30, pax_5_8: 25, pax_9_16: 20 } }] }],
        seo: {
          metaTitle: { en: 'Sunset Felucca Ride & Nubian Village', de: 'Sonnenuntergang Feluka-Fahrt & Nubisches Dorf', it: 'Giro in feluca al tramonto e villaggio nubiano' },
          metaDescription: { en: 'Traditional Nile experience with 10+ years excellence.', de: 'Traditionelles Nil-Erlebnis mit Exzellenz.', it: 'Esperienza tradizionale sul Nilo con eccellenza.' },
          metaKeywords: { en: 'Aswan, Felucca, Nubian Village, Nile, Sunset', de: 'Assuan, Feluka, Nubisches Dorf, Nil, Sonnenuntergang', it: 'Assuan, Feluca, Villaggio Nubiano, Nilo, Tramonto' }
        },
        isActive: true,
      }
    ];

    let createdCount = 0;
    for (const tourData of tours) {
      const tour = await Tour.create(tourData);
      createdCount++;
        log.success(`Tour ${createdCount}/${tours.length}: ${tour.heading.en}`);
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
