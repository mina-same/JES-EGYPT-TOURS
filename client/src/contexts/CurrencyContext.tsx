"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { currencyAPI } from "@/lib/api/currency";
import { currencyForCountry } from "@/lib/currency/countryCurrency";
import {
  isCurrencyCode,
  readCurrencyCookie,
  writeCurrencyCookie,
} from "@/lib/currency/currencyCookie";

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
const RATES_CACHE_KEY = "jes_currency_rates_cache_v1";
const RATES_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

interface CurrencyRatesCache {
  timestamp: number;
  rates: Record<CurrencyCode, number>;
}

const isRatesPayload = (rates: unknown): rates is Record<CurrencyCode, number> => {
  const data = rates as Partial<Record<CurrencyCode, unknown>>;
  return (
    typeof data?.USD === "number" &&
    typeof data?.EUR === "number" &&
    typeof data?.GBP === "number"
  );
};

const readRatesCache = (): { rates: Record<CurrencyCode, number>; expired: boolean } | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CurrencyRatesCache>;
    if (typeof parsed.timestamp !== "number" || !isRatesPayload(parsed.rates)) {
      window.sessionStorage.removeItem(RATES_CACHE_KEY);
      return null;
    }

    return {
      rates: parsed.rates,
      expired: Date.now() - parsed.timestamp >= RATES_CACHE_TTL_MS,
    };
  } catch {
    try {
      window.sessionStorage.removeItem(RATES_CACHE_KEY);
    } catch {
      // sessionStorage unavailable
    }
    return null;
  }
};

const writeRatesCache = (rates: Record<CurrencyCode, number>) => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      RATES_CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        rates,
      })
    );
  } catch {
    // sessionStorage unavailable
  }
};

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

export const CurrencyProvider: React.FC<{
  children: React.ReactNode;
  /** The preference the server read from the cookie for THIS request. Supplying
   *  it makes the first paint already correct, which is the whole fix for the
   *  dollar flash: the value used to start at "USD" and only reach localStorage
   *  in an effect, so everyone who had chosen euros or pounds watched their
   *  prices change on every single page load. */
  initialCurrency?: CurrencyCode;
}> = ({ children, initialCurrency }) => {
  // Geo, by contrast, is still never applied here — it stays in the effect
  // below. The cookie is per-visitor and travels with the request; the
  // visitor's IP would make the rendered output vary by country, which is a
  // different and unsafe thing to bake into a shared response.
  const [currency, setCurrencyState] = useState<CurrencyCode>(
    initialCurrency ?? "USD"
  );
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(DEFAULT_RATES);
  const [isLoading, setIsLoading] = useState(true);
  /** True once the visitor's own choice is known, from storage or from the
   *  switcher. Geo is only ever allowed to fill an empty preference, so this
   *  also settles the race where someone picks a currency while `/api/geo` is
   *  still in flight — the reply is then discarded instead of overruling them. */
  const hasExplicitCurrency = useRef(Boolean(initialCurrency));

  // Resolve the currency: the cookie the server already applied, then a
  // preference left behind in localStorage by the old build, then the
  // visitor's country, then the USD default.
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (readCurrencyCookie()) {
      hasExplicitCurrency.current = true;
      return;
    }

    // One-time migration. Without it, everyone who had already picked a
    // currency would silently lose it the moment this build ships, because
    // the server only ever looks at the cookie.
    let legacy: string | null = null;
    try {
      legacy = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable
    }

    if (isCurrencyCode(legacy)) {
      hasExplicitCurrency.current = true;
      writeCurrencyCookie(legacy);
      setCurrencyState(legacy);
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch("/api/geo", { signal: controller.signal });
        if (!response.ok) return;
        const data: { country?: string | null } = await response.json();
        if (hasExplicitCurrency.current) return;
        // Not written to storage: a guess must stay a guess, so that it can be
        // re-derived if the visitor travels, and so it never masquerades as a
        // decision they made.
        setCurrencyState(currencyForCountry(data?.country));
      } catch {
        // Aborted, offline, or not deployed behind the edge — stays USD.
      }
    })();

    return () => controller.abort();
  }, []);

  // Fetch exchange rates from API
  useEffect(() => {
    const fetchRates = async () => {
      const cached = readRatesCache();
      if (cached && !cached.expired) {
        setRates(cached.rates);
        setIsLoading(false);
        return;
      }

      try {
        const response = await currencyAPI.getRates();
        if (response.success && response.data) {
          const freshRates = {
            USD: 1,
            EUR: response.data.rates.EUR,
            GBP: response.data.rates.GBP,
          };
          setRates(freshRates);
          writeRatesCache(freshRates);
        } else if (cached?.rates) {
          setRates(cached.rates);
        }
      } catch (error) {
        console.warn("Failed to fetch currency rates, using defaults:", error);
        if (cached?.rates) {
          setRates(cached.rates);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, []);

  const setCurrency = useCallback((newCurrency: CurrencyCode) => {
    // From here on the visitor has decided; geo must not touch the value again.
    hasExplicitCurrency.current = true;
    setCurrencyState(newCurrency);
    if (typeof window === "undefined") return;

    // The cookie is what the next server render reads, so it is the one that
    // has to be right. localStorage is kept in step only so that a rollback to
    // the previous build does not lose the choice.
    writeCurrencyCookie(newCurrency);
    try {
      window.localStorage.setItem(STORAGE_KEY, newCurrency);
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
