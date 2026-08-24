/**
 * How many linked articles a tour page actually shows.
 *
 * The number lives here because two places have to agree on it and they sit on
 * opposite sides of the app: `useTourData` slices the tour's `blogReferences`
 * down to this many before rendering, and the admin's "Related Blogs" picker
 * uses it to tell the editor which of their selections will be seen.
 *
 * They did not agree before. The picker let an editor link any number of
 * articles and showed them all as if they were live, while the page had always
 * rendered three — so a fourth article looked linked, was stored, and never
 * appeared anywhere. Ordering matters for the same reason: which three survive
 * the slice is decided by their position in the array.
 */
export const RELATED_BLOGS_LIMIT = 3;

/**
 * How many results the picker's search dropdown shows at once.
 *
 * Five was too few to be sure of: a search matching a dozen guides showed five
 * with nothing to say there were more, so an editor could reasonably conclude
 * the article they wanted did not exist. Ten fits the dropdown's scroll height,
 * and the picker says so when a search fills it.
 */
export const BLOG_SEARCH_LIMIT = 10;
