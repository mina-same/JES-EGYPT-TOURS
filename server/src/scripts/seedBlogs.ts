import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Blog from '../models/Blog';
import BlogCategory from '../models/BlogCategory';
import BlogSubCategory from '../models/BlogSubCategory';
import User from '../models/User';

// Load environment variables
dotenv.config();

const seedBlogs = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected to MongoDB');

    // Get admin user for blog author
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ Admin user not found. Please run seedAdmin first.');
      process.exit(1);
    }

    // Clear existing blog data
    await Blog.deleteMany({});
    await BlogCategory.deleteMany({});
    await BlogSubCategory.deleteMany({});
    console.log('🗑️  Cleared existing blog data');

    // ===== CREATE CATEGORIES =====
    const catTravelGuides = await BlogCategory.create({
      name: { en: 'Travel Guides', de: 'Reiseführer', it: 'Guide di Viaggio', es: 'Guías de Viaje' },
      slug: { en: 'travel-guides', de: 'reisefuehrer', it: 'guide-di-viaggio', es: 'guias-de-viaje' },
      description: { 
        en: 'Comprehensive travel guides to help you plan your perfect trip to Egypt.', 
        de: 'Umfassende Reiseführer, die Ihnen bei der Planung Ihrer perfekten Reise nach Ägypten helfen.', 
        it: 'Guide di viaggio complete per aiutarti a pianificare il tuo viaggio perfetto in Egitto.', 
        es: 'Guías de viaje completas para ayudarlo a planificar su viaje perfecto a Egipto.' 
      },
      isActive: true,
      metaTitle: { en: 'Egypt Travel Guides', de: 'Ägypten Reiseführer', it: 'Guide di Viaggio in Egitto', es: 'Guías de Viaje a Egipto' },
      metaDescription: { en: 'Expert travel guides for Egypt.', de: 'Experten-Reiseführer für Ägypten.', it: 'Guide di viaggio esperte per l\'Egitto.', es: 'Guías de viaje de expertos para Egipto.' },
    });

    const catHistory = await BlogCategory.create({
      name: { en: 'History & Culture', de: 'Geschichte & Kultur', it: 'Storia e Cultura', es: 'Historia y Cultura' },
      slug: { en: 'history-culture', de: 'geschichte-kultur', it: 'storia-cultura', es: 'historia-cultura' },
      description: { 
        en: 'Dive deep into the rich history and vibrant culture of ancient and modern Egypt.', 
        de: 'Tauchen Sie tief in die reiche Geschichte und lebendige Kultur des antiken und modernen Ägypten ein.', 
        it: 'Immergiti nella ricca storia e nella vibrante cultura dell\'Egitto antico e moderno.', 
        es: 'Sumérgete profundamente en la rica historia y la vibrante cultura del Egipto antiguo y moderno.' 
      },
      isActive: true,
      metaTitle: { en: 'Egyptian History and Culture', de: 'Ägyptische Geschichte und Kultur', it: 'Storia e Cultura Egiziana', es: 'Historia y Cultura Egipcia' },
      metaDescription: { en: 'Explore the history.', de: 'Erkunden Sie die Geschichte.', it: 'Esplora la storia.', es: 'Explora la historia.' },
    });

    // ===== CREATE SUBCATEGORIES =====
    const subTips = await BlogSubCategory.create({
      category: catTravelGuides._id,
      name: { en: 'Travel Tips', de: 'Reisetipps', it: 'Consigli di Viaggio', es: 'Consejos de Viaje' },
      slug: { en: 'travel-tips', de: 'reisetipps', it: 'consigli-di-viaggio', es: 'consejos-de-viaje' },
      isActive: true,
      metaTitle: { en: 'Travel Tips', de: 'Reisetipps', it: 'Consigli di Viaggio', es: 'Consejos de Viaje' },
    });

    const subAncientSites = await BlogSubCategory.create({
      category: catHistory._id,
      name: { en: 'Ancient Sites', de: 'Antike Stätten', it: 'Siti Antichi', es: 'Sitios Antiguos' },
      slug: { en: 'ancient-sites', de: 'antike-staetten', it: 'siti-antichi', es: 'sitios-antiguos' },
      isActive: true,
      metaTitle: { en: 'Ancient Sites', de: 'Antike Stätten', it: 'Siti Antichi', es: 'Sitios Antiguos' },
    });

    const subFood = await BlogSubCategory.create({
      category: catHistory._id,
      name: { en: 'Food & Cuisine', de: 'Essen & Kulinarik', it: 'Cibo e Cucina', es: 'Comida y Gastronomía' },
      slug: { en: 'food-cuisine', de: 'essen-kulinarik', it: 'cibo-cucina', es: 'comida-gastronomia' },
      isActive: true,
      metaTitle: { en: 'Egyptian Food', de: 'Ägyptisches Essen', it: 'Cibo Egiziano', es: 'Comida Egipcia' },
    });

    // ===== CREATE BLOG POSTS =====
    
    // Blog 1: The Great Pyramids
    const blog1 = await Blog.create({
      title: { 
        en: 'The Ultimate Guide to Exploring the Great Pyramids of Giza', 
        de: 'Der ultimative Leitfaden zur Erkundung der Großen Pyramiden von Gizeh', 
        it: 'La guida definitiva per esplorare le Grandi Piramidi di Giza', 
        es: 'La guía definitiva para explorar las Grandes Pirámides de Guiza' 
      },
      slug: { 
        en: 'ultimate-guide-great-pyramids-giza', 
        de: 'ultimativer-leitfaden-pyramiden-gizeh', 
        it: 'guida-definitiva-grandi-piramidi-giza', 
        es: 'guia-definitiva-grandes-piramides-guiza' 
      },
      subCategory: subAncientSites._id,
      author: admin._id,
      featuredImage: {
        url: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73b6e?w=1200&h=600&fit=crop',
        fileName: 'pyramids-giza.jpg',
        title: { en: 'Great Pyramids of Giza at Sunset' },
        alt: { en: 'Great Pyramids of Giza at sunset showcasing the Sphinx' },
      },
      excerpt: { 
        en: 'Everything you need to know about visiting the magnificent Pyramids of Giza, from the best time to go to insider tips for avoiding the crowds.', 
        de: 'Alles, was Sie wissen müssen, um die herrlichen Pyramiden von Gizeh zu besuchen, von der besten Reisezeit bis zu Insider-Tipps, um die Massen zu vermeiden.', 
        it: 'Tutto ciò che devi sapere sulla visita alle magnifiche Piramidi di Giza, dal momento migliore per andare ai consigli per evitare la folla.', 
        es: 'Todo lo que necesita saber sobre visitar las magníficas Pirámides de Guiza, desde el mejor momento para ir hasta consejos para evitar las multitudes.' 
      },
      contentBlocks: [
        {
          type: 'html',
          content: { 
            en: '<p>Standing tall on the Giza Plateau, just outside of Cairo, the <strong>Great Pyramids of Giza</strong> are the sole surviving monuments of the Seven Wonders of the Ancient World. These immense structures have captivated travelers, historians, and archaeologists for centuries. In this ultimate guide, we will walk you through exactly how you can maximize your visit, ensuring that you witness these ancient marvels in all their glory.</p><h3>Why Visit the Pyramids?</h3><p>The scale of the Pyramids is something that pictures simply cannot convey. Built over 4,500 years ago, the logistics of their construction remain one of history\'s greatest mysteries. The complex houses three main pyramids: Khufu (the Great Pyramid), Khafre, and Menkaure, alongside the enigmatic Sphinx.</p>', 
            de: '<p>Die <strong>Großen Pyramiden von Gizeh</strong> stehen hoch auf dem Gizeh-Plateau und sind die einzigen erhaltenen Denkmäler der Sieben Weltwunder der Antike. In diesem ultimativen Leitfaden zeigen wir Ihnen genau, wie Sie Ihren Besuch maximieren können.</p><h3>Warum die Pyramiden besuchen?</h3><p>Der Maßstab der Pyramiden ist etwas, das Fotos einfach nicht vermitteln können.</p>', 
            it: '<p>Le <strong>Grandi Piramidi di Giza</strong> si ergono sull\'altopiano di Giza e sono l\'unico monumento sopravvissuto delle Sette Meraviglie del Mondo Antico. In questa guida ti mostreremo come massimizzare la tua visita.</p><h3>Perché visitare le Piramidi?</h3><p>La scala delle Piramidi è qualcosa che le foto non riescono a trasmettere.</p>', 
            es: '<p>Las <strong>Grandes Pirámides de Guiza</strong> se erigen en la meseta de Guiza y son los únicos monumentos supervivientes de las Siete Maravillas del Mundo Antiguo. En esta guía, le mostraremos cómo maximizar su visita.</p><h3>¿Por qué visitar las Pirámides?</h3><p>La escala de las Pirámides es algo que las fotos simplemente no pueden transmitir.</p>' 
          },
        },
        {
          type: 'blockquote',
          content: {
            en: 'Man fears time, but time fears the Pyramids.',
            de: 'Der Mensch fürchtet die Zeit, aber die Zeit fürchtet die Pyramiden.',
            it: 'L\'uomo teme il tempo, ma il tempo teme le Piramidi.',
            es: 'El hombre teme al tiempo, pero el tiempo teme a las Pirámides.'
          }
        },
        {
          type: 'html',
          content: {
            en: '<h3>Best Time to Visit</h3><p>To avoid massive tourist crowds and the peak heat of the Egyptian sun, the best time to visit the Pyramids is early morning right when the gates open (around 8:00 AM) or late afternoon just before closing. Spring and autumn offer the most comfortable weather.</p>',
            de: '<h3>Beste Reisezeit</h3><p>Um Menschenmassen zu vermeiden, besuchen Sie die Pyramiden am frühen Morgen oder späten Nachmittag.</p>',
            it: '<h3>Miglior tempo per visitare</h3><p>Per evitare la folla, visita le Piramidi la mattina presto o nel tardo pomeriggio.</p>',
            es: '<h3>Mejor momento para visitar</h3><p>Para evitar las multitudes, visite las Pirámides temprano en la mañana o al final de la tarde.</p>'
          }
        }
      ],
      metaTitle: { en: 'Ultimate Guide to the Great Pyramids of Giza | JES Egypt Tours', de: 'Gizeh Pyramiden Leitfaden', it: 'Guida Piramidi di Giza', es: 'Guía de las Pirámides de Guiza' },
      metaDescription: { en: 'Plan the perfect trip to the Great Pyramids of Giza. Read our full guide on timings, ticket prices, and tips.', de: 'Planen Sie die perfekte Reise zu den Pyramiden von Gizeh.', it: 'Pianifica il viaggio perfetto alle Piramidi di Giza.', es: 'Planifique el viaje perfecto a las Pirámides de Guiza.' },
      tags: { en: ['Pyramids', 'Giza', 'Cairo'], de: ['Pyramiden', 'Gizeh', 'Kairo'], it: ['Piramidi', 'Giza', 'Il Cairo'], es: ['Pirámides', 'Guiza', 'El Cairo'] },
      metaKeywords: { en: ['Great Pyramids', 'Giza', 'Egypt Tourism', 'Cairo tours'], de: ['Großen Pyramiden'], it: ['Grandi Piramidi'], es: ['Grandes Pirámides'] },
      status: 'published',
      isFeatured: true,
      publishedAt: new Date('2024-03-01'),
      focusKeyword: 'great pyramids giza',
      commentsEnabled: true,
      viewCount: 3450,
      readingTime: 6
    });

    // Blog 2: Nile Cruise Experience
    const blog2 = await Blog.create({
      title: { 
        en: 'What to Expect on a Luxury Nile River Cruise', 
        de: 'Was Sie auf einer Luxus-Nilkreuzfahrt erwartet', 
        it: 'Cosa aspettarsi da una lussuosa crociera sul Nilo', 
        es: 'Qué esperar de un crucero de lujo por el Nilo' 
      },
      slug: { 
        en: 'luxury-nile-river-cruise-expectations', 
        de: 'luxus-nilkreuzfahrt-erwartungen', 
        it: 'aspettative-crociera-lusso-nilo', 
        es: 'expectativas-crucero-lujo-nilo' 
      },
      subCategory: subTips._id,
      author: admin._id,
      featuredImage: {
        url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=600&fit=crop',
        fileName: 'nile-cruise.jpg',
        title: { en: 'Luxury Nile River Cruise Ship' },
        alt: { en: 'Luxury Nile River Cruise Ship sailing in Egypt' },
      },
      excerpt: { 
        en: 'Sailing the Nile is a rite of passage for any visitor to Egypt. Discover what life is like on board, the sites you will see, and how to choose the right ship.', 
        de: 'Das Segeln auf dem Nil ist ein Initiationsritus für jeden Ägypten-Besucher. Entdecken Sie das Leben an Bord.', 
        it: 'Navigare sul Nilo è un rito di passaggio per ogni visitatore in Egitto. Scopri com\'è la vita a bordo.', 
        es: 'Navegar por el Nilo es un rito de iniciación para cualquier visitante a Egipto. Descubra cómo es la vida a bordo.' 
      },
      contentBlocks: [
        {
          type: 'html',
          content: { 
            en: '<p>There is no better way to see upper Egypt than gliding along the world’s longest river. A luxury Nile cruise offers an experience that blends the romantic ambiance of passing ancient landscapes with modern, top-tier amenities.</p><h3>Life on Board a Dahabiya or Luxury Ship</h3><p>Traditional floating hotels are common, but for an ultra-premium experience, a <em>Dahabiya</em> (a traditional wooden sailboat) provides absolute exclusivity. You can expect gourmet Egyptian and international dining, afternoon tea on the sun deck to the sound of lapping water, and impeccable service.</p><h3>Key Stops Along the Way</h3><ul><li><strong>Luxor Temple & Karnak:</strong> Massive pillars and avenues of sphinxes.</li><li><strong>Valley of the Kings:</strong> Hidden tombs of the pharaohs including Tutankhamun.</li><li><strong>Edfu & Kom Ombo:</strong> Remarkably preserved temples dedicated to Horus and Sobek.</li><li><strong>Aswan:</strong> The Philae Temple rising from the tranquil waters.</li></ul>', 
            de: '<p>Es gibt keinen besseren Weg, Oberägypten zu sehen, als auf dem Nil zu gleiten. Eine Luxus-Nilkreuzfahrt bietet eine großartige Erfahrung.</p>', 
            it: '<p>Non c\'è modo migliore per vedere l\'Alto Egitto che scivolare lungo il Nilo. Una crociera sul Nilo offre un\'esperienza magnifica.</p>', 
            es: '<p>No hay mejor manera de ver el Alto Egipto que deslizarse por el Nilo. Un crucero por el Nilo ofrece una experiencia increíble.</p>' 
          },
        }
      ],
      metaTitle: { en: 'Luxury Nile Cruise Guide | JES Egypt Tours', de: 'Luxus Nilkreuzfahrt Leitfaden', it: 'Guida Crociera di Lusso sul Nilo', es: 'Guía de Crucero de Lujo por el Nilo' },
      metaDescription: { en: 'Find out what a luxury Nile river cruise in Egypt is really like, from the food to the ancient temples you visit.', de: 'Finden Sie heraus, wie eine Luxus-Nilkreuzfahrt wirklich ist.', it: 'Scopri com\'è davvero una crociera di lusso sul Nilo.', es: 'Descubra cómo es realmente un crucero de lujo por el Nilo.' },
      tags: { en: ['Nile Cruise', 'Luxor', 'Aswan'], de: ['Nilkreuzfahrt', 'Luxor', 'Assuan'], it: ['Crociera sul Nilo', 'Luxor', 'Assuan'], es: ['Crucero por el Nilo', 'Luxor', 'Asuán'] },
      metaKeywords: { en: ['Nile cruise', 'luxury cruise Egypt', 'Luxor to Aswan'], de: ['Nilkreuzfahrt'], it: ['Crociera sul Nilo'], es: ['Crucero por el Nilo'] },
      status: 'published',
      isFeatured: true,
      publishedAt: new Date('2024-03-10'),
      focusKeyword: 'luxury nile cruise',
      commentsEnabled: true,
      viewCount: 4200,
      readingTime: 8
    });

    // Blog 3: Hidden Gems in Luxor
    const blog3 = await Blog.create({
      title: { 
        en: 'Hidden Gems of Luxor: Beyond the Valley of the Kings', 
        de: 'Geheimtipps in Luxor: Jenseits des Tals der Könige', 
        it: 'Gemme nascoste di Luxor: Oltre la Valle dei Re', 
        es: 'Gemas ocultas de Luxor: Más allá del Valle de los Reyes' 
      },
      slug: { 
        en: 'hidden-gems-luxor-beyond-valley-of-kings', 
        de: 'geheimtipps-luxor-jenseits-tal-der-koenige', 
        it: 'gemme-nascoste-luxor-oltre-valle-dei-re', 
        es: 'gemas-ocultas-luxor-mas-alla-valle-de-los-reyes' 
      },
      subCategory: subAncientSites._id,
      author: admin._id,
      featuredImage: {
        url: 'https://images.unsplash.com/photo-1596710642232-05452f1e1ac3?w=1200&h=600&fit=crop',
        fileName: 'karnak-temple.jpg',
        title: { en: 'Karnak Temple in Luxor' },
        alt: { en: 'Massive pillars of Karnak Temple in Luxor' },
      },
      excerpt: { 
        en: 'While the Valley of the Kings steals the spotlight, Luxor’s West Bank harbors incredible hidden monuments that remain crowd-free.', 
        de: 'Während das Tal der Könige das Rampenlicht stiehlt, beherbergt das Westufer von Luxor unglaubliche versteckte Denkmäler.', 
        it: 'Mentre la Valle dei Re ruba la scena, la sponda occidentale di Luxor ospita incredibili monumenti nascosti.', 
        es: 'Mientras que el Valle de los Reyes roba el centro de atención, la orilla oeste de Luxor alberga increíbles monumentos ocultos.' 
      },
      contentBlocks: [
        {
          type: 'html',
          content: { 
            en: '<p>Luxor is often rightfully called the world’s greatest open-air museum. Most tourists queue for the famous tombs in the Valley of the Kings, but just a few miles away lie breathtaking sites where you might be the only visitor.</p><h3>Deir el-Medina: The Workers\' Village</h3><p>Perhaps the most fascinating site on the West Bank is Deir el-Medina. This was the village where the artisans who built the royal tombs lived. Their own tombs are radically different: brightly painted scenes of everyday life, agriculture, and their personal rituals, providing an intimate look at ancient Egyptian society.</p><h3>Medinet Habu</h3><p>Ramses III’s mortuary temple is visually spectacular. Deeply carved reliefs and beautifully preserved original paint on the ceilings make it a photographer’s dream, yet it receives a fraction of the visitors seen at Karnak.</p>', 
            de: '<p>Luxor wird oft als das größte Freilichtmuseum der Welt bezeichnet. Aber abseits der ausgetretenen Pfade gibt es viel zu sehen.</p>', 
            it: '<p>Luxor è spesso definita il più grande museo a cielo aperto del mondo. Ma fuori dai sentieri battuti c\'è molto da vedere.</p>', 
            es: '<p>Luxor a menudo se llama el museo al aire libre más grande del mundo. Pero fuera de los caminos trillados hay mucho que ver.</p>' 
          },
        }
      ],
      metaTitle: { en: 'Hidden Gems of Luxor | Undiscovered Egypt', de: 'Geheimtipps Luxor', it: 'Gemme Nascoste Luxor', es: 'Gemas Ocultas Luxor' },
      metaDescription: { en: 'Discover Deir el-Medina, Medinet Habu, and other amazing sites off the beaten path in Luxor.', de: 'Entdecken Sie unbekannte Orte in Luxor.', it: 'Scopri luoghi sconosciuti a Luxor.', es: 'Descubre lugares desconocidos en Luxor.' },
      tags: { en: ['Luxor', 'Ancient Egypt', 'Temples'], de: ['Luxor', 'Antikes Ägypten', 'Tempel'], it: ['Luxor', 'Antico Egitto', 'Templi'], es: ['Luxor', 'Antiguo Egipto', 'Templos'] },
      metaKeywords: { en: ['Luxor', 'Deir el-Medina', 'Medinet Habu'], de: ['Luxor'], it: ['Luxor'], es: ['Luxor'] },
      status: 'published',
      isFeatured: false,
      publishedAt: new Date('2024-03-05'),
      focusKeyword: 'hidden gems luxor',
      commentsEnabled: true,
      viewCount: 1850,
      readingTime: 4
    });

    // Blog 4: Egyptian Food
    const blog4 = await Blog.create({
      title: { 
        en: 'A Culinary Journey: 7 Must-Try Egyptian Dishes', 
        de: 'Eine kulinarische Reise: 7 ägyptische Gerichte, die man probieren muss', 
        it: 'Un viaggio culinario: 7 piatti egiziani da provare assolutamente', 
        es: 'Un viaje culinario: 7 platos egipcios que debes probar' 
      },
      slug: { 
        en: 'must-try-egyptian-traditional-dishes', 
        de: 'aegyptische-traditionelle-gerichte', 
        it: 'piatti-tradizionali-egiziani-da-provare', 
        es: 'platos-tradicionales-egipcios-que-debes-probar' 
      },
      subCategory: subFood._id,
      author: admin._id,
      featuredImage: {
        url: 'https://images.unsplash.com/photo-1627308595229-7830f5c9c66e?w=1200&h=600&fit=crop',
        fileName: 'egyptian-food.jpg',
        title: { en: 'Traditional Middle Eastern Spice Market' },
        alt: { en: 'Spices and culinary ingredients showcasing Egyptian flavors' },
      },
      excerpt: { 
        en: 'From the famous Koshary street food to hearty Molokhia stews, Egyptian cuisine is a rich tapestry of Mediterranean and Middle Eastern flavors.', 
        de: 'Vom berühmten Koshary Street Food bis zu herzhaften Molokhia Eintöpfen.', 
        it: 'Dal famoso cibo di strada Koshary ai sostanziosi stufati di Molokhia.', 
        es: 'Desde la famosa comida callejera Koshary hasta los abundantes guisos de Molokhia.' 
      },
      contentBlocks: [
        {
          type: 'html',
          content: { 
            en: '<p>Egyptian food blends the fresh ingredients of the Mediterranean with the rich spices of the Middle East, resulting in comforting, hearty, and aromatic dishes. When visiting, here are the absolute essentials you must savor.</p><h3>1. Koshary</h3><p>Egypt’s national dish is a carb-heavy delight. A mix of rice, macaroni, and lentils topped with a spiced tomato sauce, garlic vinegar, and crispy fried onions. It’s cheap, entirely vegan, and incredibly filling.</p><h3>2. Ful Medames</h3><p>A staple breakfast dish consisting of slow-cooked fava beans flavored with olive oil, garlic, lemon juice, and cumin. It is often served with warm pita bread.</p><h3>3. Molokhia</h3><p>A deeply historical soup made from minced jute leaves, cooked with a garlic and coriander broth, often served alongside chicken or rabbit and rice.</p>', 
            de: '<p>Ägyptisches Essen verbindet frische Zutaten aus dem Mittelmeerraum mit reichen Gewürzen. Probieren Sie Koshary und Ful Medames.</p>', 
            it: '<p>Il cibo egiziano fonde ingredienti freschi con spezie ricche. Prova Koshary e Ful Medames.</p>', 
            es: '<p>La comida egipcia mezcla ingredientes frescos con ricas especias. Pruebe Koshary y Ful Medames.</p>' 
          },
        }
      ],
      metaTitle: { en: 'Traditional Egyptian Food Guide', de: 'Ägyptisches Essen Leitfaden', it: 'Guida Cibo Egiziano', es: 'Guía Gastronómica Egipcia' },
      metaDescription: { en: 'Explore the best local food to eat in Egypt, including Koshary, Ful, and Molokhia.', de: 'Erkunden Sie das beste Essen in Ägypten.', it: 'Esplora il miglior cibo in Egitto.', es: 'Explore la mejor comida en Egipto.' },
      tags: { en: ['Food', 'Culture', 'Cairo'], de: ['Essen', 'Kultur', 'Kairo'], it: ['Cibo', 'Cultura', 'Il Cairo'], es: ['Comida', 'Cultura', 'El Cairo'] },
      metaKeywords: { en: ['Egyptian food', 'Koshary', 'local cuisine'], de: ['Ägyptisches Essen'], it: ['Cibo egiziano'], es: ['Comida egipcia'] },
      status: 'published',
      isFeatured: false,
      publishedAt: new Date('2024-03-08'),
      focusKeyword: 'egyptian food',
      commentsEnabled: true,
      viewCount: 2200,
      readingTime: 5
    });

    blog1.relatedPosts = [blog2._id, blog3._id, blog4._id];
    blog2.relatedPosts = [blog1._id, blog3._id];
    await blog1.save();
    await blog2.save();
    await blog3.save();
    await blog4.save();

    console.log('✅ Created 4 detailed, localized professional blog posts and categories');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Blog seeding completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding blogs:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seedBlogs();
