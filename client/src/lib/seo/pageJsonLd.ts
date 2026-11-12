import type { FaqContent } from "@/lib/faqContent";
import { siteOrganizationId, siteWebsiteId } from "@/lib/seo/siteJsonLd";

/**
 * Page-level structured data: the home page's WebPage + FAQPage, and the
 * FAQPage of listing pages.
 *
 * These blocks only point at the company and the website by `@id`. Both are
 * defined once per page, by SEOProvider.
 */

/** Tags that end a line of text on screen. Removing them must leave a space. */
const BLOCK_TAG =
  /<\/?(?:p|div|br|li|ul|ol|h[1-6]|blockquote|table|thead|tbody|tfoot|tr|td|th|section|article|header|footer|aside|nav|hr|dl|dt|dd|figure|figcaption|pre)\b[^>]*>/gi;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  ndash: "–", mdash: "—", hellip: "…", lsquo: "‘", rsquo: "’",
  ldquo: "“", rdquo: "”", laquo: "«", raquo: "»", euro: "€", deg: "°",
};

function decodeEntity(entity: string, body: string): string {
  if (body[0] === "#") {
    const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
    return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : entity;
  }
  return NAMED_ENTITIES[body.toLowerCase()] ?? entity;
}

/**
 * Rich text as the visitor reads it, for a schema text field: tags removed
 * (inline tags such as links vanish, keeping their words; block tags become a
 * space), entities decoded, `[anchor](/path)` links reduced to the anchor, and
 * whitespace collapsed.
 *
 * Inline tags are removed without a space so "<a>Egypt</a>." stays "Egypt."
 * and not "Egypt .". The words then match the page exactly.
 */
export function faqPlainText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(BLOCK_TAG, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, decodeEntity)
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** A FAQPage node, or null when no row has both a question and an answer. */
export function buildFaqPageNode({
  id,
  locale,
  faqs,
}: {
  /** `<page url>#faq` */
  id: string;
  locale: string;
  /** The rows exactly as the page lists them (lib/faqContent.ts). */
  faqs: FaqContent[];
}): Record<string, unknown> | null {
  const mainEntity = faqs
    .map((faq) => ({ name: faqPlainText(faq.question), text: faqPlainText(faq.answer) }))
    .filter((faq) => faq.name && faq.text)
    .map((faq) => ({
      "@type": "Question",
      name: faq.name,
      acceptedAnswer: { "@type": "Answer", text: faq.text },
    }));

  if (mainEntity.length === 0) return null;
  return { "@type": "FAQPage", "@id": id, inLanguage: locale, mainEntity };
}

/** A FAQPage as a standalone JSON-LD document (listing pages), or null. */
export function buildFaqPageJsonLd(input: Parameters<typeof buildFaqPageNode>[0]) {
  const node = buildFaqPageNode(input);
  return node ? { "@context": "https://schema.org", ...node } : null;
}

/**
 * The home page's own nodes: a WebPage named and described exactly like the
 * page's <title> and meta description, and the FAQPage of the FAQ section.
 */
export function buildHomePageJsonLd({
  baseUrl,
  pageUrl,
  locale,
  name,
  description,
  faqs,
}: {
  /** Absolute site URL, no trailing slash. */
  baseUrl: string;
  /** The page's canonical URL, e.g. https://www.jesegypttours.com/en */
  pageUrl: string;
  locale: string;
  /** The page's meta title. */
  name: string;
  /** The page's meta description. */
  description: string;
  faqs: FaqContent[];
}) {
  const faqPage = buildFaqPageNode({ id: `${pageUrl}#faq`, locale, faqs });

  const webPage = {
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    inLanguage: locale,
    name,
    description,
    isPartOf: { "@id": siteWebsiteId(baseUrl) },
    about: { "@id": siteOrganizationId(baseUrl) },
    // Only when the FAQ section has rows: a pointer to a node that is not
    // there would be a broken reference.
    ...(faqPage ? { mainEntity: { "@id": faqPage["@id"] } } : {}),
  };

  return {
    "@context": "https://schema.org",
    "@graph": faqPage ? [webPage, faqPage] : [webPage],
  };
}
