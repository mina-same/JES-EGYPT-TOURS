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
 * the code every visitor page downloads. The visitor's tour reads (./tour.ts),
 * the home intro's fallback read (./generalContent.ts) and the tour page's
 * featured articles come through here for the same reason. Routes whose own
 * components still use an axios-based client (the booking form, the login
 * page) still load it.
 *
 * The request is the one axios sent: the same URL and query string, cookies
 * (withCredentials), axios's Accept header, the call's own headers, and the
 * headers the instance's request interceptor adds — Authorization when a token
 * is stored, and X-Locale from the active language ("bypass" under /admin).
 * X-Locale is not cosmetic: the API localizes its response by it.
 *
 * The outcome is axios's too: only a 2xx status resolves. Any other status, or
 * a network failure, rejects with axios's message ("Request failed with status
 * code 404", "Network Error") and `response: { status, data }`, so the
 * callers' catch blocks see what they saw before. An aborted request rejects
 * with axios's code for it, `ERR_CANCELED`, which the listing views test for.
 * The body is parsed as axios parses it: JSON when it is JSON, otherwise the
 * text as it came.
 *
 * Left out on purpose, and why that changes nothing for the callers: the
 * response interceptor's duplicate-link feedback acts only under /admin, and
 * its 401 handling (clear the token, redirect to /login) cannot trigger — the
 * endpoints read through here are registered without the API's `protect`
 * middleware, or with `optionalProtect`, which lets a missing or invalid token
 * through, and never answer 401. Keep this helper to endpoints like those;
 * authenticated calls belong to the axios clients.
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

export interface PublicGetOptions {
  /** The query, serialized as axios serializes `params`. */
  params?: object;
  /** This call's headers. The interceptor's headers win over them, as in ./axios.ts. */
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/** The headers axios sent: its default Accept, the call's own, then the request interceptor's. */
function requestHeaders(own?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json, text/plain, */*', ...own };
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

/** axios's query encoding: percent-encoded, with ":", "$" and "," left readable and a space as "+". */
function encodeQueryPart(value: string): string {
  return encodeURIComponent(value)
    .replace(/%3A/gi, ':')
    .replace(/%24/g, '$')
    .replace(/%2C/gi, ',')
    .replace(/%20/g, '+');
}

const isNested = (value: unknown): boolean =>
  Array.isArray(value) || Object.prototype.toString.call(value) === '[object Object]';

/**
 * The URL with `params` appended as axios appends them: undefined and null
 * are left out, a Date goes as its ISO string, a top-level array of plain
 * values repeats its key as `key[]`, and anything nested is written
 * `key[sub]`.
 */
function withQuery(url: string, params?: object): string {
  if (!params) return url;

  const pairs: string[] = [];
  const add = (key: string, value: unknown, topLevel: boolean): void => {
    if (value === undefined || value === null) return;
    if (value instanceof Date) {
      pairs.push(`${encodeQueryPart(key)}=${encodeQueryPart(value.toISOString())}`);
    } else if (Array.isArray(value)) {
      const flat = topLevel && !value.some(isNested);
      value.forEach((item, index) => add(flat ? `${key}[]` : `${key}[${index}]`, item, false));
    } else if (isNested(value)) {
      for (const [name, item] of Object.entries(value as object)) add(`${key}[${name}]`, item, false);
    } else {
      pairs.push(`${encodeQueryPart(key)}=${encodeQueryPart(String(value))}`);
    }
  };
  for (const [key, value] of Object.entries(params)) add(key.trim(), value, true);

  if (pairs.length === 0) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${pairs.join('&')}`;
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

export async function publicGet<T = any>(path: string, options: PublicGetOptions = {}): Promise<T> {
  const { params, headers, signal } = options;
  let status: number;
  let text: string;
  try {
    const response = await fetch(withQuery(`${API_URL}${path}`, params), {
      headers: requestHeaders(headers),
      credentials: 'include',
      signal,
    });
    status = response.status;
    text = await response.text();
  } catch {
    if (signal?.aborted) throw new PublicApiError('canceled', 'ERR_CANCELED');
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
