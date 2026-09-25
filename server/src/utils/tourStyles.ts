import catalog from '../config/tourFilters.json';

export type TourStyleId = keyof typeof catalog.styles;

/** Write contract: exact stable IDs only; never coerce prose or drop duplicates. */
export function validTourStyles(value: unknown): value is TourStyleId[] {
  return Array.isArray(value) && value.every(id =>
    typeof id === 'string' && Object.hasOwnProperty.call(catalog.styles, id)) &&
    new Set(value).size === value.length;
}
