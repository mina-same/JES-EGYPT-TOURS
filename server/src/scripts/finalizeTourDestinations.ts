/**
 * Run only after the destination consumers pass their tests and builds.
 * Default: read-only dry-run. --apply adds missing catalog entries and removes
 * ONLY the obsolete top-level tour field. No destination assignments are made.
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import Destination from '../models/Destination';
import { revalidateTags } from '../services/revalidate';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const catalogEntries = [
  { name: 'Abu Simbel', slug: 'abu-simbel' },
  { name: 'Edfu', slug: 'edfu' },
  { name: 'Kom Ombo', slug: 'kom-ombo' },
];
const localized = (value: string) => ({ en: value, de: value, it: value, es: value });
const legacyFilter = { tourLocation: { $exists: true } };

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured');
  await mongoose.connect(uri);
  try {
    const tours = mongoose.connection.collection('tours');
    const before = await tours.countDocuments(legacyFilter);
    const missing = [];
    for (const entry of catalogEntries) {
      const exists = await Destination.exists({ $or: [
        { 'slug.en': entry.slug },
        { 'name.en': new RegExp(`^${entry.name}$`, 'i') },
      ] });
      if (!exists) {
        const destination = new Destination({
          name: localized(entry.name), shortName: localized(entry.name),
          // A catalog entry with no content: usable by tours, no public page.
          slug: localized(entry.slug), status: 'draft', isActive: true, noIndex: true,
        });
        await destination.validate();
        missing.push(destination);
      }
    }
    console.log(JSON.stringify({ mode: 'dry-run', legacyDocuments: before,
      destinationsToCreate: missing.map(d => d.name.en) }));
    if (!process.argv.includes('--apply')) return;

    // Hash every other tour field, including all nested accommodation locations.
    // The raw collection bypasses save hooks/timestamps: $unset is the only write.
    const fingerprint = async () => createHash('sha256').update(JSON.stringify(
      await tours.find({}, { projection: { tourLocation: 0 } }).sort({ _id: 1 }).toArray()
    )).digest('hex');
    const priorHash = await fingerprint();
    const created = missing.length ? await Destination.insertMany(missing) : [];
    const result = await tours.updateMany(legacyFilter, { $unset: { tourLocation: '' } });
    const after = await tours.countDocuments(legacyFilter);
    const otherFieldsUnchanged = priorHash === await fingerprint();
    const needsReview = await tours.find(
      { $or: [{ destinations: { $exists: false } }, { destinations: { $size: 0 } }] },
      { projection: { heading: 1, slug: 1 } }
    ).toArray();
    console.log(JSON.stringify({ before, modified: result.modifiedCount, after,
      otherFieldsUnchanged, destinationsCreated: created.map(d => ({ id: d._id, name: d.name.en })),
      needsReview }, null, 2));
    if (after !== 0 || !otherFieldsUnchanged) throw new Error('Post-cleanup verification failed; inspect concurrent edits before proceeding');
    revalidateTags(['destinations', 'tours']);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Destination cleanup failed');
  process.exitCode = 1;
});
