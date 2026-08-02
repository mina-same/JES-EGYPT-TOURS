import dotenv from 'dotenv';
import mongoose from 'mongoose';

/**
 * One-off, idempotent migration that clears every tour's stored social share
 * image (`seo.metaImage`).
 *
 * Why: tours used to copy `images[0]` into `seo.metaImage` on create. That left
 * a frozen duplicate — replacing the tour's first photo afterwards never updated
 * the social card, which kept pointing at the old file. `seo.metaImage` now
 * means "explicit override" only, and the tour page falls back to the CURRENT
 * first image when it is absent, so wiping the copies is the correct end state.
 *
 * Safe to re-run: the second pass matches nothing.
 *
 * Run with: npm run migrate:reset-tour-social-images
 */

dotenv.config();

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set — nothing was changed.');
    process.exitCode = 1;
    return;
  }

  try {
    await mongoose.connect(uri);
    const tours = mongoose.connection.db!.collection('tours');

    const filter = { 'seo.metaImage': { $exists: true } };
    const affected = await tours.countDocuments(filter);

    if (affected === 0) {
      console.log('No tour carries a stored seo.metaImage. Nothing to do.');
      return;
    }

    // Printed before the write so the run is auditable if anything looks wrong.
    const sample = await tours
      .find(filter, { projection: { name: 1, 'seo.metaImage.url': 1 } })
      .limit(10)
      .toArray();

    console.log(`Clearing seo.metaImage on ${affected} tour(s). First ${sample.length}:`);
    for (const tour of sample) {
      console.log(`  - ${tour.name}: ${(tour as any).seo?.metaImage?.url || '(no url)'}`);
    }

    const result = await tours.updateMany(filter, {
      $unset: { 'seo.metaImage': '' },
    });

    console.log(
      `Done. ${result.modifiedCount} tour(s) updated. Social cards now use the tour's current first image until an override is set in the admin.`
    );
  } catch (error: any) {
    console.error('Failed to reset tour social images:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

void run();
