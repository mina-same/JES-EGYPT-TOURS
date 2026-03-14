import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { seedMenus } from '../seeds/menuSeeder';

// Load environment variables
dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected to MongoDB');

    await seedMenus();
    console.log('✅ Menus seeded successfully');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding menus:', error.message);
    console.error(error);
    process.exit(1);
  }
};

run();
