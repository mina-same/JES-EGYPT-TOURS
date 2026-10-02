import { Playfair_Display } from "next/font/google";

/**
 * Preloads the Playfair Display italic face for the About page, whose page
 * header accent paints in it in the first viewport. See displayItalicHome.ts
 * for why the layout does not preload it and why this is one module per page.
 */
export const aboutDisplayItalic = Playfair_Display({
  variable: "--font-display-italic-about",
  subsets: ["latin"],
  display: "swap",
  style: ["italic"],
});
