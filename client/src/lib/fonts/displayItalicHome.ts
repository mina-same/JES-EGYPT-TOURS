import { Playfair_Display } from "next/font/google";

/**
 * Preloads the Playfair Display italic face for the home page, whose slider
 * subtitle paints in it in the first viewport.
 *
 * The visitor layout declares this face for every route WITHOUT a preload:
 * elsewhere the italic accent only appears below the fold, and preloading it
 * there made ~39 KB compete with the render-blocking CSS on slow connections.
 * Pages that paint it at once preload it through a module like this one, so
 * their text never starts in the fallback face. Same family, same file - only
 * the preload differs.
 *
 * One module per page on purpose: identical font calls share one CSS module,
 * and Turbopack placed that shared module in a chunk also linked on unrelated
 * routes, which brought the preload back everywhere. The `variable` (never
 * read) is what keeps each page's call distinct.
 */
export const homeDisplayItalic = Playfair_Display({
  variable: "--font-display-italic-home",
  subsets: ["latin"],
  display: "swap",
  style: ["italic"],
});
