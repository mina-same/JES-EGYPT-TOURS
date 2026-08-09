import React from "react";

/**
 * Shuttle van, for the "Pickup & Drop-off" fact.
 *
 * Drawn here rather than picked from gotur-icons because that font has no
 * vehicle, transfer or pickup glyph at all — its nearest entries are map pins,
 * which the Location fact right next door already uses, so the two facts would
 * have carried the same picture.
 *
 * Built to sit beside those glyphs without looking foreign: solid fill, cut-out
 * windows and hubs instead of strokes, sized in `em` so the 24px font-size on
 * `.tour-listing-details__info-area__icon` drives it, and `currentColor` so it
 * follows whatever colour the fact list sets.
 */
export const PickupIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className,
  style,
}) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    className={className}
    style={{ display: "block", ...style }}
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    {/* Body, with the two cabin windows knocked out. */}
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.4 6.2H13.1c.63 0 1.23.27 1.65.74L18.05 10.4c.17.19.4.32.65.37l1.35.25C20.75 11.13 21.4 11.9 21.4 12.8V14.6c0 .66-.54 1.2-1.2 1.2H19.5a3 3 0 0 0-6 0H10.2a3 3 0 0 0-6 0H3.4c-.66 0-1.2-.54-1.2-1.2V8.4C2.2 7.19 3.19 6.2 4.4 6.2ZM5.2 7.9H9a.6.6 0 0 1 .6.6V10.5a.6.6 0 0 1-.6.6H5.2a.6.6 0 0 1-.6-.6V8.5a.6.6 0 0 1 .6-.6ZM11.2 7.9h1.9c.3 0 .58.13.78.35L16.5 11.1H11.2a.6.6 0 0 1-.6-.6V8.5a.6.6 0 0 1 .6-.6Z"
    />
    {/* Wheels, each a ring so the hub reads at small sizes. */}
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.2 13.3a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm0 1.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM16.5 13.3a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm0 1.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
    />
  </svg>
);

export default PickupIcon;
