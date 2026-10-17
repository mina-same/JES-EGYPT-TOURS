/**
 * What the sticky (scroll-up) copy of the header is to the keyboard and to
 * assistive technology.
 *
 * The copy repeats the real header for the pointer, at every width. Its
 * language and currency controls repeat real ones too: from TOP_BAR_QUERY up
 * the top bar's switchers, below it the real header's language & currency
 * button (SitePreferences), which the copy shows in their place. Below the
 * breakpoint the copy used to hold the page's only two switchers, so it was
 * exposed there; it never is now.
 *
 *   off screen   inert: no focus, no click, nothing read.
 *   on screen    a visual copy. Hidden from assistive technology, and its
 *                controls leave the tab order like its links, so no control
 *                is met twice. It still takes clicks.
 */
export const TOP_BAR_QUERY = "(min-width: 992px)";

export interface StickyHeaderState {
  inert: boolean;
  ariaHidden: true;
}

export function getStickyHeaderState(shown: boolean): StickyHeaderState {
  return { inert: !shown, ariaHidden: true };
}
