// Parsing, validation and payload building for the blog JSON import
// (articles produced by the owner's external multi-agent workflow).
//
// Contract (docs/blog-import/README.md): the file root is ONE article object
// or an ARRAY of them; only text content travels in the file. Categories,
// tags, images, authors and related items are set by hand in the admin after
// import, and every imported article is forced to `draft`.

import { normalizeFaqsForSave, hasCompleteFaqLocalePair } from '@/lib/faqCleanup';
import { mixedToHtml, htmlAllEmpty } from '@/lib/localizedHtml';

/** Shown on the import page so anyone can SEE which engine their browser
 *  loaded before uploading. Bump on every behavior change. */
export const BLOG_IMPORT_ENGINE_VERSION = 'v3 — key merge + topological order + quote sanitizer';

const LANGS = ['en', 'de', 'it', 'es'] as const;
type Lang = (typeof LANGS)[number];

/** Fields the contract accepts — anything else in the file is ignored (warned). */
const CONTRACT_FIELDS = new Set([
  'title', 'slug', 'excerpt', 'cardDescription', 'contentBlocks',
  'metaTitle', 'metaDescription', 'metaKeywords',
  'ogTitle', 'ogDescription', 'focusKeyword',
  'summary', 'keyTakeaways', 'faqs',
]);

const ALLOWED_BLOCK_TYPES = new Set(['html', 'blockquote']);
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_ITEMS_PER_FILE = 50;

export interface BlogImportItem {
  index: number;
  raw: any;
  /** Blockers — the item cannot be imported while any exist. */
  errors: string[];
  /** Non-blocking notes (fallbacks applied, ignored fields, dropped FAQs). */
  warnings: string[];
}

export interface ParsedBlogImportFile {
  items: BlogImportItem[];
  /** File-level problems (invalid JSON, wrong root shape...). */
  fileErrors: string[];
}

const isPlainObject = (v: unknown): v is Record<string, any> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

/** blockquote content is PLAIN TEXT by design (editor Textarea + the page
 *  prints it literally) — strip any HTML the generators may have added. */
