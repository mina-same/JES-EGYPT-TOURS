import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Tour from '../models/Tour';
import TourCategory from '../models/TourCategory';
import TourSubcategory from '../models/TourSubcategory';

dotenv.config();

const seedTestTour = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected to MongoDB');

    let category = await TourCategory.findOne();
    if (!category) {
      category = await TourCategory.create({
        name: { en: 'Test Category' },
        slug: { en: 'test-category' },
        description: { en: 'Test' },
        isActive: true,
      });
    }

    let subcategory = await TourSubcategory.findOne({ category: category._id });
    if (!subcategory) {
      subcategory = await TourSubcategory.create({
        name: { en: 'Test Subcategory' },
        slug: { en: 'test-subcategory' },
        description: { en: 'Test' },
        category: category._id,
        isActive: true,
      });
    }

    const uniqueSlug = `test-multi-currency-tour-${Date.now()}`;
    const testTour = await Tour.create({
      heading: { en: 'Test Multi-Currency Tour' },
      name: { en: 'Test Multi-Currency Tour Name' },
      slug: { en: uniqueSlug },
      subcategory: subcategory._id,
      isActive: true,
      isFeatured: true,
      overview: { en: 'This is a test tour for multi-currency pricing' },
      Description: { 
        header: { en: 'Tour Description' },
        text: { en: '<p>Complete tour description with all multi-currency prices.</p>' }
      },
      duration: { en: '5 Days' },
      tourType: { en: 'Private' },
      tourLocation: { en: 'Cairo' },
      tourStyle: { en: 'Luxury' },
      priceStartingFrom: { USD: 500, EUR: 450, GBP: 400 },
      pricingPlans: [{
        planName: 'AFFORDABLE',
        seasons: [{
          seasonName: 'All Year',
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-08-31'),
          prices: {
            solo: { USD: 1000, EUR: 920, GBP: 800 },
            pax_2_4: { USD: 800, EUR: 730, GBP: 640 },
            pax_5_8: { USD: 600, EUR: 550, GBP: 480 },
            pax_9_16: { USD: 500, EUR: 450, GBP: 400 }
          }
        }]
      }],
      images: [{
        url: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73b6e',
        fileName: 'test-image.jpg',
        alt: { en: 'Test Tour Image' }
      }],
      gallery: [],
      inclusion: [{ en: 'English speaking guide' }],
      exclusion: [{ en: 'Personal expenses' }]
    });

    console.log('✅ Created test tour with ID:', testTour._id);
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

seedTestTour();
