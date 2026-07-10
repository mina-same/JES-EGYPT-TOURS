"use client";
import React, { useState, useRef, useEffect } from "react";
import { useCurrency, CurrencyCode } from "@/contexts/CurrencyContext";
import "./currencySwitcher.css";

const currencies: { code: CurrencyCode; label: string; flag: string }[] = [
  { code: "USD", label: "USD", flag: "🇺🇸" },
  { code: "EUR", label: "EUR", flag: "🇪🇺" },
  { code: "GBP", label: "GBP", flag: "🇬🇧" },
];

interface CurrencySwitcherProps {
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

const OPEN_DELAY_MS = 160;
const CLOSE_DELAY_MS = 250;

const CurrencySwitcher: React.FC<CurrencySwitcherProps> = ({
  isOpen,
  onOpen,
  onClose,
}) => {
  const { currency, setCurrency } = useCurrency();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [canHoverOpen, setCanHoverOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isControlled = typeof isOpen === "boolean";
  const dropdownIsOpen = isControlled ? isOpen : internalIsOpen;

  const currentCurrency = currencies.find((c) => c.code === currency) || currencies[0];

  const clearOpenTimer = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  };

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openDropdown = () => {
    if (isControlled) {
      onOpen?.();
      return;
    }

    setInternalIsOpen(true);
    onOpen?.();
  };

  const closeDropdown = () => {
    if (isControlled) {
      onClose?.();
      return;
    }

    setInternalIsOpen(false);
    onClose?.();
  };

  const toggleDropdown = () => {
    clearOpenTimer();
    clearCloseTimer();

    if (dropdownIsOpen) {
      closeDropdown();
      return;
    }

    openDropdown();
  };

  const handlePointerEnter = () => {
    if (!canHoverOpen) return;
    clearCloseTimer();
    clearOpenTimer();
    openTimerRef.current = setTimeout(openDropdown, OPEN_DELAY_MS);
  };

  const handlePointerLeave = () => {
    if (!canHoverOpen) return;
    clearOpenTimer();
    clearCloseTimer();
    closeTimerRef.current = setTimeout(closeDropdown, CLOSE_DELAY_MS);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDropdown();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  useEffect(() => {
    const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updateHoverCapability = () => setCanHoverOpen(hoverQuery.matches);

    updateHoverCapability();
    hoverQuery.addEventListener("change", updateHoverCapability);

    return () => {
      hoverQuery.removeEventListener("change", updateHoverCapability);
    };
  }, []);

  useEffect(() => {
    return () => {
      clearOpenTimer();
      clearCloseTimer();
    };
  }, []);

  return (
    <div
      className="currency-switcher"
      ref={dropdownRef}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <button 
        className={`currency-switcher__btn ${dropdownIsOpen ? "is-open" : ""}`}
        onClick={toggleDropdown}
        aria-haspopup="true"
        aria-expanded={dropdownIsOpen}
      >
        <span className="currency-switcher__flag">{currentCurrency.flag}</span>
        <span className="currency-switcher__label">{currentCurrency.label}</span>
        <span className="currency-switcher__arrow">
          <i className="fas fa-chevron-down"></i>
        </span>
      </button>

      {dropdownIsOpen && (
        <ul className="currency-switcher__dropdown">
          {currencies.map((c) => (
            <li key={c.code}>
              <button
                className={`currency-switcher__option ${c.code === currency ? "is-active" : ""}`}
                onClick={() => {
                  setCurrency(c.code);
                  closeDropdown();
                }}
              >
                <span className="currency-switcher__flag">{c.flag}</span>
                <span className="currency-switcher__label">{c.label}</span>
                {c.code === currency && (
                  <span className="currency-switcher__check">
                    <i className="fas fa-check"></i>
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CurrencySwitcher;
