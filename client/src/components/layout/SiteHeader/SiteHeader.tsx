"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Flame } from "lucide-react";

import main_logo from "@/assets/images/logo-dark.png";
import useStore from "@/store/useStore";
import useScrollUp from "@/hooks/useScrollUp";
import { useWishlist } from "@/contexts/WishlistContext";
import { useHeaderMenu } from "@/hooks/useHeaderMenu";
import { getLocalizedValue, formatUrl } from "@/lib/localize";
import { getLocaleFromPath, localizeInternalUrl } from "@/lib/url";
import LanguageSelector from "@/components/common/LanguageSelector/LanguageSelector";
import CurrencySwitcher from "@/components/common/CurrencySwitcher/CurrencySwitcher";
import {
  clearLanguageFocus,
  hasPendingLanguageFocus,
} from "@/components/common/LanguageSelector/languageFocus";
import { TOP_BAR_QUERY, getStickyHeaderState } from "./stickyHeaderState";

/**
 * The one site header.
 *
 * HeaderOne and HeaderOneCloned were ~180 lines of byte-identical markup each:
 * the same itemHref, the same recursive submenu renderer, the same logo, nav
 * loop, search toggle, wishlist link, CTA and hamburger. They had already
 * drifted — the wishlist badge used borderRadius 9999 in one and 999 in the
 * other, fontSize 10 vs 11, different padding — and every navigation fix had
 * to be made twice. Both are rendered on the SAME page, so the entire
 * navigation existed twice in the DOM and produced two `banner` landmarks.
 *
 * `variant` is the only real difference:
 *   "primary" — the header in the document flow. The real banner landmark.
 *   "sticky"  — the scroll-up copy. A purely VISUAL duplicate, so it is hidden
 *               from the accessibility tree and taken out of the tab order:
 *               a keyboard or screen-reader user works the primary header at
 *               the top of the document and never meets the same twenty links
 *               a second time. It stays fully clickable for pointer users.
 *               It also carries the currency/language switchers. The top bar
 *               provides those too, but only from 992px up: below that the
 *               sticky copy's are the only ones, and they are real controls.
 *               stickyHeaderState.ts has the rule for each state; off screen
 *               the whole copy is inert.
 */
export type SiteHeaderVariant = "primary" | "sticky";

type ActiveHeaderDropdown = "language" | "currency" | null;

interface SiteHeaderProps {
  variant?: SiteHeaderVariant;
  /** Only meaningful for the primary header; the sticky copy is always light. */
  linkTheme?: "dark" | "light";
}

