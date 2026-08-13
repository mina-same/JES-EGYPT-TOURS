const DEFAULT_SITE_URL = "https://www.jesegypttours.com";

const ANCHOR_TAG_PATTERN = /<a\b([^>]*)>/gi;
/** Quill puts an empty <span class="ql-ui"> inside every list item as an editor
 *  affordance. It holds no content, so shipping it adds one dead element to the
 *  DOM per bullet -- 38 of them on a single tour page -- and puts editor markup
 *  in front of crawlers. */
const EDITOR_UI_SPAN_PATTERN =
  /<span\b[^>]*\bclass\s*=\s*(["'])[^"']*\bql-ui\b[^"']*\1[^>]*>\s*<\/span>/gi;
const HREF_ATTRIBUTE_PATTERN = /\bhref\s*=\s*(["'])(.*?)\1/i;
const TARGET_ATTRIBUTE_PATTERN = /\s+target\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const REL_ATTRIBUTE_PATTERN = /\s+rel\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^www\./, "");
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function decodeAttribute(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
  };
  const decodeCodePoint = (entity: string, numericValue: number) =>
    Number.isInteger(numericValue) && numericValue >= 0 && numericValue <= 0x10ffff
      ? String.fromCodePoint(numericValue)
      : entity;

  return value
    .replace(/&(amp|quot|apos|lt|gt);/gi, (entity, name: string) =>
      namedEntities[name.toLowerCase()] ?? entity
    )
    .replace(/&#(\d+);/g, (entity, codePoint: string) => {
      const numericValue = Number(codePoint);
      return decodeCodePoint(entity, numericValue);
    })
    .replace(/&#x([\da-f]+);/gi, (entity, codePoint: string) => {
      const numericValue = Number.parseInt(codePoint, 16);
      return decodeCodePoint(entity, numericValue);
    });
}

function removeExternalNavigationAttributes(attributes: string): string {
  const withoutTarget = attributes.replace(TARGET_ATTRIBUTE_PATTERN, "");

  return withoutTarget.replace(
    REL_ATTRIBUTE_PATTERN,
    (_attribute, doubleQuoted: string, singleQuoted: string, unquoted: string) => {
      const relValue = doubleQuoted ?? singleQuoted ?? unquoted ?? "";
      const remainingTokens = relValue
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean)
        .filter((token) => !["noopener", "noreferrer"].includes(token.toLowerCase()));

      return remainingTokens.length > 0
        ? ` rel="${escapeAttribute(remainingTokens.join(" "))}"`
        : "";
    }
  );
}

/**
 * Makes same-site anchors behave like internal navigation while leaving
 * external links untouched. This also upgrades legacy rich text that Quill
 * saved with target="_blank" on every link.
 */
export function normalizeRichTextInternalLinks(
  html: string | null | undefined,
  siteUrl = process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_SITE_URL
): string {
  const value = String(html ?? "").replace(EDITOR_UI_SPAN_PATTERN, "");
  if (!value) return "";

  let site: URL;
  try {
    site = new URL(siteUrl);
  } catch {
    site = new URL(DEFAULT_SITE_URL);
  }

  const siteHostname = normalizeHostname(site.hostname);

  return value.replace(ANCHOR_TAG_PATTERN, (anchorTag, attributes: string) => {
    const hrefMatch = attributes.match(HREF_ATTRIBUTE_PATTERN);
    if (!hrefMatch) return anchorTag;

    const originalHref = decodeAttribute(hrefMatch[2].trim());
    let parsedHref: URL;

    try {
      parsedHref = new URL(originalHref, site);
    } catch {
      return anchorTag;
    }

    if (
      !["http:", "https:"].includes(parsedHref.protocol) ||
      normalizeHostname(parsedHref.hostname) !== siteHostname
    ) {
      return anchorTag;
    }

    const localHref = originalHref.startsWith("#")
      ? originalHref
      : originalHref.startsWith("?")
        ? originalHref
        : `${parsedHref.pathname}${parsedHref.search}${parsedHref.hash}`;

    const normalizedAttributes = removeExternalNavigationAttributes(attributes)
      .replace(
        HREF_ATTRIBUTE_PATTERN,
        () => `href="${escapeAttribute(localHref)}"`
      );

    return `<a${normalizedAttributes}>`;
  });
}
