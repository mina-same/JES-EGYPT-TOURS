import { API_URL } from '@/config/api';
import i18n from '@/lib/i18n';

/**
 * A GET to a PUBLIC API endpoint, with native fetch and the semantics of the
 * shared axios instance (./axios.ts).
 *
 * Every visitor page carries two such reads: the currency rates
 * (CurrencyProvider, when the session has no cached rates) and, when the
 * server supplied no header menu, the menu itself (useHeaderMenu). Through
 * axios those two calls made axios, about 18 KB of gzipped JavaScript, part of
 * the code every visitor page downloads. Routes whose own components use the
 * axios-based API clients still load it.
 *
 * The request is the one axios sent: the same URL, cookies (withCredentials),
 * axios's Accept header, and the headers the instance's request interceptor
 * adds — Authorization when a token is stored, and X-Locale from the active
 * language ("bypass" under /admin). X-Locale is not cosmetic: the menu
 * endpoint localizes its response by it.
 *
 * The outcome is axios's too: only a 2xx status resolves. Any other status, or
 * a network failure, rejects with axios's message ("Request failed with status
 * code 404", "Network Error") and `response: { status, data }`, so the
 * callers' catch blocks see what they saw before. The body is parsed as axios
 * parses it: JSON when it is JSON, otherwise the text as it came.
 *
 * Left out on purpose, and why that changes nothing for the callers: the
 * response interceptor's duplicate-link feedback acts only under /admin, and
 * its 401 handling (clear the token, redirect to /login) cannot trigger —
 * GET /currency/rates and GET /menus/:key are registered ahead of the API's
 * `protect` middleware and never answer 401. Keep this helper to endpoints
 * like those; authenticated calls belong to the axios clients.
 */
export class PublicApiError extends Error {
  code: string;
  response?: { status: number; data: unknown };

  constructor(message: string, code: string, response?: { status: number; data: unknown }) {
    super(message);
    this.name = 'PublicApiError';
    this.code = code;
    this.response = response;
  }
}

/** The headers axios sent: its default Accept, plus the request interceptor's. */
function requestHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json, text/plain, */*' };
  // The interceptor adds nothing during server rendering.
  if (typeof window === 'undefined') return headers;

  let token: string | null = null;
  try {
    token = window.localStorage.getItem('authToken');
  } catch {
    token = null;
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  if (window.location.pathname.includes('/admin')) {
    headers['X-Locale'] = 'bypass';
  } else if (i18n.language) {
    headers['X-Locale'] = i18n.language;
  }
  return headers;
}

/** axios's default response transform: JSON when the body parses, the text otherwise. */
function parseBody(text: string): unknown {
  if (!text) return text;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function publicGet<T = any>(path: string): Promise<T> {
  let status: number;
  let text: string;
  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: requestHeaders(),
      credentials: 'include',
    });
    status = response.status;
    text = await response.text();
  } catch {
    throw new PublicApiError('Network Error', 'ERR_NETWORK');
  }

  const data = parseBody(text);
  if (status < 200 || status >= 300) {
    throw new PublicApiError(
      `Request failed with status code ${status}`,
      status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST',
      { status, data }
    );
  }
  return data as T;
}
