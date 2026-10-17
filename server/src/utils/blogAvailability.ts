import { PublishingValidationError } from './publishing';

/**
 * When a Blog article is public in a language — the one rule.
 *
 * An article has one lifecycle status for every language (draft, scheduled,
 * published). Whether a PUBLISHED article also exists in a given language is
 * derived from its content, never stored: it does when that language has
 *
 *   1. a slug of the strict shape (lowercase a-z/0-9 words joined by single
 *      hyphens, at least three characters) — anything else cannot be a URL;
 *   2. a title with text in it;
 *   3. an article body: at least one `html` or `blockquote` block written for
 *      that language whose content or title holds visible text.
 *
 * Nothing else is required. Excerpt, card description, meta and OG text, image
 * alt text, FAQs and tags are optional — a page without them is still the
 * article.
 *
 * The rule exists twice, and only here: as a MongoDB filter, so listings count,
 * sort and page over exactly the articles a language can show, and as a check
 * on a document already in hand. Both are built from the same constants below,
 * and tests/blog-locale-availability.test.ts holds them to the same answer on
 * every fixture — including against a real server's regex engine.
 *
 * client/src/lib/blog/availability.ts is the browser's copy for the Admin
 * language badges; client/tests/blog-locale-availability.test.ts checks that it
 * matches this one.
 */

export const BLOG_LOCALES = ['en', 'de', 'it', 'es'] as const;
export type BlogLocale = (typeof BLOG_LOCALES)[number];

export const isBlogLocale = (value: unknown): value is BlogLocale =>
  (BLOG_LOCALES as readonly unknown[]).includes(value);

/** The block types that carry an article's text. Images and videos have no language. */
export const TEXT_BLOCK_TYPES = ['html', 'blockquote'] as const;

/*
 * The patterns are written so that MongoDB's regex engine (PCRE) and
 * JavaScript's read them identically:
 *
 *   - `\s` is ASCII-only in MongoDB but Unicode in JavaScript, so whitespace is
 *     spelled out as literal characters — exactly JavaScript's `\s` set;
 *   - `$` also matches before a final newline in PCRE, so the end of a slug is
 *     asserted with `(?![\s\S])`, which means "nothing follows" in both.
 */
const WHITESPACE = '\t\n\u000b\f\r    -     　﻿';
/** A non-breaking space written as an entity, the empty paragraph rich-text editors leave. */
const NBSP_ENTITY = '&(?:nbsp|#0*160|#[xX]0*[aA]0);';

/** Shorter than this is a placeholder, not a slug. */
export const BLOG_SLUG_MIN_LENGTH = 3;

/** The strict slug: a-z/0-9 words joined by single hyphens, BLOG_SLUG_MIN_LENGTH characters or more. */
export const BLOG_SLUG_PATTERN = `^(?=[a-z0-9-]{${BLOG_SLUG_MIN_LENGTH}})[a-z0-9]+(?:-[a-z0-9]+)*(?![\\s\\S])`;

/** Any character that is not whitespace. */
export const NON_BLANK_PATTERN = `[^${WHITESPACE}]`;

/**
 * Text a reader would see: in some run of text outside the tags, a first
 * character that is neither whitespace nor a non-breaking-space entity.
 * "<p></p>", "<p><br /></p>" and "<p>&nbsp;</p>" have none; "<p>Hi</p>" and a
 * plain-text block title do. A text node's first non-blank character decides,
 * because whatever follows it is the same text.
 */
export const VISIBLE_TEXT_PATTERN =
  `(?:^|>)(?:[${WHITESPACE}]|${NBSP_ENTITY})*(?:[^<&${WHITESPACE}]|&(?!(?:nbsp|#0*160|#[xX]0*[aA]0);))`;

const SLUG = new RegExp(BLOG_SLUG_PATTERN);
const NON_BLANK = new RegExp(NON_BLANK_PATTERN);
const VISIBLE_TEXT = new RegExp(VISIBLE_TEXT_PATTERN);

/** A slug of the strict shape, exactly as stored — not repaired, not trimmed. */
export const isStrictBlogSlug = (value: unknown): value is string =>
  typeof value === 'string' && SLUG.test(value);

export const hasNonBlankText = (value: unknown): boolean =>
  typeof value === 'string' && NON_BLANK.test(value);

export const hasVisibleText = (value: unknown): boolean =>
  typeof value === 'string' && VISIBLE_TEXT.test(value);

/**
 * A block written for this language: its `languages` list is absent or empty,
 * or names the language. (A stored scalar is compared as MongoDB compares it.)
 */
