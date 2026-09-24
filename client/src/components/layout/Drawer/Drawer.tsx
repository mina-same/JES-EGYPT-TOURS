"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { waHref, PHONE_DISPLAY, getSocialProfiles } from "@/config/contact";
import useStore from "@/store/useStore";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/images/logo-light.png";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getLocalizedValue, formatUrl } from "@/lib/localize";
import { getLocaleFromPath, localizeInternalUrl } from "@/lib/url";
import { Flame } from "lucide-react";

import { useHeaderMenu } from "@/hooks/useHeaderMenu";

/** Everything inside the panel that a keyboard can land on. */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * How many animation frames the close button gets to become focusable on open.
 *
 * It lands on the first or second frame in practice (the button's own
 * transition keeps it hidden for the frame the drawer opens on). The ceiling
 * only exists so a panel that never becomes focusable cannot retry forever.
 */
const MAX_FOCUS_FRAMES = 60;

/**
 * How long after opening a repeat tap on the menu button is absorbed: the
 * drawer's opening sequence in gotur.css — the overlay slides in over 500 ms,
 * then the panel fades in over the next 500 ms. The drawer arrives over the
 * button, so a second tap in that time lands on the overlay (or, on screens
 * narrow enough for the 300 px panel to cover the button, on the panel). It
 * used to close the menu the user had just asked for, or drop focus from it.
 */
const OPEN_SETTLE_MS = 1000;

