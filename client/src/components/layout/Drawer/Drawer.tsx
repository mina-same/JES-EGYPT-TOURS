"use client";
import React, { useState } from "react";
import useStore from "@/store/useStore";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import logo from "@/assets/images/logo-light.png";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getLocalizedValue, formatUrl } from "@/lib/localize";

import { demoPages } from "@/data/demoPages";
import { Col, Container, Row } from "react-bootstrap";
import { useHeaderMenu } from "@/hooks/useHeaderMenu";

interface SubMenu {
  id: number;
  title: string;
  link?: string;
  subMenu?: SubMenu[];
}

interface NavItem {
  id: number;
  title: string;
  link?: string;
  subMenu?: SubMenu[];
}

interface Page {
  image: StaticImageData;
  title: string;
  isNew?: boolean;
  multiPageLink?: string;
  onePageLink?: string;
  darkPageLink?: string;
  viewPageLink?: string;
}

const LOCALES = ["en", "de", "it", "es"];

const getLocaleFromPath = (pathname: string | null): string => {
  const seg = (pathname || "/").split("/")[1];
  return LOCALES.includes(seg) ? seg : "en";
};

const localizeInternalUrl = (url: string | undefined, locale: string): string => {
  if (!url) return `/${locale}`;
  if (
    /^(https?:)?\/\//i.test(url) ||
    url.startsWith("mailto:") ||
    url.startsWith("tel:") ||
    url.startsWith("#")
  ) {
    return url;
  }

  const formattedUrl = formatUrl(url);
  if (formattedUrl === "/") return `/${locale}`;
  if (!formattedUrl.startsWith("/")) return formattedUrl;

  const seg = formattedUrl.split("/")[1];
  if (LOCALES.includes(seg)) return formattedUrl;
  return `/${locale}${formattedUrl}`;
};

