/**
 * Fallback artwork for records that have no image yet.
 *
 * Exported as a constant because the value it replaces — "/assets/images/
 * resources/tour-1-1.jpg" — had been copy-pasted into sixteen places, and the
 * file it pointed at existed at neither that path nor any other. Every one of
 * them returned 400 through the image optimizer. A single source of truth is
 * what stops the next copy from drifting.
 *
 * Note the URL shape: files under `public/` are served from the site root, so
 * the path starts at `/images/...`. There is no `/assets/` segment — that was
 * the original mistake, and `src/assets/*` (which does exist) is a different
 * mechanism entirely, reachable only through a module `import`, never a URL.
 *
 * The asset itself is a flat colour, not a photograph: a stand-in should read
 * as an empty slot rather than misrepresent a tour with someone else's picture.
 * Replace the file to change the look — no code has to move.
 */
export const TOUR_IMAGE_PLACEHOLDER = "/images/resources/tour-placeholder.png";

/**
 * The same asset, under the name the blog cards ask for.
 *
 * Article cards used to fall back to `https://placehold.co/600x400?text=Image`,
 * a third-party image server: a request leaving the site on every card with no
 * picture, unoptimizable by next/image, and a stranger's uptime deciding
 * whether a listing renders. It is aliased rather than given its own file
 * because the stand-in is a flat colour with nothing tour-specific about it —
 * point this at a blog-specific asset if that ever changes.
 */
export const BLOG_IMAGE_PLACEHOLDER = TOUR_IMAGE_PLACEHOLDER;
