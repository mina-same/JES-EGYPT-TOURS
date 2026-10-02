import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Destination from '../models/Destination';
import { initialDestinationFilterKey, normalizeDestinationFilterKey } from '../utils/destinationFilterKey';

dotenv.config();

/** Dry-run by default. Run --apply only against an explicitly selected non-production DB. */
async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false });
  try {
    const documents = await Destination.find({}, { _id: 1, 'slug.en': 1, filterKey: 1 }).lean();
    const seen = new Set<string>();
    const pending: { id: mongoose.Types.ObjectId; key: string }[] = [];
    for (const document of documents) {
      if (document.filterKey && normalizeDestinationFilterKey(document.filterKey) !== document.filterKey) {
        throw new Error(`Destination ${document._id} has a noncanonical filterKey`);
      }
      const key = document.filterKey
        ? normalizeDestinationFilterKey(document.filterKey)
        : initialDestinationFilterKey(document.slug?.en);
      if (!key) throw new Error(`Destination ${document._id} has no valid English slug/filterKey`);
      if (seen.has(key)) throw new Error(`Duplicate destination filterKey: ${key}`);
      seen.add(key);
      if (!document.filterKey) pending.push({ id: document._id, key });
    }
    console.log(`Destination filterKey audit: ${documents.length} records, ${pending.length} to backfill`);
    if (process.argv.includes('--apply') && pending.length) {
      // Bypass Mongoose's immutable-path stripping for this one-time migration.
      const result = await Destination.collection.bulkWrite(pending.map(({ id, key }) => ({
        updateOne: {
          filter: { _id: id, $or: [{ filterKey: { $exists: false } }, { filterKey: null }, { filterKey: '' }] },
          update: { $set: { filterKey: key } },
        },
      })));
      if (result.modifiedCount !== pending.length) throw new Error(`Backfill incomplete: ${result.modifiedCount}/${pending.length}`);
      console.log(`Backfilled ${result.modifiedCount} filter keys`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
