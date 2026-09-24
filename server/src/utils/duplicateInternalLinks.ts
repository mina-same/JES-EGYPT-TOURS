import sanitizeHtml from 'sanitize-html';
import type { Response } from 'express';

const LOCALES = ['en', 'de', 'it', 'es'];
const RELATED = new Set(['author', 'category', 'destination', 'editorialAuthor', 'featuredBlogs', 'featuredDestinations', 'featuredTours', 'relatedDestinations', 'relatedPosts', 'relatedTours', 'subCategory', 'subcategory', 'tour']);
const METADATA = /\bseo\b|\b(?:meta|og|twitter) (?:title|description|keywords)\b/i;

export interface DuplicateLinkGroup {
  locale: string;
  target: string;
  count: number;
  locations: { path: string; label: string; occurrence: number; blockId?: string }[];
}

function label(path: string[]): string {
  return path.filter((part) => !LOCALES.includes(part)).map((part) => {
    if (/^\d+$/.test(part)) return `Item ${Number(part) + 1}`;
    const words = part.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ');
    return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
  }).join(' · ') || 'Content';
}

/** One document, one language at a time. No network requests or URL probes. */
export function findDuplicateInternalLinks(entity: unknown, siteUrl = process.env.SITE_URL || process.env.FRONTEND_URL || 'https://www.jesegypttours.com'): DuplicateLinkGroup[] {
  const canonical = new URL('https://www.jesegypttours.com');
  let site = canonical;
  try { site = new URL(siteUrl); } catch { /* use canonical */ }
  const hostname = (url: URL) => url.hostname.toLowerCase().replace(/^www\./, '');
  const hosts = new Set([hostname(site), hostname(canonical)]);
  const groups = new Map<string, DuplicateLinkGroup>();
  const visited = new WeakSet<object>();

  function visit(value: unknown, path: string[], locale = 'en') {
    if (typeof value === 'string') {
      const source = label(path);
      if (!/<a\b/i.test(value) || METADATA.test(source)) return;
      let occurrence = 0;
      // Use the HTML parser already used at save time, including entity decoding.
      sanitizeHtml(value, {
        allowedTags: ['a'],
        allowedAttributes: { a: ['href'] },
        transformTags: {
          a: (tagName, attribs) => {
            const href = attribs.href?.trim();
            if (href && !href.startsWith('#') && !href.startsWith('?')) {
              try {
                const url = new URL(href, site);
                if (['http:', 'https:'].includes(url.protocol) && hosts.has(hostname(url))) {
                  occurrence++;
                  const target = `${url.pathname}${url.search}${url.hash}`;
                  const key = JSON.stringify([locale, target]);
                  const group = groups.get(key) || { locale, target, count: 0, locations: [] };
                  group.count++;
                  group.locations.push({ path: path.join('.'), label: source, occurrence });
                  groups.set(key, group);
                }
              } catch { /* invalid URLs are outside this rule */ }
            }
            return { tagName, attribs };
          },
        },
      });
      return;
    }
    if (!value || typeof value !== 'object' || visited.has(value)) return;
    visited.add(value);
    if (Array.isArray(value)) {
      value.forEach((child, index) => visit(child, [...path, String(index)], locale));
    } else {
      for (const [key, child] of Object.entries(value)) {
        if (!RELATED.has(key)) visit(child, [...path, key], LOCALES.includes(key) ? key : locale);
      }
    }
  }
  visit(entity, []);
  return [...groups.values()].filter((group) => group.count > 1);
}

export class DuplicateInternalLinksError extends Error {
  readonly code = 'DUPLICATE_INTERNAL_LINKS';
  constructor(readonly duplicates: DuplicateLinkGroup[]) {
    super('Cannot save: duplicate internal links. Remove the repeated links and save again.');
    this.name = 'DuplicateInternalLinksError';
  }
}

export function assertNoDuplicateInternalLinks(entity: unknown): void {
  const duplicates = findDuplicateInternalLinks(entity);
  if (duplicates.length) throw new DuplicateInternalLinksError(duplicates);
}

export function respondToDuplicateInternalLinks(error: unknown, res: Response): boolean {
  if (!(error instanceof DuplicateInternalLinksError)) return false;
  // The editor removes empty blocks before submitting. Keep its stable ID so
  // navigation does not mistake a submitted index for the original form index.
  for (const group of error.duplicates) {
    for (const location of group.locations) {
      const match = location.path.match(/^contentBlocks\.(\d+)\./);
      const blockId = match ? res.req?.body?.contentBlocks?.[Number(match[1])]?.id : undefined;
      if (typeof blockId === 'string') location.blockId = blockId;
    }
  }
  res.status(422).json({
    success: false,
    code: error.code,
    error: error.message,
    message: error.message,
    duplicates: error.duplicates,
    errors: error.duplicates.map((group) => ({
      path: group.locations[0].path,
      msg: `${group.target} appears ${group.count} times in ${group.locale.toUpperCase()}. Found in: ${[...new Set(group.locations.map((item) => item.label))].join('; ')}`,
    })),
  });
  return true;
}
