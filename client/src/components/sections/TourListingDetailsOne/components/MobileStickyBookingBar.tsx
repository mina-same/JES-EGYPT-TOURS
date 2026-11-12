"use client";
import React, { useState, useEffect, useId, useRef } from 'react';
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { ICurrencyPrice } from "@/contexts/CurrencyContext";
import { BookingFormLazy } from './BookingFormLazy';
import { BadgeCheck, CalendarDays, ChevronUp, X } from 'lucide-react';

const FOCUSABLE_SELECTOR = 'a[href], button, input, select, textarea, [tabindex]';

/** What Tab can reach inside `root`: rendered, enabled and not tabindex="-1".
 *  The calendar, the phone country list and lazily loaded fields come and go,
 *  so this is read at the moment of each key press. */
const tabbableIn = (root: Element | null | undefined) =>
  Array.from(root?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []).filter(
    (el) =>
      el.tabIndex >= 0 &&
      !el.matches(':disabled') &&
      el.getClientRects().length > 0 &&
      getComputedStyle(el).visibility !== 'hidden'
  );

/** The sidebar's booking card: where focus goes when the open sheet disappears
 *  because the layout turned desktop (992px and up). */
const DESKTOP_BOOKING_CARD = '.tour-listing-details__sidebar .tour-listing-details__sidebar__item-form';

interface MobileStickyBookingBarProps {
  tourId: string;
  price?: number | ICurrencyPrice | null;
  /** Passed through to the sheet's BookingForm so the WhatsApp message names the tour. */
  tourTitle?: string;
  /** The tour's pricing plan names. The sheet renders the SAME form as the
   *  sidebar, so it has to offer the same package choice — otherwise a mobile
   *  visitor books a package tour without ever being asked which tier. */
  packageOptions?: string[];
}

/**
 * The sticky "Book This Tour" bar below 992px, and the booking sheet it opens.
 *
 * The sheet is a modal dialog: while open, focus starts on its close button,
 * Tab and Shift+Tab cycle inside it, Escape closes it (unless something inside,
 * such as the calendar, used that Escape already), the page behind does not
 * scroll, and closing gives focus back to the Book button. While closed — or
 * hidden at desktop widths — it is `inert`: nothing in it can be focused or
 * reached by assistive technology, yet the form stays mounted, so what the
 * visitor typed is still there when they come back to it.
 */