const stripToPlainText = (v: unknown): string =>
  String(v ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Cross-language alignment check for per-language arrays (blocks/FAQs):
 * - every item keyed everywhere → merge by key (types must match per key);
 * - no keys at all → positional merge, allowed only when all active
 *   languages have the same count;
 * - anything else is ambiguous → error asking for keys.
 */
function checkMergeAlignment(
  perLang: Record<string, any>,
  activeLangs: readonly string[],
  fieldName: string,
  typeOf?: (item: any) => string | undefined
): string[] {
  const errors: string[] = [];
  if (activeLangs.length <= 1) return errors;

  const allItems = activeLangs.flatMap((l) => perLang[l] as any[]);
  const keyed = allItems.filter((b) => typeof b?.key === 'string' && b.key.trim());

  if (keyed.length === 0) {
    const counts = activeLangs.map((l) => (perLang[l] as any[]).length);
    if (new Set(counts).size > 1) {
      errors.push(
        `"${fieldName}": languages have different item counts (${activeLangs.map((l, i) => `${l}:${counts[i]}`).join(', ')}) and no "key" fields — corresponding items cannot be matched safely. Add a shared "key" to each item (same key = same section across languages; unique key = language-exclusive section).`
      );
    }
    return errors;
  }

  if (keyed.length !== allItems.length) {
    errors.push(`"${fieldName}": some items have a "key" and some don't — key every item (in every language) or none.`);
    return errors;
  }

  if (typeOf) {
    const typeByKey = new Map<string, string>();
    for (const item of allItems) {
      const t = typeOf(item) || '';
      const prev = typeByKey.get(item.key);
      if (prev !== undefined && prev !== t) {
        errors.push(`"${fieldName}": key "${item.key}" has conflicting types across languages ("${prev}" vs "${t}").`);
      }
      typeByKey.set(item.key, prev ?? t);
    }
  }

  // Order-conflict detection: the CMS stores ONE ordered array, so shared
  // sections must keep the same relative order in every language (exclusive
  // sections can sit anywhere — the topological merge places them). A cycle
  // means two languages disagree on the order of shared sections.
  if (topologicalKeyOrder(perLang, activeLangs) === null) {
    errors.push(
      `"${fieldName}": languages disagree on the ORDER of shared sections (keys appear in conflicting sequences). Keep the same relative order of shared keys in every language.`
    );
  }
  return errors;
}

/**
 * Merged order for keyed items: a topological sort over every language's
 * sequence (edges key[i] → key[i+1]), so each language's own order is
 * preserved — including exclusives sitting between shared sections. Ties
 * break by first appearance walking en → de → it → es. Returns null when
 * the sequences contradict each other (cycle).
 */
function topologicalKeyOrder(
  perLang: Record<string, any>,
  activeLangs: readonly string[]
): string[] | null {
  const firstSeen: string[] = [];
  const edges = new Map<string, Set<string>>();
  const indegree = new Map<string, number>();

  const ensureNode = (k: string) => {
    if (!indegree.has(k)) {
      indegree.set(k, 0);
      edges.set(k, new Set());
      firstSeen.push(k);
    }
  };

  for (const lang of activeLangs) {
    const seq: string[] = (perLang[lang] as any[])
      .map((b) => (typeof b?.key === 'string' ? b.key.trim() : null))
      .filter(Boolean) as string[];
    seq.forEach(ensureNode);
    for (let i = 0; i + 1 < seq.length; i++) {
      const from = seq[i];
      const to = seq[i + 1];
      if (!edges.get(from)!.has(to)) {
        edges.get(from)!.add(to);
        indegree.set(to, (indegree.get(to) || 0) + 1);
      }
    }
  }

  const order: string[] = [];
  const ready = () => firstSeen.filter((k) => (indegree.get(k) || 0) === 0 && !order.includes(k));
  while (order.length < firstSeen.length) {
    const next = ready()[0];
    if (next === undefined) return null; // cycle — conflicting orders
    order.push(next);
    for (const to of edges.get(next)!) indegree.set(to, (indegree.get(to) || 0) - 1);
  }
  return order;
}

/**
 * Merges per-language item arrays into one multilingual array. Items sharing
 * a `key` become ONE item carrying all their languages; when no keys are
 * used, items merge by position (validation guarantees equal counts then).
 * Keyed order is a topological merge of every language's sequence, so each
 * language keeps its own order — exclusives land exactly where their
 * language placed them.
 */
function mergePerLanguage<T extends Record<string, any>>(
  perLang: Record<string, any>,
  activeLangs: readonly string[],
  mergeInto: (target: T | undefined, item: any, lang: string) => T
): T[] {
  const useKeys = activeLangs.some((l) =>
    (perLang[l] as any[]).some((b) => typeof b?.key === 'string' && b.key.trim())
  );

  const byId = new Map<string, T>();
  for (const lang of activeLangs) {
    (perLang[lang] as any[]).forEach((item, i) => {
      const id = useKeys ? `k:${String(item.key).trim()}` : `i:${i}`;
      byId.set(id, mergeInto(byId.get(id), item, lang));
    });
  }

  if (useKeys) {
    const order = topologicalKeyOrder(perLang, activeLangs);
    if (order) return order.map((k) => byId.get(`k:${k}`)!).filter(Boolean);
    // Conflicting orders are rejected in validation; this fallback only
    // guards direct calls: first-seen order.
  }

  const seen: string[] = [];
  for (const lang of activeLangs) {
    (perLang[lang] as any[]).forEach((item, i) => {
      const id = useKeys ? `k:${String(item.key).trim()}` : `i:${i}`;
      if (!seen.includes(id)) seen.push(id);
    });
  }
  return seen.map((id) => byId.get(id)!);
}

const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** True when the value looks like a localized string object with some text. */
const hasAnyLang = (v: any): boolean => isPlainObject(v) && LANGS.some((l) => text(v[l]));

/** Copy with `en` filled from the first non-empty language when it is empty
 *  (same rule the manual admin form applies before saving). */
const ensureEnglish = (v: any): Record<Lang, string> => {
  const out: any = { en: '', de: '', it: '', es: '' };
  for (const l of LANGS) out[l] = text(v?.[l]);
  if (!out.en) {
    const fallback = LANGS.map((l) => out[l]).find(Boolean);
    if (fallback) out.en = fallback;
  }
  return out;
};

export function parseBlogImportFile(fileText: string): ParsedBlogImportFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fileText);
  } catch (e: any) {
    return { items: [], fileErrors: [`Invalid JSON: ${e?.message || 'could not parse the file'}`] };
  }

  const rootItems = Array.isArray(parsed) ? parsed : [parsed];
  if (rootItems.length === 0) {
    return { items: [], fileErrors: ['The file contains an empty array — nothing to import.'] };
  }
  if (rootItems.length > MAX_ITEMS_PER_FILE) {
    return { items: [], fileErrors: [`Too many articles in one file (${rootItems.length}). Max is ${MAX_ITEMS_PER_FILE}.`] };
  }

  const items = rootItems.map((raw, index) => {
    if (!isPlainObject(raw)) {
      return { index, raw, errors: [`Item #${index + 1} is not an object.`], warnings: [] };
    }
    const { errors, warnings } = validateBlogImportItem(raw);
    return { index, raw, errors, warnings };
  });

  return { items, fileErrors: [] };
}