export const blockAllowsLocale = (block: { languages?: unknown } | null | undefined, locale: string): boolean => {
  const languages = block?.languages;
  if (languages === undefined || languages === null) return true;
  if (Array.isArray(languages)) return languages.length === 0 || languages.includes(locale);
  return languages === locale;
};

type BlockLike = { type?: unknown; languages?: unknown; content?: unknown; title?: unknown };
const localeValue = (field: unknown, locale: string): unknown =>
  field && typeof field === 'object' && !Array.isArray(field) ? (field as Record<string, unknown>)[locale] : undefined;

/** The article has a body in this language: one text block of its own with visible text. */
export const hasLocalizedBody = (blocks: unknown, locale: string): boolean =>
  Array.isArray(blocks) &&
  blocks.some((block: BlockLike) =>
    (TEXT_BLOCK_TYPES as readonly unknown[]).includes(block?.type) &&
    blockAllowsLocale(block, locale) &&
    (hasVisibleText(localeValue(block?.content, locale)) || hasVisibleText(localeValue(block?.title, locale)))
  );

type ArticleLike = { status?: unknown; slug?: unknown; title?: unknown; contentBlocks?: unknown };

/** The language's version of the article is complete: slug, title and body — status aside. */
export const isBlogLocaleReady = (article: ArticleLike | null | undefined, locale: string): boolean =>
  isStrictBlogSlug(localeValue(article?.slug, locale)) &&
  hasNonBlankText(localeValue(article?.title, locale)) &&
  hasLocalizedBody(article?.contentBlocks, locale);

/** Public in this language: published, and its version in the language is complete. */
export const isBlogArticleAvailableInLocale = (article: ArticleLike | null | undefined, locale: string): boolean =>
  article?.status === 'published' && isBlogLocaleReady(article, locale);

/** The languages a published article can be read in, in site order. */
export const availableBlogLocales = (article: ArticleLike | null | undefined): BlogLocale[] =>
  BLOG_LOCALES.filter((locale) => isBlogArticleAvailableInLocale(article, locale));

/** The same three conditions as isBlogLocaleReady, as a MongoDB filter. */
export const getBlogLocaleReadinessFilter = (locale: BlogLocale): Record<string, unknown> => ({
  [`slug.${locale}`]: { $regex: BLOG_SLUG_PATTERN },
  [`title.${locale}`]: { $regex: NON_BLANK_PATTERN },
  contentBlocks: {
    $elemMatch: {
      type: { $in: [...TEXT_BLOCK_TYPES] },
      $and: [
        // `null` matches an absent list as well as a null one.
        { $or: [{ languages: null }, { languages: { $size: 0 } }, { languages: locale }] },
        {
          $or: [
            { [`content.${locale}`]: { $regex: VISIBLE_TEXT_PATTERN } },
            { [`title.${locale}`]: { $regex: VISIBLE_TEXT_PATTERN } },
          ],
        },
      ],
    },
  },
});

/** isBlogArticleAvailableInLocale as a MongoDB filter. */
export const getBlogLocaleAvailabilityFilter = (locale: BlogLocale): Record<string, unknown> => ({
  status: 'published',
  ...getBlogLocaleReadinessFilter(locale),
});

/**
 * The filter a public article query runs with for a request: the language's
 * availability filter, or — for `bypass`, the Admin's all-languages reading
 * convention — published articles in any language.
 */
export const publicBlogArticleFilter = (requestLocale: unknown): Record<string, unknown> =>
  isBlogLocale(requestLocale) ? getBlogLocaleAvailabilityFilter(requestLocale) : { status: 'published' };

const joinLabels = (labels: string[]): string =>
  labels.length > 1 ? `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}` : labels[0];

/**
 * Throws unless the article's English version is public-ready. English is the
 * one language a published or scheduled article must have; the others are
 * added when their translation is done, and until then those languages simply
 * have no page.
 */
export const assertEnglishPublicReady = (article: ArticleLike): void => {
  const missing: string[] = [];
  if (!isStrictBlogSlug(localeValue(article?.slug, 'en'))) missing.push('a valid English slug');
  if (!hasNonBlankText(localeValue(article?.title, 'en'))) missing.push('an English title');
  if (!hasLocalizedBody(article?.contentBlocks, 'en')) missing.push('English article text');
  if (missing.length === 0) return;
  const list = joinLabels(missing);
  throw new PublishingValidationError(
    `${list.charAt(0).toUpperCase()}${list.slice(1)} ${missing.length > 1 ? 'are' : 'is'} required before publishing`
  );
};
