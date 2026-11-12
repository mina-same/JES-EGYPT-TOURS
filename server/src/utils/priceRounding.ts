/**
 * The site's ONE rule for a converted price (USD × rate): the nearest 5, never
 * below 5 (92 → 90, 79 → 80, 97.5 → 100). Manual prices — a typed EUR or GBP
 * amount, and every USD amount — never pass through here; they are used as
 * entered.
 *
 * Mirror of client/src/lib/currency/priceFormat.ts `roundConvertedPrice`,
 * which the tour pages, cards, booking card and JSON-LD use;
 * client/tests/exchange-rates.test.ts checks the two give the same result.
 * Here it decides the listing card price, the price filter and sort, and the
 * booking quote, so all of them show the number the tour page shows.
 *
 * Rounded to cents first, so binary noise cannot move a value across a half
 * (100 × 0.925 is 92.4999… in floating point and must count as 92.5 → 95).
 * Written as floor(x + 0.5) so `roundConvertedPriceExpression` below can
 * compute the same double in MongoDB, whose $round rounds halves to even.
 */
export const roundConvertedPrice = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const cents = Math.floor(value * 100 + 0.5) / 100;
  return Math.max(5, Math.floor(cents / 5 + 0.5) * 5);
};

/** `roundConvertedPrice` as an aggregation expression, step for step. */
export const roundConvertedPriceExpression = (value: unknown): Record<string, unknown> => {
  const cents = { $divide: [{ $floor: { $add: [{ $multiply: [value, 100] }, 0.5] } }, 100] };
  return { $max: [5, { $multiply: [{ $floor: { $add: [{ $divide: [cents, 5] }, 0.5] } }, 5] }] };
};