export function validateBlogImportItem(raw: Record<string, any>): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // title — the article's identity: English is strictly required.
  if (!hasAnyLang(raw.title)) {
    errors.push('Missing "title" (localized object with at least "en").');
  } else if (!text(raw.title.en)) {
    errors.push('"title.en" is required.');
  }

  // slug — strictly required in English, format-checked per language.
  if (!hasAnyLang(raw.slug)) {
    errors.push('Missing "slug" (localized object with at least "en").');
  } else {
    if (!text(raw.slug.en)) errors.push('"slug.en" is required.');
    for (const l of LANGS) {
      const s = text(raw.slug[l]);
      if (s && !SLUG_RE.test(s)) {
        errors.push(`"slug.${l}" ("${s}") must be lowercase letters/numbers separated by hyphens.`);
      }
    }
  }

  // contentBlocks — the article body.
  // PREFERRED shape: per-language arrays ({ en: [...], de: [...] }) — every
  // language keeps its own section count and order (independent keyword
  // maps). LEGACY shape: one aligned array whose blocks carry all languages.
  const cb = raw.contentBlocks;
  if (Array.isArray(cb)) {
    if (cb.length === 0) {
      errors.push('"contentBlocks" is an empty array.');
    }
    cb.forEach((block: any, i: number) => {
      const label = `contentBlocks[${i}]`;
      if (!isPlainObject(block)) {
        errors.push(`${label} is not an object.`);
        return;
      }
      if (!ALLOWED_BLOCK_TYPES.has(block.type)) {
        errors.push(`${label}.type "${block.type}" is not allowed — the import contract accepts only: ${[...ALLOWED_BLOCK_TYPES].join(', ')}.`);
      }
      if (!hasAnyLang(block.content)) {
        errors.push(`${label}.content is empty in every language.`);
      }
    });
  } else if (isPlainObject(cb)) {
    const badKeys = Object.keys(cb).filter((k) => !(LANGS as readonly string[]).includes(k));
    if (badKeys.length > 0) {
      errors.push(`"contentBlocks" has unknown language keys: ${badKeys.join(', ')} (allowed: en, de, it, es).`);
    }
    const activeLangs = LANGS.filter((l) => Array.isArray(cb[l]) && cb[l].length > 0);
    if (activeLangs.length === 0) {
      errors.push('"contentBlocks" has no language with at least one block.');
    }
    for (const l of LANGS) {
      if (cb[l] === undefined) continue;
      if (!Array.isArray(cb[l])) {
        errors.push(`"contentBlocks.${l}" must be an array of {type, content} blocks.`);
        continue;
      }
      const seenKeys = new Set<string>();
      cb[l].forEach((block: any, i: number) => {
        const label = `contentBlocks.${l}[${i}]`;
        if (!isPlainObject(block)) {
          errors.push(`${label} is not an object.`);
          return;
        }
        if (!ALLOWED_BLOCK_TYPES.has(block.type)) {
          errors.push(`${label}.type "${block.type}" is not allowed — the import contract accepts only: ${[...ALLOWED_BLOCK_TYPES].join(', ')}.`);
        }
        if (!text(block.content)) {
          errors.push(`${label}.content must be a non-empty string.`);
        } else if (block.type === 'blockquote' && !stripToPlainText(block.content)) {
          errors.push(`${label}.content contains only HTML markup — blockquote content must be plain text.`);
        }
        if (block.title !== undefined && typeof block.title !== 'string') {
          errors.push(`${label}.title must be a plain string (this shape is single-language).`);
        }
        if (block.key !== undefined && (typeof block.key !== 'string' || !block.key.trim())) {
          errors.push(`${label}.key must be a non-empty string.`);
        } else if (typeof block.key === 'string') {
          if (seenKeys.has(block.key)) errors.push(`${label}.key "${block.key}" is duplicated within "${l}".`);
          seenKeys.add(block.key);
        }
      });
    }
    // Cross-language merging feasibility: corresponding sections are merged
    // into ONE multilingual block. Alignment comes from `key` (shared id per
    // section) — or, when no keys are used, from position, which is only
    // safe when every language has the SAME number of blocks.
    errors.push(...checkMergeAlignment(cb, activeLangs, 'contentBlocks', (b: any) => b?.type));
  } else {
    errors.push('Missing "contentBlocks" — per-language arrays ({en: [...], de: [...]}) or a legacy aligned array.');
  }

  // Optional localized strings: English fallback is applied silently-with-warning.
  for (const field of ['excerpt', 'cardDescription', 'metaTitle', 'metaDescription', 'ogTitle', 'ogDescription', 'focusKeyword']) {
    const v = raw[field];
    if (v === undefined) continue;
    if (!isPlainObject(v)) {
      errors.push(`"${field}" must be a localized object ({en, de, it, es}).`);
    } else if (hasAnyLang(v) && !text(v.en)) {
      warnings.push(`"${field}" has no English — the first available language will be copied into "en".`);
    }
  }

  // summary / keyTakeaways: localized HTML (legacy arrays accepted → converted).
  for (const field of ['summary', 'keyTakeaways']) {
    const v = raw[field];
    if (v === undefined) continue;
    if (!isPlainObject(v)) {
      errors.push(`"${field}" must be a localized object whose values are HTML strings (e.g. "<ul><li>…</li></ul>").`);
    } else if (LANGS.some((l) => Array.isArray(v[l]))) {
      warnings.push(`"${field}" uses arrays of bullets — they will be converted to an HTML list automatically.`);
    }
  }

  // faqs — legacy multilingual array OR per-language arrays with plain strings.
  if (raw.faqs !== undefined) {
    if (Array.isArray(raw.faqs)) {
      const dropped = raw.faqs.filter((f: any) => !hasCompleteFaqLocalePair(f)).length;
      if (dropped > 0) {
        warnings.push(`${dropped} FAQ item(s) have no complete question+answer pair in any language and will be skipped.`);
      }
    } else if (isPlainObject(raw.faqs)) {
      const fq = raw.faqs;
      const badKeys = Object.keys(fq).filter((k) => !(LANGS as readonly string[]).includes(k));
      if (badKeys.length > 0) {
        errors.push(`"faqs" has unknown language keys: ${badKeys.join(', ')} (allowed: en, de, it, es).`);
      }
      const activeLangs = LANGS.filter((l) => Array.isArray(fq[l]) && fq[l].length > 0);
      for (const l of LANGS) {
        if (fq[l] === undefined) continue;
        if (!Array.isArray(fq[l])) {
          errors.push(`"faqs.${l}" must be an array of {question, answer} items.`);
          continue;
        }
        fq[l].forEach((f: any, i: number) => {
          const label = `faqs.${l}[${i}]`;
          if (!isPlainObject(f)) {
            errors.push(`${label} is not an object.`);
            return;
          }
          if (!text(f.question) || !text(f.answer)) {
            errors.push(`${label} needs non-empty plain-string "question" and "answer".`);
          }
          if (f.key !== undefined && (typeof f.key !== 'string' || !f.key.trim())) {
            errors.push(`${label}.key must be a non-empty string.`);
          }
        });
      }
      errors.push(...checkMergeAlignment(fq, activeLangs, 'faqs'));
    } else {
      errors.push('"faqs" must be an array of localized {question, answer} objects, or per-language arrays ({en: [...], de: [...]}).');
    }
  }

  // Ignored fields (out of the contract by the owner's decision).
  const ignored = Object.keys(raw).filter((k) => !CONTRACT_FIELDS.has(k));
  if (ignored.length > 0) {
    warnings.push(`Ignored fields (set manually in the admin instead): ${ignored.join(', ')}.`);
  }

  return { errors, warnings };
}

