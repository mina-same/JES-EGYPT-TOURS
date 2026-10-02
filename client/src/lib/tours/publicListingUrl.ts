import { catalog } from './catalog';

/** The only browser URL contract for visitor Tour listings. API field names stay internal. */
export const PUBLIC_LISTING_KEYS = [
  'q', 'destinations', 'duration', 'tourType', 'tourStyles',
  'minPrice', 'maxPrice', 'sort', 'page',
] as const;
export type PublicListingKey = (typeof PUBLIC_LISTING_KEYS)[number];
export const PUBLIC_SORTS = ['recommended', 'price-asc', 'price-desc', 'duration-asc', 'duration-desc'] as const;
export type PublicSort = (typeof PUBLIC_SORTS)[number];
export type PublicListingState = {
  q: string;
  destinations: string;
  duration: string;
  tourType: string;
  tourStyles: string;
  minPrice: string;
  maxPrice: string;
  sort: PublicSort;
  page: number;
};

export const EMPTY_PUBLIC_LISTING: PublicListingState = {
  q: '', destinations: '', duration: '', tourType: '', tourStyles: '',
  minPrice: '', maxPrice: '', sort: 'recommended', page: 1,
};

export const PUBLIC_SORT_TO_API: Record<PublicSort, string> = {
  recommended: 'recommended',
  'price-asc': 'priceStartingFrom',
  'price-desc': '-priceStartingFrom',
  'duration-asc': 'durationHours',
  'duration-desc': '-durationHours',
};

const TRACKING_KEYS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'gclid', 'fbclid', 'msclkid',
]);
const DESTINATION_KEY = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const OBJECT_ID = /^[a-f\d]{24}$/i;
const orderedValues = (value: string, allowed?: readonly string[]): string => {
  const values = [...new Set(value.split(',').map(part => part.trim().toLowerCase()).filter(Boolean))];
  return (allowed ? allowed.filter(id => values.includes(id)) : values.sort()).join(',');
};

export function normalizePublicListingState(input: Partial<PublicListingState>): PublicListingState {
  const state = { ...EMPTY_PUBLIC_LISTING, ...input };
  return {
    ...state,
    q: state.q.trim(),
    destinations: orderedValues(state.destinations),
    duration: orderedValues(state.duration, Object.keys(catalog.durations)),
    tourType: orderedValues(state.tourType, Object.keys(catalog.types)),
    tourStyles: orderedValues(state.tourStyles, Object.keys(catalog.styles)),
    minPrice: state.minPrice.trim() ? String(Number(state.minPrice)) : '',
    maxPrice: state.maxPrice.trim() ? String(Number(state.maxPrice)) : '',
    page: state.page,
  };
}

