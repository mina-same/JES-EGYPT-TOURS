export interface TourFilterValues {
  search: string;
  minPrice: string;
  maxPrice: string;
  tourType: string;
  tourStyles: string;
  destinations: string;
  durationRange: string;
  subcategoryId?: string;
}

export interface TourListingState {
  page: number;
  sort: string;
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
  includeSubcategory = false
): TourListingState => {
  const requestedPage = Number(params?.get('page') || '1');
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const filters: TourFilterValues = {
    search: params?.get('search') || '',
    minPrice: params?.get('minPrice') || '',
    maxPrice: params?.get('maxPrice') || '',
    tourType: params?.get('tourType') || '',
    tourStyles: params?.get('tourStyles') || '',
    destinations: params?.get('destinations') || '',
    durationRange: params?.get('durationRange') || '',
  };

  if (includeSubcategory) filters.subcategoryId = params?.get('subcategory') || '';

  return {
    page,
    sort: params?.get('sort') || 'recommended',
    filters,
  };
};

export const validateTourPriceRange = (
  minValue: string,
  maxValue: string
): 'invalid' | 'range' | null => {
  const parse = (value: string): number | undefined => {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : Number.NaN;
  };

  const min = parse(minValue);
  const max = parse(maxValue);
  if (Number.isNaN(min) || Number.isNaN(max)) return 'invalid';
  if (min !== undefined && max !== undefined && min > max) return 'range';
  return null;
};

export const countActiveTourFilters = (filters: Partial<TourFilterValues> & { q?: string }): number =>
  (['search', 'q', 'minPrice', 'maxPrice', 'tourType', 'tourStyles', 'destinations', 'durationRange', 'subcategoryId'] as const)
    .filter(key => typeof filters[key] === 'string' && filters[key]?.trim()).length;