/**
 * Converts either contentBlocks shape into the DB's single array of
 * multilingual blocks (one block = one section carrying EN/DE/IT/ES tabs,
 * exactly like the admin editor shows them):
 * - Per-language arrays (preferred): corresponding sections across languages
 *   are MERGED into one multilingual block — matched by shared `key`, or by
 *   position when every language has the same count. A section that exists
 *   in one language only stays a single-language block (the visitor page
 *   renders each language's own blocks strictly).
 * - Legacy aligned array: blocks pass through with the English fallback.
 * blockquote content is plain text by design — HTML is stripped from it.
 */
function buildContentBlocks(cb: any): Record<string, any>[] {
  const blockContent = (type: string, v: unknown): string =>
    type === 'blockquote' ? stripToPlainText(v) : String(v ?? '');

  if (Array.isArray(cb)) {
    return cb
      .filter((b: any) => isPlainObject(b) && ALLOWED_BLOCK_TYPES.has(b.type) && hasAnyLang(b.content))
      .map((b: any) => {
        const content = ensureEnglish(b.content);
        if (b.type === 'blockquote') {
          for (const l of LANGS) content[l] = stripToPlainText(content[l]);
        }
        const block: Record<string, any> = { type: b.type, content };
        if (hasAnyLang(b.title)) block.title = ensureEnglish(b.title);
        return block;
      });
  }

  if (isPlainObject(cb)) {
    const activeLangs = LANGS.filter((l) => Array.isArray(cb[l]) && cb[l].length > 0);
    const clean: Record<string, any[]> = {};
    for (const l of activeLangs) {
      clean[l] = (cb[l] as any[]).filter(
        (b) => isPlainObject(b) && ALLOWED_BLOCK_TYPES.has(b.type) && text(b.content)
      );
    }

    return mergePerLanguage<Record<string, any>>(clean, activeLangs, (target, item, lang) => {
      const block = target ?? { type: item.type, content: {} };
      block.content[lang] = blockContent(item.type, item.content);
      if (text(item.title)) {
        block.title = { ...(block.title || {}), [lang]: String(item.title) };
      }
      return block;
    });
  }

  return [];
}

