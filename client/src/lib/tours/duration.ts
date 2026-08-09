/**
 * The fixed catalogue of tour durations.
 *
 * Duration used to be four free-text boxes, which meant every tour invented its
 * own wording ("1 Day", "one day", "8 hrs") and the German, Italian and Spanish
 * versions were only filled in when someone remembered. Both problems are the
 * same problem: the value is not really free text, it is a choice from a short
 * list. So the list lives here, already translated, and the admin picks one
 * entry that writes all four languages at once.
 *
 * The stored shape is unchanged — still `{ en, de, it, es }` — so nothing on the
 * visitor side, in the API, or in the database has to know this file exists.
 * Tours saved before the catalogue keep whatever text they hold; the editor
 * surfaces such a value as "custom" rather than silently rewriting it.
 */

export type DurationLocale = 'en' | 'de' | 'it' | 'es';

export type DurationLabels = Record<DurationLocale, string>;

export interface DurationOption {
  /** Stable key for the picker. Never stored — the labels are what get saved. */
  id: string;
  /** Which of the two picker groups this belongs to. */
  group: 'hours' | 'days';
  labels: DurationLabels;
}

/** Day-tour lengths, in hours. */
const HOUR_STEPS = [2, 4, 6, 8, 12] as const;

/** Multi-day trips run from 2 days / 1 night up to this many days. */
const MAX_DAYS = 20;

const hourOption = (hours: number): DurationOption => ({
  id: `h${hours}`,
  group: 'hours',
  labels: {
    en: `${hours} Hours`,
    de: `${hours} Stunden`,
    it: `${hours} Ore`,
    es: `${hours} Horas`,
  },
});

const dayOption = (days: number): DurationOption => {
  const nights = days - 1;
  const plural = nights > 1;
  return {
    id: `d${days}`,
    group: 'days',
    labels: {
      en: `${days} Days / ${nights} ${plural ? 'Nights' : 'Night'}`,
      de: `${days} Tage / ${nights} ${plural ? 'Nächte' : 'Nacht'}`,
      it: `${days} Giorni / ${nights} ${plural ? 'Notti' : 'Notte'}`,
      es: `${days} Días / ${nights} ${plural ? 'Noches' : 'Noche'}`,
    },
  };
};

export const HOUR_DURATION_OPTIONS: DurationOption[] = HOUR_STEPS.map(hourOption);

export const DAY_DURATION_OPTIONS: DurationOption[] = Array.from(
  { length: MAX_DAYS - 1 },
  (_, i) => dayOption(i + 2)
);

export const DURATION_OPTIONS: DurationOption[] = [
  ...HOUR_DURATION_OPTIONS,
  ...DAY_DURATION_OPTIONS,
];

export const EMPTY_DURATION: DurationLabels = { en: '', de: '', it: '', es: '' };

const normalise = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase().replace(/\s+/g, ' ') : '';

/**
 * Find the catalogue entry a stored duration corresponds to.
 *
 * Matching is not restricted to English: a tour translated by hand before this
 * list existed may hold "3 Tage / 2 Nächte" with an empty `en`, and that is the
 * same duration. Any language matching is enough to recognise it, and picking
 * it up this way also repairs the missing languages on the next save.
 */
export const findDurationOption = (value: unknown): DurationOption | undefined => {
  if (!value || typeof value !== 'object') return undefined;
  const stored = value as Partial<DurationLabels>;

  return DURATION_OPTIONS.find((option) =>
    (Object.keys(option.labels) as DurationLocale[]).some((locale) => {
      const candidate = normalise(stored[locale]);
      return candidate.length > 0 && candidate === normalise(option.labels[locale]);
    })
  );
};

/** Whether a stored duration holds any text at all, in any language. */
export const hasDurationValue = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false;
  const stored = value as Partial<DurationLabels>;
  return (['en', 'de', 'it', 'es'] as DurationLocale[]).some(
    (locale) => normalise(stored[locale]).length > 0
  );
};

/** The best text to show for a duration that is not in the catalogue. */
export const describeCustomDuration = (value: unknown): string => {
  if (!value || typeof value !== 'object') return '';
  const stored = value as Partial<DurationLabels>;
  const first = (['en', 'de', 'it', 'es'] as DurationLocale[])
    .map((locale) => (typeof stored[locale] === 'string' ? stored[locale]!.trim() : ''))
    .find((text) => text.length > 0);
  return first || '';
};
