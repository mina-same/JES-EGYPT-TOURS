import mongoose from 'mongoose';
import GeneralContent from '../models/GeneralContent';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const contentBlocks = [
  {
    slug: 'home-intro',
    title: {
      en: 'Egypt Day Tours: Top Egypt Tours & Best Deals in 2025',
      de: 'Ägypten-Tagestouren: Top-Ägypten-Touren & Beste Angebote 2025',
      it: 'Tour di un giorno in Egitto: I migliori tour in Egitto e le migliori offerte nel 2025',
    },
    subtitle: {
      en: 'Experience Ancient Wonders with Local Experts',
      de: 'Erleben Sie antike Wunder mit lokalen Experten',
      it: 'Vivi le antiche meraviglie con esperti locali',
    },
    content: {
      en: `
        <p>Experience Egypt’s breathtaking history, culture, and natural beauty with Egypt Day Tours, your go-to travel partner for unforgettable day tours nationwide. Imagine walking in the footsteps of the ancient pharaohs as you stand before the awe-inspiring Pyramids of Giza or explore the vast tombs in the Valley of the Kings.</p>
        <p>At Egypt Day Tours, we specialize in making these dreams come true, offering you the chance to visit Egypt’s most famous landmarks in a single day. Whether you’re keen to see the great Sphinx, the Karnak Temple‘s intricate carvings, or the Luxor Temple‘s monumental columns, our expert-guided tours are designed to help you experience it without hassle.</p>
        <p>In Cairo, dive into the past at the Grand Egyptian Museum, where you can marvel at the treasures of ancient Egypt, including the golden mask of King Tutankhamun. For those looking for a more serene experience, our one-day tours to Aswan will introduce you to the towering obelisks and temples that define this peaceful Nile-side city. Or head south to the UNESCO World Heritage site of Abu Simbel, where the colossal statues of Ramses II stand guard over the Nile.</p>
        <p>For a mix of history and relaxation, our day trips to Alexandria offer stunning coastal views, along with visits to ancient sites like Pompey’s Pillar and the Catacombs of Kom El Shoqafa. If you’re a lover of the sea, Egypt Day Tours also offers excursions to Hurghada and Sharm El Sheikh, where you can immerse yourself in the vibrant underwater world of the Red Sea, known for its colorful coral reefs and diverse marine life.</p>
        <p>At Egypt Day Tours, we combine adventure, relaxation, and education to give you an authentic Egyptian experience. Our knowledgeable local guides, comfortable transport, and seamless planning ensure that all you need to do is enjoy the ride. Book your trip now with Egypt Day Tours and let us guide you through this magnificent country’s unforgettable Egyptian sights and stories!</p>
      `,
      de: `
        <p>Erleben Sie Ägyptens atemberaubende Geschichte, Kultur und natürliche Schönheit mit Egypt Day Tours, Ihrem Partner für unvergessliche Tagestouren im ganzen Land. Stellen Sie sich vor, Sie treten in die Fußstapfen der alten Pharaonen, während Sie vor den ehrfurchtgebietenden Pyramiden von Gizeh stehen oder die riesigen Gräber im Tal der Könige erkunden.</p>
        <p>Bei Egypt Day Tours sind wir darauf spezialisiert, diese Träume wahr werden zu lassen und bieten Ihnen die Möglichkeit, Ägyptens berühmteste Wahrzeichen an einem einzigen Tag zu besuchen.</p>
      `,
      it: `
        <p>Scopri la storia, la cultura e la bellezze naturali mozzafiato dell'Egitto con Egypt Day Tours, il tuo partner di fiducia per indimenticabili tour di un giorno in tutto il paese. Immagina di camminare sulle orme degli antichi faraoni mentre ti trovi davanti alle maestose Piramidi di Giza o esplori le vaste tombe nella Valle dei Re.</p>
        <p>Noi di Egypt Day Tours siamo specializzati nel trasformare questi sogni in realtà, offrendoti la possibilità di visitare i monumenti più famosi dell'Egitto in un solo giorno.</p>
      `,
    },
    isActive: true,
  },
  {
    slug: 'footer-about',
    title: {
      en: 'About JES Egypt Tours',
      de: 'Über JES Egypt Tours',
      it: 'Informazioni su JES Egypt Tours',
    },
    subtitle: {
      en: 'Your Gateway to Egypt',
      de: 'Ihr Tor nach Ägypten',
      it: 'La tua porta per l\'Egitto',
    },
    content: {
      en: `
        <p>JES Egypt Tours is a premier travel agency dedicated to providing authentic and immersive experiences across the land of the Pharaohs. From the majestic pyramids to the serene Nile, we crafts journeys that tell the stories of thousands of years.</p>
      `,
      de: `
        <p>JES Egypt Tours ist ein erstklassiges Reisebüro, das sich der Bereitstellung authentischer und intensiver Erlebnisse im Land der Pharaonen widmet.</p>
      `,
      it: `
        <p>JES Egypt Tours è un'agenzia di viaggi leader dedicata a fornire esperienze autentiche e coinvolgenti in tutta la terra dei Faraoni.</p>
      `,
    },
    isActive: true,
  },
  {
    slug: 'contact-side-info',
    title: {
      en: 'Need Help?',
      de: 'Brauchen Sie Hilfe?',
      it: 'Hai bisogno di aiuto?',
    },
    subtitle: {
      en: 'We are here for you 24/7',
      de: 'Wir sind rund um die Uhr für Sie da',
      it: 'Siamo qui per te 24 ore su 24, 7 giorni su 7',
    },
    content: {
      en: `
        <p>Our team of travel specialists is ready to help you plan the perfect Egyptian adventure. Whether you have questions about a tour or need a custom itinerary, we're just a message away.</p>
      `,
      de: `
        <p>Unser Team von Reisespezialisten ist bereit, Ihnen bei der Planung des perfekten ägyptischen Abenteuers zu helfen.</p>
      `,
      it: `
        <p>Il nostro team di specialisti di viaggio è pronto ad aiutarti a pianificare la perfetta avventura egiziana.</p>
      `,
    },
    isActive: true,
  }
];

const seedGeneralContent = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected to MongoDB');

    for (const block of contentBlocks) {
      await GeneralContent.findOneAndUpdate(
        { slug: block.slug },
        block,
        { upsert: true, new: true }
      );
      console.log(`✔ Seeded block: ${block.slug}`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ General content seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding general content:', error);
    process.exit(1);
  }
};

seedGeneralContent();
