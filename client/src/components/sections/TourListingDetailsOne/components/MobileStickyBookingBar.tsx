"use client";
import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { ICurrencyPrice } from "@/contexts/CurrencyContext";
import { BookingForm } from './BookingForm';
import { BadgeCheck, CalendarDays, ChevronUp, X } from 'lucide-react';

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

export const MobileStickyBookingBar: React.FC<MobileStickyBookingBarProps> = ({ tourId, price, tourTitle, packageOptions }) => {
  const { t } = useTranslation("tours");
  const { formatPrice, getPriceValue } = useCurrency();
  const hasPrice = getPriceValue(price) > 0;
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const nextIsMobile = window.innerWidth < 992;
      setIsMobile(nextIsMobile);

      if (!nextIsMobile) {
        setIsVisible(false);
      }
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

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);

    return () => {
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
    };
  }, [isMobile]);

  // Prevent body scroll when bottom sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const body = document.body;

    if (isMobile && isVisible && !isOpen) {
      body.classList.add('has-mobile-booking-bar');
    } else {
      body.classList.remove('has-mobile-booking-bar');
      body.classList.remove('mobile-booking-sheet-open');
    }

    return () => {
      body.classList.remove('has-mobile-booking-bar');
      body.classList.remove('mobile-booking-sheet-open');
    };
  }, [isMobile, isVisible, isOpen]);

  useEffect(() => {
    const body = document.body;

    if (isMobile && isOpen) {
      body.classList.add('mobile-booking-sheet-open');
    } else {
      body.classList.remove('mobile-booking-sheet-open');
    }

    return () => {
      body.classList.remove('mobile-booking-sheet-open');
    };
  }, [isMobile, isOpen]);

  if (!isMobile) return null;

  return (
    <>
      <div className={`mobile-sticky-booking-bar ${isVisible && !isOpen ? 'is-visible' : ''}`}>
        <div className="booking-bar-content">
          {hasPrice && (
            <div className="booking-bar-meta">
              <span className="booking-bar-chip">
                <BadgeCheck size={14} />
                {t("tourDetails.bestSeller", "Ready to book")}
              </span>
              <div className="booking-bar-price">
                <span className="price-label">{t("tourDetails.from")}</span>
                <span className="price-value">{formatPrice(price)}</span>
              </div>
            </div>
          )}
          <button className="theme-btn booking-bar-btn" onClick={() => setIsOpen(true)}>
            <span>{t("tourDetails.bookThisTour", "Book This Tour")}</span>
            <ChevronUp size={18} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mobile-bottom-sheet-backdrop" onClick={() => setIsOpen(false)} />
      )}
      <div className={`mobile-bottom-sheet ${isOpen ? 'open' : ''}`}>
        <div className="bottom-sheet-handle" />
        <div className="bottom-sheet-header">
          <div className="bottom-sheet-title-wrap">
            <span className="bottom-sheet-kicker">
              <CalendarDays size={14} />
              {t("tourDetails.bookNow", "Book Now")}
            </span>
            <h4 className="bottom-sheet-title">{t("tourDetails.bookThisTour", "Book This Tour")}</h4>
          </div>
          <button className="bottom-sheet-close" onClick={() => setIsOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <div className="bottom-sheet-content">
          <BookingForm tourId={tourId} price={price} tourTitle={tourTitle} packageOptions={packageOptions} />
        </div>
      </div>
    </>
  );
};
