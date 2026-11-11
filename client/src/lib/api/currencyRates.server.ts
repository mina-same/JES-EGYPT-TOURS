import { cache } from 'react';
import { API_URL } from '@/config/api';
import { FALLBACK_RATES, parseRatesPayload, type CurrencyRates } from '@/lib/currency/rates';
import { TOUR_TAG } from './tour.server';

/**
 * The exchange rates stored in the database, for server rendering.
 *
 * The [locale] layout hands them to CurrencyProvider and the tour page uses
 * them for its JSON-LD, so a converted price is the same number in the first
 * HTML, after hydration and in the structured data.
 *
 * Cached in Next's Data Cache under the `tours` tag: `PUT /api/currency/rates`
 * (Admin → Tour → Exchange Rates) already revalidates that tag, so a saved
 * rate reaches the next page render at once, together with the listing
 * responses whose card prices the API converts with the same rate. The TTL is
 * only the backstop for a missed webhook.
 *
 * FALLBACK_RATES are the last resort when the API cannot be read; `source`
 * says which one the page got.
 */
export const RATES_TTL_SECONDS = 300;

export interface ServerCurrencyRates {
  rates: CurrencyRates;
  /** When the stored rates were last saved, or null for the fallback. */
  updatedAt: string | null;
  source: 'database' | 'fallback';
}

/** One read, uncached by React. Pages use `getServerCurrencyRates` below. */
export const readServerCurrencyRates = async (): Promise<ServerCurrencyRates> => {
  try {
    const response = await fetch(`${API_URL}/currency/rates`, {
      next: { revalidate: RATES_TTL_SECONDS, tags: [TOUR_TAG] },
    });
    if (response.ok) {
      const body = await response.json();
      const stored = body?.success ? parseRatesPayload(body?.data?.rates) : null;
      if (stored) {
        return {
          rates: stored,
          updatedAt: typeof body.data.updatedAt === 'string' ? body.data.updatedAt : null,
          source: 'database',
        };
      }
    }
  } catch {
    // API unreachable: fall through to the last-resort rates.
  }
  return { rates: FALLBACK_RATES, updatedAt: null, source: 'fallback' };
};

/** The stored rates, read once per server render (layout and tour page share it). */
export const getServerCurrencyRates = cache(readServerCurrencyRates);
