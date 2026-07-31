/**
 * Which article content blocks belong to a given language.
 *
 * The single source of truth for this rule. The article page renders from it and
 * the route resolver 404s from it, so a locale can never resolve to a page that
 * then turns out to have nothing to show.
 *
 * A block belongs to a locale when BOTH hold:
 *   1. its `languages` list allows that locale — absent or empty means every
 *      language, so existing articles keep working untouched;
 *   2. and, if it is a text block, it actually has text in THAT locale.
 *
 * There is deliberately NO fallback to another language. An editor who adds a
 * sixth block written only in German means it for German readers only, and one
 * who leaves a block empty in a language means to keep it off that language's
 * article. Falling back to English would publish both against their intent.
 */

export const TEXT_BLOCK_TYPES = ['html', 'blockquote'];

const hasOwnText = (value: any, locale: string) =>
  typeof value?.[locale] === 'string' && value[locale].trim().length > 0;

/** `languages` absent or empty = every language. */
const languageAllows = (block: any, locale: string) =>
  !Array.isArray(block?.languages) ||
  block.languages.length === 0 ||
  block.languages.includes(locale);

export const blockBelongsToLocale = (block: any, locale: string): boolean => {
  if (!languageAllows(block, locale)) return false;
  if (!TEXT_BLOCK_TYPES.includes(block?.type)) return true;
  return hasOwnText(block?.content, locale) || hasOwnText(block?.title, locale);
};

export const visibleBlocksFor = (blocks: any, locale: string): any[] =>
  Array.isArray(blocks) ? blocks.filter((block) => blockBelongsToLocale(block, locale)) : [];

/**
 * True when the article has no TEXT of its own in this language.
 *
 * Deliberately counts text blocks only. Images and videos carry no language, so
 * they are allowed in every locale by default — and an article whose Italian
 * version is seven photos and an English-fallback title is exactly the thin,
 * duplicated page this rule exists to prevent. Such a locale gets no page at
 * all: an honest 404 beats a page that only looks translated.
 */
export const hasNoContentForLocale = (blocks: any, locale: string): boolean =>
  visibleBlocksFor(blocks, locale).filter((block) => TEXT_BLOCK_TYPES.includes(block?.type))
    .length === 0;
