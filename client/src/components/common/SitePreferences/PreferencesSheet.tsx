"use client";

import React, { useCallback, useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import useStore from "@/store/useStore";
import { TOP_BAR_QUERY } from "@/components/layout/SiteHeader/stickyHeaderState";
import PreferencesPanel from "./PreferencesPanel";

/** Everything inside the sheet that a keyboard can land on. */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * How long after opening a press on the backdrop is ignored. The sheet opens
 * over the header button, so a second tap on it — the "did that work?" tap —
 * would land on the backdrop and close what was just asked for.
 */
const OPEN_SETTLE_MS = 400;

/**
 * The bottom sheet the header's language & currency button opens, below the
 * top bar's breakpoint. Loaded on first use (HomeClientShell).
 *
 * A modal dialog: focus moves in on open and is kept inside, Escape and the
 * backdrop close it, and focus goes back to the button that opened it —
 * except when a language is chosen, where the next page places it
 * (languageFocus.ts). A currency applies at once and closes the sheet, so the
 * visitor sees the prices change.
 */
const PreferencesSheet: React.FC = () => {
  const { t } = useTranslation("common");
  const isOpen = useStore((state) => state.preferencesSheetStatus);
  const setPreferencesSheetStatus = useStore(
    (state) => state.setPreferencesSheetStatus
  );
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  /** False when the sheet closes because a language is navigating away. */
  const restoreFocusRef = useRef(true);
  const openedAtRef = useRef(0);

  const close = useCallback(() => {
    setPreferencesSheetStatus(false);
  }, [setPreferencesSheetStatus]);

  const closeForLanguageSwitch = useCallback(() => {
    restoreFocusRef.current = false;
    close();
  }, [close]);

  const onOverlayClick = () => {
    if (performance.now() - openedAtRef.current < OPEN_SETTLE_MS) return;
    close();
  };

  useEffect(() => {
    if (!isOpen) return;

    openerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    restoreFocusRef.current = true;
    openedAtRef.current = performance.now();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // The sheet is displayed as it mounts (its entrance animates transform
    // only), so the close button can take focus straight away.
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      // Wrap the cycle at both ends so Tab can never leave the dialog.
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    // The window grew to where the top bar carries both switchers and the
    // header button is no longer displayed: the sheet has nothing to belong to.
    const wideQuery = window.matchMedia(TOP_BAR_QUERY);
    const onWideChange = () => {
      if (wideQuery.matches) close();
    };

    document.addEventListener("keydown", onKeyDown);
    wideQuery.addEventListener("change", onWideChange);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      wideQuery.removeEventListener("change", onWideChange);
      document.body.style.overflow = previousOverflow;

      const opener = openerRef.current;
      openerRef.current = null;
      // preventScroll: the opener may be the sticky header's copy of the
      // button, or the page's own at the top of a page read further down.
      if (restoreFocusRef.current && opener?.isConnected) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div className='site-prefs-sheet'>
      {/* Pointer-only dismiss layer: Escape and the close button are the
          keyboard paths. A press on it must not move focus out of the dialog. */}
      <div
        className='site-prefs-sheet__overlay'
        onClick={onOverlayClick}
        onMouseDown={(event) => event.preventDefault()}
        aria-hidden='true'
      ></div>
      <div
        ref={panelRef}
        className='site-prefs-sheet__panel'
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
      >
        <div className='site-prefs-sheet__handle' aria-hidden='true'></div>
        <div className='site-prefs-sheet__head'>
          <h2 id={titleId} className='site-prefs-sheet__title'>
            {t("preferences.title")}
          </h2>
          <button
            ref={closeButtonRef}
            type='button'
            className='site-prefs-sheet__close'
            onClick={close}
            aria-label={t("preferences.close")}
          >
            <svg width='18' height='18' viewBox='0 0 18 18' aria-hidden='true' focusable='false'>
              <path
                d='M4 4l10 10M14 4L4 14'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
              />
            </svg>
          </button>
        </div>
        <PreferencesPanel onLanguageSwitch={closeForLanguageSwitch} onDone={close} />
      </div>
    </div>
  );
};

export default PreferencesSheet;
