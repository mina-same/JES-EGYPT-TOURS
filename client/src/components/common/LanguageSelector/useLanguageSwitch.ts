"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { usePathname, useRouter } from "next/navigation";
import i18n from "@/lib/i18n";
import { useSlugs } from "@/contexts/SlugContext";
import {
  getCanonicalStaticSlug,
  localizeInternalUrl,
  localizeStaticPathSegment,
} from "@/lib/url";
import { markLanguageFocus } from "./languageFocus";

export const LOCALES: readonly string[] = ["en", "de", "it", "es"];

const STATIC_PATHS = new Set([
  "/",
  "/about",
  "/contact",
  "/faq",
  "/login",
  "/special-offers",
  "/tailor-made",
  "/travel-trade",
  "/privacy-policy",
  "/payment-cancellation-policy",
  "/search",
  "/wishlist",
  "/404",
]);

function getStrictSlug(value: string | undefined): string | null {
  if (typeof value !== "string") return null;

  const slug = value.trim().replace(/^\/+|\/+$/g, "");
  return slug || null;
}

function hasRealSlugMap(slugs: Record<string, string | undefined> | null): boolean {
  if (!slugs) return false;
  return Object.values(slugs).some((slug) => !!getStrictSlug(slug));
}

function isLikelyDynamicSlugPath(path: string): boolean {
  const normalized = path === "" ? "/" : path;
  const firstSegment = normalized.replace(/^\/+/, "").split(/[/?#]/)[0];
  const canonicalStaticSlug = getCanonicalStaticSlug(firstSegment);
  if (canonicalStaticSlug && STATIC_PATHS.has(`/${canonicalStaticSlug}`)) return false;

  // Canonicalize localized static slugs first ("/sonderangebote" →
  // "/special-offers") so they are recognized as static pages.
  if (STATIC_PATHS.has(localizeStaticPathSegment(normalized, "en"))) return false;

  const segments = normalized.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  return segments.length === 1;
}

export interface LanguageOption {
  value: string;
  label: string;
  flag: string;
  /** This page has no version in that language. */
  isDisabled: boolean;
}

/**
 * Where each language leads from the page on screen, and the switch itself.
 *
 * Shared by the top bar's LanguageSelector and the mobile language & currency
 * panel (SitePreferences), so both offer the same links and switch the same
 * way: the cookie and storage the middleware and i18n read, and the focus
 * request a keyboard-made switch leaves for the next page (languageFocus.ts).
 */
export function useLanguageSwitch() {
  const { t } = useTranslation("common");
  const { localizedSlugs } = useSlugs();
  const router = useRouter();
  const pathname = usePathname();
  const pathLocale = useMemo(() => {
    const seg = (pathname || "/").split("/")[1] || "";
    return LOCALES.includes(seg) ? seg : "";
  }, [pathname]);
  const normalizedPath = useMemo(() => {
    const parts = (pathname || "/").split("/");
    const first = parts[1] || "";
    if (LOCALES.includes(first)) {
      return "/" + parts.slice(2).join("/");
    }
    return pathname || "/";
  }, [pathname]);
  const currentLocale = (pathLocale || i18n.language || "en").split("-")[0];
  const hasDynamicSlugContext = useMemo(() => hasRealSlugMap(localizedSlugs), [localizedSlugs]);
  const isDynamicSlugPage = hasDynamicSlugContext || isLikelyDynamicSlugPath(normalizedPath);
  const options = useMemo<LanguageOption[]>(() => {
    const baseOptions = [
      { value: "en", label: t("language.english"), flag: "en" },
      { value: "de", label: t("language.german"), flag: "de" },
      { value: "it", label: t("language.italian"), flag: "it" },
      { value: "es", label: t("language.spanish"), flag: "es" },
    ];

    return baseOptions.map((option) => {
      const hasTargetSlug = !!getStrictSlug(localizedSlugs?.[option.value]);
      const isCurrentLocale = option.value === currentLocale;
      const isDisabled = isDynamicSlugPage && !isCurrentLocale && !hasTargetSlug;

      return {
        ...option,
        isDisabled,
      };
    });
  }, [currentLocale, isDynamicSlugPage, localizedSlugs, t]);

  /** Where a language leads from this page; null when the page has no version in it. */
  const getTargetUrl = (locale: string): string | null => {
    // Static pages with per-locale slugs switch to the TARGET locale's
    // slug ("/sonderangebote" → "/offerte-speciali"); other paths pass
    // through unchanged.
    let targetPath = localizeStaticPathSegment(normalizedPath, locale);

    // If we have localized slugs, we need to replace the last segment of the path
    if (isDynamicSlugPage) {
      const newSlug = getStrictSlug(localizedSlugs?.[locale]);
      if (!newSlug && locale !== currentLocale) {
        return null;
      }
      if (newSlug) {
        const pathParts = normalizedPath.split("/");
        // Assuming the slug is the last part of relevant paths (tours/slug, category/slug, etc.)
        if (pathParts.length > 1) {
          pathParts[pathParts.length - 1] = newSlug;
          targetPath = pathParts.join("/");
        }
      }
    }

    return isDynamicSlugPage
      ? `/${locale}${targetPath === "/" ? "/" : targetPath}`
      : localizeInternalUrl(normalizedPath, locale);
  };

  /** Moves to `target`, the page in `locale` (from getTargetUrl). */
  const switchLanguage = (locale: string, target: string, fromKeyboard = false) => {
    i18n.changeLanguage(locale);
    try {
      localStorage.setItem("i18nextLng", locale);
    } catch {}
    try {
      document.cookie = `NEXT_LOCALE=${locale};path=/`;
    } catch {}

    // The page in the new language rebuilds the header: its selector takes
    // the focus back (languageFocus.ts). Choosing the current language goes
    // nowhere, and leaves nothing to restore.
    if (fromKeyboard && locale !== currentLocale) markLanguageFocus(target);

    router.push(target);
  };

  return {
    options,
    currentLocale,
    pathLocale,
    normalizedPath,
    isDynamicSlugPage,
    getTargetUrl,
    switchLanguage,
  };
}
