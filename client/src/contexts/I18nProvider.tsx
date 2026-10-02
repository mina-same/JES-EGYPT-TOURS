"use client";

import React, { useEffect, useMemo } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";
import type { LocaleResources } from "@/i18n/bundles";
import { seedResources } from "@/i18n/seedResources";

const isServer = typeof window === "undefined";

export function I18nProvider({
  children,
  locale,
  resources,
}: {
  children: React.ReactNode;
  locale?: string;
  /** Loaded server-side so no locale JSON ships in the client bundle. */
  resources?: LocaleResources;
}) {
  // Browser: one visitor per instance, so keeping the shared one in sync every
  // render is both safe and what makes the first paint match the URL's language.
  if (!isServer) {
    seedResources(i18n, resources);
    if (locale && i18n.resolvedLanguage !== locale && i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }

  // Server: this module-level instance is shared by every request rendering at
  // the same moment, so changing its language here leaked one visitor's locale
  // into another's HTML — an /en page could ship "Startseite" and then fail to
  // hydrate. Each server render gets its own clone instead; the clone shares the
  // resource store, so it costs an object, not a copy of the translations.
  const instance = useMemo(() => {
    if (!(isServer && locale)) return i18n;
    const clone = i18n.cloneInstance({ lng: locale, initImmediate: false });
    seedResources(clone, resources);
    return clone;
  }, [locale, resources]);

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

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}
