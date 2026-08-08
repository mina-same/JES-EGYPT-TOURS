import type { CurrencyCode } from "@/contexts/CurrencyContext";

/** Readable by the server, unlike the localStorage key it replaces. That is
 *  the entire point: the render can now emit the visitor's own currency
 *  instead of shipping dollars and correcting them after hydration. */
export const CURRENCY_COOKIE = "jes_preferred_currency";

/** A currency preference is not a session — it should survive closing the
 *  browser, the way the localStorage value did. */
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export const isCurrencyCode = (value: unknown): value is CurrencyCode =>
  value === "USD" || value === "EUR" || value === "GBP";

/** Narrows an untrusted cookie value. Anything else — absent, stale, hand-
 *  edited — is treated as "no preference" so the caller falls through to geo. */
export const parseCurrencyCookie = (
  value: string | null | undefined
): CurrencyCode | null => (isCurrencyCode(value) ? value : null);

/**
 * Writes the preference where both the browser and the next server render can
 * see it.
 *
 * Not `HttpOnly`: the switcher is client-side and has to set it. `SameSite=Lax`
 * keeps it off cross-site requests while still arriving on ordinary navigation
 * — including the first hit from a Google result, which is when the flash used
 * to be most visible. No `Secure` flag on localhost, or the cookie would be
 * dropped during development.
 */
export const writeCurrencyCookie = (currency: CurrencyCode): void => {
  if (typeof document === "undefined") return;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${CURRENCY_COOKIE}=${currency}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax${secure}`;
};

/** Client-side read, used to detect whether a preference already exists before
 *  falling back to the legacy localStorage value or to geo. */
export const readCurrencyCookie = (): CurrencyCode | null => {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${CURRENCY_COOKIE}=([^;]*)`)
  );
  return parseCurrencyCookie(match?.[1]);
};
