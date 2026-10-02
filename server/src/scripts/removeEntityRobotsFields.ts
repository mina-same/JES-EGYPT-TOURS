/**
 * One-off: delete the retired page-level robots fields (`noIndex`, `noFollow`)
 * from the documents that still store them.
 *
 * Run AFTER deploying the code that no longer reads them. Default: read-only
 * dry-run that reports what matches. --apply runs a raw-collection `$unset` of
 * those two fields only: no timestamps (so no sitemap lastmod moves), no model
 * hooks and therefore no cache-invalidation webhook, no other field.
 *
 * Afterwards every other field and every `updatedAt` must be unchanged, and no
 * tour may have been touched; otherwise it reports the failure.
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { createHash } from 'node:crypto';
import mongoose from 'mongoose';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const COLLECTIONS = ['blogs', 'blogcategories', 'blogsubcategories', 'destinations'];
const FIELDS = ['noIndex', 'noFollow'] as const;
// Variants an older shape could have used; none is expected.
const NESTED = ['seo.noIndex', 'seo.noFollow', 'seo.robots', 'robots'];
const HAS_FIELD = { $or: FIELDS.map((field) => ({ [field]: { $exists: true } })) };

const sha = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

// A document as it must look after the cleanup: every field except the two.
const withoutRetiredFields = (doc: Record<string, unknown>) => {
  const rest = { ...doc };
  for (const field of FIELDS) delete rest[field];
  return rest;
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured');
  await mongoose.connect(uri);
  try {
    const db = mongoose.connection;
    const counts = async () => Object.fromEntries(await Promise.all(COLLECTIONS.map(async (name) => {
      const collection = db.collection(name);
      const fields = Object.fromEntries(await Promise.all(FIELDS.map(async (field) => [field, await collection.countDocuments({ [field]: { $exists: true } })])));
      const nested = Object.fromEntries((await Promise.all(NESTED.map(async (field) => [field, await collection.countDocuments({ [field]: { $exists: true } })])))
        .filter(([, n]) => n));
      return [name, { total: await collection.countDocuments({}), matching: await collection.countDocuments(HAS_FIELD), ...fields, ...(Object.keys(nested).length ? { nested } : {}) }];
    })));
    const before = await counts();
    console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'apply' : 'dry-run', before }, null, 2));
    if (!process.argv.includes('--apply')) return;

    // Each document without the two fields, plus its updatedAt: identical after.
    const rest = async () => Object.fromEntries(await Promise.all(COLLECTIONS.map(async (name) => [
      name,
      sha((await db.collection(name).find({}).sort({ _id: 1 }).toArray()).map(withoutRetiredFields)),
    ])));
    const tours = async () => sha(await db.collection('tours').find({}).sort({ _id: 1 }).toArray());
    const [restBefore, toursBefore] = await Promise.all([rest(), tours()]);

    const unset = Object.fromEntries(FIELDS.map((field) => [field, '']));
    const modified: Record<string, number> = {};
    for (const name of COLLECTIONS) {
      modified[name] = (await db.collection(name).updateMany(HAS_FIELD, { $unset: unset })).modifiedCount;
    }

    const [restAfter, toursAfter, after] = await Promise.all([rest(), tours(), counts()]);
    const unchanged = Object.fromEntries(COLLECTIONS.map((name) => [name, restBefore[name] === restAfter[name]]));
    console.log(JSON.stringify({ modified, after, otherFieldsAndUpdatedAtUnchanged: unchanged, toursUnchanged: toursBefore === toursAfter }, null, 2));
    const left = Object.values(after).some((c) => (c as { matching: number }).matching > 0);
    if (left || Object.values(unchanged).includes(false) || toursBefore !== toursAfter) {
      throw new Error('Post-cleanup verification failed; inspect concurrent edits before proceeding');
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Robots field cleanup failed');
  process.exitCode = 1;
});
