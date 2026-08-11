/**
 * Day tour vs package, and the pricing plans each may carry.
 *
 * Mirrors `server/src/models/Tour.ts`. The server stays the authority — it
 * rejects an illegal combination whichever route submits it — but the admin
 * editor and the booking form both need the same rule to decide what to show,
 * and a second hand-written copy in each of them would drift.
 */
export const TOUR_KINDS = ['DAY_TOUR', 'PACKAGE'] as const;
export type TourKind = (typeof TOUR_KINDS)[number];

export const DAY_TOUR_PLAN_NAMES = ['TOUR PRICES'] as const;
export const PACKAGE_PLAN_NAMES = [
  'AFFORDABLE',
  'GOLD (5 STAR STANDARD)',
  'DIAMOND (5 STAR LUXURY)',
] as const;

export const ALL_PLAN_NAMES = [...PACKAGE_PLAN_NAMES, ...DAY_TOUR_PLAN_NAMES] as const;

/** Sentinel for "I haven't decided" — deliberately not a plan name, so it can
 *  never be mistaken for one that was priced. */
export const PACKAGE_NOT_SURE = 'NOT_SURE';

export const plansAllowedForKind = (kind?: TourKind | null): readonly string[] =>
  kind === 'DAY_TOUR'
    ? DAY_TOUR_PLAN_NAMES
    : kind === 'PACKAGE'
      ? PACKAGE_PLAN_NAMES
      : ALL_PLAN_NAMES;

/** A day tour is a single price, so it can hold exactly one plan. */
export const maxPlansForKind = (kind?: TourKind | null): number =>
  kind === 'DAY_TOUR' ? 1 : PACKAGE_PLAN_NAMES.length;

/** Plans that would become illegal if the tour switched to `kind` — this is
 *  what the admin is warned about before anything is discarded. */
export const plansIncompatibleWith = (
  kind: TourKind,
  plans: Array<{ planName?: string }> | null | undefined
): string[] => {
  const allowed = plansAllowedForKind(kind);
  const names = (plans || []).map((p) => p?.planName).filter(Boolean) as string[];
  const stray = names.filter((n) => !allowed.includes(n));

  // Switching to a day tour also caps the count at one, so any plan beyond the
  // first is lost even when its name is allowed.
  if (kind === 'DAY_TOUR') {
    const keepable = names.filter((n) => allowed.includes(n));
    return [...stray, ...keepable.slice(1)];
  }
  return stray;
};
