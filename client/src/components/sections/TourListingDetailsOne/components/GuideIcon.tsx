import React from "react";

/**
 * Guide with a raised pennant — the pictogram a traveller already reads as
 * "the person leading this tour".
 *
 * gotur-icons offers `icon-user`, `icon-group` and `icon-tourist` for people,
 * but a bare silhouette says nothing about guiding, and a bare `icon-flag`
 * reads as a destination marker. The two together do the job, so they are drawn
 * as one shape here.
 *
 * Same construction rules as [PickupIcon]: solid fill, `currentColor`, sized in
 * `em` off the 24px icon column, and kept to roughly the same optical height as
 * the font glyphs beside it so no fact looks larger than its neighbours.
 */
export const GuideIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
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
    {/* Head */}
    <path d="M7.6 4.6a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8Z" />
    {/* Shoulders */}
    <path d="M7.6 10.9c3.15 0 5.7 2.05 5.7 5.35v.65a1.3 1.3 0 0 1-1.3 1.3H3.2a1.3 1.3 0 0 1-1.3-1.3v-.65c0-3.3 2.55-5.35 5.7-5.35Z" />
    {/* Pole */}
    <path d="M16.2 4.5a.95.95 0 0 1 .95.95V17.3a.95.95 0 0 1-1.9 0V5.45a.95.95 0 0 1 .95-.95Z" />
    {/* Pennant */}
    <path d="M17.15 5.6 22.8 8.2 17.15 10.8Z" />
  </svg>
);

export default GuideIcon;
