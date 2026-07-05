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
import LanguageSelector from "../../common/LanguageSelector/LanguageSelector";
import { useState, useEffect } from "react";

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

  useEffect(() => {
    setMounted(true);
  }, []);
  const {
    changeSearchPopupStatus,
    changeMobileDrawerStatus,
    changeSideBarDrawerStatus,
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
      className={`main-header main-header--one sticky-header sticky-header--normal sticky-header--cloned ${
        scrollToTop ? " active" : ""
      }`}
    >
      <div className='container-fluid'>
        <div className='main-header__inner'>
          <div className='main-header__logo logo-retina'>
            <Link href={`/${locale}`}>
              <Image src={main_logo} alt='JES Egypt Tours' title="JES Egypt Tours" width='100' height='30' />
            </Link>
          </div>

          <div className='main-header__right' style={{ display: "flex", alignItems: "center", flex: 1, justifyContent: "flex-end", position: "relative" }}>
            <nav className='main-header__nav main-menu'>
              <ul className='main-menu__list'>
                {/* Render Home menu with showcase */}
                <li className='dropdown megamenu'>
                  <Link href={`/${locale}`} style={{ color: "#000" }}>Home</Link>
                </li>

                {nav.map((item: any) => (
                  (() => {
                    const hasChildren = (Array.isArray(item?.children) && item.children.length > 0) || (Array.isArray(item?.subMenu) && item.subMenu.length > 0);
                    return (
                  <li
                    className={`${hasChildren ? "dropdown" : ""} ${
                      pathname === (item.url || item.link) ? "current" : ""
                    }`}
                    key={item._id || item.id || `${item.label || item.title}`}
                  >
                    <Link href={localizeInternalUrl(formatUrl(item.url || item.link), locale)} style={{ color: "#000" }}>
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
                  style={{ color: "#000" }}
                ></i>
                <span className='sr-only'>Search</span>
              </Link>
              <Link href={`/${locale}/wishlist`} className='main-header__info__item' style={{ position: "relative" }}>
                <i
                  className={wishlist.length > 0 ? 'fas fa-heart' : 'far fa-heart'}
                  aria-hidden='true'
                  style={{ color: "#000" }}
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
                <div style={{ marginLeft: "5px" }}>
                  <LanguageSelector theme="light" />
                </div>
              )}
            </div>

            <div
              className='main-header__btn-popup main-header__element__btn'
              onClick={changeSideBarDrawerStatus}
            >
              <i className='icon-menu-bar' style={{ color: "#000" }}></i>
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

export default HeaderOneCloned;
