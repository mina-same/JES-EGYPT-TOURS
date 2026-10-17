/**
 * Which article content blocks belong to a given language — which blocks an
 * article page that exists renders.
 *
 * Whether the page exists at all is a separate question with its own rule (a
 * strict slug, a title and a body of its own in the language), decided on the
 * server for every surface at once: server/src/utils/blogAvailability.ts. An
 * article tells the page where it is public in `availableLocales`.
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
