/**
 * Tour availability: one fixed choice plus free text.
 *
 * Nearly every tour runs every day, and typing "Daily" four times invited four
 * different wordings (the seeds alone hold "Daily", "Every Day", "Quotidiano"
 * and "Diario"). So "Daily" is a single pick that writes all four languages,
 * and anything else ("Mon, Wed & Fri") stays per-language free text.
 *
 * The stored shape is unchanged — still `{ en, de, it, es }` — so the tour
 * page and JSON-LD read it exactly as before.
 */

export type AvailabilityLocale = 'en' | 'de' | 'it' | 'es';

export type AvailabilityLabels = Record<AvailabilityLocale, string>;

export const AVAILABILITY_LOCALES: AvailabilityLocale[] = ['en', 'de', 'it', 'es'];

/** What the "Daily" choice saves. Each fits the 16-character sweet spot. */
export const DAILY_AVAILABILITY: AvailabilityLabels = {
  en: 'Daily',
  de: 'Täglich',
  it: 'Tutti i giorni',
  es: 'Todos los días',
};

export const EMPTY_AVAILABILITY: AvailabilityLabels = { en: '', de: '', it: '', es: '' };

const normalise = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase().replace(/\s+/g, ' ') : '';

const populatedLocales = (value: unknown): AvailabilityLocale[] => {
  if (!value || typeof value !== 'object') return [];
  const stored = value as Partial<AvailabilityLabels>;
  return AVAILABILITY_LOCALES.filter((locale) => normalise(stored[locale]).length > 0);
};

/** Whether a stored availability holds any text at all, in any language. */
export const hasAvailabilityValue = (value: unknown): boolean => populatedLocales(value).length > 0;

/**
 * Whether a stored availability is the "Daily" choice.
 *
 * Same rule as durations: every non-empty language must match the Daily label,
 * so a tour saved with only English "Daily" is still recognised and its blank
 * languages can be filled by picking Daily again.
 */
export const isDailyAvailability = (value: unknown): boolean => {
  const populated = populatedLocales(value);
  const stored = value as Partial<AvailabilityLabels>;
  return populated.length > 0 &&
    populated.every((locale) => normalise(stored[locale]) === normalise(DAILY_AVAILABILITY[locale]));
};

/** Languages left blank on a stored value — the ones picking Daily would fill. */
export const missingAvailabilityLocales = (value: unknown): AvailabilityLocale[] => {
  const populated = populatedLocales(value);
  return AVAILABILITY_LOCALES.filter((locale) => !populated.includes(locale));
};

/**
 * Whether the English text says "Daily" even though the value as a whole is
 * not the Daily choice — a tour translated by hand ("Quotidiano", "Diario").
 */
export const readsAsDaily = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false;
  return normalise((value as Partial<AvailabilityLabels>).en) === normalise(DAILY_AVAILABILITY.en);
};
