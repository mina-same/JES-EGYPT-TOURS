/**
 * The stand-in picture every seeder writes into image fields.
 *
 * The seeders used to hardcode `https://images.unsplash.com/photo-…` URLs.
 * That was not a cosmetic choice: whatever a seeder writes lands in MongoDB,
 * gets served by the API, and ends up in a `next/image` `src` on the public
 * site — so a stock URL in a fixture silently turned a third-party CDN into a
 * production dependency and forced `images.unsplash.com` into the optimizer's
 * `remotePatterns`. Removing the host from `client/next.config.ts` is what
 * surfaced it: the home page threw `Invalid src prop` on a seeded tour.
 *
 * The value is a path, not an absolute URL, because files under
 * `client/public/` are served from the site root — the same asset and the same
 * reasoning as `client/src/lib/images/placeholders.ts`, which is where the
 * runtime fallback for a record with no image already lives.
 *
 * Keep this in step with TOUR_IMAGE_PLACEHOLDER in
 * client/src/lib/images/placeholders.ts — same file, same extension. Seed data
 * is not real content: this stands in only until the admin uploads the real
 * picture, which arrives as a Cloudinary URL.
 *
 * Do not put a remote stock-image URL back here.
 */
export const SEED_IMAGE_PLACEHOLDER = '/images/resources/tour-placeholder.webp';