const SiteHeader: React.FC<SiteHeaderProps> = ({
  variant = "primary",
  linkTheme = "light",
}) => {
  const { t, i18n } = useTranslation("common");
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const { menu } = useHeaderMenu("header-main");
  const { wishlist } = useWishlist();
  // One selector per action: actions never change identity, so neither header
  // copy re-renders when the popup or drawer toggles.
  const changeSearchPopupStatus = useStore(
    (state) => state.changeSearchPopupStatus
  );
  const setMobileDrawerStatus = useStore(
    (state) => state.setMobileDrawerStatus
  );

  const isSticky = variant === "sticky";
  const scrolledUp = useScrollUp(500);
  const [mounted, setMounted] = React.useState(false);
  const [activeDropdown, setActiveDropdown] =
    React.useState<ActiveHeaderDropdown>(null);
  const headerRef = React.useRef<HTMLElement>(null);
  // True until measured: the server render and the first paint treat the
  // sticky copy as the visual duplicate it is on a desktop.
  const [topBarShown, setTopBarShown] = React.useState(true);
  // Keyboard focus is inside the sticky copy. It stays on screen until that
  // focus leaves, instead of sliding away from under it on a scroll down.
  const [holdsFocus, setHoldsFocus] = React.useState(false);

  const stickyShown = isSticky && (scrolledUp || holdsFocus);
  const sticky = isSticky ? getStickyHeaderState(stickyShown, topBarShown) : null;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isSticky) return;
    const query = window.matchMedia(TOP_BAR_QUERY);
    const update = () => setTopBarShown(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [isSticky]);

  // Off screen, an open currency or language list would keep its listeners
  // and come back open the next time the header slides in.
  React.useEffect(() => {
    if (isSticky && !stickyShown) setActiveDropdown(null);
  }, [isSticky, stickyShown]);

  // A wheel or a finger scrolling the page has taken over from the keyboard:
  // the copy goes back to following the scroll.
  React.useEffect(() => {
    if (!holdsFocus) return;
    const release = () => setHoldsFocus(false);

    window.addEventListener("wheel", release, { passive: true });
    window.addEventListener("touchmove", release, { passive: true });
    return () => {
      window.removeEventListener("wheel", release);
      window.removeEventListener("touchmove", release);
    };
  }, [holdsFocus]);

  // The window grew past the top bar's breakpoint with focus in the sticky
  // copy: its controls are now the top bar's, and focus goes to that one,
  // scrolled into view if the page is further down.
  React.useEffect(() => {
    if (!isSticky || !topBarShown) return;
    const focused = document.activeElement;
    if (!(focused instanceof HTMLElement) || !headerRef.current?.contains(focused)) return;

    const twin = document.querySelector<HTMLElement>(
      focused.closest(".currency-switcher")
        ? ".top-one .currency-switcher__btn"
        : ".top-one .language-switcher__btn"
    );
    if (twin) twin.focus();
    else focused.blur();
  }, [isSticky, topBarShown]);

  // A language switch made from the keyboard, where this copy holds the only
  // language control: the new page opens at its top with the copy off screen,
  // so no selector could take the focus back. The copy comes on screen with
  // its language button focused, and leaves again when that focus does.
  React.useEffect(() => {
    if (!isSticky || !mounted || topBarShown || !hasPendingLanguageFocus()) return;

    setHoldsFocus(true);
    let frame = 0;
    let attempts = 0;
    let settled = false;
    // The selector mounts a moment after the header: wait for its button.
    const focusLanguageButton = () => {
      const header = headerRef.current;
      const button = header?.querySelector<HTMLElement>(".language-switcher__btn");
      if (button && !header?.inert) {
        settled = true;
        clearLanguageFocus();
        button.focus({ preventScroll: true });
        if (document.activeElement !== button) setHoldsFocus(false);
      } else if (++attempts > 90) {
        settled = true;
        clearLanguageFocus();
        setHoldsFocus(false);
      } else {
        frame = window.requestAnimationFrame(focusLanguageButton);
      }
    };
    frame = window.requestAnimationFrame(focusLanguageButton);
    return () => {
      window.cancelAnimationFrame(frame);
      // Interrupted before the button took the focus: nothing holds the copy.
      if (!settled) setHoldsFocus(false);
    };
  }, [isSticky, mounted, topBarShown]);

  const handleStickyFocus = (event: React.FocusEvent<HTMLElement>) => {
    if (event.target.matches(":focus-visible")) setHoldsFocus(true);
  };

  const handleStickyBlur = (event: React.FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setHoldsFocus(false);
    }
  };

  // The sticky copy repeats links the primary header already exposes, so it is
  // skipped by the keyboard rather than doubling every tab stop on the page.
  const tabIndex = isSticky ? -1 : undefined;
  // Each of those repeats is hidden on its own as well: below the top bar's
  // breakpoint the copy as a whole is exposed, for its currency and language.
  const repeated = isSticky || undefined;

  // Menu URLs are localized per language (legacy items may be plain strings)
  // — resolve the active language's path before locale-prefixing it.
  const itemHref = (item: any) =>
    localizeInternalUrl(
      formatUrl(getLocalizedValue(item.url || item.link, i18n.language)),
      locale
    );

  const hasChildren = (item: any) =>
    (Array.isArray(item?.children) && item.children.length > 0) ||
    (Array.isArray(item?.subMenu) && item.subMenu.length > 0);

  const renderSubMenu = (subMenu: any[]) => (
    <ul className=''>
      {subMenu.map((item: any, index: number) => (
        <li key={index} className={hasChildren(item) ? "dropdown" : ""}>
          <Link href={itemHref(item)} tabIndex={tabIndex}>
            {getLocalizedValue(item.label || item.title, i18n.language)}
          </Link>
          {hasChildren(item) ? renderSubMenu(item.children || item.subMenu) : null}
        </li>
      ))}
    </ul>
  );

  const nav = Array.isArray(menu?.items) ? menu!.items : [];

  const headerClassName = isSticky
    ? `main-header main-header--one main-header--links-light sticky-header sticky-header--normal sticky-header--cloned${
        stickyShown ? " active" : ""
      }`
    : `main-header main-header--one sticky-header sticky-header--normal ${
        linkTheme === "light" ? "main-header--links-light" : ""
      }`;

  return (
    <header
      ref={headerRef}
      className={headerClassName}
      // One banner landmark for the page: the sticky copy never is one.
      aria-hidden={sticky?.ariaHidden}
      role={sticky?.role}
      inert={sticky?.inert}
      onFocus={isSticky ? handleStickyFocus : undefined}
      onBlur={isSticky ? handleStickyBlur : undefined}
    >
      <div className='container-fluid'>
        <div className='main-header__inner'>
          <div className='main-header__logo logo-retina' aria-hidden={repeated}>
            <Link href={`/${locale}`} tabIndex={tabIndex}>
              {/* logo-dark.png is square (313x313) and CSS renders it at
                  108x108. Declaring 100x30 reserved a box 78px too short, so
                  when the real ratio applied the header grew 102 -> 108 and
                  pushed every page down 6px — the site's whole CLS. */}
              <Image
                src={main_logo}
                alt='JES EGYPT TOURS'
                title='JES EGYPT TOURS'
                width='108'
                height='108'
              />
            </Link>
          </div>

          <div
            className='main-header__right'
            style={{
              display: "flex",
              alignItems: "center",
              flex: 1,
              justifyContent: "flex-end",
              position: "relative",
            }}
          >
            <nav className='main-header__nav main-menu' aria-label={t("nav.label")} aria-hidden={repeated}>
              <ul className='main-menu__list'>
                <li className='dropdown megamenu'>
                  <Link href={`/${locale}`} tabIndex={tabIndex}>
                    {t("nav.home")}
                  </Link>
                </li>

                {nav.map((item: any) => {
                  const itemHasChildren = hasChildren(item);
                  const isPromotion = item?.displayVariant === "promotion";
                  const href = itemHref(item);
                  return (
                    <li
                      className={`${itemHasChildren ? "dropdown" : ""} ${
                        pathname === href ? "current" : ""
                      }`}
                      key={item._id || item.id || `${item.label || item.title}`}
                    >
                      <Link
                        href={href}
                        tabIndex={tabIndex}
                        className={isPromotion ? "main-menu__promotion-link" : undefined}
                      >
                        {isPromotion ? (
                          <Flame
                            size={15}
                            aria-hidden='true'
                            focusable={false}
                            className='main-menu__promotion-icon'
                          />
                        ) : null}
                        {getLocalizedValue(item.label || item.title, i18n.language)}
                      </Link>

                      {itemHasChildren
                        ? renderSubMenu(item.children || item.subMenu)
                        : null}
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div
              className='main-header__info'
              style={
                isSticky
                  ? { display: "flex", alignItems: "center", gap: "20px" }
                  : undefined
              }
            >
              {/* A real button: this opens a dialog, it does not navigate.
                  As <Link href="#"> it announced itself as a link to nowhere
                  and put a dead "#" entry in front of crawlers. */}
              <button
                type='button'
                onClick={changeSearchPopupStatus}
                tabIndex={tabIndex}
                className='search-toggler main-header__info__item'
                aria-label={t("search.open")}
                aria-hidden={repeated}
              >
                <i className='icon-search-interface-symbol' aria-hidden='true'></i>
              </button>

              <Link
                href={localizeInternalUrl("/wishlist", locale)}
                tabIndex={tabIndex}
                className='main-header__info__item'
                style={{ position: "relative" }}
                aria-hidden={repeated}
              >
                <i
                  className={wishlist.length > 0 ? "fas fa-heart" : "far fa-heart"}
                  aria-hidden='true'
                ></i>
                <span className='sr-only'>{t("wishlistLink")}</span>
                {wishlist.length > 0 && (
                  <span aria-hidden className='main-header__wishlist-badge'>
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {isSticky && mounted && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginLeft: "5px",
                  }}
                >
                  <CurrencySwitcher
                    tabIndex={sticky?.switcherTabIndex}
                    isOpen={activeDropdown === "currency"}
                    onOpen={() => setActiveDropdown("currency")}
                    onClose={() =>
                      setActiveDropdown((current) =>
                        current === "currency" ? null : current
                      )
                    }
                  />
                  <LanguageSelector
                    theme='dark'
                    tabIndex={sticky?.switcherTabIndex}
                    isOpen={activeDropdown === "language"}
                    onOpen={() => setActiveDropdown("language")}
                    onClose={() =>
                      setActiveDropdown((current) =>
                        current === "language" ? null : current
                      )
                    }
                  />
                </div>
              )}
            </div>

            <Link
              href={localizeInternalUrl("/tailor-made", locale)}
              tabIndex={tabIndex}
              className='gotur-btn main-header__btn'
              aria-hidden={repeated}
            >
              {t("nav.tailorMade")} <i className='icon-paper-plane' aria-hidden='true'></i>
            </Link>

            {/* A real button. As a <div onClick> the mobile drawer — the only
                navigation that exists at this width — could not be opened by
                keyboard or switch device at all (WCAG 2.1.1).
                It OPENS, it does not toggle: the drawer is mounted lazily on
                first use, so a second tap before it appeared used to toggle it
                straight back to closed and the menu never showed. Once open,
                the drawer covers this button; closing is the drawer's job. */}
            <button
              type='button'
              className='mobile-nav__btn mobile-nav__toggler'
              onClick={() => setMobileDrawerStatus(true)}
              // A repeat tap while the drawer is already opening must not pull
              // focus back out of it: the drawer slides in over this button, so
              // for a moment it is still under the finger. Read without
              // subscribing, so the header still never re-renders on open.
              onMouseDown={(event) => {
                if (useStore.getState().mobileDrawerStatus) event.preventDefault();
              }}
              tabIndex={tabIndex}
              aria-label={t("menu.open")}
              aria-haspopup='dialog'
              aria-hidden={repeated}
            >
              <span aria-hidden='true'></span>
              <span aria-hidden='true'></span>
              <span aria-hidden='true'></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
