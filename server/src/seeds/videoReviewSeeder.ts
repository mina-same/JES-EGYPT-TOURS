import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import VideoReview from '../models/VideoReview';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const reviews = [
  {
    title: 'An Unforgettable Journey through Cairo and Giza',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    videoId: 'dQw4w9WgXcQ',
    tourName: 'Cairo & Giza 2 Days Private Tour',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    isActive: true,
    order: 1
  },
  {
    title: 'The Best Way to See the Pyramids!',
    url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw', 
    videoId: 'jNQXAC9IVRw',
    tourName: 'Great Pyramids & Sphinx Half Day Tour',
    thumbnail: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
    isActive: true,
    order: 2
  },
  {
    title: 'Our Luxor and Aswan Experience with JES Egypt',
    url: 'https://www.youtube.com/watch?v=_V2sBurXfH4',
    videoId: '_V2sBurXfH4',
    tourName: 'Luxor & Aswan 4 Days Nile Cruise',
    thumbnail: 'https://img.youtube.com/vi/_V2sBurXfH4/maxresdefault.jpg',
    isActive: true,
    order: 3
  },
  {
      title: 'Diving in the Red Sea with Local Experts',
      url: 'https://www.youtube.com/watch?v=l5X2sY6X69I',
      videoId: 'l5X2sY6X69I',
      tourName: 'Hurghada Red Sea Scuba Diving',
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
