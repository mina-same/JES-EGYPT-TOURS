/**
 * The comment data a visitor may see — the public half of a blog comment.
 *
 * A post keeps every submission in `comments`, approved or not, each with the
 * commenter's email address (models/Blog.ts). The public article endpoint used
 * to send that array whole, so pending submissions and every commenter's
 * address reached the page's serialized props, even though the page itself
 * only draws approved comments. Public responses pass comments through here
 * instead.
 *
 * Approved means `isApproved === true`, the schema's only moderation state.
 * Anything else (pending, turned down, or an old record without the flag)
 * stays on the server.
 *
 * The fields are named rather than filtered out, so a field added to the
 * comment schema later stays private until someone decides it is public. They
 * are exactly what the comment card draws; `isApproved` is kept because the
 * article page still filters on it, and on this list it is always true.
 */
export interface PublicBlogComment {
  _id: string;
  name: string;
  text: string;
  avatar?: string;
  isApproved: true;
  createdAt?: Date | string;
}

/** A stored comment as it arrives: a subdocument or its plain object. */
interface StoredComment {
  _id?: unknown;
  name?: unknown;
  text?: unknown;
  avatar?: unknown;
  isApproved?: unknown;
  createdAt?: unknown;
}

const isApprovedComment = (comment: unknown): comment is StoredComment =>
  typeof comment === 'object' &&
  comment !== null &&
  (comment as StoredComment).isApproved === true;

export const toPublicBlogComments = (comments: unknown): PublicBlogComment[] => {
  if (!Array.isArray(comments)) return [];

  return comments.filter(isApprovedComment).map((comment) => ({
    _id: String(comment._id),
    name: String(comment.name ?? ''),
    text: String(comment.text ?? ''),
    ...(typeof comment.avatar === 'string' && comment.avatar ? { avatar: comment.avatar } : {}),
    isApproved: true as const,
    ...(comment.createdAt instanceof Date || typeof comment.createdAt === 'string'
      ? { createdAt: comment.createdAt }
      : {}),
  }));
};
