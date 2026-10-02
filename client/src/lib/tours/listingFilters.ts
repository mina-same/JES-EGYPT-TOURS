import {
  parsePublicListingQuery, publicListingUrl, PUBLIC_SORT_TO_API,
  type PublicListingState, type PublicSort,
} from './publicListingUrl';

export interface TourFilterValues {
  search: string;
  minPrice: string;
  maxPrice: string;
  tourType: string;
  tourStyles: string;
  destinations: string;
  durationRange: string;
}

export interface TourListingState {
  page: number;
  sort: PublicSort;
  filters: TourFilterValues;
}

type SearchParamsReader = {
  get(name: string): string | null;
};

export const EMPTY_TOUR_FILTERS: TourFilterValues = {
  search: '',
  minPrice: '',
  maxPrice: '',
  tourType: '',
  tourStyles: '', destinations: '', durationRange: '',
};

export const readTourListingState = (
  params: SearchParamsReader | null | undefined,
): TourListingState => {
  const parsed = parsePublicListingQuery(new URLSearchParams(
    ['q', 'destinations', 'duration', 'tourType', 'tourStyles', 'minPrice', 'maxPrice', 'sort', 'page']
      .flatMap(key => params?.get(key) === null || params?.get(key) === undefined ? [] : [[key, params!.get(key)!] as [string, string]]),
  ));
  const state = parsed.state;
  const filters: TourFilterValues = {
    search: state.q,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
    tourType: state.tourType,
    tourStyles: state.tourStyles,
    destinations: state.destinations,
    durationRange: state.duration,
  };
  return {
    page: state.page,
    sort: state.sort,
    filters,
  };
};

export function toPublicListingState(filters: TourFilterValues, sort: PublicSort, page: number): PublicListingState {
  return {
    q: filters.search,
    destinations: filters.destinations,
    duration: filters.durationRange,
    tourType: filters.tourType,
    tourStyles: filters.tourStyles,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sort,
    page,
  };
}

export function buildTourListingUrl(path: string, filters: TourFilterValues, sort: PublicSort, page: number): string {
  return publicListingUrl(path, toPublicListingState(filters, sort, page));
}

export const apiTourSort = (sort: PublicSort) => PUBLIC_SORT_TO_API[sort];

export const validateTourPriceRange = (
  minValue: string,
  maxValue: string
): 'invalid' | 'range' | null => {
  const parse = (value: string): number | undefined => {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    return /^\d+(?:\.\d+)?$/.test(value.trim()) && Number.isFinite(parsed) && parsed >= 0 && parsed <= Number.MAX_SAFE_INTEGER ? parsed : Number.NaN;
  };

  const min = parse(minValue);
  const max = parse(maxValue);
  if (Number.isNaN(min) || Number.isNaN(max)) return 'invalid';
  if (min !== undefined && max !== undefined && min > max) return 'range';
  return null;
};

export const countActiveTourFilters = (filters: Partial<TourFilterValues> & { q?: string }): number =>
  (['search', 'q', 'minPrice', 'maxPrice', 'tourType', 'tourStyles', 'destinations', 'durationRange'] as const)
    .filter(key => typeof filters[key] === 'string' && filters[key]?.trim()).length;

