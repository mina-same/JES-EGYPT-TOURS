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
 *               It also carries the currency/language switchers, which the
 *               top bar already provides above the fold.
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
  const { changeSearchPopupStatus, changeMobileDrawerStatus } = useStore();

  const isSticky = variant === "sticky";
  const scrolledUp = useScrollUp(500);
  const [mounted, setMounted] = React.useState(false);
  const [activeDropdown, setActiveDropdown] =
    React.useState<ActiveHeaderDropdown>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // The sticky copy repeats links the primary header already exposes, so it is
  // skipped by the keyboard rather than doubling every tab stop on the page.
  const tabIndex = isSticky ? -1 : undefined;

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
        scrolledUp ? " active" : ""
      }`
    : `main-header main-header--one sticky-header sticky-header--normal ${
        linkTheme === "light" ? "main-header--links-light" : ""
      }`;

  return (
    <header
      className={headerClassName}
      // One banner landmark for the page: the sticky copy is decorative.
      aria-hidden={isSticky || undefined}
    >
      <div className='container-fluid'>
        <div className='main-header__inner'>
          <div className='main-header__logo logo-retina'>
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
            <nav className='main-header__nav main-menu' aria-label={t("nav.label")}>
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
              >
                <i className='icon-search-interface-symbol' aria-hidden='true'></i>
              </button>

              <Link
                href={localizeInternalUrl("/wishlist", locale)}
                tabIndex={tabIndex}
                className='main-header__info__item'
                style={{ position: "relative" }}
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
            >
              {t("nav.tailorMade")} <i className='icon-paper-plane' aria-hidden='true'></i>
            </Link>

            {/* A real button. As a <div onClick> the mobile drawer — the only
                navigation that exists at this width — could not be opened by
                keyboard or switch device at all (WCAG 2.1.1). */}
            <button
              type='button'
              className='mobile-nav__btn mobile-nav__toggler'
              onClick={changeMobileDrawerStatus}
              tabIndex={tabIndex}
              aria-label={t("menu.open")}
              aria-haspopup='dialog'
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