/**
 * FAQs come either as the legacy multilingual array
 * ([{question: {en,de,...}, answer: {...}}]) or as per-language arrays
 * ({ en: [{key?, question, answer}], de: [...] }) with plain strings —
 * merged into multilingual FAQ items by `key` or position, exactly like
 * content blocks. A language may keep exclusive FAQs.
 */
function buildFaqs(rawFaqs: any): any[] {
  if (Array.isArray(rawFaqs)) return rawFaqs;

  if (isPlainObject(rawFaqs)) {
    const activeLangs = LANGS.filter((l) => Array.isArray(rawFaqs[l]) && rawFaqs[l].length > 0);
    const clean: Record<string, any[]> = {};
    for (const l of activeLangs) {
      clean[l] = (rawFaqs[l] as any[]).filter(
        (f) => isPlainObject(f) && text(f.question) && text(f.answer)
      );
    }

    return mergePerLanguage<Record<string, any>>(clean, activeLangs, (target, item, lang) => {
      const faq = target ?? { question: {}, answer: {} };
      faq.question[lang] = String(item.question).trim();
      faq.answer[lang] = String(item.answer).trim();
      return faq;
    });
  }

  return [];
}

/**
 * Builds the exact POST /blog/posts payload for one validated item.
 * Mirrors the manual new-blog page's save transformations, forces `draft`,
 * and never sends images/relations (the contract excludes them).
 */
export function buildBlogCreatePayload(raw: Record<string, any>, authorId: string): Record<string, any> {
  const payload: Record<string, any> = {
    title: ensureEnglish(raw.title),
    slug: ensureEnglish(raw.slug),
    status: 'draft',
    author: authorId,
    contentBlocks: buildContentBlocks(raw.contentBlocks),
  };

  for (const field of ['excerpt', 'cardDescription', 'metaTitle', 'metaDescription', 'ogTitle', 'ogDescription', 'focusKeyword']) {
    if (hasAnyLang(raw[field])) payload[field] = ensureEnglish(raw[field]);
  }

  // metaKeywords: per-language arrays of trimmed strings (like the manual form).
  if (isPlainObject(raw.metaKeywords)) {
    const kw: any = {};
    let any = false;
    for (const l of LANGS) {
      const arr = Array.isArray(raw.metaKeywords[l])
        ? raw.metaKeywords[l].map((k: any) => String(k).trim()).filter(Boolean)
        : [];
      kw[l] = arr;
      if (arr.length) any = true;
    }
    if (any) {
      if (!kw.en.length) kw.en = LANGS.map((l) => kw[l]).find((a: string[]) => a.length) || [];
      payload.metaKeywords = kw;
    }
  }

  for (const field of ['summary', 'keyTakeaways']) {
    const html = mixedToHtml(raw[field]);
    if (!htmlAllEmpty(html)) payload[field] = html;
  }

  const faqs = normalizeFaqsForSave(buildFaqs(raw.faqs));
  if (faqs.length > 0) payload.faqs = faqs;

  return payload;
}