const encode = (value: string) => encodeURIComponent(value).replace(/%2C/gi, ',');
export function serializePublicListingState(input: Partial<PublicListingState>): string {
  const state = normalizePublicListingState(input);
  const values: Record<PublicListingKey, string> = {
    q: state.q,
    destinations: state.destinations,
    duration: state.duration,
    tourType: state.tourType,
    tourStyles: state.tourStyles,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
    sort: state.sort === 'recommended' ? '' : state.sort,
    page: state.page === 1 ? '' : String(state.page),
  };
  const parts = PUBLIC_LISTING_KEYS.filter(key => values[key]).map(key => `${key}=${encode(values[key])}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

export function publicListingUrl(path: string, state: Partial<PublicListingState>): string {
  return `${path}${serializePublicListingState(state)}`;
}

export type PublicListingParse = {
  state: PublicListingState;
  normalizedSearch: string;
  redirectSearch: string;
  isUtility: boolean;
  error?: string;
};

function toParams(input: URLSearchParams | Record<string, string | string[] | undefined>): URLSearchParams {
  if (input instanceof URLSearchParams) return input;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) value.forEach(item => params.append(key, item));
    else if (value !== undefined) params.append(key, value);
  }
  return params;
}

export function parsePublicListingQuery(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
  options: { destinationKeys?: readonly string[]; allowBlogKeys?: boolean } = {},
): PublicListingParse {
  const params = toParams(input);
  const tracking = new URLSearchParams();
  const extras = new URLSearchParams();
  const raw: Record<string, string> = {};
  for (const [key, value] of params) {
    if (TRACKING_KEYS.has(key.toLowerCase())) { tracking.append(key, value); continue; }
    if (options.allowBlogKeys && (key === 'blogSubCategory' || key === 'blogPage')) {
      if (extras.has(key)) return { state: EMPTY_PUBLIC_LISTING, normalizedSearch: '', redirectSearch: '', isUtility: true, error: `Duplicate ${key}` };
      extras.set(key, value);
      continue;
    }
    if (!(PUBLIC_LISTING_KEYS as readonly string[]).includes(key)) {
      return { state: EMPTY_PUBLIC_LISTING, normalizedSearch: '', redirectSearch: '', isUtility: false, error: `Unknown parameter: ${key}` };
    }
    if (Object.hasOwn(raw, key)) {
      return { state: EMPTY_PUBLIC_LISTING, normalizedSearch: '', redirectSearch: '', isUtility: false, error: `Duplicate ${key}` };
    }
    raw[key] = value;
  }
  const fail = (error: string): PublicListingParse => ({ state: EMPTY_PUBLIC_LISTING, normalizedSearch: '', redirectSearch: '', isUtility: false, error });
  const multi = (key: 'destinations' | 'duration' | 'tourType' | 'tourStyles', allowed?: readonly string[]) => {
    const value = raw[key] || '';
    if (value.length > 2000) throw new Error(`Invalid ${key}`);
    const parts = value.split(',').map(part => part.trim().toLowerCase()).filter(Boolean);
    if (parts.length > 100 || parts.some(part => allowed ? !allowed.includes(part) : !DESTINATION_KEY.test(part) || OBJECT_ID.test(part))) {
      throw new Error(`Invalid ${key}`);
    }
    if (key === 'destinations' && options.destinationKeys && parts.some(part => !options.destinationKeys!.includes(part))) {
      throw new Error('Unknown destination');
    }
    return orderedValues(value, allowed);
  };
  try {
    const rawPage = raw.page;
    if (rawPage !== undefined && (!/^[0-9]+$/.test(rawPage) || !Number.isSafeInteger(Number(rawPage)) || Number(rawPage) < 1)) return fail('Invalid page');
    const rawSort = (raw.sort || 'recommended').toLowerCase();
    if (!(PUBLIC_SORTS as readonly string[]).includes(rawSort)) return fail('Invalid sort');
    const price = (key: 'minPrice' | 'maxPrice') => {
      const value = (raw[key] || '').trim();
      if (!value) return '';
      if (!/^(?:\d+)(?:\.\d+)?$/.test(value) || !Number.isFinite(Number(value)) || Number(value) > Number.MAX_SAFE_INTEGER) throw new Error(`Invalid ${key}`);
      return String(Number(value));
    };
    const minPrice = price('minPrice');
    const maxPrice = price('maxPrice');
    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) return fail('Invalid price range');
    const q = (raw.q || '').trim();
    if (q.length > 100) return fail('Invalid q');
    const state: PublicListingState = {
      q, destinations: multi('destinations'), duration: multi('duration', Object.keys(catalog.durations)),
      tourType: multi('tourType', Object.keys(catalog.types)), tourStyles: multi('tourStyles', Object.keys(catalog.styles)),
      minPrice, maxPrice, sort: rawSort as PublicSort, page: rawPage === undefined ? 1 : Number(rawPage),
    };
    const normalizedSearch = serializePublicListingState(state);
    const extraPairs = [...extras, ...tracking].map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    const redirectSearch = [normalizedSearch.replace(/^\?/, ''), ...extraPairs].filter(Boolean).join('&');
    return {
      state, normalizedSearch,
      redirectSearch: redirectSearch ? `?${redirectSearch}` : '',
      isUtility: Boolean(q || state.destinations || state.duration || state.tourType || state.tourStyles || minPrice || maxPrice || state.sort !== 'recommended'),
    };
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Invalid listing query');
  }
}

export function shouldRedirectPublicQuery(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
  parsed: PublicListingParse,
): boolean {
  if (parsed.error) return false;
  const current = toParams(input).toString().replace(/%2C/gi, ',').replace(/\+/g, '%20');
  return current !== parsed.redirectSearch.replace(/^\?/, '').replace(/%2C/gi, ',');
}
