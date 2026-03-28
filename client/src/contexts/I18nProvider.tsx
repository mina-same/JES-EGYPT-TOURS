"use client";

import React, { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";

export function I18nProvider({ children, locale }: { children: React.ReactNode; locale?: string }) {
  // Sync the language synchronously to prevent SSR hydration mismatches
  // where the server renders English but the client hydrates with German/Italian
  if (locale && i18n.resolvedLanguage !== locale && i18n.language !== locale) {
    i18n.changeLanguage(locale);
  }

  useEffect(() => {
    const handler = (lng: string) => {
      if (typeof document !== "undefined") {
        document.documentElement.lang = lng || "en";
      }
    };
    
    if (locale) {
      handler(locale);
    } else {
      handler(i18n.language);
    }

    i18n.on("languageChanged", handler);
    return () => {
      i18n.off("languageChanged", handler);
    };
  }, [locale]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}