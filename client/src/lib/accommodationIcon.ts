import {
  ACCOMMODATION_ICONS,
  DEFAULT_ACCOMMODATION_ICON,
  LEGACY_ACCOMMODATION_ICONS,
  type AccommodationIcon,
} from "@/types/tour";

const CURRENT = new Set<string>(ACCOMMODATION_ICONS);

/**
 * Turns whatever is stored on a row into a glyph name that can be drawn.
 *
 * One function for the whole client: the renderer and the API normalizer used
 * to each have their own idea of what an unrecognised value meant, so the same
 * row could normalize to `city` and then draw the hotel glyph.
 *
 * Trims and lower-cases first — an icon is an enum, and `"Temple "` from a
 * hand-edited document should not silently become the default.
 */
export const resolveAccommodationIcon = (value: unknown): AccommodationIcon => {
  if (typeof value !== "string") return DEFAULT_ACCOMMODATION_ICON;

  const key = value.trim().toLowerCase();
  if (CURRENT.has(key)) return key as AccommodationIcon;

  /* `Object.hasOwn`, not a plain lookup: a stored value of "constructor" or
     "toString" would otherwise find an inherited member of Object.prototype,
     return a function where an icon name is declared, and draw nothing. */
  if (Object.hasOwn(LEGACY_ACCOMMODATION_ICONS, key)) {
    return (LEGACY_ACCOMMODATION_ICONS as Record<string, AccommodationIcon>)[key];
  }

  return DEFAULT_ACCOMMODATION_ICON;
};

/**
 * Guesses the icon from the place that was typed.
 *
 * Ordered most-specific first, and read as DESTINATIONS: the question each
 * pattern answers is "which place is this?", never "what kind of building is
 * it?". That is why Philae sits with Aswan — it is an island in Aswan, and the
 * colonnade glyph is drawn from its temple — rather than with Luxor.
 *
 * Only the location is ever matched, never the hotel text: "Steigenberger
 * Pyramids" is a hotel in Cairo, and letting the hotel name vote would draw
 * pyramids beside a city stop.
 */
export const ACCOMMODATION_ICON_HINTS: Array<[RegExp, AccommodationIcon]> = [
  [/giza|pyramid|haram/i, "pyramids"],
  /* `nile` only as a label in its own right ("Nile", "The Nile", "Nile
     Cruise"). It used to match anywhere in the string, which would have drawn a
     boat beside a land hotel on the "Nile Corniche". `\bm\/?s\b` is likewise
     anchored, though note it still matches a bare "Ms". */
  [/\b(?:cruise|felucca|dahabiya|boat|m\/?s)\b|^(?:the\s+)?nile$/i, "cruise"],
  [/aswan|nubian?|elephantine|sehel|philae/i, "colonnade"],
  /* The Nile temple towns. `valley of` is spelled out rather than left open:
     bare "valley of" also caught the Valley of the Whales, which is in Fayoum
     and belongs to the desert rule two lines down. */
  [/luxor|abu ?simbel|karnak|edfu|kom ?ombo|temple|valley of the (?:kings|queens|nobles)/i, "temple"],
  [/hurghada|sharm|marsa|dahab|taba|sahl|red ?sea|beach|coast|alamein|soma|gouna/i, "sea"],
  [/siwa|oasis|desert|bahariya|farafra|safari|fayoum|valley of the whales|wadi el.?hitan/i, "desert"],
  [/cairo|alexandria|city|downtown|zamalek|heliopolis|maadi/i, "city"],
];

/** The suggested icon for a place name, or null when nothing matches. */
export const guessAccommodationIcon = (
  location: string | undefined
): AccommodationIcon | null => {
  const text = (location || "").trim();
  if (!text) return null;
  for (const [pattern, icon] of ACCOMMODATION_ICON_HINTS) {
    if (pattern.test(text)) return icon;
  }
  return null;
};

/** True when a row carries nothing a reader could use. Such rows render as an
 *  icon with two empty lines beside it, which reads as a broken page. */
export const isEmptyAccommodation = (row: {
  location?: unknown;
  hotels?: unknown;
}): boolean => {
  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  return !text(row?.location) && !text(row?.hotels);
};
