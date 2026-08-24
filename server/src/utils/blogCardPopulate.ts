import type { PopulateOptions } from 'mongoose';

/**
 * What a blog CARD needs — the server half of the client's card view model.
 *
 * Every surface that shows article cards (related posts under an article,
 * featured blogs on a category, subcategory or destination page) reaches for
 * the same handful of fields, and the two references the card resolves its
 * byline and its section label from. Spelling that out per call site is how
 * the pages drifted: some populated the admin `author` and printed "By Admin",
 * some populated nothing at all and printed it anyway, and none of them asked
 * for `readingTime`.
 *
 * The teaser here is `cardDescription`, not `excerpt`. `excerpt` still exists
 * and still does its other two jobs — the article page's sub-title and the
 * meta-description fallback — but it is not what a card shows, and a card that
 * has no `cardDescription` shows no description at all.
 *
 * The select list is also a payload guard. `.populate('featuredBlogs')` with
 * no projection ships whole articles — every content block, in four languages —
 * to draw a title and a thumbnail. Naming the fields keeps a card a card.
 */
export const BLOG_CARD_FIELDS =
  'title slug featuredImage cardDescription publishedAt createdAt tags readingTime editorialAuthor subCategory';

export const blogCardPopulate = (path: string): PopulateOptions => ({
  path,
  select: BLOG_CARD_FIELDS,
  populate: [
    // The public byline, with its own author page.
    { path: 'editorialAuthor' },
    // The section label on the card, and where it links.
    { path: 'subCategory', select: 'name slug' },
  ],
});
