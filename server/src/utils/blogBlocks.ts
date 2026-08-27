/**
 * Server-side twin of client/src/lib/blogBlocks.ts.
 *
 * The client decides which content blocks belong to a language; this narrows the
 * response to exactly those before it leaves the server, so a block written for
 * one audience never travels inside another language's page — not in the HTML,
 * not in the source, not to a crawler.
 *
 * The two rules MUST stay identical. If one changes, change the other: a block
 * the server drops but the client expects renders as a gap, and a block the
 * server keeps but the client hides is wasted payload.
 */

const TEXT_BLOCK_TYPES = ['html', 'blockquote'];
const LOCALES = ['en', 'de', 'it', 'es'];

const hasOwnText = (value: any, locale: string) =>
  typeof value?.[locale] === 'string' && value[locale].trim().length > 0;

/** `languages` absent or empty = every language. */
const languageAllows = (block: any, locale: string) =>
  !Array.isArray(block?.languages) ||
  block.languages.length === 0 ||
  block.languages.includes(locale);

const blockBelongsToLocale = (block: any, locale: string): boolean => {
  if (!languageAllows(block, locale)) return false;
  if (!TEXT_BLOCK_TYPES.includes(block?.type)) return true;
  return hasOwnText(block?.content, locale) || hasOwnText(block?.title, locale);
};

/**
 * Keeps ONLY the requested locale's key on a localized field, rather than
 * flattening it to a string. The article page reads `content[locale]` itself to
 * decide whether a block renders, so the object shape has to survive — it just
 * no longer carries the other three languages.
 */
const narrowLocalizedField = (value: any, locale: string): any => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const keys = Object.keys(value);
  if (keys.length === 0 || !keys.every((k) => LOCALES.includes(k))) return value;
  return { [locale]: value[locale] ?? '' };
};

/**
 * Drops the blocks that do not belong to `locale`, and strips the other
 * languages out of the ones that remain.
 */
export const narrowBlocksToLocale = (blocks: any, locale: string): any => {
  if (!Array.isArray(blocks)) return blocks;
  if (!locale || locale === 'bypass') return blocks;

  return blocks
    .filter((block) => blockBelongsToLocale(block, locale))
    .map((block) => ({
      ...block,
      title: narrowLocalizedField(block?.title, locale),
      content: narrowLocalizedField(block?.content, locale),
    }));
};

/**
 * True when the article has TEXT of its own in this language.
 *
 * The same rule the article page 404s on (client/src/lib/blogBlocks.ts →
 * hasNoContentForLocale), expressed positively. Listings that link to articles
 * need it: a localized slug alone is not enough to promise a page, so a card
 * whose article has no text in the visitor's language must not be shown — it
 * would link straight to a 404.
 */
export const hasTextForLocale = (blocks: any, locale: string): boolean => {
  if (!Array.isArray(blocks)) return false;
  if (!locale || locale === 'bypass') return true;

  return blocks.some(
    (block) => blockBelongsToLocale(block, locale) && TEXT_BLOCK_TYPES.includes(block?.type)
  );
};
