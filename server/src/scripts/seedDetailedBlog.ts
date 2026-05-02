import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Blog from '../models/Blog';
import BlogCategory from '../models/BlogCategory';
import BlogSubCategory from '../models/BlogSubCategory';
import User from '../models/User';
import Destination from '../models/Destination';

// Load environment variables
dotenv.config();

const seedDetailedBlog = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected to MongoDB');

    // Get admin user for blog author
    const admin = await User.findOne({ role: { $in: ['admin', 'superadmin'] } });
    if (!admin) {
      console.log('❌ Admin user not found. Please run seedAdmin first.');
      process.exit(1);
    }

    // Get or create Category
    let category = await BlogCategory.findOne({ 'slug.en': 'travel-guides' });
    if (!category) {
      category = await BlogCategory.create({
        name: { en: 'Travel Guides', de: 'Reiseführer', it: 'Guide di Viaggio', es: 'Guías de Viaje' },
        slug: { en: 'travel-guides', de: 'reisefuehrer', it: 'guide-di-viaggio', es: 'guias-de-viaje' },
        isActive: true,
      });
    }

    // Get or create Subcategory
    let subCategory = await BlogSubCategory.findOne({ 'slug.en': 'itineraries' });
    if (!subCategory) {
      subCategory = await BlogSubCategory.create({
        category: category._id,
        name: { en: 'Itineraries', de: 'Reiseverläufe', it: 'Itinerari', es: 'Itinerarios' },
        slug: { en: 'itineraries', de: 'reiseverlaeufe', it: 'itinerari', es: 'itinerarios' },
        isActive: true,
      });
    }

    // Get a destination if possible
    const destination = await Destination.findOne({ 'slug.en': 'cairo' }) || await Destination.findOne({});

    const blogTitle = {
      en: 'The Ultimate Luxury Egypt Itinerary: A 10-Day Journey Through History',
      de: 'Die ultimative Luxus-Ägypten-Reiseroute: Eine 10-tägige Reise durch die Geschichte',
      it: 'L\'itinerario di lusso definitivo in Egitto: Un viaggio di 10 giorni attraverso la storia',
      es: 'El itinerario definitivo de lujo por Egipto: Un viaje de 10 días a través de la historia'
    };

    const blogSlug = {
      en: 'ultimate-luxury-egypt-itinerary-10-days',
      de: 'ultimative-luxus-aegypten-reiseroute-10-tage',
      it: 'itinerario-lusso-egitto-10-giorni',
      es: 'itinerario-lujo-egipto-10-dias'
    };

    // Clean up existing blog with same slug to avoid duplicate key error
    await Blog.deleteOne({ 'slug.en': blogSlug.en });

    // Create the blog post
    const blog = await Blog.create({
      title: blogTitle,
      slug: blogSlug,
      author: admin._id,
      category: category._id,
      subCategory: subCategory._id,
      destination: destination?._id,
      featuredImage: {
        url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=1600&h=900&fit=crop',
        fileName: 'luxury-egypt-hero.jpg',
        title: { en: 'Aerial view of the Nile in Cairo' },
        alt: { en: 'Luxury travel experience in Egypt showcasing the Nile and Pyramids' },
      },
      excerpt: {
        en: 'Discover how to experience Egypt in absolute luxury. From private viewings of the Sphinx to five-star Nile cruises, this 10-day itinerary covers it all.',
        de: 'Entdecken Sie, wie Sie Ägypten in absolutem Luxus erleben können. Von privaten Besichtigungen der Sphinx bis hin zu Fünf-Sterne-Nilkreuzfahrten.',
        it: 'Scopri come vivere l\'Egitto nel lusso assoluto. Dalle visite private della Sfinge alle crociere sul Nilo a cinque stelle.',
        es: 'Descubre cómo vivir Egipto en el lujo absoluto. Desde visitas privadas a la Esfinge hasta cruceros de cinco estrellas por el Nilo.'
      },
      keyTakeaways: {
        en: [
          'Best time to visit is October to April for luxury travel.',
          'A Dahabiya cruise offers more privacy than large ships.',
          'Private Egyptologist guides are essential for depth.',
          'Book domestic flights in advance to save time.'
        ],
        de: [
          'Die beste Reisezeit ist Oktober bis April.',
          'Eine Dahabiya-Kreuzfahrt bietet mehr Privatsphäre.',
          'Private Ägyptologen-Führer sind unerlässlich.',
          'Inlandsflüge im Voraus buchen.'
        ],
        it: [
          'Il periodo migliore è da ottobre ad aprile.',
          'Una crociera Dahabiya offre più privacy.',
          'Le guide egittologiche private sono essenziali.',
          'Prenota i voli interni in anticipo.'
        ],
        es: [
          'La mejor época es de octubre a abril.',
          'Un crucero Dahabiya ofrece más privacidad.',
          'Los guías egiptólogos privados son esenciales.',
          'Reserve vuelos nacionales con antelación.'
        ]
      },
      summary: {
        en: 'In conclusion, a 10-day luxury trip to Egypt is a transformative experience that combines ancient wonder with modern comfort. By following this curated itinerary, you will witness the highlights of Cairo, Luxor, and Aswan while enjoying the finest hospitality the Land of the Pharaohs has to offer.',
        de: 'Zusammenfassend lässt sich sagen, dass eine 10-tägige Luxusreise nach Ägypten eine transformative Erfahrung ist, die antike Wunder mit modernem Komfort verbindet.',
        it: 'In conclusione, un viaggio di lusso di 10 giorni in Egitto è un\'esperienza trasformativa che unisce meraviglie antiche e comfort moderno.',
        es: 'En conclusión, un viaje de lujo de 10 días a Egipto es una experiencia transformadora que combina maravillas antiguas con confort moderno.'
      },
      contentBlocks: [
        {
          type: 'html',
          title: { en: 'Days 1-3: The Majesty of Cairo' },
          content: {
            en: '<p>Your journey begins in the bustling heart of Egypt. Stay at the legendary Marriott Mena House, where you can wake up to views of the Pyramids from your balcony. Spend your first days exploring the Giza Plateau with a private Egyptologist, visiting the Solar Boat Museum, and enjoying a private dinner under the stars.</p><p>Don\'t miss the Grand Egyptian Museum (GEM), which houses the world\'s most extensive collection of ancient artifacts, including the complete treasures of Tutankhamun.</p>',
            de: '<p>Ihre Reise beginnt im geschäftigen Herzen Ägyptens. Übernachten Sie im legendären Marriott Mena House.</p>',
            it: '<p>Il tuo viaggio inizia nel cuore pulsante dell\'Egitto. Soggiorna al leggendario Marriott Mena House.</p>',
            es: '<p>Su viaje comienza en el corazón de Egipto. Alójese en el legendario Marriott Mena House.</p>'
          }
        },
        {
          type: 'image',
          image: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73b6e?w=1200&h=600&fit=crop',
          alt: { en: 'Great Pyramids at sunset' },
          caption: { en: 'The Great Pyramids of Giza, seen from the Mena House grounds.' }
        },
        {
          type: 'html',
          title: { en: 'Days 4-7: Sailing the Eternal Nile' },
          content: {
            en: '<p>Fly to Luxor and board a private <strong>Dahabiya</strong>. Unlike large cruise ships, a Dahabiya allows you to dock at small islands and ancient sites that are inaccessible to others. Sail towards Aswan, stopping at the Valley of the Kings, the Temple of Hatshepsut, and the beautifully preserved Edfu Temple.</p>',
            de: '<p>Fliegen Sie nach Luxor und gehen Sie an Bord einer privaten Dahabiya.</p>',
            it: '<p>Vola a Luxor e imbarcati su una Dahabiya privata.</p>',
            es: '<p>Vuele a Luxor y suba a bordo de una Dahabiya privada.</p>'
          }
        },
        {
          type: 'blockquote',
          content: {
            en: 'The Nile is the lifeblood of Egypt, and sailing its waters is the only way to truly understand its history.',
            de: 'Der Nil ist das Lebenselixier Ägyptens.',
            it: 'Il Nilo è la linfa vitale dell\'Egitto.',
            es: 'El Nilo es el alma de Egipto.'
          }
        }
      ],
      faqs: [
        {
          question: { en: 'Is it safe to travel to Egypt in 2024?', de: 'Ist es sicher, 2024 nach Ägypten zu reisen?' },
          answer: { en: 'Yes, Egypt remains a top destination with high security in tourist areas. Luxury tours provide additional peace of mind with private transfers.', de: 'Ja, Ägypten bleibt ein Top-Reiseziel.' }
        },
        {
          question: { en: 'What should I pack for a luxury Nile cruise?', de: 'Was sollte ich für eine Luxus-Nilkreuzfahrt einpacken?' },
          answer: { en: 'Light linen clothing for the day and "smart casual" attire for dinners on board. Don\'t forget a hat and high-SPF sunscreen.', de: 'Leichte Leinenkleidung für den Tag.' }
        }
      ],
      metaTitle: { en: '10-Day Luxury Egypt Itinerary | Premium Travel Guide', de: '10-tägige Luxus-Ägypten-Reiseroute', it: 'Itinerario di lusso in Egitto di 10 giorni', es: 'Itinerario de lujo por Egipto de 10 días' },
      metaDescription: { en: 'Plan your dream 10-day luxury trip to Egypt. Expert tips on hotels, cruises, and private tours.', de: 'Planen Sie Ihre Traumreise nach Ägypten.', it: 'Pianifica il tuo viaggio da sogno in Egitto.', es: 'Planifica el viaje de tus sueños a Egipto.' },
      metaKeywords: { en: ['Luxury Egypt', 'Egypt Itinerary', 'Private Tour'], de: ['Luxus Ägypten'], it: ['Egitto di lusso'], es: ['Egipto de lujo'] },
      metaImage: {
        url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=1200&h=630&fit=crop',
        fileName: 'luxury-egypt-meta.jpg',
        alt: { en: 'Luxury Egypt Tour' }
      },
      
      // Open Graph
      ogTitle: { en: 'Experience Egypt in Absolute Luxury' },
      ogDescription: { en: 'A 10-day curated journey through the land of the Pharaohs.' },
      ogImage: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=1200&h=630&fit=crop',
      ogType: 'article',
      
      // Indexing
      noIndex: false,
      noFollow: false,
      
      // Focus Keyword
      focusKeyword: { en: 'luxury egypt itinerary' },
      
      // Breadcrumbs
      breadcrumbs: [
        { name: { en: 'Home' }, url: '/' },
        { name: { en: 'Blog' }, url: '/blogs' },
        { name: { en: 'Luxury Itinerary' }, url: '#' }
      ],
      
      // Analytics
      viewCount: 1250,
      shareCount: 85,
      averageTimeOnPage: 320,
      
      // Comments
      commentsEnabled: true,
      comments: [
        {
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          text: 'This itinerary looks absolutely incredible! I particularly love the idea of a private Dahabiya.',
          isApproved: true,
          createdAt: new Date()
        }
      ],
      
      // Publishing
      status: 'published',
      isFeatured: true,
      publishedAt: new Date(),
      tags: { en: ['Luxury', 'Itinerary', 'Nile Cruise'], de: ['Luxus', 'Reiseverlauf', 'Nilkreuzfahrt'] }
    });

    console.log(`✅ Detailed blog created: ${blog.title.en}`);
    console.log(`🔗 Slug: ${blog.slug.en}`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding detailed blog:', error.message);
    process.exit(1);
  }
};

seedDetailedBlog();
