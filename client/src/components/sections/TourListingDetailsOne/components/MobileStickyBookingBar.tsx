import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { BookingForm } from './BookingForm';
import { X } from 'lucide-react';

interface MobileStickyBookingBarProps {
  tourId: string;
  price?: number;
}

export const MobileStickyBookingBar: React.FC<MobileStickyBookingBarProps> = ({ tourId, price }) => {
  const { t } = useTranslation("tours");
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 992);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  if (!isMobile) return null;

  return (
    <>
      <div className="mobile-sticky-booking-bar">
        <div className="booking-bar-content">
          <div className="booking-bar-price">
            <span className="price-label">{t("tourDetails.from")}</span>
            <span className="price-value">${price || 0}</span>
          </div>
          <button className="theme-btn booking-bar-btn" onClick={() => setIsOpen(true)}>
            {t("tourDetails.bookNow", "Book Now")}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mobile-bottom-sheet-backdrop" onClick={() => setIsOpen(false)} />
      )}
      <div className={`mobile-bottom-sheet ${isOpen ? 'open' : ''}`}>
        <div className="bottom-sheet-header">
          <h4 className="bottom-sheet-title">{t("tourDetails.bookThisTour", "Book This Tour")}</h4>
          <button className="bottom-sheet-close" onClick={() => setIsOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <div className="bottom-sheet-content">
          <BookingForm tourId={tourId} />
        </div>
      </div>
    </>
  );
};
