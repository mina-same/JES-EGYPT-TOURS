import 'dotenv/config';
import mongoose from 'mongoose';
import { writeFile } from 'node:fs/promises';
import { revalidateTags } from '../services/revalidate';
import { planTourFilterMigration } from '../utils/tourFilterMigration';

async function main() {
  const apply = process.argv.includes('--apply');
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');
  await mongoose.connect(uri);
  try {
    const collection = mongoose.connection.collection('tours');
    const tours = await collection.find({}).toArray();
    const report = tours.map(tour => ({ id: String(tour._id), name: tour.name, before: {
      updatedAt: tour.updatedAt, editVersion: tour.editVersion,
      tourType: tour.tourType, tourStyle: tour.tourStyle, tourStyles: tour.tourStyles,
      duration: tour.duration, durationHours: tour.durationHours, destinations: tour.destinations,
    }, ...planTourFilterMigration(tour) }));
    const filename = `tour-filter-migration-${Date.now()}.json`;
    await writeFile(filename, JSON.stringify({ apply, records: report }, null, 2), { flag: 'wx' });
    if (apply) {
      for (let i = 0; i < report.length; i++) {
        const { set, unset } = report[i];
        if (!Object.keys(set).length && !Object.keys(unset).length) continue;
        // Compare the original document to avoid overwriting concurrent admin edits.
        const result = await collection.updateOne({ _id: tours[i]._id, updatedAt: tours[i].updatedAt }, {
          $set: { ...set, updatedAt: new Date() },
          $inc: { editVersion: 1 },
          ...(Object.keys(unset).length ? { $unset: unset } : {}),
        });
        if (!result.matchedCount) throw new Error(`Concurrent edit: ${report[i].id}; rerun the report`);
      }
    }
    if (apply) revalidateTags(['tours']);
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', report: filename,
      total: report.length, needsReview: report.filter(r => r.review.length).map(r => ({ id: r.id, fields: r.review })) }, null, 2));
  } finally { await mongoose.disconnect(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