export const MobileStickyBookingBar: React.FC<MobileStickyBookingBarProps> = ({ tourId, price, tourTitle, packageOptions }) => {
  const { t } = useTranslation("tours");
  // The fallback wording lives in `common`, next to the tour-card labels, so
  // the same phrase appears wherever a tour can be shown without a price.
  const { t: tCommon } = useTranslation("common");
  const { formatPrice, getPriceValue } = useCurrency();
  const hasPrice = getPriceValue(price) > 0;
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  /** Once the layout has been mobile, the bar and sheet stay mounted — hidden
   *  and inert at desktop widths — so the form and what the visitor typed
   *  survive a rotation or a resize across 992px. They used to unmount there,
   *  taking the typed values with them. */
  const [hasBeenMobile, setHasBeenMobile] = useState(false);
  /** Keeps the bar shown after the sheet closes, while its button holds the
   *  focus given back to it, even where the scroll position would hide the bar
   *  (a rotation while open can change that). Released by the button losing
   *  focus or by the next scroll. */
  const [holdsFocus, setHoldsFocus] = useState(false);
  const titleId = useId();
  const barRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  /** True from the sheet's opening until focus has been settled after it closed. */
  const wasOpenRef = useRef(false);
  /** Set when the layout turns desktop while focus is in the bar or the sheet. */
  const refocusOnDesktopRef = useRef(false);

  const isSheetOpen = isOpen && isMobile;
  const barShown = isMobile && !isOpen && (isVisible || holdsFocus);

  const closeSheet = () => {
    setIsOpen(false);
    setHoldsFocus(true);
  };

  useEffect(() => {
    const checkMobile = () => {
      const nextIsMobile = window.innerWidth < 992;

      if (nextIsMobile) {
        setHasBeenMobile(true);
      } else {
        // The bar and sheet are about to be hidden: focus inside them — or
        // nowhere, while the sheet was open — moves to the desktop booking card.
        const active = document.activeElement;
        const focusInside = !!active && (!!barRef.current?.contains(active) || !!sheetRef.current?.contains(active));
        const focusLost = !active || active === document.body;
        if (focusInside || (wasOpenRef.current && focusLost)) {
          refocusOnDesktopRef.current = true;
        }
        // Closed, not just hidden: coming back below 992px must not reopen it.
        setIsOpen(false);
        setHoldsFocus(false);
        setIsVisible(false);
      }

      setIsMobile(nextIsMobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    const updateVisibility = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const viewportHeight = window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      const distanceFromBottom = pageHeight - (scrollY + viewportHeight);
      const showAfter = Math.max(360, viewportHeight * 0.65);
      const hideBeforeBottom = 260;

      setIsVisible(scrollY > showAfter && distanceFromBottom > hideBeforeBottom);
    };
    const releaseFocusHold = () => setHoldsFocus(false);

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('scroll', releaseFocusHold, { passive: true });
    window.addEventListener('resize', updateVisibility);

    return () => {
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('scroll', releaseFocusHold);
      window.removeEventListener('resize', updateVisibility);
    };
  }, [isMobile]);

  // Background scroll lock. The page scrolls on <html> (custom.css sets
  // overflow-x on both html and body), so locking <body> alone let the page
  // move behind the sheet. Whatever inline values were there before are put
  // back afterwards, rather than forced to `unset`.
  useEffect(() => {
    if (!isSheetOpen) {
      return;
    }

    const html = document.documentElement;
    const body = document.body;
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      gutter: html.style.getPropertyValue('scrollbar-gutter'),
    };
    // Where the page has a classic scrollbar (a narrow desktop window), keep
    // its space so the page does not widen and shift behind the backdrop.
    if (window.innerWidth > html.clientWidth) {
      html.style.setProperty('scrollbar-gutter', 'stable');
    }
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    return () => {
      html.style.overflow = previous.htmlOverflow;
      body.style.overflow = previous.bodyOverflow;
      html.style.setProperty('scrollbar-gutter', previous.gutter);
    };
  }, [isSheetOpen]);

  // Escape, and the Tab cycle, while the sheet is open.
  useEffect(() => {
    if (!isSheetOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const sheet = sheetRef.current;
      if (!sheet) {
        return;
      }

      if (event.key === 'Escape') {
        // The calendar closes itself on Escape and marks the event handled;
        // only an Escape nothing inside has used closes the sheet.
        if (event.defaultPrevented || event.isComposing) {
          return;
        }
        event.preventDefault();
        setIsOpen(false);
        setHoldsFocus(true);
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const tabbable = tabbableIn(sheet);
      if (tabbable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = tabbable[0];
      const last = tabbable[tabbable.length - 1];
      const active = document.activeElement;

      if (!active || !sheet.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      // Focus can also sit on something outside the list (a calendar day the
      // calendar focused itself): compare document positions, not identity.
      const beforeFirst = active === first || !!(active.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING);
      const afterLast = active === last || !!(active.compareDocumentPosition(last) & Node.DOCUMENT_POSITION_PRECEDING);

      if (event.shiftKey && beforeFirst) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && afterLast) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isSheetOpen]);

  // Focus on opening and closing.
  useEffect(() => {
    if (isSheetOpen) {
      wasOpenRef.current = true;
      // The button is always mounted and the sheet stops being inert in this
      // same commit, so it can take focus now, whatever the slide is doing;
      // preventScroll keeps the page where it is.
      closeButtonRef.current?.focus({ preventScroll: true });
      return;
    }

    if (!wasOpenRef.current) {
      return;
    }
    wasOpenRef.current = false;

    if (!isMobile) {
      // Closed by the layout turning desktop: the effect below places focus.
      return;
    }

    const active = document.activeElement;
    if (active && active !== document.body && !sheetRef.current?.contains(active)) {
      // Focus has already gone somewhere else on purpose; leave it there.
      setHoldsFocus(false);
      return;
    }

    // closeSheet() set holdsFocus, so the bar — and its button — is shown and
    // no longer inert in this commit.
    const trigger = triggerRef.current;
    trigger?.focus({ preventScroll: true });
    if (document.activeElement !== trigger) {
      setHoldsFocus(false);
    }
  }, [isSheetOpen, isMobile]);

  // The layout turned desktop while focus was in the bar or the sheet: the
  // desktop booking card is the same form's place in that layout.
  useEffect(() => {
    if (isMobile || !refocusOnDesktopRef.current) {
      return;
    }
    refocusOnDesktopRef.current = false;

    const target = tabbableIn(document.querySelector(DESKTOP_BOOKING_CARD))[0];
    if (!target) {
      const active = document.activeElement;
      if (active instanceof HTMLElement && (barRef.current?.contains(active) || sheetRef.current?.contains(active))) {
        active.blur();
      }
      return;
    }

    target.focus({ preventScroll: true });
    // The sidebar places itself (fixed, parked or in flow) on the frame after
    // a resize. Once it has, a card that ended up out of view is brought into
    // it, so focus is never left somewhere the visitor cannot see.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        if (document.activeElement !== target) {
          return;
        }
        const rect = target.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
          target.scrollIntoView({ block: 'center' });
        }
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [isMobile]);

  useEffect(() => {
    const body = document.body;

    if (barShown) {
      body.classList.add('has-mobile-booking-bar');
    } else {
      body.classList.remove('has-mobile-booking-bar');
    }

    return () => {
      body.classList.remove('has-mobile-booking-bar');
    };
  }, [barShown]);

  useEffect(() => {
    const body = document.body;

    if (isSheetOpen) {
      body.classList.add('mobile-booking-sheet-open');
    } else {
      body.classList.remove('mobile-booking-sheet-open');
    }

    return () => {
      body.classList.remove('mobile-booking-sheet-open');
    };
  }, [isSheetOpen]);

  if (!isMobile && !hasBeenMobile) return null;

  return (
    <>
      <div
        ref={barRef}
        className={`mobile-sticky-booking-bar ${barShown ? 'is-visible' : ''}`}
        hidden={!isMobile}
        inert={!barShown}
      >
        <div className="booking-bar-content">
          {/*
            The meta block now always renders, so the bar cannot show a price
            on desktop and nothing here. The "Ready to book" chip stays tied to
            hasPrice exactly as before: it is a claim about being bookable at a
            known rate, and an unpriced tour has not earned it.
          */}
          <div className="booking-bar-meta">
            {hasPrice && (
              <span className="booking-bar-chip">
                <BadgeCheck size={14} />
                {t("tourDetails.bestSeller", "Ready to book")}
              </span>
            )}
            <div className="booking-bar-price">
              {hasPrice ? (
                <>
                  <span className="price-label">{t("tourDetails.from")}</span>
                  <span className="price-value">{formatPrice(price)}</span>
                </>
              ) : (
                <span className="price-value">{tCommon("tourCard.priceOnRequest")}</span>
              )}
            </div>
          </div>
          <button
            ref={triggerRef}
            type="button"
            className="theme-btn booking-bar-btn"
            onClick={() => setIsOpen(true)}
            onBlur={() => setHoldsFocus(false)}
          >
            <span>{t("tourDetails.bookThisTour", "Book This Tour")}</span>
            <ChevronUp size={18} />
          </button>
        </div>
      </div>

      {isSheetOpen && (
        // A pointer target only: mousedown keeps focus inside the sheet, and
        // the click closes it like the close button does.
        <div
          className="mobile-bottom-sheet-backdrop"
          aria-hidden="true"
          onMouseDown={(event) => event.preventDefault()}
          onClick={closeSheet}
        />
      )}
      <div
        ref={sheetRef}
        className={`mobile-bottom-sheet ${isSheetOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal={isSheetOpen ? true : undefined}
        aria-labelledby={titleId}
        hidden={!isMobile}
        inert={!isSheetOpen}
      >
        <div className="bottom-sheet-handle" />
        <div className="bottom-sheet-header">
          <div className="bottom-sheet-title-wrap">
            <span className="bottom-sheet-kicker">
              <CalendarDays size={14} />
              {t("tourDetails.bookNow", "Book Now")}
            </span>
            {/* h2 under the page's h1; .bottom-sheet-title sets every visible
                property, so it looks exactly as the h4 did. */}
            <h2 id={titleId} className="bottom-sheet-title">{t("tourDetails.bookThisTour", "Book This Tour")}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="bottom-sheet-close"
            aria-label={t("tourDetails.askModal.close")}
            onClick={closeSheet}
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>
        <div className="bottom-sheet-content">
          <BookingFormLazy tourId={tourId} price={price} tourTitle={tourTitle} packageOptions={packageOptions} />
        </div>
      </div>
    </>
  );
};
