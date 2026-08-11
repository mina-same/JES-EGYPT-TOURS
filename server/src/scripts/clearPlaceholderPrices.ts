/**
 * Removes placeholder zero prices, and recomputes every tour's
 * `priceStartingFrom` from the plans that remain.
 *
 * Why: new pricing plans used to be scaffolded with `{ USD: 0 }` in all four
 * group-size tiers, so a tour that had merely been *created* already carried
 * dozens of zeros. Nothing here is free, so a stored 0 is always an unfilled
 * field — but the tour page could not tell the difference and rendered "$0.00"
 * to visitors. The scaffold no longer writes zeros; this clears the ones it
 * already wrote.
 *
 * A tier is removed only when EVERY currency on it is missing or <= 0. A tier
 * priced in USD but not EUR keeps its USD amount untouched.
 *
 * `priceStartingFrom` is recomputed rather than preserved: it used to be typed
 * by hand in a separate field and had drifted — one tour advertised $1200 while
 * its own pricing table said $100.
 *
 * Runs in report-only mode by default. Pass --apply to write.
 *
 *   npm run migrate:clear-placeholder-prices            # report only
 *   npm run migrate:clear-placeholder-prices -- --apply # actually write
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tour from '../models/Tour';
import { deriveStartingPrice } from '../utils/startingPrice';

dotenv.config();

const APPLY = process.argv.includes('--apply');

const TIERS = ['solo', 'pax_2_4', 'pax_5_8', 'pax_9_16'] as const;
const CURRENCIES = ['USD', 'EUR', 'GBP'] as const;

const isUsable = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v > 0;

/** Keeps only the currencies that carry a real amount. Returns undefined when
 *  the tier holds nothing worth quoting. */
const cleanTier = (amounts: any): Record<string, number> | undefined => {
  if (!amounts || typeof amounts !== 'object') return undefined;

  const kept: Record<string, number> = {};
  for (const currency of CURRENCIES) {
    if (isUsable(amounts[currency])) kept[currency] = amounts[currency];
  }
  return Object.keys(kept).length > 0 ? kept : undefined;
};

const run = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri);
  console.log(APPLY ? '=== APPLYING ===' : '=== REPORT ONLY (pass --apply to write) ===\n');

  const tours = await Tour.find({}).select('slug heading pricingPlans priceStartingFrom').lean();

  let toursTouched = 0;
  let tiersCleared = 0;

  for (const tour of tours as any[]) {
    const slug = typeof tour.slug === 'string' ? tour.slug : tour.slug?.en || String(tour._id);
    const plans = Array.isArray(tour.pricingPlans) ? tour.pricingPlans : [];

    let clearedHere = 0;
    const cleanedPlans = plans.map((plan: any) => ({
      ...plan,
      seasons: (Array.isArray(plan?.seasons) ? plan.seasons : []).map((season: any) => {
        const prices: Record<string, unknown> = {};
        for (const tier of TIERS) {
          const cleaned = cleanTier(season?.prices?.[tier]);
          if (cleaned) prices[tier] = cleaned;
          else if (season?.prices?.[tier] !== undefined) clearedHere++;
        }
        return { ...season, prices };
      }),
    }));

    const before = tour.priceStartingFrom
      ? JSON.stringify(tour.priceStartingFrom)
      : 'none';
    const derived = deriveStartingPrice(cleanedPlans);
    const after = derived ? JSON.stringify(derived) : 'none';

    const startingChanged = before !== after;
    if (clearedHere === 0 && !startingChanged) continue;

    toursTouched++;
    tiersCleared += clearedHere;
    console.log(`${slug}`);
    if (clearedHere > 0) console.log(`    placeholder tiers removed: ${clearedHere}`);
    if (startingChanged) console.log(`    priceStartingFrom: ${before}  ->  ${after}`);

    if (APPLY) {
      const update: any = { $set: { pricingPlans: cleanedPlans } };
      if (derived) update.$set.priceStartingFrom = derived;
      else update.$unset = { priceStartingFrom: 1 };
      await Tour.updateOne({ _id: tour._id }, update);
    }
  }

  console.log(
    `\n${APPLY ? 'Updated' : 'Would update'} ${toursTouched} tour(s); ` +
      `${tiersCleared} placeholder tier(s) removed. ${tours.length} scanned.`
  );
  if (!APPLY && toursTouched > 0) console.log('Re-run with --apply to write these changes.');

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
