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

/**
 * The same card as a LISTING query — what /blog/categories/:slug/posts,
 * /blog/subcategories/:slug/posts and /destinations/:id/blogs select and
 * populate for each article on the page.
 *
 * Those two used to exclude only `comments` and `contentBlocks` and populate
 * whole documents, so every card carried its article's FAQs, summary, key
 * takeaways and SEO fields, the editorial author's full profile (bio, about,
 * expertise, images) and the admin account's email address: ~14 KB per card,
 * of which the card reads under 1 KB. The Blog Category and Subcategory pages
 * render on the server and pass this list to a Client Component, so all of it
 * was serialized into the page's HTML a second time as well.
 *
 * `author` is the one field BLOG_CARD_FIELDS leaves out: resolveBlogByline
 * falls back to the account's display name when an article has no editorial
 * author, so the name — and only the name — is kept.
 *
 * Kept separate from blogCardPopulate on purpose: that one also serves the
 * featured-blog populates on destination pages and an article's related posts,
 * and narrowing it would change those responses too.
 */
export const BLOG_LISTING_FIELDS = `${BLOG_CARD_FIELDS} author`;

export const BLOG_LISTING_POPULATE: PopulateOptions[] = [
  { path: 'editorialAuthor', select: 'name slug' },
  { path: 'author', select: 'name' },
  { path: 'subCategory', select: 'name slug' },
];

/**
 * A whole article minus its stored comments, for the public responses that
 * still embed full Blog documents: the by-id category, subcategory and
 * destination routes (their editors reduce featured articles to ids). Stored
 * comments carry each commenter's email and every unapproved submission, and
 * none of those responses shows comments, so they stay in the database rather
 * than being sent and ignored.
 */
export const BLOG_WITHOUT_COMMENTS = '-comments';
