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
 * The asset is one of the agency's own Egypt photographs. It was a flat colour
 * until 2026-08-29, on the reasoning that a stand-in should read as an empty
 * slot rather than misrepresent a tour — that risk is real and still worth
 * knowing about: a card with no picture of its own now looks like it has one.
 * What makes it acceptable is ownership. The picture is the agency's, served
 * from `public/`, so it carries no third-party dependency and no licence to
 * honour — the two things that made the old Unsplash hotlinks untenable.
 *
 * The extension is `.webp`, not `.png`: the file is a photograph, and the same
 * image as PNG weighs 3.3 MB against 172 KB here. Swapping the file for another
 * format means changing this constant AND `SEED_IMAGE_PLACEHOLDER` in
 * `server/src/seeds/seedImages.ts` — a path served with the wrong extension
 * gets the wrong Content-Type.
 */
export const TOUR_IMAGE_PLACEHOLDER = "/images/resources/tour-placeholder.webp";

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
