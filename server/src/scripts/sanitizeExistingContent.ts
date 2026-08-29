/**
 * Cleans editor HTML written BEFORE sanitization moved into the models.
 *
 * From now on every rich-text field is sanitized on the way in (see
 * utils/sanitizeRichText.ts and the pre-hooks on each model). Rows that were
 * already in the database when that landed have never been through it, so the
 * ~30 dangerouslySetInnerHTML call sites on the visitor pages would still be
 * rendering whatever those rows hold. This is the one-off pass that closes
 * that gap.
 *
 * Runs in report-only mode by default. Pass --apply to write.
 *
 *   npm run sanitize:existing            # report what would change
 *   npm run sanitize:existing -- --apply # actually write
 *
 * Writes go through `updateOne` with the already-sanitized value, so the
 * model's own pre-hooks are a no-op second pass rather than a conflict.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { sanitizeAtDocumentPath } from '../utils/sanitizeRichText';
import Faq from '../models/Faq';
import GeneralContent from '../models/GeneralContent';
import Blog from '../models/Blog';
import Tour from '../models/Tour';
import BlogCategory from '../models/BlogCategory';
import BlogSubCategory from '../models/BlogSubCategory';
import TourCategory from '../models/TourCategory';
import TourSubcategory from '../models/TourSubcategory';
import Destination from '../models/Destination';

dotenv.config();

const APPLY = process.argv.includes('--apply');

/** Must mirror RICH_TEXT_PATHS in each model. */
const TARGETS: { name: string; model: mongoose.Model<any>; paths: string[] }[] = [
  { name: 'Faq', model: Faq as mongoose.Model<any>, paths: ['answer'] },
  { name: 'GeneralContent', model: GeneralContent as mongoose.Model<any>, paths: ['content'] },
  { name: 'Blog', model: Blog as mongoose.Model<any>, paths: ['content', 'excerpt', 'contentBlocks[].content'] },
  {
    name: 'Tour',
    model: Tour as mongoose.Model<any>,
    paths: ['description', 'generalDescription', 'whatYouWillLoveHtml', 'Description.text', 'notes[].text'],
  },
  { name: 'BlogCategory', model: BlogCategory as mongoose.Model<any>, paths: ['description', 'heroDescription'] },
  { name: 'BlogSubCategory', model: BlogSubCategory as mongoose.Model<any>, paths: ['description', 'heroDescription'] },
  { name: 'TourCategory', model: TourCategory as mongoose.Model<any>, paths: ['description', 'toursSectionSubTitle'] },
  { name: 'TourSubcategory', model: TourSubcategory as mongoose.Model<any>, paths: ['description', 'toursSectionSubTitle'] },
  { name: 'Destination', model: Destination as mongoose.Model<any>, paths: ['description', 'heroDescription'] },
];

/** A short, readable sample of what changed, for the report. */
function firstDifference(before: unknown, after: unknown): string | null {
  const a = JSON.stringify(before);
  const b = JSON.stringify(after);
  if (a === b) return null;
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    if (a[i] !== b[i]) {
      const from = i > 40 ? i - 40 : 0;
      return `…${a.slice(from, i + 80)}\n      ->  …${b.slice(from, i + 80)}`;
    }
  }
  return `${a.length} chars -> ${b.length} chars`;
}

async function run() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is not set.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(APPLY ? 'MODE: APPLY (writing)\n' : 'MODE: report only (pass --apply to write)\n');

  let totalChanged = 0;

  for (const { name, model, paths } of TARGETS) {
    const docs = await model.find({}).lean();
    let changed = 0;

    for (const doc of docs) {
      const updates: Record<string, unknown> = {};

      for (const path of paths) {
        // The ROOT of the path is the document key; the rest ('[].text',
        // '.text') is walked inside it, so only the HTML leaf is touched and
        // plain-text siblings like notes[].title are left exactly as they are.
        const root = path.split(/[.[]/)[0];
        const current = (doc as Record<string, unknown>)[root];
        if (current === undefined || current === null) continue;

        const cleaned = sanitizeAtDocumentPath(current, path);
        const diff = firstDifference(current, cleaned);
        if (!diff) continue;

        // Keyed by the ROOT field, never the declared path: a $set of
        // "contentBlocks[].content" is not valid Mongo syntax.
        updates[root] = cleaned;
        console.log(`  ${name} ${String(doc._id)} .${path}\n      ${diff}`);
      }

      if (Object.keys(updates).length === 0) continue;
      changed += 1;

      if (APPLY) {
        await model.updateOne({ _id: doc._id }, { $set: updates });
      }
    }

    totalChanged += changed;
    console.log(`${name}: ${changed} of ${docs.length} document(s) ${APPLY ? 'updated' : 'would change'}`);
  }

  console.log(`\nTotal: ${totalChanged} document(s) ${APPLY ? 'updated' : 'would change'}.`);
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error('sanitize:existing failed:', error);
  process.exit(1);
});
