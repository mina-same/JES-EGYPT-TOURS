import React from "react";
import type { SeasonKind } from "@/lib/tours/seasonKind";

/**
 * Season glyphs, drawn to match the accommodation set (same 24px box, same
 * stroke weight) so the pricing section reads as one family of icons.
 *
 * Winter is a sun behind cloud, NOT a snowflake: an Egyptian winter is the mild
 * high season, and a snowflake beside "Luxor in January" would misdescribe the
 * weather a traveller is buying.
 */
const GLYPHS: Record<SeasonKind, React.ReactNode> = {
  // Full sun — the hot months.
  summer: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path
        d="M12 2.6v2.2M12 19.2v2.2M21.4 12h-2.2M4.8 12H2.6M18.6 5.4l-1.6 1.6M7 17l-1.6 1.6M18.6 18.6 17 17M7 7 5.4 5.4"
        strokeLinecap="round"
      />
    </>
  ),
  // Sun behind cloud — the mild season.
  winter: (
    <>
      <circle cx="8.5" cy="8" r="3.1" />
      <path d="M8.5 2.4v1.6M3 8H1.4M4.6 4.1 3.5 3M12.9 4.1 14 3" strokeLinecap="round" opacity="0.85" />
      <path d="M9 19.5h8.6a3.4 3.4 0 0 0 .3-6.8 4.6 4.6 0 0 0-8.7-1 3.9 3.9 0 0 0-.2 7.8Z" />
    </>
  ),
  // Sparkle — Christmas and Easter, the premium window.
  peak: (
    <>
      <path d="M12 2.8 13.9 9l6.2 1.9-6.2 1.9L12 19l-1.9-6.2L3.9 10.9 10.1 9 12 2.8Z" />
      <path d="M18.6 16.4l.7 2.2 2.2.7-2.2.7-.7 2.2-.7-2.2-2.2-.7 2.2-.7.7-2.2Z" opacity="0.8" />
    </>
  ),
};

export const SeasonIcon: React.FC<{ kind: SeasonKind }> = ({ kind }) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {GLYPHS[kind]}
  </svg>
);

export default SeasonIcon;
