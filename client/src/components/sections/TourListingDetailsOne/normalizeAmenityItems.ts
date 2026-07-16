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
