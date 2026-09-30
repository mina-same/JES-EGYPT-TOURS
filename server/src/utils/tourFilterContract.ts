import { Types } from 'mongoose';
import catalog from '../config/tourFilters.json';
import { TourQueryValidationError } from './tourQuery';

export function parseFilterIds(value: unknown, allowed?: string[]): string[] {
  if (value === undefined || value === '') return [];
  if (typeof value !== 'string' || value.length > 2000) throw new TourQueryValidationError('Invalid filter values');
  const values = [...new Set(value.split(',').map(id => id.trim()).filter(Boolean))].sort();
  if (values.length > 100 || values.some(id => allowed ? !allowed.includes(id) : !/^[a-f\d]{24}$/i.test(id))) {
    throw new TourQueryValidationError('Unknown filter value');
  }
  return values;
}

export function structuredTourFilters(query: { tourType?: string; tourStyles?: string; destinations?: string; durationRange?: string }) {
  const filter: Record<string, unknown> = {};
  const types = parseFilterIds(query.tourType, Object.keys(catalog.types));
  if (types.length) filter.tourType = types.length === 1 ? types[0] : { $in: types };
  const styles = parseFilterIds(query.tourStyles, Object.keys(catalog.styles));
  if (styles.length) filter.tourStyles = { $in: styles };
  const destinations = parseFilterIds(query.destinations);
  if (destinations.length) filter.destinations = { $in: destinations.map(id => new Types.ObjectId(id)) };
  const ranges = parseFilterIds(query.durationRange, Object.keys(catalog.durations));
  if (ranges.length) filter.$and = [{ $or: ranges.map(id => {
    const range = catalog.durations[id as keyof typeof catalog.durations];
    return { durationHours: { $gt: range.minExclusive, ...(range.maxInclusive === null ? {} : { $lte: range.maxInclusive }) } };
  }) }];
  return filter;
}
