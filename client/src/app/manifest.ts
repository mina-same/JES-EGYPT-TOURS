import type { MetadataRoute } from "next";

/**
 * The web app manifest — one for the whole site.
 *
 * ── Why it lives here ──
 * This file used to sit at `app/(visitor)/[locale]/(home)/manifest.ts`, which
 * made its route `/en/manifest.webmanifest`. Next only links a manifest
 * automatically from the ROOT of the app directory, so nothing ever pointed at
 * it and no browser read it — which is why its contents went unnoticed for so
 * long. It now sits beside robots.ts and sitemap.ts, the site's other two
 * generated root files, and is served at `/manifest.webmanifest`.
 *
 * ── What it replaced ──
 * The values were the unmodified Next.js starter, carrying the purchased
 * theme's identity: name "gotur-nextjs", short_name "Gotur", the description
 * "A Progressive Web App built with Next.js", a theme colour of #ff5528
 * (orange, from the template) and two icon paths — /icon-192x192.png and
 * /icon-512x512.png — that did not exist in public/. Installing the site to a
 * phone's home screen showed the theme vendor's name with a broken icon.
 *
 * The manifest is intentionally minimal: no service worker, no install
 * prompt, no offline handling. It exists so an installed shortcut carries the
 * right name, colour and icon — nothing more.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JES Egypt Tours",
    short_name: "JES Egypt",
    description:
      "Private Egypt tours and Nile cruises with licensed Egyptologist guides.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    // The brand gold, the same value the site's own accents use.
    theme_color: "#b79c5c",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
