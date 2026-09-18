/**
 * Serialize a JSON-LD object for a <script type="application/ld+json"> body.
 *
 * JSON.stringify leaves "<" as-is, so a string containing "</script>" (for
 * example one that stripHtml decoded from `&lt;/script&gt;`) would end the
 * script element early. `\u003c` is the same character to a JSON parser, so
 * the parsed values are unchanged.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
