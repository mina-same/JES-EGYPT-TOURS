import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import VideoReview from '../models/VideoReview';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const reviews = [
  {
    title: {
      en: 'An Unforgettable Journey through Cairo and Giza',
      de: 'Eine unvergessliche Reise durch Kairo und Gizeh',
      it: 'Un viaggio indimenticabile attraverso Il Cairo e Giza'
    },
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    videoId: 'dQw4w9WgXcQ',
    tourName: {
      en: 'Cairo & Giza 2 Days Private Tour',
      de: 'Kairo & Gizeh 2 Tage Private Tour',
      it: 'Il Cairo e Giza 2 giorni di tour privato'
    },
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    isActive: true,
    order: 1
  },
  {
    title: {
      en: 'The Best Way to See the Pyramids!',
      de: 'Der beste Weg, die Pyramiden zu sehen!',
      it: 'Il modo migliore per vedere le piramidi!'
    },
    url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw', 
    videoId: 'jNQXAC9IVRw',
    tourName: {
      en: 'Great Pyramids & Sphinx Half Day Tour',
      de: 'Große Pyramiden & Sphinx Halbtagstour',
      it: 'Grandi Piramidi e Sfinge Tour di mezza giornata'
    },
    thumbnail: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
    isActive: true,
    order: 2
  },
  {
    title: {
      en: 'Our Luxor and Aswan Experience with JES Egypt',
      de: 'Unsere Luxor- und Assuan-Erfahrung mit JES Egypt',
      it: 'La nostra esperienza a Luxor e Assuan con JES Egypt'
    },
    url: 'https://www.youtube.com/watch?v=_V2sBurXfH4',
    videoId: '_V2sBurXfH4',
    tourName: {
      en: 'Luxor & Aswan 4 Days Nile Cruise',
      de: 'Luxor & Assuan 4 Tage Nilkreuzfahrt',
      it: 'Crociera sul Nilo di 4 giorni a Luxor e Assuan'
    },
    thumbnail: 'https://img.youtube.com/vi/_V2sBurXfH4/maxresdefault.jpg',
    isActive: true,
    order: 3
  },
  {
      title: {
        en: 'Diving in the Red Sea with Local Experts',
        de: 'Tauchen im Roten Meer mit lokalen Experten',
        it: 'Immersioni nel Mar Rosso con esperti locali'
      },
      url: 'https://www.youtube.com/watch?v=l5X2sY6X69I',
      videoId: 'l5X2sY6X69I',
      tourName: {
        en: 'Hurghada Red Sea Scuba Diving',
        de: 'Hurghada Rotes Meer Scuba Diving',
        it: 'Immersioni subacquee nel Mar Rosso a Hurghada'
      },
      thumbnail: 'https://img.youtube.com/vi/l5X2sY6X69I/maxresdefault.jpg',
      isActive: true,
      order: 4
  }
];

const seedVideoReviews = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB for seeding video reviews...');

    // Option 1: Clear existing (careful!)
    // await VideoReview.deleteMany({});
    
    // Option 2: Upsert (safer)
    for (const review of reviews) {
      await VideoReview.findOneAndUpdate(
        { videoId: review.videoId },
        review,
        { upsert: true, new: true }
      );
    }

    console.log('Video reviews seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding video reviews:', error);
    process.exit(1);
  }
};

seedVideoReviews();
