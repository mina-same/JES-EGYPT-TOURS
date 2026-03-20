import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Tour from '../models/Tour';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const migrate = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected!');

    const tours = await Tour.find({});
    console.log(`Found ${tours.length} tours to check/migrate.`);

    let count = 0;
    for (const tour of tours) {
      let modified = false;

      // Migrate heading if it's still a string (though Mongoose might cast it to object depending on version)
      // If we see it's missing 'en' or looks like an old record
      if (typeof tour.heading === 'string' || (tour.heading && !(tour.heading as any).en)) {
         const oldHeading = tour.heading as any;
         tour.heading = { en: oldHeading };
         modified = true;
      }

      // Migrate Description
      if (tour.Description) {
        if (typeof tour.Description.header === 'string' || (tour.Description.header && !(tour.Description.header as any).en)) {
          const oldHeader = tour.Description.header as any;
          tour.Description.header = { en: oldHeader };
          modified = true;
        }
        if (typeof tour.Description.text === 'string' || (tour.Description.text && !(tour.Description.text as any).en)) {
          const oldText = tour.Description.text as any;
          tour.Description.text = { en: oldText };
          modified = true;
        }
      }

      if (modified) {
        await tour.save({ validateBeforeSave: false });
        count++;
      }
    }

    console.log(`Migration complete. Updated ${count} tours.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

void migrate();
