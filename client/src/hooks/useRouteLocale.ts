"use client";

import { useParams } from "next/navigation";
import { normalizeLocale, type SupportedLocale } from "@/lib/url/locales";

/**
 * The locale of the CURRENT request, taken from the route.
 *
 * Use this — not `i18n.resolvedLanguage` / `i18n.language` — anywhere the answer
 * affects rendered output: localized hrefs, date and number formats, or any
 * per-language lookup table.
 *
 * ── Why not read it off the i18next instance ──
 * Translation itself is already request-safe: I18nProvider hands every server
 * render its own `cloneInstance`, so `t()` cannot pick up another visitor's
 * language. `resolvedLanguage` is the part that is not safe. i18next only fills
 * it in once it has finished RESOLVING a language, and on the first render of a
 * given locale in a server process that has not resolved it yet, it still holds
 * the previously resolved value. Measured on a production build, first German
 * request after an English one:
 *
 *     resolvedLanguage=en   language=de   lngOpt=de   isClone=true
 *
 * Code written as `i18n.resolvedLanguage || i18n.language` therefore preferred
 * the stale `en` and emitted `<a href="/en/contact">` into German HTML — beside
 * a correctly translated "Kontaktieren Sie uns", which is what made it easy to
 * miss. The second request for the same locale looked fine, because by then the
 * resolution had completed.
 *
 * Route params carry no such state. They are read from the URL being rendered,
 * so two requests for different locales cannot influence one another no matter
 * how they interleave.
 *
 * `fallback` covers a component rendered outside the `[locale]` segment, where
 * `useParams()` has no locale to give; pass the i18next language there if the
 * caller has one. Without it the site default is used.
 */
export function useRouteLocale(fallback?: string): SupportedLocale {
  const params = useParams() as { locale?: string | string[] } | null;
  const raw = Array.isArray(params?.locale) ? params?.locale[0] : params?.locale;
  return normalizeLocale(raw ?? fallback);
}
