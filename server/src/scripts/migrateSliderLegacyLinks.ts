import dotenv from 'dotenv';
import mongoose from 'mongoose';

/**
 * One-off, idempotent migration: converts legacy PLAIN-STRING links to the
 * current localized { en, de, it, es } shape.
 *
 * Why: SliderContent.button.link and SliderPromoConfig.underPromo.link were
 * upgraded to localized objects. Old documents that still hold a string fail
 * full-document validation (e.g. on save()), which surfaced as
 * "Failed to toggle slider content status" for pre-upgrade slides.
 *
 * Safe to re-run: it only touches documents where the link is still a string
 * and uses targeted $set updates (no full-document validation).
 *
 * Run with: npm run migrate:slider-links   (from the server directory)
 */

dotenv.config();

const toLocalized = (link: string) => ({
  en: (link || '').trim(),
  de: '',
  it: '',
  es: '',
});

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db!;

    // 1) SliderContent: legacy string button.link → localized object.
    const sliders = db.collection('slidercontents');
    const legacySliders = await sliders
      .find({ 'button.link': { $type: 'string' } })
      .project({ _id: 1, 'button.link': 1 })
      .toArray();

    for (const doc of legacySliders) {
      const link = (doc as any).button?.link as string;
      await sliders.updateOne(
        { _id: doc._id },
        { $set: { 'button.link': toLocalized(link) } }
      );
      console.log(`  • slidercontents ${doc._id}: "${link}" → localized object`);
    }
    console.log(`✅ SliderContent migrated: ${legacySliders.length} document(s)`);

    // 2) SliderPromoConfig: legacy string underPromo.link → localized object.
    const promos = db.collection('sliderpromoconfigs');
    const legacyPromos = await promos
      .find({ 'underPromo.link': { $type: 'string' } })
      .project({ _id: 1, 'underPromo.link': 1 })
      .toArray();

    for (const doc of legacyPromos) {
      const link = (doc as any).underPromo?.link as string;
      await promos.updateOne(
        { _id: doc._id },
        { $set: { 'underPromo.link': toLocalized(link) } }
      );
      console.log(`  • sliderpromoconfigs ${doc._id}: "${link}" → localized object`);
    }
    console.log(`✅ SliderPromoConfig migrated: ${legacyPromos.length} document(s)`);

    console.log('✅ Migration complete — no legacy string links remain.');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

run();
