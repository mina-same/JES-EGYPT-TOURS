import { Playfair_Display } from "next/font/google";

/**
 * Preloads the Playfair Display italic face for the FAQ page, whose sidebar
 * sub-title paints in it in the first viewport. See displayItalicHome.ts for
 * why the layout does not preload it and why this is one module per page.
 */
export const faqDisplayItalic = Playfair_Display({
  variable: "--font-display-italic-faq",
  subsets: ["latin"],
  display: "swap",
  style: ["italic"],
});