const Drawer: React.FC = () => {
  const { t, i18n } = useTranslation("common");
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
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
  const toggleDropdown = (itemId: number) => {
    setIsItems((prevItem) => (prevItem === itemId ? null : itemId));
  };

  const toggleSubItemDropdown = (subItemId: number) => {
    setIsSubItems((prevSubItem) =>
      prevSubItem === subItemId ? null : subItemId
    );
  };

  // aria-controls needs an id that is identical on every render: the CMS
  // `_id` when the item has one, else its position in the drawer. The `p`
  // prefix keeps a position from ever colliding with an ObjectId.
  const submenuId = (item: any, position: string) =>
    `mobile-nav-submenu-${item?._id || `p${position}`}`;

  // A collapsed submenu is `inert`, and an element that turns inert while
  // focused loses focus to <body>. Clicking the toggle usually moves focus
  // onto it first, but not everywhere (Safari does not focus buttons on
  // click), so if focus is still inside the submenu, park it on the toggle.
  const onSubmenuToggle = (
    event: React.MouseEvent<HTMLButtonElement>,
    controlsId: string,
    isOpen: boolean,
    toggle: () => void
  ) => {
    if (isOpen && document.getElementById(controlsId)?.contains(document.activeElement)) {
      event.currentTarget.focus();
    }
    toggle();
  };

  // ── Dialog behaviour ──────────────────────────────────────────────────
  // The drawer IS the only navigation on mobile, and none of this existed:
  // the close control was a <span onClick>, the dismiss layer a <div onClick>,
  // there was no Escape key, no focus trap and no focus restoration. A
  // keyboard or switch-device user could not operate it at all (WCAG 2.1.1).
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  /** The pending focus-retry frame, so a close (or a newer open) cancels it. */
  const focusFrameRef = useRef<number | null>(null);
  /** False when the drawer closes because one of its links is navigating away. */
  const restoreFocusRef = useRef(true);
  /** When the drawer last opened, so a repeat tap on the menu button is absorbed. */
  const openedAtRef = useRef(0);

  const close = useCallback(() => {
    setMobileDrawerStatus(false);
  }, [setMobileDrawerStatus]);

  // Internal links close the drawer themselves. LayoutObserver only closes it
  // on a pathname change, which never comes for a link to the page already on
  // screen (Home on /en): the tap did nothing and the menu stayed open. A real
  // navigation leaves focus to the new page; a same-page link is a dismissal
  // like the close button, so focus goes back to the opener. The link's own
  // navigation is untouched, and modified clicks (new tab/window) stay open.
  const onLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    restoreFocusRef.current =
      new URL(event.currentTarget.href).pathname === window.location.pathname;
    close();
  };

  const isSettling = () => performance.now() - openedAtRef.current < OPEN_SETTLE_MS;

  const onOverlayClick = () => {
    if (isSettling()) return;
    close();
  };

  // While the drawer is still opening, a press on the panel's own background
  // (never on a control) must not blur the close button.
  const onPanelMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isSettling() && !(event.target as Element).closest(FOCUSABLE_SELECTOR)) {
      event.preventDefault();
    }
  };

  useEffect(() => {
    if (!mobileDrawerStatus) return;

    // Remember who opened it so focus can go back there on close.
    lastFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    restoreFocusRef.current = true;
    openedAtRef.current = performance.now();

    // Move focus into the panel — otherwise the tab order stays behind the
    // drawer and the next Tab press walks the page underneath it — and confirm
    // it landed. Only the first open mounts the drawer already visible; every
    // later open starts it mid-transition, and an element that is not yet
    // visible silently refuses focus(), so focus stayed on the hamburger while
    // the dialog declared itself modal. Retry on the following frames until it
    // sticks (same pattern as the Search dialog). custom.css makes the panel
    // visible at once on open, so it can stay once it lands.
    let framesLeft = MAX_FOCUS_FRAMES;
    const focusCloseButton = () => {
      focusFrameRef.current = null;
      const button = closeButtonRef.current;
      if (!button) return;

      button.focus();
      if (document.activeElement === button || framesLeft <= 0) return;

      framesLeft -= 1;
      focusFrameRef.current = requestAnimationFrame(focusCloseButton);
    };
    focusCloseButton();

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
      // A retry still queued would pull focus back into a closing drawer.
      if (focusFrameRef.current !== null) {
        cancelAnimationFrame(focusFrameRef.current);
        focusFrameRef.current = null;
      }
      const opener = lastFocusedRef.current;
      lastFocusedRef.current = null;
      // preventScroll: the opener is the hamburger in the page header, and a
      // plain focus() scrolled it into view — a reader who opened the menu
      // part-way down the page was thrown back to the top on close.
      if (restoreFocusRef.current && opener?.isConnected) {
        opener.focus({ preventScroll: true });
      }
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
          keyboard paths, so this must not be announced or focusable. A press
          on it must not blur the focused control either: an ignored repeat
          tap would otherwise drop focus out of the open dialog onto <body>. */}
      <div
        className='mobile-nav__overlay'
        onClick={onOverlayClick}
        onMouseDown={(event) => event.preventDefault()}
        aria-hidden='true'
      ></div>
      <div ref={panelRef} className='mobile-nav__content' onMouseDown={onPanelMouseDown}>
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
          <Link href={`/${locale}`} aria-label='logo image' onClick={onLinkClick}>
            <Image src={logo} width={155} height={41} alt='logo' />
          </Link>
        </div>

        <div className='mobile-nav__container'>
          <ul className='main-menu__list'>
            <li>
              <Link href={`/${locale}`} onClick={onLinkClick}>{t("nav.home")}</Link>
            </li>

            {(Array.isArray(menu?.items) ? (menu!.items as any[]) : []).map((item: any, idx: number) => (
              (() => {
                const children = item.children || item.subMenu;
                const hasChildren = Array.isArray(children) && children.length > 0;
                const isPromotion = item?.displayVariant === "promotion";
                const isOpen = isItems === idx;
                const label = getLocalizedValue(item.label || item.title, i18n.language);
                const controlsId = submenuId(item, String(idx));
                const itemLink = (
                  <Link
                    href={itemHref(item)}
                    className={`${isOpen ? "expanded" : ""} ${isPromotion ? "mobile-menu__promotion-link" : ""}`}
                    onClick={onLinkClick}
                  >
                    {isPromotion ? (
                      <Flame size={16} aria-hidden="true" focusable={false} className="mobile-menu__promotion-icon" />
                    ) : null}
                    {label}
                  </Link>
                );
                return (
              <li
                key={item._id || item.id || `${item.label || item.title}-${idx}`}
                className={`${hasChildren ? "dropdown" : ""} ${
                  isOpen ? "open" : ""
                }`}
              >
                {/* A parent keeps its label as a real link to its own page and
                    gets the chevron as a SIBLING button — nested inside the
                    <a> it was invalid HTML, and it had no name or state. */}
                {hasChildren ? (
                  <div className='main-menu__list__wrapper'>
                    {itemLink}
                    <button
                      type='button'
                      onClick={(e) => onSubmenuToggle(e, controlsId, isOpen, () => toggleDropdown(idx))}
                      className={`${isOpen ? "expanded" : ""}`}
                      aria-expanded={isOpen}
                      aria-controls={controlsId}
                      aria-label={t(isOpen ? "menu.collapseSubmenu" : "menu.expandSubmenu", { label })}
                    >
                      <i className='fa fa-angle-down' aria-hidden='true'></i>
                    </button>
                  </div>
                ) : (
                  itemLink
                )}

                {/* `inert` while collapsed: max-height only hid the links,
                    which stayed tabbable and exposed to assistive tech. The
                    classes still drive the expand/collapse animation. */}
                {hasChildren ? (
                  <ul
                    id={controlsId}
                    className={`close ${isOpen ? "open" : ""}`}
                    inert={!isOpen}
                  >
                    {children.map((subMenu: any, sidx: number) => {
                      const subChildren = subMenu.children || subMenu.subMenu;
                      const hasSubChildren = Array.isArray(subChildren) && subChildren.length > 0;
                      const isSubOpen = isSubItems === sidx;
                      const subLabel = getLocalizedValue(subMenu.label || subMenu.title, i18n.language);
                      const subControlsId = submenuId(subMenu, `${idx}-${sidx}`);
                      return (
                    <li
                      key={subMenu._id || subMenu.id || `${subMenu.label || subMenu.title}-${sidx}`}
                      className={`${hasSubChildren ? "dropdown" : ""} ${
                        isSubOpen ? "open" : ""
                      }`}
                    >
                      <div className=' main-menu__list__wrapper'>
                        <Link
                          href={itemHref(subMenu)}
                          className={`${isSubOpen ? "expanded" : ""}`}
                          onClick={onLinkClick}
                        >
                          {subLabel}{" "}
                        </Link>

                        {hasSubChildren && (
                          <button
                            type='button'
                            onClick={(e) => onSubmenuToggle(e, subControlsId, isSubOpen, () => toggleSubItemDropdown(sidx))}
                            className={`${isSubOpen ? "expanded" : ""}`}
                            aria-expanded={isSubOpen}
                            aria-controls={subControlsId}
                            aria-label={t(isSubOpen ? "menu.collapseSubmenu" : "menu.expandSubmenu", { label: subLabel })}
                          >
                            <i className='fa fa-angle-down' aria-hidden='true'></i>
                          </button>
                        )}
                      </div>

                      {hasSubChildren && (
                        <ul
                          id={subControlsId}
                          className={`close ${isSubOpen ? "open" : ""}`}
                          inert={!isSubOpen}
                        >
                          {subChildren.map((subSubItem: any, ssidx: number) => (
                            <li key={subSubItem._id || subSubItem.id || `${subSubItem.label || subSubItem.title}-${ssidx}`}>
                              <Link href={itemHref(subSubItem)} onClick={onLinkClick}>
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
