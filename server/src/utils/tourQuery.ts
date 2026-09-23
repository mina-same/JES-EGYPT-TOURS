import type { FilterQuery } from 'mongoose';
import type { ITour } from '../models/Tour';

export const TOUR_LOCALES = ['en', 'de', 'it', 'es'] as const;
export type TourLocale = (typeof TOUR_LOCALES)[number];

export const TOUR_CURRENCIES = ['USD', 'EUR', 'GBP'] as const;
export type TourCurrency = (typeof TOUR_CURRENCIES)[number];

export class TourQueryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TourQueryValidationError';
  }
}

export const toTourLocale = (value: unknown): TourLocale =>
  typeof value === 'string' && TOUR_LOCALES.includes(value as TourLocale)
    ? (value as TourLocale)
    : 'en';

export const toTourCurrency = (value: unknown): TourCurrency =>
  typeof value === 'string' && TOUR_CURRENCIES.includes(value as TourCurrency)
    ? (value as TourCurrency)
    : 'USD';

export const escapeSearchPattern = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const exactLocalizedValueFilter = (
  field: 'tourType' | 'tourStyle',
  locale: TourLocale,
  value: string
): Record<string, { $regex: string; $options: 'i' }> => ({
  [`${field}.${locale}`]: {
    $regex: `^${escapeSearchPattern(value.trim())}$`,
    $options: 'i',
  },
});

export const parseTourPagination = (pageValue?: string, limitValue?: string) => {
  const parsedPage = Number(pageValue ?? 1);
  const parsedLimit = Number(limitValue ?? 10);

  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = Number.isInteger(parsedLimit) && parsedLimit > 0
    ? Math.min(parsedLimit, 100)
    : 10;

  return { page, limit, skip: (page - 1) * limit };
};

const parseOptionalPrice = (value: string | undefined, label: string): number | undefined => {
  if (value === undefined || value.trim() === '') return undefined;

  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) {
    throw new TourQueryValidationError(`${label} must be a non-negative number`);
  }
  return price;
};

export const applyStartingPriceFilter = (
  filter: FilterQuery<ITour>,
  minValue: string | undefined,
  maxValue: string | undefined,
  currency: TourCurrency,
  conversionRate = 1
): void => {
  const minPrice = parseOptionalPrice(minValue, 'minPrice');
  const maxPrice = parseOptionalPrice(maxValue, 'maxPrice');

  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new TourQueryValidationError('minPrice cannot be greater than maxPrice');
  }

  if (minPrice === undefined && maxPrice === undefined) return;

  if (currency === 'USD') {
    const range: { $gte?: number; $lte?: number } = {};
    if (minPrice !== undefined) range.$gte = minPrice;
    if (maxPrice !== undefined) range.$lte = maxPrice;
    filter['priceStartingFrom.USD'] = range;
    return;
  }

  const price = effectiveStartingPriceExpression(currency, conversionRate);
  const comparisons: Record<string, unknown>[] = [];
  if (minPrice !== undefined) comparisons.push({ $gte: [price, minPrice] });
  if (maxPrice !== undefined) comparisons.push({ $lte: [price, maxPrice] });
  (filter as FilterQuery<ITour> & { $expr?: unknown }).$expr =
    comparisons.length === 1 ? comparisons[0] : { $and: comparisons };
};

/** Exact currency prices win; otherwise mirror CurrencyContext and convert USD. */
export const effectiveStartingPriceExpression = (
  currency: TourCurrency,
  conversionRate = 1
): Record<string, unknown> | string =>
  currency === 'USD'
    ? '$priceStartingFrom.USD'
    : {
        $ifNull: [
          `$priceStartingFrom.${currency}`,
          { $multiply: ['$priceStartingFrom.USD', conversionRate] },
        ],
      };

export const parseTourSort = (
  sortParam: string | undefined,
  locale: TourLocale,
  currency: TourCurrency
): string => {
  if (!sortParam) return '-createdAt';

  const descending = sortParam.startsWith('-');
  const requested = descending ? sortParam.slice(1) : sortParam;
  const [field, explicitLocale, extra] = requested.split('.');

  if (extra) return '-createdAt';

  let target: string;
  switch (field) {
    case 'createdAt':
    case 'updatedAt':
      if (explicitLocale) return '-createdAt';
      target = field;
      break;
    case 'heading':
    case 'tourLocation': {
      if (explicitLocale && !TOUR_LOCALES.includes(explicitLocale as TourLocale)) {
        return '-createdAt';
      }
      target = `${field}.${explicitLocale || locale}`;
      break;
    }
    case 'priceStartingFrom':
      if (explicitLocale) return '-createdAt';
      target = `priceStartingFrom.${currency}`;
      break;
    default:
      return '-createdAt';
  }

  return descending ? `-${target}` : target;
};

export const PUBLIC_TOUR_LIST_FIELDS = new Set([
  'heading', 'name', 'slug', 'images', 'gallery', 'cardDescription',
  'Description', 'tourLocation', 'duration', 'priceStartingFrom',
  'subcategory', 'category', 'tourType', 'tourStyle', 'specialOfferDiscount',
  'isActive', 'isFeatured', 'scheduledAt', 'createdAt', 'updatedAt', 'reviews.url',
]);

export const parseTourFields = (
  fieldsParam: string | undefined,
  allowAdminFields: boolean
): string => {
  if (!fieldsParam) return '';

  const fields = fieldsParam
    .split(',')
    .map((field) => field.trim())
    .filter(Boolean);

  if (allowAdminFields) return fields.join(' ');
  return fields.filter((field) => PUBLIC_TOUR_LIST_FIELDS.has(field)).join(' ');
};
