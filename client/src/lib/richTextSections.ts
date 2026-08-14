/** Splits editor HTML into one chunk per heading, so a block written as a flat
 *  run of `<h3>` + `<p>` pairs can be laid out as a grid of cards instead of a
 *  single column. The "What You'll Love" section on a tour page is the caller:
 *  its container is far wider than any comfortable line length, so a single
 *  column leaves a quarter of the card empty no matter where the measure is
 *  capped.
 *
 *  Deliberately a string split rather than a DOM parse. This runs during SSR
 *  as well as in the browser, and `DOMParser` does not exist in Node — pulling
 *  in a parser to serialise the result straight back to strings for
 *  `dangerouslySetInnerHTML` would be a dependency and a render cost for
 *  nothing. The trade is that the split cannot see nesting, which is what the
 *  balance checks below are for. */

/** Lookahead, so the heading that starts each chunk is kept rather than eaten. */
const HEADING_SPLIT_PATTERN = /(?=<h[1-6][\s>])/i;
const HEADING_OPEN_PATTERN = /<h[1-6][\s>]/gi;
/** Same pattern for `search`, which needs a non-global regex to report an
 *  index rather than walk `lastIndex`. */
const FIRST_HEADING_PATTERN = /<h[1-6][\s>]/i;
/** Only the wrappers an editor can actually produce around a whole block. An
 *  unclosed one of these inside a chunk means the split cut through a
 *  container, and the chunks would render as broken HTML. */
const BALANCED_TAGS = ["div", "ul", "ol", "table", "blockquote", "section"] as const;

function countMatches(html: string, pattern: RegExp): number {
  return (html.match(pattern) || []).length;
}

function isSelfContained(chunk: string): boolean {
  return BALANCED_TAGS.every((tag) => {
    const open = countMatches(chunk, new RegExp(`<${tag}\\b`, "gi"));
    const close = countMatches(chunk, new RegExp(`</${tag}\\s*>`, "gi"));
    return open === close;
  });
}

/**
 * Returns one self-contained HTML string per heading, or `null` when the
 * content is not shaped like a list of headed sections and should be rendered
 * as it always was. Returning `null` rather than a one-element array keeps the
 * decision at the call site explicit: a grid of one is not a grid.
 *
 * Bails when:
 * - there are fewer than two headings — nothing to lay out side by side;
 * - anything but whitespace precedes the first heading, which means either an
 *   intro paragraph that belongs to no section or, as in the seeded tours, a
 *   `<div class="love-section">` wrapping the lot;
 * - any chunk has an unbalanced wrapper, i.e. the split landed inside a
 *   container rather than between siblings.
 */
export function splitRichTextByHeading(html: string | null | undefined): string[] | null {
  if (!html) return null;
  if (countMatches(html, HEADING_OPEN_PATTERN) < 2) return null;

  /* The lead is measured by index rather than taken as the first element of
     the split. `String.prototype.split` drops a zero-width match at position 0,
     so content that opens on a heading — which is the normal case — yields no
     empty first chunk to test, and reading one out of the array treats the
     first benefit as the lead and rejects every well-formed block. */
  const firstHeading = html.search(FIRST_HEADING_PATTERN);
  if (firstHeading < 0 || html.slice(0, firstHeading).trim()) return null;

  const sections = html.slice(firstHeading).split(HEADING_SPLIT_PATTERN);
  if (sections.length < 2) return null;
  if (!sections.every(isSelfContained)) return null;

  return sections.map((section) => section.trim());
}
