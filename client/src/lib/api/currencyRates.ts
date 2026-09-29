import type { CurrencyRates } from './currency';
import { publicGet } from './publicGet';

/**
 * currencyAPI.getRates() (./currency.ts) for CurrencyProvider, without axios.
 *
 * CurrencyProvider runs on every visitor page, and currency.ts imports the
 * axios instance, so reading the rates through it put axios into every
 * page's JavaScript. This returns what getRates returns in every case: the
 * response body on success; on failure the same console.warn, then the error
 * response's body, or the same fallback object when there is none. Like
 * getRates, it never throws.
 */
export async function getCurrencyRates(): Promise<{ success: boolean; data?: CurrencyRates; message?: string }> {
  try {
    return await publicGet('/currency/rates');
  } catch (error: any) {
    // CurrencyProvider falls back to cached/default rates, so an unreachable
    // API is not an error worth the dev overlay — console.error would raise it.
    console.warn('Currency rates unavailable, using fallback rates:', error?.message);
    return error.response?.data || { success: false, message: 'Failed to fetch rates' };
  }
}
