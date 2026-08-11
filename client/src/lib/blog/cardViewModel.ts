/**
 * Everything an article card needs, derived once.
 *
 * Five places on the site drew a blog card — the homepage carousel, the blog
 * listing grid, the destination/category sections, the "keep exploring" strip
 * under an article and the related-blogs block on a tour — and each one had
 * written its own copy of this mapping. They drifted, as duplicated mappings
 * do: one localized the date through the shared helper and the others called
 * `toLocaleString`, one linked the tag to the tag listing and the rest linked
 * it back to the article, one showed the editorial author and the rest printed
 * "By Admin". Deriving the card here means the next fix lands in all five.
 *
 * Returning `null` for a post with no slug in the active language is part of
 * the contract, not an error case: an article that has not been translated
 * must not appear as a card that leads to another language.
 */

import { formatBlogDate } from "@/lib/api/blog";
import { BLOG_IMAGE_PLACEHOLDER } from "@/lib/images/placeholders";
import { getLocalizedValue } from "@/lib/localize";
import { getStrictLocalizedSlug, type SupportedLocale } from "@/lib/url";
import { resolveBlogByline } from "./author";

export interface BlogCardViewModel {
  id: string;
  title: string;
  /** Article URL in the active locale. */
  link: string;
  image: string;
  imageAlt: string;
  imageTitle: string;
  /** Date badge parts; `day`/`month` are "" when the post has no valid date. */
  day: string;
  month: string;
  /** ISO date for <time dateTime>, so the badge is machine-readable. */
  iso: string;
  /** Full date including the year — the badge itself shows only day + month. */
  dateLabel: string;
  author: string;
  /** Author-page URL, or "" when the byline has no page. */
  authorLink: string;
  /** Sub-category name when the post has one, else its first tag, else "". */
  category: string;
  categoryLink: string;
  excerpt: string;
  /** Minutes, computed server-side from the word count. 0 when unknown. */
  readingTime: number;
}

const asTrimmedString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export function buildBlogCardViewModel(
  post: any,
  locale: string
): BlogCardViewModel | null {
  const slug = getStrictLocalizedSlug(post?.slug, locale as SupportedLocale);
  if (!slug) return null;

  const title = asTrimmedString(getLocalizedValue(post?.title, locale));

  // `featuredImage` is a string on older records and an object on new ones.
  const imageObject =
    post?.featuredImage && typeof post.featuredImage === "object"
      ? post.featuredImage
      : null;
  const image =
    asTrimmedString(post?.featuredImage) ||
    asTrimmedString(imageObject?.url) ||
    BLOG_IMAGE_PLACEHOLDER;
  const imageAlt =
    asTrimmedString(getLocalizedValue(imageObject?.alt, locale)) || title;
  const imageTitle =
    asTrimmedString(getLocalizedValue(imageObject?.title, locale)) || imageAlt;

  const { day, month, iso, label: dateLabel } = formatBlogDate(
    post?.publishedAt || post?.createdAt,
    locale
  );

  const byline = resolveBlogByline(post, locale);

  // The sub-category is the article's real classification: it has a name, a
  // localized slug and a page of its own. A tag is a keyword with no page
  // beyond the filtered listing, so it is the fallback, not the first choice —
  // and the tag link goes to /blogs/all, the route that actually filters
  // (/blogs is the hub page and ignores the parameter).
  const subCategory =
    post?.subCategory && typeof post.subCategory === "object"
      ? post.subCategory
      : null;
  const subCategoryName = asTrimmedString(
    getLocalizedValue(subCategory?.name, locale)
  );
  const subCategorySlug = subCategory
    ? getStrictLocalizedSlug(subCategory.slug, locale as SupportedLocale)
    : null;

  const localizedTags = getLocalizedValue(post?.tags, locale);
  const firstTag = Array.isArray(localizedTags)
    ? asTrimmedString(localizedTags[0])
    : "";

  let category = "";
  let categoryLink = "";
  if (subCategoryName && subCategorySlug) {
    category = subCategoryName;
    categoryLink = `/${locale}/${subCategorySlug}`;
  } else if (firstTag) {
    category = firstTag;
    categoryLink = `/${locale}/blogs/all?tag=${encodeURIComponent(firstTag)}`;
  }

  const readingTime =
    typeof post?.readingTime === "number" && post.readingTime > 0
      ? Math.round(post.readingTime)
      : 0;

  return {
    id: String(post?._id || post?.id || slug),
    title,
    link: `/${locale}/${slug}`,
    image,
    imageAlt: imageAlt || title || "Blog post image",
    imageTitle,
    day,
    month,
    iso,
    dateLabel,
    author: byline.name,
    authorLink: byline.link,
    category,
    categoryLink,
    excerpt: asTrimmedString(getLocalizedValue(post?.excerpt, locale)),
    readingTime,
  };
}

/**
 * Maps a list of posts, dropping any that have no slug in this language.
 * `limit` is applied AFTER that filter, so a section asking for three cards
 * gets three translated ones rather than three minus whatever was skipped.
 */
export function buildBlogCardViewModels(
  posts: unknown,
  locale: string,
  limit?: number
): BlogCardViewModel[] {
  if (!Array.isArray(posts)) return [];

  const models = posts
    .map((post) => buildBlogCardViewModel(post, locale))
    .filter((model): model is BlogCardViewModel => model !== null);

  return typeof limit === "number" ? models.slice(0, limit) : models;
}
