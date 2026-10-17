"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { GB } from "country-flag-icons/react/3x2";
import useStore from "@/store/useStore";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getLocaleFromPath } from "@/lib/url";
import {
  canTakeFocus,
  clearLanguageFocus,
  hasPendingLanguageFocus,
} from "@/components/common/LanguageSelector/languageFocus";
import { FLAGS, CURRENCY_SYMBOLS } from "./preferenceOptions";
import { provideSheet } from "./sheetSlot";

/**
 * The sheet's code, fetched once per visit, from the press on this button: a
 * moment before the click that opens it. Imported here and not by the layout's
 * HomeClientShell, which renders it, so that its chunk reuses the language
 * code this header has already loaded (sheetSlot.ts).
 */
let sheetRequest: Promise<void> | null = null;
const loadSheet = () => {
  if (!sheetRequest) {
    sheetRequest = import("./PreferencesSheet").then(
      (module) => provideSheet(module.default),
      () => {
        // A chunk that failed to arrive is asked for again on the next press.
        sheetRequest = null;
      }
    );
  }
  return sheetRequest;
};

interface PreferencesButtonProps {
  /** -1 for the sticky header's copy, which repeats the real header's. */
  tabIndex?: number;
}

/**
 * The header's language & currency button, below the top bar's breakpoint.
 *
 * From 992px up the top bar carries both switchers. Below it the top bar is
 * not displayed, and nothing on a phone offered either one until the visitor
 * scrolled back up (the sticky copy's), and then only the language: the
 * currency and the menu button were pushed off the screen. This pill shows
 * what is set — flag, language, currency — and opens the bottom sheet that
 * changes both (PreferencesSheet). CSS hides it from 992px up.
 *
 * Rendered on the server: the locale comes from the path and the currency
 * from the cookie the server already read, so it paints correct, with no
 * shift and no flash.
 */
const PreferencesButton: React.FC<PreferencesButtonProps> = ({ tabIndex }) => {
  const { t } = useTranslation("common");
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const { currency } = useCurrency();
  const setPreferencesSheetStatus = useStore(
    (state) => state.setPreferencesSheetStatus
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const Flag = FLAGS[locale] || GB;

  // A language switch made from the keyboard arrives here: below the top
  // bar's breakpoint this button is the language control the new page shows,
  // so it takes the focus back (languageFocus.ts). From 992px up it is not
  // displayed and the top bar's selector does it; the sticky copy's is inert
  // off screen.
  useEffect(() => {
    if (!hasPendingLanguageFocus()) return;
    const button = buttonRef.current;
    if (!canTakeFocus(button)) return;

    clearLanguageFocus();
    button.focus({ preventScroll: true });
  }, []);

  return (
    <button
      ref={buttonRef}
      type='button'
      className='site-prefs-btn'
      onClick={() => {
        void loadSheet();
        setPreferencesSheetStatus(true);
      }}
      onPointerDown={() => void loadSheet()}
      tabIndex={tabIndex}
      aria-haspopup='dialog'
    >
      <span className='sr-only'>{t("preferences.title")}: </span>
      <Flag aria-hidden='true' className='site-prefs-btn__flag' />
      <span className='site-prefs-btn__lang'>{locale.toUpperCase()}</span>
      <span className='site-prefs-btn__sep' aria-hidden='true'></span>
      <span className='site-prefs-btn__currency'>{CURRENCY_SYMBOLS[currency]}</span>
    </button>
  );
};

export default PreferencesButton;
