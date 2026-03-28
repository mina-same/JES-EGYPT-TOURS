"use client";

import React, { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";

export function I18nProvider({ children, locale }: { children: React.ReactNode; locale?: string }) {
  useEffect(() => {
    const handler = (lng: string) => {
      if (typeof document !== "undefined") {
        document.documentElement.lang = lng || "en";
      }
    };
    
    if (locale) {
      i18n.changeLanguage(locale);
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