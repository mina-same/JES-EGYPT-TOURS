"use client";

import useStore from "@/store/useStore";
import React, { useEffect, useRef, FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getLocaleFromPath } from "@/lib/url";
import { useTranslation } from "react-i18next";

/** Everything inside the popup that a keyboard can land on. */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * How many animation frames the input gets to become focusable on open.
 *
 * It takes one — two on a slow frame — while the opening transition flips the
 * panel from `visibility: hidden`. This is only a ceiling so a panel that never
 * becomes focusable cannot retry forever.
 */
const MAX_FOCUS_FRAMES = 10;

const Search: React.FC = () => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const {
    changeSearchPopupStatus,
    searchPopupStatus,
  } = useStore();

  // ── Dialog behaviour ──────────────────────────────────────────────────
  // Same pattern as the mobile Drawer. There was no Escape key, focus stayed
  // on the page underneath, Tab walked out of the popup, and while closed the
  // invisible input and button were still in the tab order (the popup is only
  // faded and sent behind the page, never hidden).
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  /** The pending focus-retry frame, so closing cancels it. */
  const focusFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!searchPopupStatus) return;

    // Remember who opened it so focus can go back there on close.
    lastFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    /*
     * Focus lands on a LATER frame, not this one.
     *
     * `inert` is already off by the time this runs, but the panel only becomes
     * `visibility: visible` as the opening transition starts, and the input
     * carries `transition: all 400ms` — so for the first frame its own computed
     * visibility is still `hidden`, and an invisible element silently refuses
     * focus(). Calling it here left the caret on the search toggler behind the
     * overlay: the dialog announced itself as modal while the keyboard was
     * still outside it.
     *
     * So: try on the next frame, confirm the focus actually landed, and try
     * again on the frame after that if it did not. It succeeds on the first or
     * second frame in practice; MAX_FOCUS_FRAMES is only a stop so a panel that
     * never becomes focusable cannot spin forever. Refs, not state — none of
     * this should re-render the dialog.
     */
    let framesLeft = MAX_FOCUS_FRAMES;
    const focusInput = () => {
      focusFrameRef.current = null;
      const input = inputRef.current;
      if (!input) return;

      input.focus();
      if (document.activeElement === input || framesLeft <= 0) return;

      framesLeft -= 1;
      focusFrameRef.current = requestAnimationFrame(focusInput);
    };
    focusFrameRef.current = requestAnimationFrame(focusInput);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Also stops a type="search" input clearing itself on the way out.
        event.preventDefault();
        changeSearchPopupStatus();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      // Wrap the cycle at both ends so Tab can never leave the dialog.
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    // Runs whenever the popup closes — Escape, the overlay, or a submitted
    // search — so every way out hands focus back to the opener.
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // A retry still queued when the popup closes would steal focus back from
      // the opener, so it is dropped before focus is handed over.
      if (focusFrameRef.current !== null) {
        cancelAnimationFrame(focusFrameRef.current);
        focusFrameRef.current = null;
      }
      const opener = lastFocusedRef.current;
      lastFocusedRef.current = null;
      if (opener?.isConnected) opener.focus();
    };
  }, [searchPopupStatus, changeSearchPopupStatus]);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const raw = formData.get("search");
    const q = typeof raw === "string" ? raw.trim() : "";
    const url = q ? `/${locale}/search?q=${encodeURIComponent(q)}` : `/${locale}/search`;
    router.push(url);
    changeSearchPopupStatus();
  };

  return (
    <div
      ref={dialogRef}
      className={`search-popup ${searchPopupStatus ? " active" : ""}`}
      role='dialog'
      aria-modal='true'
      aria-label={t("search.submit")}
      // While closed the popup is still in the DOM, so without `inert` its
      // input and button stay in the tab order with focus landing off-screen.
      inert={!searchPopupStatus}
    >
      {/* Pointer-only dismiss layer. Escape is the keyboard path, so this
          must not be announced or focusable. */}
      <div
        onClick={(e) => {
          e.preventDefault();
          changeSearchPopupStatus();
        }}
        className='search-popup__overlay search-toggler'
        aria-hidden='true'
      ></div>

      <div className='search-popup__content'>
        <form onSubmit={handleSearch} className='search-popup__form' action='#'>
          <input
            ref={inputRef}
            type='search'
            id='search'
            name='search'
            aria-label={t("search.submit")}
            placeholder={t("search.placeholder")}
          />
          <button
            type='submit'
            aria-label={t("search.submit")}
            className='gotur-btn'
          >
            <i className='icon-search' aria-hidden='true'></i>

            <span></span>
          </button>
        </form>

        {/* A visible way out for pointer and touch users who cannot see that
            the dimmed backdrop is clickable. Inside the panel so it moves
            with it, and after the form so the focus trap still reaches it as
            the last stop. */}
        <button
          type='button'
          className='search-popup__close'
          onClick={changeSearchPopupStatus}
          aria-label={t("search.close")}
        >
          <i className='fa fa-times' aria-hidden='true'></i>
        </button>
      </div>
    </div>
  );
};

export default Search;
