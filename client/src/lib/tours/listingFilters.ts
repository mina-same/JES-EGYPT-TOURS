export interface TourFilterValues {
  search: string;
  minPrice: string;
  maxPrice: string;
  tourType: string;
  tourStyle: string;
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
  tourStyle: '',
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
    tourStyle: params?.get('tourStyle') || '',
  };

  if (includeSubcategory) filters.subcategoryId = params?.get('subcategory') || '';

  return {
    page,
    sort: params?.get('sort') || '-createdAt',
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

export const countActiveTourFilters = (filters: TourFilterValues): number =>
  Object.values(filters).filter((value) => typeof value === 'string' && value.trim()).length;

