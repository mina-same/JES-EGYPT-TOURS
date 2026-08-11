/**
 * Seasons are named by what they cost, not by their weather.
 *
 * The section is headed "Prices by Travel Date", so price is the axis it should
 * speak in. Mixing the two vocabularies — "Summer" beside "Peak Season" —
 * reads as two different naming schemes in three rows. It also mislabels the
 * business: September–March is Egypt's BEST weather and its busiest stretch,
 * so calling it by a weather word buries the reason the price differs, while
 * calling it "regular" against a hot, cheap summer is exactly right.
 *
 * The weather word is kept as a secondary descriptor rather than dropped — the
 * same shape the festive row uses for "Christmas & New Year".
 */
export const SEASON_KINDS = ['low', 'regular', 'peak'] as const;
export type SeasonKind = (typeof SEASON_KINDS)[number];

/** Month name -> number, matched case-insensitively against a season label. */
const MONTHS: Array<[RegExp, number]> = [
  [/jan/i, 1],
  [/feb/i, 2],
  [/mar/i, 3],
  [/apr/i, 4],
  [/may/i, 5],
  [/jun/i, 6],
  [/jul/i, 7],
  [/aug/i, 8],
  [/sep/i, 9],
  [/oct/i, 10],
  [/nov/i, 11],
  [/dec/i, 12],
];

/**
 * Which kind of season a date-range label describes.
 *
 * Derived from the months named in the text rather than matched against the
 * three canonical strings, because those strings carry years — "1 May 2026 –
 * 31 August 2026" becomes a different string every season without becoming a
 * different KIND of season. Matching whole strings would silently drop every
 * label the first time sales rolled the calendar forward.
 *
 * The three shapes actually in use:
 *   summer  May–August
 *   winter  September–December plus January–March
 *   peak    a late-December/early-January window AND a spring window, i.e.
 *           Christmas/New Year and Easter
 *
 * Anything it cannot place returns null and simply renders without a label —
 * the dates are still shown, so an unrecognised season loses decoration, never
 * information.
 */
/** Every month named anywhere in a label, as numbers. */
const monthsIn = (text: string): Set<number> => {
  const months = new Set<number>();
  // Token by token so "1 May 2026 – 31 August 2026" yields {5, 8} rather than
  // every month whose name happens to appear inside another word.
  for (const token of text.split(/[^A-Za-z]+/)) {
    if (!token) continue;
    for (const [pattern, month] of MONTHS) {
      if (pattern.test(token)) {
        months.add(month);
        break;
      }
    }
  }
  return months;
};

export const classifySeason = (label: string | undefined | null): SeasonKind | null => {
  const text = (label || '').trim();
  if (!text) return null;

  const months = monthsIn(text);
  if (months.size === 0) return null;

  const has = (m: number) => months.has(m);

  // Warm months only: Egypt's hot, quiet, cheapest stretch.
  const warm = [5, 6, 7, 8].some(has);
  const cool = [10, 11, 12, 1, 2].some(has);
  if (warm && !cool) return 'low';

  // The shoulder months are what separate the long season from the festive
  // one. BOTH ranges span December into January and reach into March, so a
  // "December + January + spring" test matched the long season too and
  // labelled it Christmas. September/October/November appear only in the long
  // season; the festive windows are short and skip them entirely.
  const shoulder = [9, 10, 11].some(has);
  if (shoulder) return 'regular';

  // No shoulder months but still spanning the new year: the festive windows.
  if (has(12) && has(1)) return 'peak';

  // Cool months without the turn of the year — still the long season.
  if (cool) return 'regular';

  return null;
};

/** i18n key for a season kind, so callers do not rebuild the string. */
export const seasonLabelKey = (kind: SeasonKind): string =>
  `tourDetails.pricing.season_${kind}`;

/** The weather word that used to be the headline, kept as a subtitle. */
export const seasonDescriptorKey = (kind: SeasonKind): string =>
  `tourDetails.pricing.seasonDesc_${kind}`;

export const HOLIDAY_KINDS = ['christmas', 'easter'] as const;
export type HolidayKind = (typeof HOLIDAY_KINDS)[number];

export interface SeasonWindow {
  /** The date range exactly as the admin wrote it. */
  dates: string;
  /** The holiday this window covers, when it is recognisably one. */
  holiday: HolidayKind | null;
}

/**
 * Splits a season label into its separate date windows.
 *
 * A season is stored as one string because that is what an admin types, but
 * two of the three hold TWO windows joined by a slash:
 *
 *   "20 December 2026 – 5 January 2027 / 25 March 2027 – 15 April 2027"
 *
 * On one line the slash hides that these are two distinct periods, and the
 * reader has to parse the whole thing to count them. Split, they are two
 * countable rows.
 *
 * Windows are named where the months make it obvious — a turn-of-the-year
 * window is Christmas and New Year, a spring one is Easter — which answers the
 * question the peak row otherwise raises: why are two unrelated date ranges
 * grouped together? Inferred rather than entered, so no admin has to type it.
 */
export const splitSeasonWindows = (
  label: string | undefined | null,
  kind: SeasonKind | null
): SeasonWindow[] => {
  const text = (label || '').trim();
  if (!text) return [];

  const parts = text
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);

  // A single window needs no naming: nothing is ambiguous about one range.
  if (parts.length < 2) return [{ dates: text, holiday: null }];

  return parts.map((dates) => {
    // Only the festive season carries holidays. The regular season is ALSO two
    // windows and its second one runs January–March, so an unconditional
    // "spring window = Easter" rule labelled a four-month shoulder period as
    // Easter. The holiday is a property of the peak season, not of any spring.
    if (kind !== 'peak') return { dates, holiday: null };

    const months = monthsIn(dates);
    if (months.has(12) && months.has(1)) return { dates, holiday: 'christmas' as const };
    if (months.has(3) || months.has(4)) return { dates, holiday: 'easter' as const };
    return { dates, holiday: null };
  });
};

export const holidayLabelKey = (holiday: HolidayKind): string =>
  `tourDetails.pricing.holiday_${holiday}`;
