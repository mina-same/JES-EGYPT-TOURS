// Computes per-language content completeness for any admin entity
// (tour, blog, category, ...). A field enters the comparison when ANY
// language has a value for it — so a language is "complete" when it has
// every field that exists in at least one other language. SEO fields are
// tracked separately (they inform the tooltip but never the state color).

export const CONTENT_LANGS = ['en', 'de', 'it', 'es'] as const;
export type ContentLang = (typeof CONTENT_LANGS)[number];

export type LangState = 'complete' | 'partial' | 'empty';

export interface LangCompleteness {
  state: LangState;
  /** Human-readable labels of the fields this language is missing. */
  missing: string[];
  /** SEO fields this language is missing (never affects `state`). */
  missingSeo: string[];
}

export type CompletenessReport = Record<ContentLang, LangCompleteness>;

// Relations / metadata that must not count toward THIS entity's content.
// `faqs` is excluded on purpose: each language may legitimately have its own
// FAQ set (8 questions in EN, 4 in DE…), so an untranslated FAQ is not a gap —
// the FAQ editor shows its own per-question language chips instead.
// `contentBlocks` is excluded for the same reason: each language's article
// body is authored independently against its own keyword map, so a section
// existing in one language only is intentional, not missing work.
const DEFAULT_SKIP_KEYS = new Set([
  '_id', 'id', '__v', 'createdAt', 'updatedAt', 'editVersion',
  'subcategory', 'subCategory', 'category', 'subcategories',
  'author', 'editorialAuthor',
  'relatedTours', 'relatedBlogs', 'relatedPosts', 'blogReferences',
  'destination', 'destinations', 'featuredBlogs', 'featuredDestinations',
  'reviews', 'comments', 'viewCount', 'reviewsCount',
  'faqs', 'contentBlocks',
]);

const SEO_KEYS = new Set(['seo', 'metaTitle', 'metaDescription', 'metaKeywords', 'mapSchema']);

const isLocalizedLeaf = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value).filter((k) => k !== '_id');
  return keys.length > 0 && keys.every((k) => (CONTENT_LANGS as readonly string[]).includes(k));
};

const hasValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasValue);
  if (typeof value === 'object') return Object.values(value).some(hasValue);
  return true; // numbers / booleans count as content
};

// "itinerary.days.2.title" -> "Itinerary days #3 title"
const prettifyPath = (path: string[]): string =>
  path
    .map((part) => (/^\d+$/.test(part) ? `#${Number(part) + 1}` : part.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()))
    .join(' ')
    .replace(/^./, (c) => c.toUpperCase());

interface WalkContext {
  report: CompletenessReport;
  totals: { content: number };
  filled: Record<ContentLang, number>;
}

const visitLeaf = (leaf: Record<string, unknown>, path: string[], isSeo: boolean, ctx: WalkContext) => {
  const presentIn = CONTENT_LANGS.filter((lang) => hasValue(leaf[lang]));
  if (presentIn.length === 0) return; // nothing anywhere → field doesn't exist yet

  const label = prettifyPath(path);
  for (const lang of CONTENT_LANGS) {
    const has = hasValue(leaf[lang]);
    if (isSeo) {
      if (!has) ctx.report[lang].missingSeo.push(label);
      continue;
    }
    if (has) ctx.filled[lang] += 1;
    else ctx.report[lang].missing.push(label);
  }
  if (!isSeo) ctx.totals.content += 1;
};

const walk = (node: unknown, path: string[], inSeo: boolean, ctx: WalkContext) => {
  if (!node || typeof node !== 'object') return;

  if (isLocalizedLeaf(node)) {
    visitLeaf(node as Record<string, unknown>, path, inSeo, ctx);
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((item, i) => walk(item, [...path, String(i)], inSeo, ctx));
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    if (DEFAULT_SKIP_KEYS.has(key)) continue;
    walk(value, [...path, key], inSeo || SEO_KEYS.has(key), ctx);
  }
};

export function getLocaleCompleteness(entity: unknown): CompletenessReport {
  const report: CompletenessReport = {
    en: { state: 'empty', missing: [], missingSeo: [] },
    de: { state: 'empty', missing: [], missingSeo: [] },
    it: { state: 'empty', missing: [], missingSeo: [] },
    es: { state: 'empty', missing: [], missingSeo: [] },
  };

  const ctx: WalkContext = {
    report,
    totals: { content: 0 },
    filled: { en: 0, de: 0, it: 0, es: 0 },
  };

  walk(entity, [], false, ctx);

  for (const lang of CONTENT_LANGS) {
    const filled = ctx.filled[lang];
    report[lang].state =
      ctx.totals.content === 0 ? 'empty' : filled === ctx.totals.content ? 'complete' : filled > 0 ? 'partial' : 'empty';
  }

  return report;
}
