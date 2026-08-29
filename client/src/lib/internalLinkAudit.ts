import { SUPPORTED_LOCALES, type SupportedLocale } from './url/locales';
import { getCanonicalStaticSlug, getLocalizedStaticSlug } from './url/staticSlugs';

// Audit every locale the site ships — never a second hand-kept copy of the
// list, or adding a language would silently stop auditing it.
const AUDIT_LOCALES = SUPPORTED_LOCALES;
const DEFAULT_SITE_URL = 'https://www.jesegypttours.com';
const ANCHOR_PATTERN = /<a\b([^>]*)>([\s\S]*?)(?:<\/a\s*>|(?=<a\b)|$)/gi;
const HAS_ANCHOR_PATTERN = /<a\b/i;
// Any SEO/meta field, not only the description: a link is equally dead inside
// a meta title, an OG title or a keywords list.
const METADATA_SOURCE_PATTERN = /\bseo\b|\b(?:meta|og|twitter) (?:title|description|keywords)\b/i;
// Relationship fields the API populates into a View page's payload. Their
// HTML belongs to the related document's own audit, not to this page.
// `featuredDestinations` is populated in full (no field projection) on the
// blog/tour category and subcategory endpoints, so leaving it out attributed
// another destination's body links to the category being viewed.
const POPULATED_RELATION_FIELDS = new Set([
  'author',
  'category',
  'destination',
  'editorialAuthor',
  'featuredBlogs',
  'featuredDestinations',
  'featuredTours',
  'relatedDestinations',
  'relatedPosts',
  'relatedTours',
  'subCategory',
  'subcategory',
  'tour',
]);

export type InternalLinkIssueSeverity = 'warning' | 'error';

export type InternalLinkIssueCode =
  | 'language_mismatch'
  | 'missing_locale'
  | 'absolute_internal_url'
  | 'insecure_http'
  | 'empty_anchor_text'
  | 'internal_nofollow'
  | 'link_in_metadata'
  | 'localized_slug_mismatch';

export interface InternalLinkIssue {
  code: InternalLinkIssueCode;
  severity: InternalLinkIssueSeverity;
  message: string;
}

export interface InternalLinkSource {
  label: string;
  /** A localized object, a legacy EN string, or a localized mixed array. */
  value: unknown;
}

export interface AuditedInternalLink {
  id: string;
  locale: SupportedLocale;
  source: string;
  anchorText: string;
  href: string;
  normalizedHref: string;
  resolvedUrl: string;
  targetLocale: SupportedLocale | null;
  samePageReference: boolean;
  issues: InternalLinkIssue[];
}

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^www\./, '');
}

function decodeHtml(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  };

  return value
    .replace(/&(amp|apos|gt|lt|nbsp|quot);/gi, (entity, name: string) =>
      namedEntities[name.toLowerCase()] ?? entity
    )
    .replace(/&#(\d+);/g, (entity, codePoint: string) => {
      const value = Number(codePoint);
      return Number.isInteger(value) && value >= 0 && value <= 0x10ffff
        ? String.fromCodePoint(value)
        : entity;
    })
    .replace(/&#x([\da-f]+);/gi, (entity, codePoint: string) => {
      const value = Number.parseInt(codePoint, 16);
      return Number.isInteger(value) && value >= 0 && value <= 0x10ffff
        ? String.fromCodePoint(value)
        : entity;
    });
}

function readAttribute(attributes: string, name: string): string | null {
  const pattern = new RegExp(
    `(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>` + '`' + `]+))`,
    'i'
  );
  const match = attributes.match(pattern);
  return match ? decodeHtml(match[1] ?? match[2] ?? match[3] ?? '') : null;
}

