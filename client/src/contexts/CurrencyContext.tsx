"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, startTransition } from "react";
// Not currencyAPI (lib/api/currency): it imports axios, and this provider is on every page.
import { getCurrencyRates } from "@/lib/api/currencyRates";
import { currencyForCountry } from "@/lib/currency/countryCurrency";
import {
  isCurrencyCode,
  readCurrencyCookie,
  writeCurrencyCookie,
} from "@/lib/currency/currencyCookie";
import { localeCurrency } from "@/lib/currency/localeCurrency";
import { CURRENCY_SYMBOLS, convertUsdPrice, formatPriceAmount } from "@/lib/currency/priceFormat";
import { FALLBACK_RATES, parseRatesPayload, type CurrencyRates } from "@/lib/currency/rates";
import { isUsableAmount } from "@/lib/tours/startingPrice";

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
  /** Formats an amount that is ALREADY in the current currency (for example the
   *  result of getPriceValue). formatPrice(number) would treat it as dollars
   *  and convert it a second time. */
  formatAmount: (value: number) => string;
  getPriceValue: (amount: number | ICurrencyPrice | undefined | null) => number;
  currencySymbol: string;
  isLoading: boolean;
}

const STORAGE_KEY = "jes_preferred_currency";

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "USD",
  setCurrency: () => {},
  rates: FALLBACK_RATES,
  formatPrice: () => "$0",
  formatAmount: () => "$0",
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
  savedCurrency?: CurrencyCode;
  /** The page language. /de, /it and /es are priced in EUR whatever the
   *  visitor's country (lib/currency/localeCurrency.ts). */
  locale?: string;
  /** The exchange rates the server rendered with: the ones stored in the
   *  database (Admin → Tour → Exchange Rates). Starting from them is what makes
   *  a converted price in the first HTML the same number after hydration. */
  initialRates?: CurrencyRates;
  /** False when the server could not read the stored rates and rendered with
   *  the last-resort FALLBACK_RATES; the browser then asks the API once. */
  ratesFromDatabase?: boolean;
}> = ({ children, savedCurrency, locale, initialRates, ratesFromDatabase = false }) => {
  /*
   * The currency is derived, never copied between states:
   *
   *   saved choice -> the page language's currency (/de, /it, /es: EUR)
   *   -> the visitor's country (/en only) -> USD
   *
   * The server layout renders with the first two (it has the cookie and the
   * locale), so /de, /it and /es are EUR in the first HTML and stay EUR after
   * hydration. A language switch changes `locale` and the result follows in
   * the same render, with no effect in between and so no flash.
   *
   * Geo, by contrast, is still never applied on the server: the cookie is
   * per-visitor and travels with the request, while the visitor's IP would
   * make the rendered output vary by country, which is a different and unsafe
   * thing to bake into a shared response.
   */
  /** The visitor's own choice: the cookie, a legacy localStorage value, or the
   *  switcher. It beats every rule below, including a geo answer still in
   *  flight when they pick a currency. */
  const [choice, setChoice] = useState<CurrencyCode | null>(savedCurrency ?? null);
  /** The country rule's answer (/en). A guess, never stored: it can be
   *  re-derived if the visitor travels, and never masquerades as a decision
   *  they made. Kept across language switches so /en asks /api/geo once. */
  const [countryCurrency, setCountryCurrency] = useState<CurrencyCode | null>(null);
  const currency: CurrencyCode = choice ?? localeCurrency(locale) ?? countryCurrency ?? "USD";
  const [rates, setRates] = useState<CurrencyRates>(initialRates ?? FALLBACK_RATES);
  const [isLoading, setIsLoading] = useState(!ratesFromDatabase);

  /*
   * Every update this provider makes on its own — the one-time migration, the
   * geo guess and the rates below — is a transition. They land shortly after
   * hydration, and a plain update to this context reaches every Suspense
   * boundary below it that is still waiting for its code (the tour page's
   * booking form): React then throws that boundary's server HTML away and
   * shows its placeholder. A transition is held back until the boundary has
   * hydrated instead. The visitor's own choice (setCurrency) stays urgent.
   */

  // The saved choice: the cookie the server already applied, then a
  // preference left behind in localStorage by the old build.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const cookie = readCurrencyCookie();
    if (cookie) {
      if (cookie !== savedCurrency) startTransition(() => setChoice(cookie));
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
      writeCurrencyCookie(legacy);
      startTransition(() => setChoice(legacy));
    }
    // Mount only: the server-provided value seeds the state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The country rule — only where nothing above it has decided: no saved
  // choice and a page language without a fixed currency (/en). The mapping
  // itself is unchanged (countryCurrency.ts).
  const needsCountry = choice === null && localeCurrency(locale) === null && countryCurrency === null;
  useEffect(() => {
    if (!needsCountry || typeof window === "undefined") return;

    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch("/api/geo", { signal: controller.signal });
        if (!response.ok) return;
        const data: { country?: string | null } = await response.json();
        startTransition(() => setCountryCurrency(currencyForCountry(data?.country)));
      } catch {
        // Aborted, offline, or not deployed behind the edge — stays USD.
      }
    })();

    return () => controller.abort();
  }, [needsCountry]);

  // The rates: the server already rendered with the stored ones, so there is
  // nothing to fetch — fetching would only risk a different answer after
  // hydration (the old 6-hour browser cache could hold rates an admin had
  // since changed). Only when the server fell back to FALLBACK_RATES does the
  // browser ask the API once.
  useEffect(() => {
    if (ratesFromDatabase) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await getCurrencyRates();
        const stored = parseRatesPayload(response?.data?.rates);
        if (!cancelled && stored) startTransition(() => setRates(stored));
      } catch (error) {
        console.warn("Failed to fetch currency rates, using fallback rates:", error);
      } finally {
        if (!cancelled) startTransition(() => setIsLoading(false));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ratesFromDatabase]);

  const setCurrency = useCallback((newCurrency: CurrencyCode) => {
    // From here on the visitor has decided; neither the page language nor geo
    // can override it.
    setChoice(newCurrency);
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
      
      // A bare number is a USD amount: shown as entered in USD, otherwise
      // converted and rounded by the one rule (nearest 5).
      if (typeof amount === 'number') {
        if (!isUsableAmount(amount)) return 0;
        return convertUsdPrice(amount, currency, rates[currency]);
      }

      // It's an ICurrencyPrice object. A typed amount is used as it is; zero
      // means "not priced in this currency" (as everywhere else on the site),
      // so it falls back to the converted USD amount like an absent one.
      const typed = amount[currency];
      if (isUsableAmount(typed)) return typed;

      // Fallback to USD, converted and rounded by the one rule
      return isUsableAmount(amount.USD) ? convertUsdPrice(amount.USD, currency, rates[currency]) : 0;
    },
    [currency, rates]
  );

  // Formatting only: getPriceValue already applied the one rounding rule.
  const formatPrice = useCallback(
    (amount: number | ICurrencyPrice | undefined | null): string =>
      formatPriceAmount(getPriceValue(amount), currency),
    [currency, getPriceValue]
  );

  const formatAmount = useCallback(
    (value: number): string => formatPriceAmount(value, currency),
    [currency]
  );

  const currencySymbol = CURRENCY_SYMBOLS[currency];

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        rates,
        formatPrice,
        formatAmount,
        getPriceValue,
        currencySymbol,
        isLoading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};
