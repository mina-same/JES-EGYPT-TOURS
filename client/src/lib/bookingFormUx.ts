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
