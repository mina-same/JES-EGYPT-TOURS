"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { waHref, PHONE_DISPLAY, getSocialProfiles } from "@/config/contact";
import useStore from "@/store/useStore";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import logo from "@/assets/images/logo-light.png";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getLocalizedValue, formatUrl } from "@/lib/localize";
import { getLocaleFromPath, localizeInternalUrl } from "@/lib/url";
import { Flame } from "lucide-react";

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

/** Everything inside the panel that a keyboard can land on. */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Drawer: React.FC = () => {
  const { t, i18n } = useTranslation("common");
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const [isMegaMenu, setIsMegaMenu] = useState(false);
  const [isHomeDrop, setIsHomeDrop] = useState(false);
  const {
    mobileDrawerStatus,
    setMobileDrawerStatus,
  } = useStore();
  const { menu } = useHeaderMenu('header-main');
  const socials = getSocialProfiles();

  // Menu URLs are localized per language (legacy items may be plain strings)
  // — resolve the active language's path before locale-prefixing it.
  const itemHref = (item: any) =>
    localizeInternalUrl(formatUrl(getLocalizedValue(item.url || item.link, i18n.language)), locale);
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

  // ── Dialog behaviour ──────────────────────────────────────────────────
  // The drawer IS the only navigation on mobile, and none of this existed:
  // the close control was a <span onClick>, the dismiss layer a <div onClick>,
  // there was no Escape key, no focus trap and no focus restoration. A
  // keyboard or switch-device user could not operate it at all (WCAG 2.1.1).
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setMobileDrawerStatus(false);
  }, [setMobileDrawerStatus]);

  useEffect(() => {
    if (!mobileDrawerStatus) return;

    // Remember who opened it so focus can go back there on close.
    lastFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Move focus into the panel — otherwise the tab order stays behind the
    // drawer and the next Tab press walks the page underneath it.
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
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      lastFocusedRef.current?.focus();
    };
  }, [mobileDrawerStatus, close]);

  return (
    <div
      className={`mobile-nav__wrapper ${mobileDrawerStatus ? "expanded" : ""}`}
      role='dialog'
      aria-modal='true'
      aria-label={t("nav.label")}
      // While closed the panel is still in the DOM, so without `inert` every
      // link inside it stays in the tab order and focus vanishes off-screen.
      inert={!mobileDrawerStatus}
    >
      {/* Pointer-only dismiss layer. Escape and the close button are the
          keyboard paths, so this must not be announced or focusable. */}
      <div
        className='mobile-nav__overlay'
        onClick={close}
        aria-hidden='true'
      ></div>
      <div
        ref={panelRef}
        className={`mobile-nav__content ${
          isMegaMenu ? "megamenu-popup-active" : ""
        }`}
      >
        <button
          type='button'
          ref={closeButtonRef}
          className='mobile-nav__close'
          onClick={close}
          aria-label={t("menu.close")}
        >
          <i className='fa fa-times' aria-hidden='true'></i>
        </button>

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
                const isPromotion = item?.displayVariant === "promotion";
                return (
              <li
                key={item._id || item.id || `${item.label || item.title}-${idx}`}
                className={`${hasChildren ? "dropdown" : ""} ${
                  isItems === idx ? "open" : ""
                }`}
              >
                <Link
                  href={itemHref(item)}
                  className={`${isItems === idx ? "expanded" : ""} ${isPromotion ? "mobile-menu__promotion-link" : ""}`}
                >
                  {isPromotion ? (
                    <Flame size={16} aria-hidden="true" focusable={false} className="mobile-menu__promotion-icon" />
                  ) : null}
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
                          href={itemHref(subMenu)}
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
                              <Link href={itemHref(subSubItem)}>
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
            <Link href={waHref()}>{PHONE_DISPLAY}</Link>
          </li>
        </ul>

        {/* Was four hardcoded links to the platforms' own front pages, a
            third copy of the same list, and the only one missing
            rel="noopener noreferrer". Now one source: config/contact.ts. */}
        {socials.length > 0 && (
          <div className='mobile-nav__social'>
            {socials.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                target='_blank'
                rel='noopener noreferrer'
              >
                <i className={social.icon} aria-hidden='true'></i>
                <span className='sr-only'>{social.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Drawer;
