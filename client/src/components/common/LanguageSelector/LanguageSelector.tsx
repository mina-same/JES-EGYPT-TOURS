"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import './langusgeSelect.css'
import i18n from "@/lib/i18n";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { GB, DE, IT, ES } from "country-flag-icons/react/3x2";
import { useSlugs } from "@/contexts/SlugContext";
import {
  getCanonicalStaticSlug,
  localizeInternalUrl,
  localizeStaticPathSegment,
} from "@/lib/url";
import {
  canTakeFocus,
  clearLanguageFocus,
  hasPendingLanguageFocus,
  isKeyboardClick,
  markLanguageFocus,
} from "./languageFocus";

const FLAG_COMPONENTS: Record<string, any> = {
  en: GB,
  de: DE,
  it: IT,
  es: ES,
};

const LOCALES: readonly string[] = ["en", "de", "it", "es"];

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

/** The languages a visitor can move to: the links in the list, in order. */
function getLanguageLinks(menu: HTMLUListElement | null): HTMLAnchorElement[] {
  return Array.from(menu?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? []);
}

interface LanguageSelectorProps {
  theme?: "light" | "dark";
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  /** -1 keeps the button and its links out of the tab order (see SiteHeader's sticky copy). */
  tabIndex?: number;
}

const OPEN_DELAY_MS = 160;
const CLOSE_DELAY_MS = 250;

/**
 * The language switcher: a button that discloses a list of links, one per
 * language, each to this page in that language.
 *
 * It was a react-select. That put react-select and Emotion into the JavaScript
 * of every visitor page for one four-item menu, and gave assistive technology
 * a combobox with no name. Links are what the items are: choosing one
 * navigates.
 */
