import React from "react";
import { resolveAccommodationIcon } from "@/lib/accommodationIcon";
import type { AccommodationIcon } from "@/types/tour";

/**
 * Destination glyphs for the accommodation list.
 *
 * Drawn here rather than pulled from Font Awesome because FA5 Free — the set
 * this site ships — has no pyramid and no felucca, which are the two most
 * recognisable Egyptian silhouettes. Mixing one custom SVG in among icon-font
 * glyphs also reads badly: different stroke weights, different optical sizes.
 * One hand-tuned set at a shared 24px viewBox keeps them consistent.
 *
 * `currentColor` throughout, so the colour is decided by CSS.
 *
 * Each glyph names a DESTINATION, not a kind of building — see the note on
 * `ACCOMMODATION_ICONS`. Typed against the enum, so adding a value there
 * without drawing it is a compile error rather than a silent fallback.
 */
const GLYPHS: Record<AccommodationIcon, React.ReactNode> = {
  // Two pyramids and a ground line — the Giza silhouette.
  //
  // Three were drawn at first, but at 20px the flanking pair collided with the
  // main triangle's base and the whole thing read as one shape. Two, clearly
  // separated and different in size, is what actually reads at this scale.
  pyramids: (
    <>
      <path d="M9 5.5 2.5 17.5h13L9 5.5Z" />
      <path d="M17 10 12.6 17.5h8.9L17 10Z" opacity="0.85" />
      <path d="M1.5 20.5h21" strokeLinecap="round" />
    </>
  ),
  /* Obelisk with a temple base — the Nile temple towns: Luxor, Abu Simbel,
     Karnak, Edfu, Kom Ombo.
     NOT Aswan: this comment used to claim Aswan too, while `colonnade` below
     also claimed it. That contradiction is why the same city ended up drawn
     two different ways on two tours. Aswan is the colonnade. */
  temple: (
    <>
      <path d="M12 2.5 9.8 7.5h4.4L12 2.5Z" />
      <path d="M9.8 7.5h4.4l-.7 10.5h-3L9.8 7.5Z" />
      <path d="M6 18h12" strokeLinecap="round" />
      <path d="M4 21.5h16" strokeLinecap="round" />
    </>
  ),
  // Skyline — Cairo, Alexandria.
  city: (
    <>
      <path d="M3 21V9.5l5.5-3v6" />
      <path d="M8.5 12.5H15V21" />
      <path d="M15 15h6v6" />
      <path d="M2 21.5h20" strokeLinecap="round" />
    </>
  ),
  // Felucca / cruise boat on the Nile.
  cruise: (
    <>
      <path d="M12 3 12 14" strokeLinecap="round" />
      <path d="M12 4.5 5.5 14H12" />
      <path d="M13.5 7 19 14h-5.5" opacity="0.8" />
      <path d="M2.5 17.5c1.6 0 1.6 1.6 3.2 1.6s1.6-1.6 3.2-1.6 1.6 1.6 3.2 1.6 1.6-1.6 3.2-1.6 1.6 1.6 3.2 1.6 1.6-1.6 3.2-1.6" strokeLinecap="round" />
    </>
  ),
  // Sun over water — Hurghada, Sharm, the Red Sea.
  sea: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M12 2.2v1.4M12 12.4v1.4M18.1 8h-1.4M7.3 8H5.9M16.3 4.3l-1 1M8.7 11.7l-1 1M16.3 11.7l-1-1M8.7 4.3l-1-1" strokeLinecap="round" opacity="0.8" />
      <path d="M2.5 17.5c1.6 0 1.6 1.5 3.2 1.5s1.6-1.5 3.2-1.5 1.6 1.5 3.2 1.5 1.6-1.5 3.2-1.5 1.6 1.5 3.2 1.5 1.6-1.5 3.2-1.5" strokeLinecap="round" />
      <path d="M2.5 21c1.6 0 1.6 1.4 3.2 1.4s1.6-1.4 3.2-1.4 1.6 1.4 3.2 1.4 1.6-1.4 3.2-1.4" strokeLinecap="round" opacity="0.6" />
    </>
  ),
  // Dunes and a palm — Siwa, the Western Desert.
  desert: (
    <>
      <path d="M2 19c3-5 5.5-5 8 0" strokeLinecap="round" />
      <path d="M10 19c2.5-4 4.5-4 7 0" strokeLinecap="round" opacity="0.8" />
      <path d="M17 19V9" strokeLinecap="round" />
      <path d="M17 9c-2.2-1.6-4 .4-3 1.6M17 9c2.2-1.6 4 .4 3 1.6M17 9c0-2.4 1.6-3 2.8-2.6" strokeLinecap="round" />
      <path d="M1 21.5h22" strokeLinecap="round" />
    </>
  ),
  /* Colonnade — Aswan. A horizontal rhythm of columns, so it separates from
     Luxor's single vertical shaft at a glance, and it carries the same
     monumental tone as the rest of the set. A dwelling was tried first and
     read as budget lodging next to the four- and five-star hotels listed
     beside it. */
  colonnade: (
    <>
      <path d="M4.5 6.5h15" />
      <path d="M3 9.5h18" strokeLinecap="round" />
      <path d="M6.5 9.5V18.5M12 9.5V18.5M17.5 9.5V18.5" />
      <path d="M4.5 18.5h15" strokeLinecap="round" />
      <path d="M2 21.5h20" strokeLinecap="round" />
    </>
  ),
  // Generic stay.
  hotel: (
    <>
      <path d="M4 21V5.5h16V21" />
      <path d="M8 9h2M14 9h2M8 13h2M14 13h2" strokeLinecap="round" />
      <path d="M10 21v-4h4v4" />
      <path d="M2 21.5h20" strokeLinecap="round" />
    </>
  ),
};

export const StayIcon: React.FC<{ name?: string }> = ({ name }) => {
  // Legacy names, casing and stray whitespace are all settled in one place, so
  // the glyph drawn here always matches the value the rest of the app resolved.
  const glyph = GLYPHS[resolveAccommodationIcon(name)];

  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {glyph}
    </svg>
  );
};

export default StayIcon;
