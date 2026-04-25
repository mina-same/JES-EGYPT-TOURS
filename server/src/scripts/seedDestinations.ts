import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Destination from '../models/Destination';
import Blog from '../models/Blog';

// Load environment variables
dotenv.config();

const seedDestinations = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected to MongoDB');

    // Clear existing destination data
    await Destination.deleteMany({});
    console.log('🗑️  Cleared existing destination data');

    // Get some blogs to feature (optional, but requested "full details")
    const blogs = await Blog.find({ status: 'published' }).limit(5);
    const blogIds = blogs.map(b => b._id);

    const destinationsData = [
      {
        name: { en: 'Cairo', de: 'Kairo', it: 'Il Cairo', es: 'El Cairo' },
        slug: { en: 'cairo', de: 'kairo', it: 'il-cairo', es: 'el-cairo' },
        subheader: { 
          en: 'The Triumphant City: Where Ancient Wonders Meet Modern Vitality',
          de: 'Die triumphale Stadt: Wo antike Wunder auf moderne Vitalität treffen',
          it: 'La Città Trionfante: Dove le Meraviglie Antiche incontrano la Vitalità Moderna',
          es: 'La ciudad triunfante: donde las maravillas antiguas se encuentran con la vitalidad moderna'
        },
        description: {
          en: 'Cairo, Egypt’s sprawling capital, is set on the Nile River. At its heart is Tahrir Square and the vast Egyptian Museum, a trove of antiquities including royal mummies and gilded King Tutankhamun artifacts.',
          de: 'Kairo, Ägyptens weitläufige Hauptstadt, liegt am Nil. In ihrem Herzen befindet sich der Tahrir-Platz und das riesige Ägyptische Museum.',
          it: 'Il Cairo, la tentacolare capitale dell\'Egitto, sorge sul fiume Nilo. Al suo centro si trova Piazza Tahrir e il vasto Museo Egizio.',
          es: 'El Cairo, la extensa capital de Egipto, se encuentra a orillas del río Nilo. En su corazón está la plaza Tahrir y el vasto Museo Egipcio.'
        },
        region: { en: 'Lower Egypt', de: 'Unterägypten', it: 'Basso Egitto', es: 'Bajo Egipto' },
        coverImage: {
          url: 'https://images.unsplash.com/photo-1541165995349-4293442a1c61?w=1600&q=80',
          fileName: 'cairo-skyline.jpg',
          alt: { en: 'Skyline of Cairo at night with the Nile River' }
        },
        heroTitle: { en: 'Explore the Heart of Egypt', de: 'Erkunden Sie das Herz Ägyptens', it: 'Esplora il Cuore dell\'Egitto', es: 'Explora el Corazón de Egipto' },
        heroDescription: {
          en: ['Vibrant Markets', 'Ancient Citadel', 'Islamic Architecture', 'Nile Views'],
          de: ['Lebhafte Märkte', 'Antike Zitadelle', 'Islamische Architektur', 'Nilblick'],
          it: ['Mercati vivaci', 'Antica Cittadella', 'Architettura islamica', 'Vista sul Nilo'],
          es: ['Mercados vibrantes', 'Antigua Ciudadela', 'Arquitectura islámica', 'Vistas del Nilo']
        },
        bestFor: { en: 'History Buffs, City Explorers, Foodies', de: 'Geschichtsliebhaber, Stadterkunder, Feinschmecker', it: 'Appassionati di storia, esploratori urbani, amanti del cibo', es: 'Aficionados a la historia, exploradores urbanos, amantes de la comida' },
        combinesWith: { en: 'Giza, Alexandria, Luxor', de: 'Gizeh, Alexandria, Luxor', it: 'Giza, Alessandria, Luxor', es: 'Guiza, Alejandría, Luxor' },
        timeNeeded: { en: '3-4 Days', de: '3-4 Tage', it: '3-4 Giorni', es: '3-4 Días' },
        bestSeason: { en: 'October to April', de: 'Oktober bis April', it: 'Da ottobre ad aprile', es: 'De octubre a abril' },
        featuredBlogsSectionTitle: { en: 'Cairo Insights', de: 'Kairo Einblicke', it: 'Approfondimenti sul Cairo', es: 'Perspectivas de El Cairo' },
        featuredBlogs: blogIds,
        faqs: [
          {
            question: { en: 'Is Cairo safe for tourists?', de: 'Ist Kairo für Touristen sicher?', it: 'Il Cairo è sicuro per i turisti?', es: '¿Es El Cairo seguro para los turistas?' },
            answer: { en: 'Yes, Cairo is generally safe for tourists, but it is always recommended to stay in well-known areas and follow local advice.', de: 'Ja, Kairo ist im Allgemeinen sicher für Touristen.', it: 'Sì, il Cairo è generalmente sicuro per i turisti.', es: 'Sí, El Cairo es generalmente seguro para los turistas.' }
          }
        ],
        metaTitle: { en: 'Visit Cairo | Ultimate Travel Guide to Egypt\'s Capital', de: 'Besuchen Sie Kairo', it: 'Visita il Cairo', es: 'Visita El Cairo' },
        metaDescription: { en: 'Discover the best things to do in Cairo, from the Egyptian Museum to the Citadel of Saladin.', de: 'Entdecken Sie die besten Aktivitäten in Kairo.', it: 'Scopri le migliori cose da fare al Cairo.', es: 'Descubre las mejores cosas que hacer en El Cairo.' }
      },
      {
        name: { en: 'Giza', de: 'Gizeh', it: 'Giza', es: 'Guiza' },
        slug: { en: 'giza', de: 'gizeh', it: 'giza', es: 'guiza' },
        subheader: { 
          en: 'Home of the Last Standing Ancient Wonder',
          de: 'Heimat des letzten erhaltenen antiken Weltwunders',
          it: 'Sede dell\'Ultima Meraviglia Antica Rimasta',
          es: 'Hogar de la última maravilla antigua que queda en pie'
        },
        description: {
          en: 'Giza is home to the Giza Plateau, the site of the iconic Great Pyramids, the Sphinx, and several other ancient monuments. It is the quintessential symbol of ancient Egyptian civilization.',
          de: 'Gizeh beherbergt das Gizeh-Plateau, den Ort der ikonischen Großen Pyramiden und der Sphinx.',
          it: 'Giza ospita l\'altopiano di Giza, il sito delle iconiche Grandi Piramidi e della Sfinge.',
          es: 'Guiza es el hogar de la meseta de Guiza, el sitio de las icónicas Grandes Pirámides y la Esfinge.'
        },
        region: { en: 'Greater Cairo', de: 'Großraum Kairo', it: 'Grande Cairo', es: 'Gran Cairo' },
        coverImage: {
          url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=1600&q=80',
          fileName: 'giza-pyramids.jpg',
          alt: { en: 'The Great Pyramids of Giza under a blue sky' }
        },
        heroTitle: { en: 'Walk Among Giants', de: 'Wandeln Sie unter Riesen', it: 'Cammina tra i Giganti', es: 'Camina entre Gigantes' },
        heroDescription: {
          en: ['The Great Pyramid', 'The Great Sphinx', 'Solar Boat Museum', 'Camel Rides'],
          de: ['Die Große Pyramide', 'Die Große Sphinx', 'Sonnenboot-Museum', 'Kamelreiten'],
          it: ['La Grande Piramide', 'La Grande Sfinge', 'Museo della Barca Solare', 'Giri in cammello'],
          es: ['La Gran Pirámide', 'La Gran Esfinge', 'Museo del Barco Solar', 'Paseos en camello']
        },
        bestFor: { en: 'Archaeology Lovers, Icon Seekers', de: 'Archäologieliebhaber, Ikonsucher', it: 'Amanti dell\'archeologia, cercatori di icone', es: 'Amantes de la arqueología, buscadores de iconos' },
        combinesWith: { en: 'Cairo, Saqqara, Memphis', de: 'Kairo, Saqqara, Memphis', it: 'Il Cairo, Saqqara, Menfi', es: 'El Cairo, Saqqara, Menfis' },
        timeNeeded: { en: '1 Full Day', de: '1 ganzer Tag', it: '1 Giorno intero', es: '1 Día completo' },
        bestSeason: { en: 'Spring and Autumn', de: 'Frühling und Herbst', it: 'Primavera e Autunno', es: 'Primavera y Otoño' },
        metaTitle: { en: 'Giza Pyramids Guide | Visit the Sphinx & Pyramids', de: 'Gizeh Pyramiden Leitfaden', it: 'Guida alle Piramidi di Giza', es: 'Guía de las Pirámides de Guiza' }
      },
      {
        name: { en: 'Luxor', de: 'Luxor', it: 'Luxor', es: 'Luxor' },
        slug: { en: 'luxor', de: 'luxor', it: 'luxor', es: 'luxor' },
        subheader: { 
          en: 'The World’s Greatest Open-Air Museum',
          de: 'Das größte Freilichtmuseum der Welt',
          it: 'Il Più Grande Museo a Cielo Aperto del Mondo',
          es: 'El museo al aire libre más grande del mundo'
        },
        description: {
          en: 'Luxor is a city on the east bank of the Nile River in southern Egypt. It\'s on the site of ancient Thebes, the pharaohs\' capital at the height of their power, during the 16th–11th centuries B.C.',
          de: 'Luxor ist eine Stadt am Ostufer des Nils in Südägypten. Sie liegt an der Stelle des antiken Theben.',
          it: 'Luxor è una città sulla sponda orientale del fiume Nilo, nel sud dell\'Egitto. Sorge sul sito dell\'antica Tebe.',
          es: 'Luxor es una ciudad en la orilla este del río Nilo en el sur de Egipto. Está en el sitio de la antigua Tebas.'
        },
        region: { en: 'Upper Egypt', de: 'Oberägypten', it: 'Alto Egitto', es: 'Alto Egipto' },
        coverImage: {
          url: 'https://images.unsplash.com/photo-1544274411-a7af6d1211fe?w=1600&q=80',
          fileName: 'luxor-temple.jpg',
          alt: { en: 'Luxor Temple pillars at sunset' }
        },
        heroTitle: { en: 'Discover Ancient Thebes', de: 'Entdecken Sie das antike Theben', it: 'Scopri l\'antica Tebe', es: 'Descubre la antigua Tebas' },
        heroDescription: {
          en: ['Karnak Temple', 'Valley of the Kings', 'Luxor Temple', 'Hot Air Balloons'],
          de: ['Karnak-Tempel', 'Tal der Könige', 'Luxor-Tempel', 'Heißluftballons'],
          it: ['Tempio di Karnak', 'Valle dei Re', 'Tempio di Luxor', 'Mongolfiere'],
          es: ['Templo de Karnak', 'Valle de los Reyes', 'Templo de Luxor', 'Globos aerostáticos']
        },
        bestFor: { en: 'History, Photography, River Cruises', de: 'Geschichte, Fotografie, Flusskreuzfahrten', it: 'Storia, Fotografia, Crociere fluviali', es: 'Historia, Fotografía, Cruceros fluviales' },
        combinesWith: { en: 'Aswan, Edfu, Kom Ombo', de: 'Assuan, Edfu, Kom Ombo', it: 'Assuan, Edfu, Kom Ombo', es: 'Asuán, Edfu, Kom Ombo' },
        timeNeeded: { en: '2-3 Days', de: '2-3 Tage', it: '2-3 Giorni', es: '2-3 Días' },
        bestSeason: { en: 'Winter (Nov-Feb)', de: 'Winter (Nov-Feb)', it: 'Inverno (Nov-Feb)', es: 'Invierno (Nov-Feb)' },
        metaTitle: { en: 'Visit Luxor | Valley of the Kings & Karnak Guide', de: 'Besuchen Sie Luxor', it: 'Visita Luxor', es: 'Visita Luxor' }
      },
      {
        name: { en: 'Aswan', de: 'Assuan', it: 'Assuan', es: 'Asuán' },
        slug: { en: 'aswan', de: 'assuan', it: 'assuan', es: 'asuan' },
        subheader: { 
          en: 'Egypt\'s Sunniest Southern Gem',
          de: 'Ägyptens sonnigstes Juwel im Süden',
          it: 'La Gemma del Sud più Soleggiata dell\'Egitto',
          es: 'La joya del sur más soleada de Egipto'
        },
        description: {
          en: 'Aswan is a city on the Nile River, has been southern Egypt’s strategic and commercial gateway since antiquity. It contains significant archaeological sites like the Philae temple complex.',
          de: 'Assuan ist eine Stadt am Nil und seit der Antike Ägyptens Tor zum Süden.',
          it: 'Assuan è una città sul fiume Nilo, sin dall\'antichità porta strategica e commerciale dell\'Egitto meridionale.',
          es: 'Asuán es una ciudad en el río Nilo, ha sido la puerta de entrada estratégica y comercial del sur de Egipto desde la antigüedad.'
        },
        region: { en: 'Upper Egypt', de: 'Oberägypten', it: 'Alto Egitto', es: 'Alto Egipto' },
        coverImage: {
          url: 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=1600&q=80',
          fileName: 'aswan-nile.jpg',
          alt: { en: 'Felucca sailboats on the Nile in Aswan' }
        },
        heroTitle: { en: 'Tranquility on the Nile', de: 'Ruhe am Nil', it: 'Tranquillità sul Nilo', es: 'Tranquilidad en el Nilo' },
        heroDescription: {
          en: ['Philae Temple', 'Nubian Village', 'Abu Simbel (Excursion)', 'Unfinished Obelisk'],
          de: ['Philae-Tempel', 'Nubisches Dorf', 'Abu Simbel (Ausflug)', 'Unvollendeter Obelisk'],
          it: ['Tempio di Philae', 'Villaggio Nubiano', 'Abu Simbel (Escursione)', 'Obelisco incompiuto'],
          es: ['Templo de Philae', 'Pueblo Nubio', 'Abu Simbel (Excursión)', 'Obelisco inacabado']
        },
        bestFor: { en: 'Relaxation, Culture, Nubian Heritage', de: 'Entspannung, Kultur, nubisches Erbe', it: 'Relax, Cultura, Patrimonio Nubiano', es: 'Relajación, Cultura, Patrimonio Nubio' },
        combinesWith: { en: 'Luxor, Abu Simbel, Kom Ombo', de: 'Luxor, Abu Simbel, Kom Ombo', it: 'Luxor, Abu Simbel, Kom Ombo', es: 'Luxor, Abu Simbel, Kom Ombo' },
        timeNeeded: { en: '2 Days', de: '2 Tage', it: '2 Giorni', es: '2 Días' },
        bestSeason: { en: 'Winter', de: 'Winter', it: 'Inverno', es: 'Invierno' },
        metaTitle: { en: 'Aswan Travel Guide | Philae Temple & Nubian Culture', de: 'Assuan Reiseführer', it: 'Guida di viaggio di Assuan', es: 'Guía de viaje de Asuán' }
      },
      {
        name: { en: 'Alexandria', de: 'Alexandria', it: 'Alessandria', es: 'Alejandría' },
        slug: { en: 'alexandria', de: 'alexandria', it: 'alessandria', es: 'alejandria' },
        subheader: { 
          en: 'The Pearl of the Mediterranean',
          de: 'Die Perle des Mittelmeers',
          it: 'La Perla del Mediterraneo',
          es: 'La perla del Mediterráneo'
        },
        description: {
          en: 'Alexandria is a Mediterranean port city in Egypt. During the Hellenistic period, it was home to a lighthouse ranking among the Seven Wonders of the Ancient World as well as a storied library.',
          de: 'Alexandria ist eine mediterrane Hafenstadt in Ägypten.',
          it: 'Alessandria è una città portuale mediterranea in Egitto.',
          es: 'Alejandría es una ciudad portuaria mediterránea en Egipto.'
        },
        region: { en: 'Mediterranean Coast', de: 'Mittelmeerküste', it: 'Costa Mediterranea', es: 'Costa del Mediterráneo' },
        coverImage: {
          url: 'https://images.unsplash.com/photo-1568283046733-49bf77e46702?w=1600&q=80',
          fileName: 'alexandria-citadel.jpg',
          alt: { en: 'Citadel of Qaitbay in Alexandria' }
        },
        heroTitle: { en: 'Greco-Roman Elegance', de: 'Griechisch-römische Eleganz', it: 'Eleganza Greco-Romana', es: 'Elegancia grecorromana' },
        heroDescription: {
          en: ['Bibliotheca Alexandrina', 'Qaitbay Citadel', 'Montaza Palace', 'Catacombs'],
          de: ['Bibliotheca Alexandrina', 'Qaitbay-Zitadelle', 'Montaza-Palast', 'Katakomben'],
          it: ['Bibliotheca Alexandrina', 'Cittadella di Qaitbay', 'Palazzo Montaza', 'Catacombe'],
          es: ['Bibliotheca Alexandrina', 'Ciudadela de Qaitbay', 'Palacio Montaza', 'Catacumbas']
        },
        bestFor: { en: 'Seafood, Architecture, Coastal Vibes', de: 'Meeresfrüchte, Architektur, Küstenflair', it: 'Pesce, Architettura, Atmosfera costiera', es: 'Mariscos, Arquitectura, Vibras costeras' },
        combinesWith: { en: 'Cairo, Marsa Matruh', de: 'Kairo, Marsa Matruh', it: 'Il Cairo, Marsa Matruh', es: 'El Cairo, Marsa Matruh' },
        timeNeeded: { en: '1-2 Days', de: '1-2 Tage', it: '1-2 Giorni', es: '1-2 Días' },
        bestSeason: { en: 'Summer (for sea breeze) or Autumn', de: 'Sommer oder Herbst', it: 'Estate o Autunno', es: 'Verano u Otoño' },
        metaTitle: { en: 'Alexandria Guide | Mediterranean Heritage in Egypt', de: 'Alexandria Reiseführer', it: 'Guida di Alessandria', es: 'Guía de Alejandría' }
      },
      {
        name: { en: 'Sharm El Sheikh', de: 'Scharm El-Scheich', it: 'Sharm El Sheikh', es: 'Sharm El Sheikh' },
        slug: { en: 'sharm-el-sheikh', de: 'scharm-el-scheich', it: 'sharm-el-sheikh', es: 'sharm-el-sheikh' },
        subheader: { 
          en: 'The City of Peace & World-Class Diving',
          de: 'Die Stadt des Friedens und Weltklasse-Tauchen',
          it: 'La Città della Pace e Immersioni di Classe Mondiale',
          es: 'La ciudad de la paz y el buceo de clase mundial'
        },
        description: {
          en: 'Sharm El Sheikh is an Egyptian resort town between the desert of the Sinai Peninsula and the Red Sea. It\'s known for its sheltered sandy beaches, clear waters and coral reefs.',
          de: 'Scharm El-Scheich ist eine ägyptische Ferienstadt zwischen der Wüste der Sinai-Halbinsel und dem Roten Meer.',
          it: 'Sharm El Sheikh è una località turistica egiziana tra il deserto della penisola del Sinai e il Mar Rosso.',
          es: 'Sharm El Sheikh es una ciudad turística egipcia entre el deserto de la península del Sinaí y el Mar Rojo.'
        },
        region: { en: 'South Sinai', de: 'Süd-Sinai', it: 'Sinai del Sud', es: 'Sinaí del Sur' },
        coverImage: {
          url: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1600&q=80',
          fileName: 'sharm-red-sea.jpg',
          alt: { en: 'Coral reefs and turquoise water in Sharm El Sheikh' }
        },
        heroTitle: { en: 'Red Sea Paradise', de: 'Paradies am Roten Meer', it: 'Paradiso del Mar Rosso', es: 'Paraíso del Mar Rojo' },
        heroDescription: {
          en: ['Ras Mohammed National Park', 'Scuba Diving', 'Luxury Resorts', 'Nightlife'],
          de: ['Ras-Mohammed-Nationalpark', 'Gerätetauchen', 'Luxusresorts', 'Nachtleben'],
          it: ['Parco Nazionale Ras Mohammed', 'Immersioni subacquee', 'Resort di lusso', 'Vita notturna'],
          es: ['Parque Nacional Ras Mohammed', 'Buceo', 'Resorts de lujo', 'Vida nocturna']
        },
        bestFor: { en: 'Diving, Beach Lovers, Honeymooners', de: 'Tauchen, Strandliebhaber, Hochzeitsreisende', it: 'Immersioni, Amanti della spiaggia, Viaggi di nozze', es: 'Buceo, Amantes de la playa, Recién casados' },
        combinesWith: { en: 'Dahab, Cairo, St. Catherine', de: 'Dahab, Kairo, St. Katharina', it: 'Dahab, Il Cairo, Santa Caterina', es: 'Dahab, El Cairo, Santa Catalina' },
        timeNeeded: { en: '4-7 Days', de: '4-7 Tage', it: '4-7 Giorni', es: '4-7 Días' },
        bestSeason: { en: 'Year-round (Best: Oct-Nov, Mar-May)', de: 'Ganzjährig', it: 'Tutto l\'anno', es: 'Todo el año' },
        metaTitle: { en: 'Sharm El Sheikh Travel Guide | Red Sea Diving & Resorts', de: 'Scharm El-Scheich Reiseführer', it: 'Guida di Sharm El Sheikh', es: 'Guía de Sharm El Sheikh' }
      },
      {
        name: { en: 'Hurghada', de: 'Hurghada', it: 'Hurghada', es: 'Hurghada' },
        slug: { en: 'hurghada', de: 'hurghada', it: 'hurghada', es: 'hurghada' },
        subheader: { 
          en: 'Red Sea Riviera: Beaches & Adventure',
          de: 'Rote Meer Riviera: Strände und Abenteuer',
          it: 'Riviera del Mar Rosso: Spiagge e Avventura',
          es: 'Riviera del Mar Rojo: playas y aventura'
        },
        description: {
          en: 'Hurghada is a beach resort town stretching some 40km along Egypt’s Red Sea coast. It’s renowned for scuba diving, and has numerous dive shops and schools in its modern Sekalla district.',
          de: 'Hurghada ist ein Badeort, der sich etwa 40 km entlang der ägyptischen Rotmeerküste erstreckt.',
          it: 'Hurghada è una località balneare che si estende per circa 40 km lungo la costa egiziana del Mar Rosso.',
          es: 'Hurghada es una ciudad turística de playa que se extiende unos 40 km a lo largo de la costa del Mar Rojo en Egipto.'
        },
        region: { en: 'Red Sea Coast', de: 'Rotmeerküste', it: 'Costa del Mar Rosso', es: 'Costa del Mar Rojo' },
        coverImage: {
          url: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=1600&q=80',
          fileName: 'hurghada-beach.jpg',
          alt: { en: 'White sand beach in Hurghada' }
        },
        heroTitle: { en: 'Endless Sunshine', de: 'Endloser Sonnenschein', it: 'Sole Infinito', es: 'Sol infinito' },
        heroDescription: {
          en: ['Giftun Islands', 'Desert Safari', 'El Gouna (Nearby)', 'Snorkeling'],
          de: ['Giftun-Inseln', 'Wüstensafari', 'El Gouna (in der Nähe)', 'Schnorcheln'],
          it: ['Isole Giftun', 'Safari nel deserto', 'El Gouna (Nelle vicinanze)', 'Snorkeling'],
          es: ['Islas Giftun', 'Safari por el desierto', 'El Gouna (Cerca)', 'Esnórquel']
        },
        bestFor: { en: 'Families, Water Sports, Desert Adventures', de: 'Familien, Wassersport, Wüstenabenteuer', it: 'Famiglie, Sport acquatici, Avventure nel deserto', es: 'Familias, Deportes acuáticos, Aventuras en el desierto' },
        combinesWith: { en: 'Luxor, Marsa Alam, El Gouna', de: 'Luxor, Marsa Alam, El Gouna', it: 'Luxor, Marsa Alam, El Gouna', es: 'Luxor, Marsa Alam, El Gouna' },
        timeNeeded: { en: '3-5 Days', de: '3-5 Tage', it: '3-5 Giorni', es: '3-5 Días' },
        bestSeason: { en: 'Spring and Autumn', de: 'Frühling und Herbst', it: 'Primavera e Autunno', es: 'Primavera y Otoño' },
        metaTitle: { en: 'Hurghada Holidays | Diving, Snorkeling & Resorts', de: 'Hurghada Urlaub', it: 'Vacanze a Hurghada', es: 'Vacaciones en Hurghada' }
      },
      {
        name: { en: 'Siwa Oasis', de: 'Oase Siwa', it: 'Oasi di Siwa', es: 'Oasis de Siwa' },
        slug: { en: 'siwa-oasis', de: 'oase-siwa', it: 'oasi-di-siwa', es: 'oasis-de-siwa' },
        subheader: { 
          en: 'A Hidden Paradise in the Great Sand Sea',
          de: 'Ein verstecktes Paradies im Großen Sandmeer',
          it: 'Un Paradiso Nascosto nel Grande Mare di Sabbia',
          es: 'Un paraíso escondido en el Gran Mar de Arena'
        },
        description: {
          en: 'Siwa Oasis is an urban oasis in Egypt between the Qattara Depression and the Great Sand Sea in the Western Desert. It is one of Egypt\'s most isolated settlements and home to the Oracle of Amun.',
          de: 'Die Oase Siwa ist eine städtische Oase in Ägypten zwischen der Qattara-Senke und dem Großen Sandmeer.',
          it: 'L\'Oasi di Siwa è un\'oasi urbana in Egitto tra la Depressione di Qattara e il Grande Mare di Sabbia.',
          es: 'El oasis de Siwa es un oasis urbano en Egipto entre la depresión de Qattara y el Gran Mar de Arena.'
        },
        region: { en: 'Western Desert', de: 'Westliche Wüste', it: 'Deserto Occidentale', es: 'Desierto Occidental' },
        coverImage: {
          url: 'https://images.unsplash.com/photo-1590059002624-6593096a74c1?w=1600&q=80',
          fileName: 'siwa-oasis.jpg',
          alt: { en: 'Ancient fortress of Shali in Siwa Oasis' }
        },
        heroTitle: { en: 'Off the Beaten Path', de: 'Abseits der ausgetretenen Pfade', it: 'Fuori dai sentieri battuti', es: 'Fuera de los caminos trillados' },
        heroDescription: {
          en: ['Cleopatra\'s Bath', 'Oracle Temple', 'Shali Fortress', 'Salt Lakes'],
          de: ['Cleopatra-Bad', 'Orakel-Tempel', 'Schali-Festung', 'Salzseen'],
          it: ['Bagno di Cleopatra', 'Tempio dell\'Oracolo', 'Fortezza di Shali', 'Laghi salati'],
          es: ['Baño de Cleopatra', 'Templo del Oráculo', 'Fortaleza de Shali', 'Lagos de sal']
        },
        bestFor: { en: 'Adventure, Eco-Tourism, Mysticism', de: 'Abenteuer, Ökotourismus, Mystik', it: 'Avventura, Ecoturismo, Misticismo', es: 'Aventura, Ecoturismo, Misticismo' },
        combinesWith: { en: 'Marsa Matruh, Bahariya Oasis', de: 'Marsa Matruh, Oase Bahariya', it: 'Marsa Matruh, Oasi di Bahariya', es: 'Marsa Matruh, Oasis de Bahariya' },
        timeNeeded: { en: '3 Days', de: '3 Tage', it: '3 Giorni', es: '3 Días' },
        bestSeason: { en: 'October to March', de: 'Oktober bis März', it: 'Da ottobre a marzo', es: 'De octubre a marzo' },
        metaTitle: { en: 'Siwa Oasis Guide | Discover Egypt\'s Western Desert', de: 'Oase Siwa Reiseführer', it: 'Guida dell\'Oasi di Siwa', es: 'Guía del Oasis de Siwa' }
      },
      {
        name: { en: 'Marsa Alam', de: 'Marsa Alam', it: 'Marsa Alam', es: 'Marsa Alam' },
        slug: { en: 'marsa-alam', de: 'marsa-alam', it: 'marsa-alam', es: 'marsa-alam' },
        subheader: { 
          en: 'Pristine Marine Life & Untouched Reefs',
          de: 'Unberührtes Meeresleben und unberührte Riffe',
          it: 'Vita Marina Incontaminata e Barriere Coralline Intatte',
          es: 'Vida marina prístina y arrecifes vírgenes'
        },
        description: {
          en: 'Marsa Alam is a town in south-eastern Egypt, located on the western shore of the Red Sea. It is currently seeing fast increasing popularity as a tourist destination and development.',
          de: 'Marsa Alam ist eine Stadt im Südosten Ägyptens an der Westküste des Roten Meeres.',
          it: 'Marsa Alam è una città nel sud-est dell\'Egitto, situata sulla costa occidentale del Mar Rosso.',
          es: 'Marsa Alam es una ciudad en el sureste de Egipto, situada en la costa oeste del Mar Rojo.'
        },
        region: { en: 'Red Sea Coast', de: 'Rotmeerküste', it: 'Costa del Mar Rosso', es: 'Costa del Mar Rojo' },
        coverImage: {
          url: 'https://images.unsplash.com/photo-1544274411-a7af6d1211fe?w=1600&q=80',
          fileName: 'marsa-alam-sea.jpg',
          alt: { en: 'Crystal clear water in Marsa Alam' }
        },
        heroTitle: { en: 'Eco-Luxury Diving', de: 'Öko-Luxus-Tauchen', it: 'Immersioni Eco-Lusso', es: 'Buceo de lujo ecológico' },
        heroDescription: {
          en: ['Dugong Sightseeing', 'Abu Dabbab Bay', 'Samadai Reef', 'Quiet Relaxation'],
          de: ['Dugong-Besichtigung', 'Abu-Dabbab-Bucht', 'Samadai-Riff', 'Ruhige Entspannung'],
          it: ['Avvistamento Dugonghi', 'Baia di Abu Dabbab', 'Reef di Samadai', 'Relax tranquillo'],
          es: ['Avistamiento de dugongos', 'Bahía de Abu Dabbab', 'Arrecife Samadai', 'Relajación tranquila']
        },
        bestFor: { en: 'Serious Divers, Nature Lovers, Tranquility', de: 'Ernsthafte Taucher, Naturliebhaber, Ruhe', it: 'Subacquei esperti, Amanti della natura, Tranquillità', es: 'Buceadores serios, Amantes de la naturaleza, Tranquilidad' },
        combinesWith: { en: 'Hurghada, Luxor, Quseir', de: 'Hurghada, Luxor, Quseir', it: 'Hurghada, Luxor, Quseir', es: 'Hurghada, Luxor, Quseir' },
        timeNeeded: { en: '4-6 Days', de: '4-6 Tage', it: '4-6 Giorni', es: '4-6 Días' },
        bestSeason: { en: 'Spring and Autumn', de: 'Frühling und Herbst', it: 'Primavera e Autunno', es: 'Primavera y Otoño' },
        metaTitle: { en: 'Marsa Alam Guide | Diving with Dolphins & Dugongs', de: 'Marsa Alam Reiseführer', it: 'Guida di Marsa Alam', es: 'Guía de Marsa Alam' }
      },
      {
        name: { en: 'Fayoum', de: 'Fayyum', it: 'Faiyum', es: 'Fayún' },
        slug: { en: 'fayoum', de: 'fayyum', it: 'faiyum', es: 'fayun' },
        subheader: { 
          en: 'Wadi El Hitan & Ancient Fossils',
          de: 'Wadi El Hitan und antike Fossilien',
          it: 'Wadi El Hitan e Antichi Fossili',
          es: 'Wadi El Hitan y fósiles antiguos'
        },
        description: {
          en: 'Fayoum is a city in Middle Egypt. Traditionally, it is an oasis, though it is not a true oasis as it depends on Nile water. It is home to the UNESCO World Heritage site, Wadi El Hitan.',
          de: 'Fayyum ist eine Stadt in Mittelägypten.',
          it: 'Faiyum è una città del Medio Egitto.',
          es: 'Fayún es una ciudad en el Medio Egipto.'
        },
        region: { en: 'Middle Egypt', de: 'Mittelägypten', it: 'Medio Egitto', es: 'Egipto Medio' },
        coverImage: {
          url: 'https://images.unsplash.com/photo-1541165995349-4293442a1c61?w=1600&q=80',
          fileName: 'fayoum-lake.jpg',
          alt: { en: 'Magic Lake in Fayoum desert' }
        },
        heroTitle: { en: 'Ancient Natural Wonders', de: 'Antike Naturwunder', it: 'Antiche Meraviglie Naturali', es: 'Antiguas maravillas naturales' },
        heroDescription: {
          en: ['Wadi El Hitan (Whale Valley)', 'Magic Lake', 'Pottery Village', 'Qarun Lake'],
          de: ['Wadi El Hitan (Wal-Tal)', 'Magic Lake', 'Töpferdorf', 'Qarun-See'],
          it: ['Wadi El Hitan (Valle delle Balene)', 'Magic Lake', 'Villaggio della ceramica', 'Lago Qarun'],
          es: ['Wadi El Hitan (Valle de las Ballenas)', 'Magic Lake', 'Pueblo de alfarería', 'Lago Qarun']
        },
        bestFor: { en: 'Paleontology, Camping, Pottery', de: 'Paläontologie, Camping, Töpferei', it: 'Paleontologia, Campeggio, Ceramica', es: 'Paleontología, Camping, Alfarería' },
        combinesWith: { en: 'Cairo, Wadi El Rayan', de: 'Kairo, Wadi El Rayan', it: 'Il Cairo, Wadi El Rayan', es: 'El Cairo, Wadi El Rayan' },
        timeNeeded: { en: '1-2 Days', de: '1-2 Tage', it: '1-2 Giorni', es: '1-2 Días' },
        bestSeason: { en: 'Autumn and Winter', de: 'Herbst und Winter', it: 'Autunno e Inverno', es: 'Otoño e Invierno' },
        metaTitle: { en: 'Fayoum Guide | Explore Whale Valley & Magic Lake', de: 'Fayyum Reiseführer', it: 'Guida di Faiyum', es: 'Guía de Fayún' }
      }
    ];

    for (const data of destinationsData) {
      await Destination.create({
        ...data,
        isActive: true,
        noIndex: false,
        noFollow: false
      });
    }

    console.log(`✅ Successfully seeded ${destinationsData.length} highly detailed destinations`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Destination seeding completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding destinations:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seedDestinations();
