"use client";
import React, { useState, useRef, useEffect } from "react";
import { useCurrency, CurrencyCode } from "@/contexts/CurrencyContext";
import "./currencySwitcher.css";

const currencies: { code: CurrencyCode; label: string; flag: string }[] = [
  { code: "USD", label: "USD", flag: "🇺🇸" },
  { code: "EUR", label: "EUR", flag: "🇪🇺" },
  { code: "GBP", label: "GBP", flag: "🇬🇧" },
];

const CurrencySwitcher: React.FC = () => {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentCurrency = currencies.find((c) => c.code === currency) || currencies[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="currency-switcher" ref={dropdownRef}>
      <button 
        className={`currency-switcher__btn ${isOpen ? "is-open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="currency-switcher__flag">{currentCurrency.flag}</span>
        <span className="currency-switcher__label">{currentCurrency.label}</span>
        <span className="currency-switcher__arrow">
          <i className="fas fa-chevron-down"></i>
        </span>
      </button>

      {isOpen && (
        <ul className="currency-switcher__dropdown">
          {currencies.map((c) => (
            <li key={c.code}>
              <button
                className={`currency-switcher__option ${c.code === currency ? "is-active" : ""}`}
                onClick={() => {
                  setCurrency(c.code);
                  setIsOpen(false);
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
