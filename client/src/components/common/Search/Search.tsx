"use client";

import useStore from "@/store/useStore";
import React, { useEffect, useRef, useState, FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getLocaleFromPath } from "@/lib/url";
import { useTranslation } from "react-i18next";

/** Everything inside the popup that a keyboard can land on. */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Search: React.FC = () => {
  const { t } = useTranslation("common");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const {
    changeSearchPopupStatus,
    searchPopupStatus,
  } = useStore();
  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Dialog behaviour ──────────────────────────────────────────────────
  // Same pattern as the mobile Drawer. There was no Escape key, focus stayed
  // on the page underneath, Tab walked out of the popup, and while closed the
  // invisible input and button were still in the tab order (the popup is only
  // faded and sent behind the page, never hidden).
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!searchPopupStatus) return;

    // Remember who opened it so focus can go back there on close.
    lastFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // `inert` is already off by the time this runs — it is removed in the
    // same commit that opens the popup — so the input can take focus now.
    inputRef.current?.focus();

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

  if (!mounted) {
    return null;
  }

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