function getAnchorText(innerHtml: string): string {
  const text = decodeHtml(
    innerHtml
      .replace(/<span\b[^>]*\bclass\s*=\s*(["'])[^"']*\bql-ui\b[^"']*\1[^>]*>[\s\S]*?<\/span\s*>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();

  if (text) return text;

  const imageMatch = innerHtml.match(/<img\b([^>]*)>/i);
  const imageAlt = imageMatch ? readAttribute(imageMatch[1], 'alt')?.trim() : '';
  return imageAlt ? `[Image: ${imageAlt}]` : '';
}

function localeValue(value: unknown, locale: SupportedLocale): unknown {
  if (value == null) return undefined;
  if (typeof value === 'string' || Array.isArray(value)) return locale === 'en' ? value : undefined;
  if (typeof value === 'object') return (value as Record<string, unknown>)[locale];
  return undefined;
}

function contentStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(contentStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(contentStrings);
  return [];
}

function isSupportedLocale(value: string): value is SupportedLocale {
  return (AUDIT_LOCALES as readonly string[]).includes(value);
}

function analyzeAnchor({
  attributes,
  innerHtml,
  locale,
  source,
  site,
  siteHostname,
  id,
}: {
  attributes: string;
  innerHtml: string;
  locale: SupportedLocale;
  source: string;
  site: URL;
  siteHostname: string;
  id: string;
}): AuditedInternalLink | null {
  const rawHref = readAttribute(attributes, 'href');
  if (rawHref == null || !rawHref.trim()) return null;

  const href = rawHref.trim();
  let parsed: URL;
  try {
    parsed = new URL(href, site);
  } catch {
    return null;
  }

  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    normalizeHostname(parsed.hostname) !== siteHostname
  ) {
    return null;
  }

  const samePageReference = href.startsWith('#') || href.startsWith('?');
  const pathSegments = parsed.pathname.split('/').filter(Boolean).map((part) => part.toLowerCase());
  const firstPathSegment = pathSegments[0] ?? '';
  const targetLocale = isSupportedLocale(firstPathSegment) ? firstPathSegment : null;
  const anchorText = getAnchorText(innerHtml);
  const issues: InternalLinkIssue[] = [];
  const absoluteInternal = /^(?:https?:)?\/\//i.test(href);

  if (!anchorText) {
    issues.push({
      code: 'empty_anchor_text',
      severity: 'warning',
      message: 'Link has no readable anchor text',
    });
  }

  if (href.toLowerCase().startsWith('http://')) {
    issues.push({
      code: 'insecure_http',
      severity: 'warning',
      message: 'Internal URL uses HTTP instead of HTTPS',
    });
  }

  if (absoluteInternal) {
    issues.push({
      code: 'absolute_internal_url',
      severity: 'warning',
      message: 'Use a relative path for this internal URL',
    });
  }

  if (METADATA_SOURCE_PATTERN.test(source)) {
    issues.push({
      code: 'link_in_metadata',
      severity: 'warning',
      message: 'Links inside metadata are not rendered as clickable page links',
    });
  }

  const relTokens = (readAttribute(attributes, 'rel') || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (relTokens.includes('nofollow')) {
    issues.push({
      code: 'internal_nofollow',
      severity: 'warning',
      message: 'Internal link is marked nofollow',
    });
  }

  if (!samePageReference && !targetLocale) {
    issues.push({
      code: 'missing_locale',
      severity: 'warning',
      message: `URL has no supported language prefix (/${locale}/...)`,
    });
  } else if (targetLocale && targetLocale !== locale) {
    issues.push({
      code: 'language_mismatch',
      severity: 'error',
      message: `${locale.toUpperCase()} content links to the ${targetLocale.toUpperCase()} page`,
    });
  }

  // Static pages carry a different slug per language (/de/kontakt, not
  // /de/contact). next.config permanently redirects the wrong-language slug,
  // so linking to it costs a redirect hop on every internal click.
  if (targetLocale) {
    const staticSlug = pathSegments[1];
    const canonicalStaticSlug = staticSlug ? getCanonicalStaticSlug(staticSlug) : null;
    if (canonicalStaticSlug) {
      const expectedSlug = getLocalizedStaticSlug(canonicalStaticSlug, targetLocale);
      if (expectedSlug !== staticSlug) {
        issues.push({
          code: 'localized_slug_mismatch',
          severity: 'error',
          message: `Redirects to /${targetLocale}/${expectedSlug} — link to that URL directly`,
        });
      }
    }
  }

  return {
    id,
    locale,
    source,
    anchorText,
    href,
    normalizedHref: samePageReference
      ? href
      : `${parsed.pathname}${parsed.search}${parsed.hash}`,
    resolvedUrl: parsed.toString(),
    targetLocale,
    samePageReference,
    issues,
  };
}

/**
 * Extracts same-site links from the exact saved content fields supplied by a
 * View page. External, mail, telephone and JavaScript links are deliberately
 * excluded from this report.
 */
export function auditInternalLinks(
  sources: InternalLinkSource[],
  siteUrl = process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_SITE_URL
): AuditedInternalLink[] {
  let site: URL;
  try {
    site = new URL(siteUrl);
  } catch {
    site = new URL(DEFAULT_SITE_URL);
  }

  const siteHostname = normalizeHostname(site.hostname);
  const results: AuditedInternalLink[] = [];
  let sequence = 0;

  for (const source of sources) {
    for (const locale of AUDIT_LOCALES) {
      for (const html of contentStrings(localeValue(source.value, locale))) {
        ANCHOR_PATTERN.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = ANCHOR_PATTERN.exec(html)) !== null) {
          const link = analyzeAnchor({
            attributes: match[1],
            innerHtml: match[2],
            locale,
            source: source.label,
            site,
            siteHostname,
            id: `${locale}-${sequence++}`,
          });
          if (link) results.push(link);
        }
      }
    }
  }

  return results;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isLocalizedValue(value: unknown): value is Partial<Record<SupportedLocale, unknown>> {
  return isRecord(value) && AUDIT_LOCALES.some((locale) =>
    Object.prototype.hasOwnProperty.call(value, locale)
  );
}

function hasAnchorMarkup(value: unknown): boolean {
  return contentStrings(value).some((item) => HAS_ANCHOR_PATTERN.test(item));
}

function humanizeFieldName(value: string): string {
  const knownNames: Record<string, string> = {
    faqs: 'FAQs',
    html: 'HTML',
    seo: 'SEO',
  };
  if (knownNames[value]) return knownNames[value];

  const words = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  if (!words) return 'Content';
  return `${words.charAt(0).toUpperCase()}${words.slice(1).toLowerCase()}`
    .replace(/\bhtml\b/gi, 'HTML');
}

function sourceLabel(path: Array<string | number>): string {
  return path.length
    ? path.map((part) => typeof part === 'number' ? `Item ${part + 1}` : humanizeFieldName(part)).join(' · ')
    : 'Content';
}

/**
 * Finds every one of this entity's saved fields that contains anchor HTML.
 * Populated relationship documents are excluded because their links belong in
 * their own report. Recursive discovery means adding a new rich-text field to
 * an entity does not require remembering to update this audit separately.
 */
export function buildAllHtmlLinkSources(entity: unknown): InternalLinkSource[] {
  const sources: InternalLinkSource[] = [];
  const visited = new WeakSet<object>();

  function visit(value: unknown, path: Array<string | number>) {
    if (typeof value === 'string') {
      if (HAS_ANCHOR_PATTERN.test(value)) {
        sources.push({ label: sourceLabel(path), value });
      }
      return;
    }

    if (!value || typeof value !== 'object') return;
    if (visited.has(value)) return;
    visited.add(value);

    if (isLocalizedValue(value)) {
      if (hasAnchorMarkup(value)) {
        sources.push({ label: sourceLabel(path), value });
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, [...path, index]));
      return;
    }

    Object.entries(value).forEach(([key, child]) => {
      if (!POPULATED_RELATION_FIELDS.has(key)) visit(child, [...path, key]);
    });
  }

  visit(entity, []);
  return sources;
}
