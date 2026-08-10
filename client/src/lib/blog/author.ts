/**
 * Who an article is published under.
 *
 * A post carries two different "authors". `author` is the admin ACCOUNT that
 * typed it in — usually the shared login, whose name is literally "Admin" —
 * while `editorialAuthor` is the person it is published under, the one with a
 * bio page of their own. Only the second is a byline.
 *
 * Every card used to pick whichever field it happened to reach for, so the
 * same article read "By Madonna Roshdey" on the homepage and "By Admin" in the
 * listing three clicks away. Resolving it in one place is what keeps those in
 * step; "Admin" as a byline is also the weakest authorship signal a travel
 * blog can send, on pages whose whole argument is that a person who has been
 * there wrote this.
 */

export const EDITORIAL_AUTHOR_NAME = "Madonna Roshdey";
export const EDITORIAL_AUTHOR_SLUG = "madonna-roshdey";

/**
 * The name to print for an admin account. Anything but the shared "Admin"
 * login is a real person and is shown as-is; "Admin" itself is replaced by the
 * house byline rather than exposing an internal account name to visitors.
 */
export function getPublicAuthorName(authorName?: string | null): string {
  const trimmed = typeof authorName === "string" ? authorName.trim() : "";
  if (trimmed && trimmed.toLowerCase() !== "admin") {
    return trimmed;
  }
  return EDITORIAL_AUTHOR_NAME;
}

export function isEditorialAuthor(authorName: string): boolean {
  return authorName === EDITORIAL_AUTHOR_NAME;
}

export interface BlogByline {
  name: string;
  /** Author-page slug, or "" when this byline has no page to link to. */
  slug: string;
  /** Ready-made href, or "" — callers render plain text when it is empty. */
  link: string;
}

/**
 * Resolves the byline for a post: the editorial author when one is set, the
 * admin account's public name otherwise. The link is only produced when the
 * byline genuinely has an author page — a link to a 404 is worse than text.
 */
export function resolveBlogByline(post: any, locale: string): BlogByline {
  const editorial = post?.editorialAuthor;
  const editorialName =
    typeof editorial?.name === "string" ? editorial.name.trim() : "";
  const accountName =
    post?.author && typeof post.author === "object" ? post.author.name : undefined;

  const name = editorialName || getPublicAuthorName(accountName);

  const editorialSlug =
    typeof editorial?.slug === "string" ? editorial.slug.trim() : "";
  const slug =
    editorialSlug || (isEditorialAuthor(name) ? EDITORIAL_AUTHOR_SLUG : "");

  return {
    name,
    slug,
    link: slug ? `/${locale}/authors/${slug}` : "",
  };
}
