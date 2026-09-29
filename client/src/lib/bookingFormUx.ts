export const BOOKING_FIELD_FOCUS_ORDER = [
  'name',
  'email',
  'phone',
  'dateFrom',
  'dateTo',
] as const;

type FocusableBookingElement = Pick<HTMLElement, 'focus' | 'scrollIntoView'>;

export const getFirstInvalidBookingField = (
  errors: Record<string, string>
): string | undefined =>
  BOOKING_FIELD_FOCUS_ORDER.find((field) => Boolean(errors[field]));

const systemPrefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

/** Move feedback into view without letting focus trigger a second, abrupt
 * browser scroll. The explicit motion argument keeps this behavior testable. */
export const focusWithComfortableScroll = (
  element: FocusableBookingElement | null,
  reduceMotion = systemPrefersReducedMotion()
): void => {
  if (!element) return;
  element.focus({ preventScroll: true });
  element.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'center',
    inline: 'nearest',
  });
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;

/** Same value one level deep: identical, or arrays / plain objects whose
 *  entries are identical. */
const sameShallowValue = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => Object.is(item, b[i]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every((key) => Object.is(a[key], b[key]));
  }
  return false;
};

/**
 * React.memo comparison for the booking card: equal when every prop has the
 * same value, comparing the price object ({ USD, EUR, GBP }) and the package
 * name list by their entries rather than their identity.
 *
 * The tour page re-renders several times right after it hydrates — it
 * measures its nav and sidebar, and useTourData re-maps the tour once the
 * related content arrives — and every render builds a new package array and,
 * after the re-map, a new price object with the same amounts. A new props
 * object reaching the form's still-dehydrated Suspense boundary is what made
 * React throw the server-rendered form away and show the placeholder until
 * the form's chunk arrived. Callbacks, if any are added later, still compare
 * by identity.
 */
export const sameBookingCardProps = <P extends object>(prev: Readonly<P>, next: Readonly<P>): boolean => {
  const a = prev as Record<string, unknown>;
  const b = next as Record<string, unknown>;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (!sameShallowValue(a[key], b[key])) return false;
  }
  return true;
};