const Drawer: React.FC = () => {
  const { i18n } = useTranslation();
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const [isMegaMenu, setIsMegaMenu] = useState(false);
  const [isHomeDrop, setIsHomeDrop] = useState(false);
  const {
    mobileDrawerStatus,
    changeMobileDrawerStatus,
    setMobileDrawerStatus,
  } = useStore();
  const { menu } = useHeaderMenu('header-main');
  const [isItems, setIsItems] = useState<number | null>(null);
  const [isSubItems, setIsSubItems] = useState<number | null>(null);
  const [openNavItemId, setOpenNavItemId] = useState<number | null>(null);
  const [openSubItemId, setOpenSubItemId] = useState<number | null>(null);
  const toggleDropdown = (itemId: number) => {
    setIsItems((prevItem) => (prevItem === itemId ? null : itemId));
    setOpenNavItemId((prev) => (prev === itemId ? null : itemId));
  };

  const toggleSubItemDropdown = (subItemId: number) => {
    setIsSubItems((prevSubItem) =>
      prevSubItem === subItemId ? null : subItemId
    );
    setOpenSubItemId((prev) => (prev === subItemId ? null : subItemId));
  };

  const toggleMegaMenu = () => {
    setIsMegaMenu(!isMegaMenu);
  };
  const toggleHomeDrop = () => {
    setIsHomeDrop(!isMegaMenu);
  };

  return (
    <div
      className={`mobile-nav__wrapper ${mobileDrawerStatus ? "expanded" : ""}`}
    >
      <div
        className='mobile-nav__overlay'
        onClick={changeMobileDrawerStatus}
      ></div>
      <div
        className={`mobile-nav__content ${
          isMegaMenu ? "megamenu-popup-active" : ""
        }`}
      >
        <span className='mobile-nav__close' onClick={changeMobileDrawerStatus}>
          <i className='fa fa-times'></i>
        </span>

        <div className='logo-box'>
          <Link href={`/${locale}`} aria-label='logo image'>
            <Image src={logo} width={155} height={41} alt='logo' />
          </Link>
        </div>

        <div className='mobile-nav__container'>
          <ul className='main-menu__list'>
            <li className={`megamenu  ${isMegaMenu ? "current" : ""}`}>
              <Link
                href=''
                onClick={(e) => {
                  e.preventDefault();
                  toggleMegaMenu();
                }}
              >
                Home
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleHomeDrop();
                  }}
                  className={`${isHomeDrop ? "expanded" : ""}`}
                >
                  <i className='fa fa-angle-down'></i>
                </button>
              </Link>
              <ul className={`${isHomeDrop ? "open " : ""} close`}>
                <li>
                  <section className='home-showcase'>
                    <Container>
                      <div className='home-showcase__inner'>
                      </div>
                    </Container>
                  </section>
                </li>
              </ul>
            </li>

            {(Array.isArray(menu?.items) ? (menu!.items as any[]) : []).map((item: any, idx: number) => (
              (() => {
                const children = item.children || item.subMenu;
                const hasChildren = Array.isArray(children) && children.length > 0;
                return (
              <li
                key={item._id || item.id || `${item.label || item.title}-${idx}`}
                className={`${hasChildren ? "dropdown" : ""} ${
                  isItems === idx ? "open" : ""
                }`}
              >
                <Link
                  href={localizeInternalUrl(item.url || item.link, locale)}
                  className={`${isItems === idx ? "expanded" : ""}`}
                >
                  {getLocalizedValue(item.label || item.title, i18n.language)}

                  {hasChildren && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleDropdown(idx);
                      }}
                      className={`${isItems === idx ? "expanded" : ""}`}
                    >
                      <i className='fa fa-angle-down'></i>
                    </button>
                  )}
                </Link>

                {hasChildren ? (
                  <ul
                    className={`close ${openNavItemId === idx ? "open" : ""}`}
                  >
                    {children.map((subMenu: any, sidx: number) => {
                      const subChildren = subMenu.children || subMenu.subMenu;
                      const hasSubChildren = Array.isArray(subChildren) && subChildren.length > 0;
                      return (
                    <li
                      key={subMenu._id || subMenu.id || `${subMenu.label || subMenu.title}-${sidx}`}
                      className={`${hasSubChildren ? "dropdown" : ""} ${
                        isSubItems === sidx ? "open" : ""
                      }`}
                    >
                      <div className=' main-menu__list__wrapper'>
                        <Link
                          href={localizeInternalUrl(subMenu.url || subMenu.link, locale)}
                          className={`${isSubItems === sidx ? "expanded" : ""}`}
                        >
                          {getLocalizedValue(subMenu.label || subMenu.title, i18n.language)}{" "}
                        </Link>

                        {hasSubChildren && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleSubItemDropdown(sidx);
                            }}
                            className={`${isSubItems === sidx ? "expanded" : ""}`}
                          >
                            <i className='fa fa-angle-down'></i>
                          </button>
                        )}
                      </div>

                      {hasSubChildren && (
                        <ul
                          className={`close ${openSubItemId === sidx ? "open" : ""}`}
                        >
                          {subChildren.map((subSubItem: any, ssidx: number) => (
                            <li key={subSubItem._id || subSubItem.id || `${subSubItem.label || subSubItem.title}-${ssidx}`}>
                              <Link href={localizeInternalUrl(subSubItem.url || subSubItem.link, locale)}>
                                {getLocalizedValue(subSubItem.label || subSubItem.title, i18n.language)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                      );
                    })}
                  </ul>
                ) : null}
              </li>
                );
              })()
            ))}
          </ul>
        </div>

        <ul className='mobile-nav__contact list-unstyled'>
          <li>
            <span className='mobile-nav__contact__icon'>
              <i className='fa fa-envelope'></i>
            </span>
            <Link href='mailto:info@jesegypttours.com'>info@jesegypttours.com</Link>
          </li>
          <li>
            <span className='mobile-nav__contact__icon'>
              <i className='fab fa-whatsapp'></i>
            </span>
            <Link href='https://wa.me/201007437271'>+20 100 743 7271</Link>
          </li>
        </ul>

        <div className='mobile-nav__social'>
          <Link href='https://facebook.com'>
            {" "}
            <i className='icon-facebook' aria-hidden='true'></i>{" "}
            <span className='sr-only'>Facebook</span>
          </Link>
          <Link href='https://twitter.com'>
            {" "}
            <i className='icon-twitter' aria-hidden='true'></i>{" "}
            <span className='sr-only'>Twitter</span>
          </Link>
          <Link href='https://instagram.com'>
            {" "}
            <i className='icon-instagram' aria-hidden='true'></i>{" "}
            <span className='sr-only'>Instagram</span>
          </Link>
          <Link href='https://youtube.com'>
            {" "}
            <i className='icon-youtube' aria-hidden='true'></i>{" "}
            <span className='sr-only'>Youtube</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Drawer;