const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  theme = "dark",
  isOpen,
  onOpen,
  onClose,
  tabIndex,
}) => {
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
  const options = useMemo(() => {
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
  const [mounted, setMounted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(options[0]);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [canHoverOpen, setCanHoverOpen] = useState(false);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  // The end of the list an arrow key asked for while the list was closed.
  const pendingFocusRef = useRef<"first" | "last" | null>(null);
  // True while the list is open because the pointer came to rest on it.
  const openedByHoverRef = useRef(false);
  const menuId = useId();
  const isControlled = typeof isOpen === "boolean";
  const menuIsOpen = isControlled ? isOpen : internalIsOpen;

  const clearOpenTimer = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  };

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openMenu = () => {
    if (isControlled) {
      onOpen?.();
      return;
    }

    setInternalIsOpen(true);
    onOpen?.();
  };

  const closeMenu = () => {
    if (isControlled) {
      onClose?.();
      return;
    }

    setInternalIsOpen(false);
    onClose?.();
  };

  const toggleMenu = () => {
    clearOpenTimer();
    clearCloseTimer();

    // The pointer resting on the button has already opened the list. The click
    // that follows is the visitor reaching for it, not sending it away.
    if (menuIsOpen && openedByHoverRef.current) {
      openedByHoverRef.current = false;
      return;
    }

    if (menuIsOpen) {
      closeMenu();
      return;
    }

    openMenu();
  };

  const handlePointerEnter = () => {
    if (!canHoverOpen) return;
    clearCloseTimer();
    clearOpenTimer();
    openTimerRef.current = setTimeout(() => {
      if (menuRef.current?.hidden) openedByHoverRef.current = true;
      openMenu();
    }, OPEN_DELAY_MS);
  };

  const handlePointerLeave = () => {
    if (!canHoverOpen) return;
    clearOpenTimer();
    clearCloseTimer();
    closeTimerRef.current = setTimeout(closeMenu, CLOSE_DELAY_MS);
  };

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

  const selectLanguage = (option: (typeof options)[number], fromKeyboard = false) => {
    if (option.isDisabled) return;

    const target = getTargetUrl(option.value);
    if (!target) return;

    setSelectedOption(option);
    closeMenu();
    i18n.changeLanguage(option.value);
    try {
      localStorage.setItem("i18nextLng", option.value);
    } catch {}
    try {
      document.cookie = `NEXT_LOCALE=${option.value};path=/`;
    } catch {}

    // The page in the new language rebuilds the header: its selector takes
    // the focus back (languageFocus.ts). Choosing the current language goes
    // nowhere, and leaves nothing to restore.
    if (fromKeyboard && option.value !== currentLocale) markLanguageFocus(target);

    router.push(target);
  };

  const handleLinkClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    option: (typeof options)[number]
  ) => {
    // A modified click (new tab, new window, download) is the browser's.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    // The link is about to be hidden; focus goes back to the button first.
    buttonRef.current?.focus();
    selectLanguage(option, isKeyboardClick(event));
  };

  // Tab and Shift+Tab walk the button and the links as they would any links.
  // The arrow keys, Home and End are the optional extras of the disclosure
  // pattern, and are what the menu this replaces answered to.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const links = getLanguageLinks(menuRef.current);
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    const focusLink = (position: number) =>
      links[(position + links.length) % links.length]?.focus();

    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        const down = event.key === "ArrowDown";
        if (!menuIsOpen) {
          pendingFocusRef.current = down ? "first" : "last";
          clearOpenTimer();
          openMenu();
        } else if (index === -1) {
          focusLink(down ? 0 : -1);
        } else {
          focusLink(index + (down ? 1 : -1));
        }
        break;
      }
      case "Home":
      case "End":
        if (!menuIsOpen) return;
        event.preventDefault();
        focusLink(event.key === "Home" ? 0 : -1);
        break;
      case " ":
        // A link answers to Enter alone; Space chose a language before.
        if (index === -1) return;
        event.preventDefault();
        links[index].click();
        break;
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    // Focus has moved on to another control: the list does not stay behind.
    if (menuIsOpen && next && !event.currentTarget.contains(next)) closeMenu();
  };

  useEffect(() => {
    setMounted(true);
    const found = options.find(o => o.value === currentLocale) || options[0];
    setSelectedOption(found);

    if (isDynamicSlugPage) {
      return;
    }

    // Filter and log user country/timezone
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Automatic Language Detection (only on first visit if no preference is saved)
      const hasPreference = localStorage.getItem("i18nextLng");
      if (!hasPreference) {
          let detectedLocale = 'en'; // Default

          // Detection using timezone (as requested)
          const tz = timezone.toLowerCase();
          if (tz.includes('berlin') || tz.includes('zurich') || tz.includes('vienna') || tz.includes('germany') || tz.includes('europe/london') === false && (navigator.language.startsWith('de'))) {
            detectedLocale = 'de';
          } else if (tz.includes('rome') || tz.includes('milan') || tz.includes('venice') || (navigator.language.startsWith('it'))) {
            detectedLocale = 'it';
          } else if (tz.includes('madrid') || tz.includes('barcelona') || tz.includes('sevilla') || (navigator.language.startsWith('es'))) {
            detectedLocale = 'es';
          }

          // If detected non-english and we are currently on default 'en'
          if (detectedLocale !== 'en' && pathLocale === 'en') {
             const target = localizeInternalUrl(normalizedPath, detectedLocale);
             i18n.changeLanguage(detectedLocale);
             localStorage.setItem("i18nextLng", detectedLocale);
             document.cookie = `NEXT_LOCALE=${detectedLocale};path=/`;
             router.push(target);
          }
      }
    } catch (e) {
      console.error("Location/Detection failed", e);
    }
  }, [currentLocale, isDynamicSlugPage, normalizedPath, options, pathLocale, router]);

  useEffect(() => {
    const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updateHoverCapability = () => setCanHoverOpen(hoverQuery.matches);

    updateHoverCapability();
    hoverQuery.addEventListener("change", updateHoverCapability);

    return () => {
      hoverQuery.removeEventListener("change", updateHoverCapability);
    };
  }, []);

  useEffect(() => {
    return () => {
      clearOpenTimer();
      clearCloseTimer();
    };
  }, []);

  // While the list is open: Escape closes it from anywhere (it may be open
  // under the pointer with focus elsewhere), and so does pressing outside it.
  useEffect(() => {
    if (!menuIsOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      clearOpenTimer();
      clearCloseTimer();
      // Out of the list before it is hidden, so focus is never left on nothing.
      if (rootRef.current?.contains(document.activeElement)) buttonRef.current?.focus();
      closeMenu();
    };
    const handlePressOutside = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("pointerdown", handlePressOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("pointerdown", handlePressOutside);
    };
  });

  useEffect(() => {
    if (!menuIsOpen) {
      openedByHoverRef.current = false;
      return;
    }

    const end = pendingFocusRef.current;
    pendingFocusRef.current = null;
    if (!end) return;

    const links = getLanguageLinks(menuRef.current);
    (end === "first" ? links[0] : links[links.length - 1])?.focus();
  }, [menuIsOpen]);

  // The page a keyboard-made switch arrives on: the selector it shows takes
  // the focus back, without scrolling. A copy the visitor cannot see (the top
  // bar's below its breakpoint, the sticky header's while it is off screen)
  // leaves the request alone; SiteHeader handles the width where the sticky
  // copy is the only one.
  useEffect(() => {
    if (!mounted || !hasPendingLanguageFocus()) return;
    const button = buttonRef.current;
    if (!canTakeFocus(button)) return;

    clearLanguageFocus();
    button.focus({ preventScroll: true });
  }, [mounted]);

  if (!mounted) {
    return <div style={{ width: '120px', height: '40px' }} />;
  }

  const CurrentFlag = FLAG_COMPONENTS[selectedOption.flag] || GB;

  return (
    <div
      ref={rootRef}
      className={cn("top-one__language-sort", theme === "light" && "light")}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      suppressHydrationWarning
    >
      <div className={cn("language-switcher", menuIsOpen && "is-open")}>
        <button
          ref={buttonRef}
          type="button"
          className="language-switcher__btn"
          tabIndex={tabIndex}
          aria-expanded={menuIsOpen}
          aria-controls={menuId}
          onClick={toggleMenu}
        >
          <span className="sr-only">{t("language.label")}: </span>
          <span className={cn("flex items-center gap-2 whitespace-nowrap overflow-visible", theme === "dark" ? "text-white" : "text-black")}>
            <CurrentFlag aria-hidden="true" className="w-5 h-3.5 rounded-sm object-cover shadow-sm flex-shrink-0" />
            <span className="font-medium whitespace-nowrap">{selectedOption.label}</span>
          </span>
          <svg
            className="language-switcher__chevron"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z" />
          </svg>
        </button>

        <ul
          ref={menuRef}
          id={menuId}
          className="language-switcher__menu"
          aria-label={t("language.label")}
          hidden={!menuIsOpen}
        >
          {options.map((option) => {
            const Flag = FLAG_COMPONENTS[option.flag] || GB;
            const isCurrent = option.value === selectedOption.value;
            const href = option.isDisabled ? null : getTargetUrl(option.value);

            return (
              <li key={option.value}>
                {href ? (
                  <a
                    href={href}
                    hrefLang={option.value}
                    tabIndex={tabIndex}
                    className={cn("language-switcher__item", isCurrent && "is-current")}
                    aria-current={isCurrent ? "page" : undefined}
                    onClick={(event) => handleLinkClick(event, option)}
                  >
                    <Flag aria-hidden="true" className="w-5 h-3.5 rounded-sm object-cover shadow-sm" />
                    <span>{option.label}</span>
                  </a>
                ) : (
                  // No version of this page in that language: a link that leads nowhere.
                  <a
                    role="link"
                    aria-disabled="true"
                    className="language-switcher__item is-disabled"
                    title={`${option.label} unavailable for this page`}
                  >
                    <Flag aria-hidden="true" className="w-5 h-3.5 rounded-sm object-cover shadow-sm" />
                    <span>{option.label}</span>
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default LanguageSelector;
