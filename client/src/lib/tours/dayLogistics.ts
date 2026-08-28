/**
 * The fixed option lists a day's logistics are chosen from.
 *
 * Same reasoning as the meals selector and the duration picker: the admin picks
 * a key, and every locale renders it in its own words. Typing "Cairo" into four
 * language boxes invited four spellings of one city — Kairo, Il Cairo, El Cairo
 * — and three of them being left blank.
 *
 * Mirrored by the key lists in `server/src/models/Tour.ts`. The server stays the
 * authority — it rejects a key that is not on these lists whichever route
 * submits it — but the editor and the tour page both need them, and a second
 * hand-written copy in each would drift.
 */

/** Egypt is the common case, so it sits at the top level of the picker. */
export const DAY_FLIGHT_EGYPT = [
  { key: 'cairo', label: 'Cairo' },
  { key: 'luxor', label: 'Luxor' },
  { key: 'aswan', label: 'Aswan' },
  { key: 'hurghada', label: 'Hurghada' },
  { key: 'sharmElSheikh', label: 'Sharm El-Sheikh' },
  { key: 'marsaAlam', label: 'Marsa Alam' },
  { key: 'alexandria', label: 'Alexandria' },
] as const;

/**
 * Everything abroad, behind one "Other" step so the seven Egyptian airports a
 * tour usually flies to are never buried under a list four times as long.
 */
export const DAY_FLIGHT_INTERNATIONAL = [
  {
    country: 'Jordan',
    airports: [
      { key: 'amman', label: 'Amman' },
      { key: 'aqaba', label: 'Aqaba' },
    ],
  },
  {
    country: 'United Arab Emirates',
    airports: [{ key: 'dubai', label: 'Dubai' }],
  },
  {
    country: 'Saudi Arabia',
    airports: [
      { key: 'riyadh', label: 'Riyadh' },
      { key: 'jeddah', label: 'Jeddah' },
      { key: 'medina', label: 'Medina' },
    ],
  },
  {
    country: 'Morocco',
    airports: [
      { key: 'casablanca', label: 'Casablanca' },
      { key: 'marrakech', label: 'Marrakech' },
      { key: 'fez', label: 'Fez' },
    ],
  },
  {
    country: 'Oman',
    airports: [
      { key: 'muscat', label: 'Muscat' },
      { key: 'salalah', label: 'Salalah' },
    ],
  },
  {
    country: 'Turkey',
    airports: [
      { key: 'istanbul', label: 'Istanbul' },
      { key: 'antalya', label: 'Antalya' },
      { key: 'cappadocia', label: 'Cappadocia' },
    ],
  },
  {
    country: 'Lebanon',
    airports: [{ key: 'beirut', label: 'Beirut' }],
  },
] as const;

/** Flat, for the fallback map and for anything that just needs every key. The
 *  spread widens the `as const` tuples so flatMap can flatten them. */
export const DAY_FLIGHT_OPTIONS: ReadonlyArray<{ key: string; label: string }> = [
  ...DAY_FLIGHT_EGYPT,
  ...DAY_FLIGHT_INTERNATIONAL.flatMap((group) => [...group.airports]),
];

export const DAY_ACCOMMODATION_OPTIONS = [
  { key: 'cairoHotel', label: 'Cairo Hotel' },
  { key: 'luxorHotel', label: 'Luxor Hotel' },
  { key: 'aswanHotel', label: 'Aswan Hotel' },
  { key: 'alexandriaHotel', label: 'Alexandria Hotel' },
  { key: 'hurghadaHotel', label: 'Hurghada Hotel' },
  { key: 'sharmElSheikhHotel', label: 'Sharm El-Sheikh Hotel' },
  { key: 'marsaAlamHotel', label: 'Marsa Alam Hotel' },
  { key: 'siwaOasisHotel', label: 'Siwa Oasis Hotel' },
  { key: 'bahariyaOasisHotel', label: 'Bahariya Oasis Hotel' },
  { key: 'nileCruise', label: 'Nile Cruise' },
] as const;

const toFallbacks = (options: ReadonlyArray<{ key: string; label: string }>) =>
  Object.fromEntries(options.map((o) => [o.key, o.label])) as Record<string, string>;

/** English labels by key — the i18next fallbacks, so a half-updated locale can
 *  never put "tourDetails.logistics.flyToOptions.cairo" in front of a visitor. */
export const DAY_FLIGHT_FALLBACKS = toFallbacks(DAY_FLIGHT_OPTIONS);
export const DAY_ACCOMMODATION_FALLBACKS = toFallbacks(DAY_ACCOMMODATION_OPTIONS);

/** Radix Select cannot hold an item whose value is the empty string, and both
 *  fields are optional, so "not set" travels as this sentinel inside a picker
 *  and is stored as an absent value. */
export const DAY_LOGISTICS_UNSET = '__unset__';
