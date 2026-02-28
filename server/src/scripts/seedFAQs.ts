#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import seedFAQs from '../seeds/faqSeeder';

const runSeeder = async () => {
  try {
    console.log('🌱 Starting FAQ seeding process...');
    await seedFAQs();
    console.log('✅ FAQ seeding completed successfully!');
  } catch (error) {
    console.error('❌ FAQ seeding failed:', error);
    process.exit(1);
  }
};

runSeeder();
