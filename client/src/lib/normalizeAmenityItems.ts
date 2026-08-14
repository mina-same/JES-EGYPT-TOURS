// Turns amenity-style content into a flat list of HTML item strings.
// Handles the new format (localized HTML string with <ul><li> or <p>/<br>
// separated lines), plain strings, and the legacy array-of-items format.
export const normalizeAmenityItems = (value: unknown): string[] => {
  const values = Array.isArray(value) ? value : [value];

  return values.flatMap((item) => {
    if (!item) return [];

    const rawValue =
      typeof item === "object" && item !== null && "en" in item
        ? (item as { en?: unknown }).en
        : item;
    const raw = String(rawValue ?? "").trim();

    if (!raw) return [];

    const listItems = [...raw.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
      .map((match) => match[1].trim())
      .filter(Boolean);

    if (listItems.length > 0) return listItems;

    return raw
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p\s*>/gi, "\n")
      .replace(/<p\b[^>]*>/gi, "")
      .replace(/<\/div\s*>/gi, "\n")
      .replace(/<div\b[^>]*>/gi, "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  });
};

/**
 * True when the stored content is a numbered list rather than bullets.
 *
 * Quill writes both as <ol>, telling them apart only by data-list on each item,
 * so rendering every <ol> as bullets silently drops the numbering from any list
 * an editor deliberately numbered.
 */
export const isOrderedListContent = (value: unknown): boolean => {
  const item = Array.isArray(value) ? value[0] : value;
  const raw =
    typeof item === "object" && item !== null && "en" in item
      ? String((item as { en?: unknown }).en ?? "")
      : String(item ?? "");

  if (/data-list\s*=\s*["']?ordered/i.test(raw)) return true;
  // Older content has no data-list at all: <ol> means numbered, <ul> bullets.
  return /<ol[\s>]/i.test(raw) && !/data-list/i.test(raw);
};

/**
 * Ties a dash to the word before it.
 *
 * Packing entries read "Sun hat and sunglasses \u2014 for extended time outdoors".
 * When the term happens to end a line, the dash wraps on alone and opens the
 * next line, which reads as a bullet rather than as punctuation. A non-breaking
 * space keeps the two together; the ordinary space after the dash still lets
 * the explanation wrap normally.
 */
export const bindLeadingDash = (html: string): string =>
  html.replace(/ +([\u2013\u2014]) /g, "\u00A0$1 ");
