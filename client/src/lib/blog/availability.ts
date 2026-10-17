/**
 * The browser's copy of the Blog availability rule.
 *
 * The rule itself — when a Blog article is public in a language — lives on the
 * server, in server/src/utils/blogAvailability.ts, which every public endpoint
 * applies in its queries. The visitor pages never need to evaluate it: what
 * they receive is already filtered, and an article tells them its
 * `availableLocales`.
 *
 * The Admin does: its language badges show whether each language's version of
 * an article is complete, and "complete" has to mean what the public site
 * means. These patterns and checks are the server's, character for character;
 * client/tests/blog-locale-availability.test.ts compares the two on the same
 * fixtures and fails the moment they drift.
 */

export const BLOG_LOCALES = ['en', 'de', 'it', 'es'] as const;
export type BlogLocale = (typeof BLOG_LOCALES)[number];

export const TEXT_BLOCK_TYPES = ['html', 'blockquote'] as const;

const WHITESPACE = '\t\n\u000b\f\r    -     　﻿';
const NBSP_ENTITY = '&(?:nbsp|#0*160|#[xX]0*[aA]0);';

export const BLOG_SLUG_MIN_LENGTH = 3;
export const BLOG_SLUG_PATTERN = `^(?=[a-z0-9-]{${BLOG_SLUG_MIN_LENGTH}})[a-z0-9]+(?:-[a-z0-9]+)*(?![\\s\\S])`;
export const NON_BLANK_PATTERN = `[^${WHITESPACE}]`;
export const VISIBLE_TEXT_PATTERN =
  `(?:^|>)(?:[${WHITESPACE}]|${NBSP_ENTITY})*(?:[^<&${WHITESPACE}]|&(?!(?:nbsp|#0*160|#[xX]0*[aA]0);))`;

const SLUG = new RegExp(BLOG_SLUG_PATTERN);
const NON_BLANK = new RegExp(NON_BLANK_PATTERN);
const VISIBLE_TEXT = new RegExp(VISIBLE_TEXT_PATTERN);

export const isStrictBlogSlug = (value: unknown): value is string =>
  typeof value === 'string' && SLUG.test(value);

export const hasNonBlankText = (value: unknown): boolean =>
  typeof value === 'string' && NON_BLANK.test(value);

export const hasVisibleText = (value: unknown): boolean =>
  typeof value === 'string' && VISIBLE_TEXT.test(value);

export const blockAllowsLocale = (block: { languages?: unknown } | null | undefined, locale: string): boolean => {
  const languages = block?.languages;
  if (languages === undefined || languages === null) return true;
  if (Array.isArray(languages)) return languages.length === 0 || languages.includes(locale);
  return languages === locale;
};

type BlockLike = { type?: unknown; languages?: unknown; content?: unknown; title?: unknown };
const localeValue = (field: unknown, locale: string): unknown =>
  field && typeof field === 'object' && !Array.isArray(field) ? (field as Record<string, unknown>)[locale] : undefined;

export const hasLocalizedBody = (blocks: unknown, locale: string): boolean =>
  Array.isArray(blocks) &&
  blocks.some((block: BlockLike) =>
    (TEXT_BLOCK_TYPES as readonly unknown[]).includes(block?.type) &&
    blockAllowsLocale(block, locale) &&
    (hasVisibleText(localeValue(block?.content, locale)) || hasVisibleText(localeValue(block?.title, locale)))
  );

type ArticleLike = { status?: unknown; slug?: unknown; title?: unknown; contentBlocks?: unknown };

export const isBlogLocaleReady = (article: ArticleLike | null | undefined, locale: string): boolean =>
  isStrictBlogSlug(localeValue(article?.slug, locale)) &&
  hasNonBlankText(localeValue(article?.title, locale)) &&
  hasLocalizedBody(article?.contentBlocks, locale);

export const isBlogArticleAvailableInLocale = (article: ArticleLike | null | undefined, locale: string): boolean =>
  article?.status === 'published' && isBlogLocaleReady(article, locale);

export const availableBlogLocales = (article: ArticleLike | null | undefined): BlogLocale[] =>
  BLOG_LOCALES.filter((locale) => isBlogArticleAvailableInLocale(article, locale));
