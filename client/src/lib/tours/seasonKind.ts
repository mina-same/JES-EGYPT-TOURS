export const SEASON_KINDS = ['summer', 'winter', 'peak'] as const;
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
export const classifySeason = (label: string | undefined | null): SeasonKind | null => {
  const text = (label || '').trim();
  if (!text) return null;

  const months = new Set<number>();
  // Scan token by token so "1 May 2026 – 31 August 2026" yields {5, 8} rather
  // than every month whose name happens to appear inside another word.
  for (const token of text.split(/[^A-Za-z]+/)) {
    if (!token) continue;
    for (const [pattern, month] of MONTHS) {
      if (pattern.test(token)) {
        months.add(month);
        break;
      }
    }
  }
  if (months.size === 0) return null;

  const has = (m: number) => months.has(m);

  // Summer: warm months only.
  const warm = [5, 6, 7, 8].some(has);
  const cool = [10, 11, 12, 1, 2].some(has);
  if (warm && !cool) return 'summer';

  // The shoulder months are what separate the long season from the festive
  // one. BOTH ranges span December into January and reach into March, so a
  // "December + January + spring" test matched the long season too and
  // labelled it Christmas. September/October/November appear only in the long
  // season; the festive windows are short and skip them entirely.
  const shoulder = [9, 10, 11].some(has);
  if (shoulder) return 'winter';

  // No shoulder months but still spanning the new year: the festive windows.
  if (has(12) && has(1)) return 'peak';

  // Cool months without the turn of the year — still the long season.
  if (cool) return 'winter';

  return null;
};

/** i18n key for a season kind, so callers do not rebuild the string. */
export const seasonLabelKey = (kind: SeasonKind): string =>
  `tourDetails.pricing.season_${kind}`;
