/**
 * What the sticky (scroll-up) copy of the header is to the keyboard and to
 * assistive technology in each of its states.
 *
 * The copy repeats the real header for the pointer. It also carries a currency
 * and a language control, and those are a repeat only where the top bar is
 * shown: below TOP_BAR_QUERY the top bar is `display: none` (gotur.css) and
 * the sticky copy holds the page's only currency and language controls.
 *
 *   off screen            inert: no focus, no click, nothing read.
 *   on screen, top bar    a visual copy. Hidden from assistive technology, and
 *                         its two controls leave the tab order like its links,
 *                         so no control is met twice. It still takes clicks.
 *   on screen, no top bar its two controls are real: in the tab order and
 *                         exposed. The repeated logo, search, wishlist and
 *                         menu buttons stay hidden one by one, and the header
 *                         element gives up its landmark role so the page keeps
 *                         one banner.
 */
export const TOP_BAR_QUERY = "(min-width: 992px)";

export interface StickyHeaderState {
  inert: boolean;
  ariaHidden: true | undefined;
  role: "none" | undefined;
  /** For the currency and language controls. */
  switcherTabIndex: -1 | undefined;
}

export function getStickyHeaderState(shown: boolean, topBarShown: boolean): StickyHeaderState {
  if (!shown) {
    return { inert: true, ariaHidden: true, role: undefined, switcherTabIndex: -1 };
  }
  if (topBarShown) {
    return { inert: false, ariaHidden: true, role: undefined, switcherTabIndex: -1 };
  }
  return { inert: false, ariaHidden: undefined, role: "none", switcherTabIndex: undefined };
}
