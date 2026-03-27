import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import TourCategory from '../models/TourCategory';
import TourSubcategory from '../models/TourSubcategory';
import Tour from '../models/Tour';
import { tourCategorySeed, tourSubcategorySeed, tourSeed } from './tourSeeds';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Professional Tour Seeder
 * Seeds the database with sample tour data including categories, subcategories, and tours
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
 * Clear existing tour data
 */
/*
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
*/

/**
 * Seed tour category
 */
const seedCategory = async (): Promise<mongoose.Types.ObjectId> => {
  try {
    log.info('Seeding tour category...');
    
    const category = await TourCategory.create(tourCategorySeed);
    
    log.success(`Category created: ${category.name} (ID: ${category._id})`);
    return category._id;
  } catch (error: any) {
    log.error(`Error seeding category: ${error.message}`);
    throw error;
  }
};

/**
 * Seed tour subcategory
 */
const seedSubcategory = async (categoryId: mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId> => {
  try {
    log.info('Seeding tour subcategory...');
    
    const subcategoryData = {
      ...tourSubcategorySeed,
      category: categoryId,
    };
    
    const subcategory = await TourSubcategory.create(subcategoryData);
    
    log.success(`Subcategory created: ${subcategory.name} (ID: ${subcategory._id})`);
    return subcategory._id;
  } catch (error: any) {
    log.error(`Error seeding subcategory: ${error.message}`);
    throw error;
  }
};

/**
 * Seed tour
 */
const seedTour = async (subcategoryId: mongoose.Types.ObjectId): Promise<void> => {
  try {
    log.info('Seeding tour...');
    
    const tourData = {
      ...tourSeed,
      subcategory: subcategoryId,
    };
    
    const tour = await Tour.create(tourData);
    
    log.success(`Tour created: ${tour.heading} (ID: ${tour._id})`);
    log.info(`  - Slug: ${tour.slug}`);
    log.info(`  - External ID: ${tour.idExternal}`);
    log.info(`  - Pricing Plans: ${tour.pricingPlans.length}`);
    log.info(`  - Featured: ${tour.isFeatured ? 'Yes' : 'No'}`);
  } catch (error: any) {
    log.error(`Error seeding tour: ${error.message}`);
    throw error;
  }
};

/**
 * Display seeded data summary
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
const seedTours = async (): Promise<void> => {
  try {
    log.header('🌱 TOUR DATABASE SEEDER');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    // await clearData();
    
    // Seed data in order
    const categoryId = await seedCategory();
    const subcategoryId = await seedSubcategory(categoryId);
    await seedTour(subcategoryId);
    
    // Display summary
    await displaySummary();
    
    log.success('Tour seeding completed successfully!');
    
    // Exit
    process.exit(0);
  } catch (error: any) {
    log.error(`Seeding failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

/**
 * Handle script arguments
 */
const handleArguments = (): void => {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.bright}Tour Database Seeder${colors.reset}

Usage:
  npm run seed:tours              Seed tour data
  ts-node src/seeds/tourSeeder.ts Seed tour data
  
Options:
  --help, -h    Show this help message
  
Environment Variables:
  MONGODB_URI   MongoDB connection string (required)
                Example: mongodb+srv://user:pass@cluster.mongodb.net/dbname
    `);
    process.exit(0);
  }
};

// Run seeder
if (require.main === module) {
  handleArguments();
  seedTours();
}

export default seedTours;
