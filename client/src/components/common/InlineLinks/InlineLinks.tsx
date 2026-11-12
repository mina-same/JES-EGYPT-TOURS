import React from "react";
import Link from "next/link";

/**
 * `[anchor text](/path)` inside a translated string. Only a path on this site
 * matches (one leading slash, no "//host"), so a translation can never add a
 * link to another website.
 */
const INLINE_LINK = /\[([^\]]+)\]\((\/(?!\/)[^)\s]*)\)/g;

/**
 * A translated sentence that may carry internal links.
 *
 * The homepage copy links to tours and guides from inside its paragraphs. The
 * translation files hold plain strings, so each link is written in the string
 * as `[anchor text](/de/kontakt)`, already naming the page in that string's
 * language; the path is used as it is. A string without that syntax renders
 * exactly as `{text}` would.
 */
function InlineLinks({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const pattern = new RegExp(INLINE_LINK.source, "g");
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <Link key={match.index} href={match[2]} className="inline-text-link">
        {match[1]}
      </Link>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return <>{parts}</>;
}

export default InlineLinks;
