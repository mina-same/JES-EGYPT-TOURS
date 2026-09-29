import catalog from '../config/tourFilters.json';

export function validTourType(value: unknown): value is keyof typeof catalog.types {
  return typeof value === 'string' && Object.hasOwnProperty.call(catalog.types, value);
}
/** A Tour Type is replaced as one scalar, never patched as localized leaves. */
export function hasNestedTourType(fields: Record<string, unknown>): boolean {
  return Object.keys(fields).some(key => key.startsWith('tourType.'));
}
