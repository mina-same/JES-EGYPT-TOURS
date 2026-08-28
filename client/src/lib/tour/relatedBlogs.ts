/** How many featured articles fill the section when no blogs were curated. */
export const RELATED_BLOGS_FALLBACK_LIMIT = 3;

/**
 * How many results the picker's search dropdown shows at once.
 *
 * Five was too few to be sure of: a search matching a dozen guides showed five
 * with nothing to say there were more, so an editor could reasonably conclude
 * the article they wanted did not exist. Ten fits the dropdown's scroll height,
 * and the picker says so when a search fills it.
 */
export const BLOG_SEARCH_LIMIT = 10;
