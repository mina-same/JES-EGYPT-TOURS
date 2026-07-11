"use client";
import React from "react";
import Image from "next/image";

import Link from "next/link"; // Assuming we're using Next.js for routing
import main_logo from "@/assets/images/logo-dark.png";
import { usePathname } from "next/navigation";
import useStore from "@/store/useStore";
import { useWishlist } from "@/contexts/WishlistContext";
import { useHeaderMenu } from "@/hooks/useHeaderMenu";
import { useTranslation } from "react-i18next";
import { getLocalizedValue, formatUrl } from "@/lib/localize";
import { getLocaleFromPath, localizeInternalUrl } from "@/lib/url";
import { Flame } from "lucide-react";

interface NavItem {
  id: number;
  title: string;
  link?: string;
  subMenu?: NavItem[];
}

type HeaderLinkTheme = "dark" | "light";

interface HeaderOneProps {
  linkTheme?: HeaderLinkTheme;
}

const HeaderOne: React.FC<HeaderOneProps> = ({ linkTheme = "light" }) => {
  const { i18n } = useTranslation();
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const { menu } = useHeaderMenu("header-main");
  const {
    changeSearchPopupStatus,
    changeMobileDrawerStatus,
  } = useStore();
  const { wishlist } = useWishlist();

  const renderSubMenu = (subMenu: any[]) => (
    <ul className=''>
      {subMenu.map((item: any, index: number) => (
        <li
          key={index}
          className={(Array.isArray(item?.children) && item.children.length > 0) || (Array.isArray(item?.subMenu) && item.subMenu.length > 0)
            ? "dropdown"
            : ""}
        >
          <Link href={localizeInternalUrl(formatUrl(item.url || item.link), locale)}>
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
      className={`main-header main-header--one sticky-header sticky-header--normal ${
        linkTheme === "light" ? "main-header--links-light" : ""
      }`}
    >
      <div className='container-fluid'>
        <div className='main-header__inner'>
          <div className='main-header__logo logo-retina'>
            <Link href={`/${locale}`}>
              <Image src={main_logo} alt='JES EGYPT TOURS' title='JES EGYPT TOURS' width='100' height='30' />
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
                    return (
                  <li
                    className={`${hasChildren ? "dropdown" : ""} ${
                      pathname === (item.url || item.link) ? "current" : ""
                    }`}
                    key={item._id || item.id || `${item.label || item.title}`}
                  >
                    <Link
                      href={localizeInternalUrl(formatUrl(item.url || item.link), locale)}
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

            <div className='main-header__info'>
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
                <i className={wishlist.length > 0 ? 'fas fa-heart' : 'far fa-heart'} aria-hidden='true'></i>
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
                      borderRadius: 9999,
                      fontSize: 10,
                      padding: "2px 6px",
                      lineHeight: 1,
                      fontWeight: 700,
                    }}
                  >
                    {wishlist.length}
                  </span>
                )}
              </Link>
            </div>

            <Link href={`/${locale}/tailor-made`} className='gotur-btn main-header__btn'>

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

export default HeaderOne;
