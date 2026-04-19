"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { currencyAPI } from "@/lib/api/currency";

export type CurrencyCode = "USD" | "EUR" | "GBP";

export interface ICurrencyPrice {
  USD: number;
  EUR?: number;
  GBP?: number;
}

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  rates: Record<CurrencyCode, number>;
  formatPrice: (amount: number | ICurrencyPrice | undefined | null) => string;
  getPriceValue: (amount: number | ICurrencyPrice | undefined | null) => number;
  currencySymbol: string;
  isLoading: boolean;
}

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};

const DEFAULT_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
};

const STORAGE_KEY = "jes_preferred_currency";

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "USD",
  setCurrency: () => {},
  rates: DEFAULT_RATES,
  formatPrice: () => "$0",
  getPriceValue: () => 0,
  currencySymbol: "$",
  isLoading: true,
});

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(DEFAULT_RATES);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved currency from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === "USD" || saved === "EUR" || saved === "GBP")) {
        setCurrencyState(saved as CurrencyCode);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  // Fetch exchange rates from API
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await currencyAPI.getRates();
        if (response.success && response.data) {
          setRates({
            USD: 1,
            EUR: response.data.rates.EUR,
            GBP: response.data.rates.GBP,
          });
        }
      } catch (error) {
        console.warn("Failed to fetch currency rates, using defaults:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, []);

  const setCurrency = useCallback((newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    try {
      localStorage.setItem(STORAGE_KEY, newCurrency);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const getPriceValue = useCallback(
    (amount: number | ICurrencyPrice | undefined | null): number => {
      if (amount === undefined || amount === null) return 0;
      
      if (typeof amount === 'number') {
        if (isNaN(amount)) return 0;
        return amount * rates[currency];
      }

      // It's an ICurrencyPrice object
      if (amount[currency] !== undefined && amount[currency] !== null) {
        return amount[currency] as number;
      }

      // Fallback to USD and convert
      return (amount.USD || 0) * rates[currency];
    },
    [currency, rates]
  );

  const formatPrice = useCallback(
    (amount: number | ICurrencyPrice | undefined | null): string => {
      const value = getPriceValue(amount);
      const symbol = CURRENCY_SYMBOLS[currency];

      // Format with appropriate decimal places
      // Round to whole number if >= 10, otherwise show 2 decimal places
      if (value >= 10) {
        return `${symbol}${Math.round(value)}`;
      }
      return `${symbol}${value.toFixed(2)}`;
    },
    [currency, getPriceValue]
  );

  const currencySymbol = CURRENCY_SYMBOLS[currency];

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        rates,
        formatPrice,
        getPriceValue,
        currencySymbol,
        isLoading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};
