"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

/**
 * The shared i18next instance — initialised with NO resources.
 *
 * It used to statically import nine namespaces for four languages (~164 KB of
 * raw JSON) into `init({ resources })`, which is not tree-shakeable, so every
 * visitor downloaded and parsed every language to read one. The active
 * locale's translations are now loaded on the server and seeded here by
 * I18nProvider via `addResourceBundle` before the first render — see
 * src/i18n/bundles/index.ts.
 */
export const I18N_NAMESPACES = [
  "common",
  "faq",
  "contact",
  "wishlist",
  "tailorMade",
  "tours",
  "search",
  "blogs",
  "specialOffers",
] as const;

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .use(LanguageDetector)
    .init({
      resources: {},
      fallbackLng: "en",
      supportedLngs: ["en", "de", "it", "es"],
      defaultNS: "common",
      ns: [...I18N_NAMESPACES],
      // Bundles are added imperatively, so nothing is ever "still loading":
      // without this, i18next suspends rendering waiting for a backend that
      // does not exist here.
      initImmediate: false,
      react: { useSuspense: false },
      detection: {
        order: ["path", "cookie", "localStorage", "navigator"],
        caches: ["cookie", "localStorage"],
        lookupCookie: "NEXT_LOCALE",
        lookupFromPathIndex: 0,
      },
      interpolation: {
        escapeValue: false,
      },
    });
}

export default i18n;
