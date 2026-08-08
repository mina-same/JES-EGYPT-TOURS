"use client";
import React from "react";
import Image from "next/image";

import Link from "next/link"; // Assuming we're using Next.js for routing
import main_logo from "@/assets/images/logo-dark.png";
import { usePathname } from "next/navigation";
import useStore from "@/store/useStore";
import useScrollUp from "@/hooks/useScrollUp";
import { useWishlist } from "@/contexts/WishlistContext";
import { useHeaderMenu } from "@/hooks/useHeaderMenu";
import { useTranslation } from "react-i18next";
import { getLocalizedValue, formatUrl } from "@/lib/localize";
import { getLocaleFromPath, localizeInternalUrl } from "@/lib/url";
import { Flame } from "lucide-react";
import LanguageSelector from "../../common/LanguageSelector/LanguageSelector";
import CurrencySwitcher from "../../common/CurrencySwitcher/CurrencySwitcher";
import { useState, useEffect } from "react";

type ActiveHeaderDropdown = "language" | "currency" | null;

interface NavItem {
  id: number;
  title: string;
  link?: string;
  subMenu?: NavItem[];
}

const HeaderOneCloned: React.FC = () => {
  const { i18n } = useTranslation();
  const scrollToTop = useScrollUp(500);
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const { menu } = useHeaderMenu("header-main");
  const [mounted, setMounted] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<ActiveHeaderDropdown>(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  const {
    changeSearchPopupStatus,
    changeMobileDrawerStatus,
  } = useStore();
  const { wishlist } = useWishlist();

  // Menu URLs are localized per language (legacy items may be plain strings)
  // — resolve the active language's path before locale-prefixing it.
  const itemHref = (item: any) =>
    localizeInternalUrl(formatUrl(getLocalizedValue(item.url || item.link, i18n.language)), locale);

  const renderSubMenu = (subMenu: any[]) => (
    <ul className=''>
      {subMenu.map((item: any, index: number) => (
        <li
          key={index}
          className={(Array.isArray(item?.children) && item.children.length > 0) || (Array.isArray(item?.subMenu) && item.subMenu.length > 0)
            ? "dropdown"
            : ""}
        >
          <Link href={itemHref(item)}>
            {getLocalizedValue(item.label || item.title, i18n.language)}
          </Link>

          {((Array.isArray(item?.children) && item.children.length > 0) || (Array.isArray(item?.subMenu) && item.subMenu.length > 0))
            ? renderSubMenu(item.children || item.subMenu)
            : null}
        </li>
      ))}
    </ul>
  );
  const handelClick = () => {
    changeMobileDrawerStatus();
  };
  const nav = Array.isArray(menu?.items) ? menu!.items : [];
  return (
    <header
      className={`main-header main-header--one main-header--links-light sticky-header sticky-header--normal sticky-header--cloned ${
        scrollToTop ? " active" : ""
      }`}
    >
      <div className='container-fluid'>
        <div className='main-header__inner'>
          <div className='main-header__logo logo-retina'>
            <Link href={`/${locale}`}>
              {/* Square source (313x313) rendered at 108x108 — see HeaderOne.
                  The declared box must match, or the sticky clone shifts too. */}
              <Image src={main_logo} alt='JES Egypt Tours' title="JES Egypt Tours" width='108' height='108' />
            </Link>
          </div>

          <div className='main-header__right' style={{ display: "flex", alignItems: "center", flex: 1, justifyContent: "flex-end", position: "relative" }}>
            <nav className='main-header__nav main-menu'>
              <ul className='main-menu__list'>
                {/* Render Home menu with showcase */}
                <li className='dropdown megamenu'>
                  <Link href={`/${locale}`}>Home</Link>
                </li>

                {nav.map((item: any) => (
                  (() => {
                    const hasChildren = (Array.isArray(item?.children) && item.children.length > 0) || (Array.isArray(item?.subMenu) && item.subMenu.length > 0);
                    const isPromotion = item?.displayVariant === "promotion";
                    const href = itemHref(item);
                    return (
                  <li
                    className={`${hasChildren ? "dropdown" : ""} ${
                      pathname === href ? "current" : ""
                    }`}
                    key={item._id || item.id || `${item.label || item.title}`}
                  >
                    <Link
                      href={href}
                      className={isPromotion ? "main-menu__promotion-link" : undefined}
                    >
                      {isPromotion ? (
                        <Flame size={15} aria-hidden="true" focusable={false} className="main-menu__promotion-icon" />
                      ) : null}
                      {getLocalizedValue(item.label || item.title, i18n.language)}
                    </Link>

                    {hasChildren ? renderSubMenu(item.children || item.subMenu) : null}
                  </li>
                    );
                  })()
                ))}
              </ul>
            </nav>

            <div className='main-header__info' style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <Link
                onClick={(e) => {
                  e.preventDefault();
                  changeSearchPopupStatus();
                }}
                href='#'
                className='search-toggler main-header__info__item'
              >
                <i
                  className='icon-search-interface-symbol'
                  aria-hidden='true'
                ></i>
                <span className='sr-only'>Search</span>
              </Link>
              <Link href={`/${locale}/wishlist`} className='main-header__info__item' style={{ position: "relative" }}>
                <i
                  className={wishlist.length > 0 ? 'fas fa-heart' : 'far fa-heart'}
                  aria-hidden='true'
                ></i>
                <span className='sr-only'>Wishlist</span>
                {wishlist.length > 0 && (
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -10,
                      background: "#b79c5c",
                      color: "#fff",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      lineHeight: "16px",
                      minWidth: 18,
                      height: 16,
                      padding: "0 6px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {wishlist.length}
                  </span>
                )}
              </Link>
              {mounted && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "5px" }}>
                  <CurrencySwitcher
                    isOpen={activeDropdown === "currency"}
                    onOpen={() => setActiveDropdown("currency")}
                    onClose={() => setActiveDropdown((current) => (current === "currency" ? null : current))}
                  />
                  <LanguageSelector
                    theme="dark"
                    isOpen={activeDropdown === "language"}
                    onOpen={() => setActiveDropdown("language")}
                    onClose={() => setActiveDropdown((current) => (current === "language" ? null : current))}
                  />
                </div>
              )}
            </div>

            <Link href={localizeInternalUrl("/tailor-made", locale)} className='gotur-btn main-header__btn'>

              Tailor-Made <i className='icon-paper-plane'></i>
            </Link>

            <div
              className='mobile-nav__btn mobile-nav__toggler'
              onClick={handelClick}
            >
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderOneCloned;
