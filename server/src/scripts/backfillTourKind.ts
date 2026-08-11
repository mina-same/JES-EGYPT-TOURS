/**
 * Backfills `tourKind` on tours created before the field existed.
 *
 * The kind is inferred from the plans a tour already carries, which is the only
 * evidence in the data: "TOUR PRICES" is the single-price shape a day tour
 * uses, and the three tiers only ever belong to a package. Tours with no plans
 * at all are left unset on purpose — there is nothing to infer from, and a
 * wrong guess would silently restrict what the admin may enter next.
 *
 * Runs in report-only mode by default. Pass --apply to write.
 *
 *   npm run migrate:tour-kind            # report what would change
 *   npm run migrate:tour-kind -- --apply # actually write
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tour, {
  DAY_TOUR_PLAN_NAMES,
  PACKAGE_PLAN_NAMES,
  type TourKind,
} from '../models/Tour';

dotenv.config();

const APPLY = process.argv.includes('--apply');

const inferKind = (planNames: string[]): TourKind | null => {
  if (planNames.length === 0) return null;
  const isDayTour = planNames.every((n) => (DAY_TOUR_PLAN_NAMES as readonly string[]).includes(n));
  const isPackage = planNames.every((n) => (PACKAGE_PLAN_NAMES as readonly string[]).includes(n));
  if (isDayTour) return 'DAY_TOUR';
  if (isPackage) return 'PACKAGE';
  // Mixed: the tour breaks the rule we are about to enforce. Report, never guess.
  return null;
};

const run = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri);
  console.log(APPLY ? '=== APPLYING ===' : '=== REPORT ONLY (pass --apply to write) ===\n');

  const tours = await Tour.find({}, 'slug tourKind pricingPlans').lean();
  let updated = 0;
  let skippedAlreadySet = 0;
  const needsAttention: string[] = [];

  for (const tour of tours) {
    const slug =
      typeof (tour as any).slug === 'string'
        ? (tour as any).slug
        : (tour as any).slug?.en || String(tour._id);
    const planNames = ((tour as any).pricingPlans || [])
      .map((p: any) => p?.planName)
      .filter(Boolean) as string[];

    if ((tour as any).tourKind) {
      skippedAlreadySet++;
      console.log(`  skip    ${slug} — already ${(tour as any).tourKind}`);
      continue;
    }

    const kind = inferKind(planNames);
    if (!kind) {
      const why = planNames.length === 0 ? 'no pricing plans' : `mixed plans: ${planNames.join(', ')}`;
      needsAttention.push(`${slug} (${why})`);
      console.log(`  LEAVE   ${slug} — ${why}`);
      continue;
    }

    console.log(`  set     ${slug} -> ${kind}   [${planNames.join(', ')}]`);
    if (APPLY) {
      // updateOne, not save(): the document would run every pre('save') hook,
      // and an unrelated pre-existing validation problem elsewhere in the tour
      // would then block a migration that only touches one field.
      await Tour.updateOne({ _id: tour._id }, { $set: { tourKind: kind } });
    }
    updated++;
  }

  console.log(`\n${APPLY ? 'updated' : 'would update'}: ${updated}`);
  console.log(`already set: ${skippedAlreadySet}`);
  if (needsAttention.length) {
    console.log(`\nleft unset — set these by hand in the admin:`);
    needsAttention.forEach((s) => console.log(`  - ${s}`));
  }

  await mongoose.disconnect();
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
