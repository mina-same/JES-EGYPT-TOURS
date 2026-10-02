/**
 * One-off: give every Destination an explicit publication status.
 *
 * Run BEFORE deploying the code that reads `status`: the public rule is
 * `status: 'published'`, so a destination without the field would stop
 * resolving. The old code ignores the field, which makes this order safe.
 *
 * Default: read-only dry-run. --apply writes ONLY `status`, through the raw
 * collection: no timestamps, no hooks, no other field. No Tour is read for
 * writing; a tour keeps every destination reference it has.
 *
 * Refuses to write unless the collection is exactly the reviewed snapshot: the
 * ten destinations with content become `published`, the three catalog entries
 * created without content become `draft`.
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import { revalidateTags } from '../services/revalidate';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DRAFT: Record<string, string> = {
  '6abb7dd4eebd0cc00bb64c9a': 'abu-simbel',
  '6abb7dd4eebd0cc00bb64c9c': 'edfu',
  '6abb7dd4eebd0cc00bb64c9e': 'kom-ombo',
};
const PUBLISHED_SLUGS = [
  'alexandria', 'aswan', 'cairo', 'fayoum', 'giza', 'hurghada', 'luxor', 'marsa-alam', 'sharm-el-sheikh', 'siwa-oasis',
];
// What a landing page is made of; a catalog entry has none of these.
const CONTENT_FIELDS = ['description', 'heroTitle', 'heroDescription', 'coverImage', 'subheader', 'faqs', 'metaDescription'];

const filled = (value: unknown): boolean => {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.values(value as object).some(filled);
  return true;
};
const sha = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured');
  await mongoose.connect(uri);
  try {
    const destinations = mongoose.connection.collection('destinations');
    const tours = mongoose.connection.collection('tours');
    const docs = await destinations.find({}).sort({ _id: 1 }).toArray();

    const problems: string[] = [];
    if (docs.length !== 13) problems.push(`expected 13 destinations, found ${docs.length}`);
    const plan = docs.map((doc) => {
      const id = String(doc._id);
      const slug = doc.slug?.en as string | undefined;
      const content = CONTENT_FIELDS.filter((field) => filled(doc[field]));
      const target = DRAFT[id] ? 'draft' : 'published';
      if (DRAFT[id] && DRAFT[id] !== slug) problems.push(`${id}: expected slug ${DRAFT[id]}, found ${slug}`);
      if (DRAFT[id] && content.length) problems.push(`${slug}: planned as draft but has content (${content.join(', ')})`);
      if (!DRAFT[id] && !PUBLISHED_SLUGS.includes(slug || '')) problems.push(`${slug}: not in the reviewed snapshot`);
      if (!DRAFT[id] && !content.length) problems.push(`${slug}: planned as published but has no content`);
      if (doc.status !== undefined && doc.status !== target) problems.push(`${slug}: already has status ${doc.status}, planned ${target}`);
      return { id, slug, name: doc.name?.en as string, current: doc.status ?? null, target, contentFields: content.length };
    });
    for (const id of Object.keys(DRAFT)) if (!plan.some((row) => row.id === id)) problems.push(`${DRAFT[id]} (${id}) is missing`);
    for (const slug of PUBLISHED_SLUGS) if (!plan.some((row) => row.slug === slug)) problems.push(`${slug} is missing`);

    // Tours that reference a destination about to be a draft. They are reported,
    // never changed: a draft only unpublishes the destination's own page.
    const draftIds = docs.filter((doc) => DRAFT[String(doc._id)]).map((doc) => doc._id);
    const referencing = await tours
      .find({ destinations: { $in: draftIds } }, { projection: { heading: 1, slug: 1, isActive: 1, destinations: 1 } })
      .toArray();

    console.log(JSON.stringify({
      mode: process.argv.includes('--apply') ? 'apply' : 'dry-run',
      destinations: docs.length,
      plan,
      toursReferencingDrafts: referencing.map((tour) => ({
        id: String(tour._id), heading: tour.heading?.en, isActive: tour.isActive,
        drafts: (tour.destinations as unknown[]).map(String).filter((id) => DRAFT[id]).map((id) => DRAFT[id]),
      })),
      problems,
    }, null, 2));
    if (problems.length) throw new Error('The collection is not the reviewed snapshot; nothing was written');
    if (!process.argv.includes('--apply')) return;

    const withoutStatus = async () => sha(
      (await destinations.find({}, { projection: { status: 0 } }).sort({ _id: 1 }).toArray())
    );
    const allTours = async () => sha(await tours.find({}).sort({ _id: 1 }).toArray());
    const [destinationsBefore, toursBefore] = await Promise.all([withoutStatus(), allTours()]);

    const drafted = await destinations.updateMany({ _id: { $in: draftIds }, status: { $exists: false } }, { $set: { status: 'draft' } });
    const published = await destinations.updateMany({ _id: { $nin: draftIds }, status: { $exists: false } }, { $set: { status: 'published' } });

    const [destinationsAfter, toursAfter] = await Promise.all([withoutStatus(), allTours()]);
    const statuses = await destinations.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]).toArray();
    console.log(JSON.stringify({
      drafted: drafted.modifiedCount,
      published: published.modifiedCount,
      statuses: Object.fromEntries(statuses.map((row) => [String(row._id), row.n])),
      otherDestinationFieldsUnchanged: destinationsBefore === destinationsAfter,
      toursUnchanged: toursBefore === toursAfter,
    }, null, 2));
    if (destinationsBefore !== destinationsAfter || toursBefore !== toursAfter) {
      throw new Error('Post-migration verification failed; inspect concurrent edits before proceeding');
    }
    revalidateTags(['destinations', 'tours']);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Destination status migration failed');
  process.exitCode = 1;
});
