import { catalog, catalogOptions, type FilterOption } from './catalog';

export const splitFilterValues = (value = '') => [...new Set(value.split(',').map(v => v.trim()).filter(Boolean))].sort();
type StructuredValues = { tourType?: string; tourStyles?: string; durationRange?: string; destinations?: string };
/** Check destination membership only after scope options have loaded. */
export function sanitizeTourFilters<T extends StructuredValues>(values: T, destinations?: FilterOption[]): T {
  const next = { ...values };
  const allowed = { tourType: catalog.types, tourStyles: catalog.styles, durationRange: catalog.durations };
  for (const key of Object.keys(allowed) as (keyof typeof allowed)[]) {
    if (typeof values[key] === 'string') next[key] = splitFilterValues(values[key]).filter(id => Object.hasOwn(allowed[key], id)).join(',');
  }
  if (typeof values.destinations === 'string') next.destinations = splitFilterValues(values.destinations).filter(id =>
    /^[a-f\d]{24}$/i.test(id) && (!destinations || destinations.some(option => option.id === id))
  ).join(',');
  return next;
}

export function tourFilterChips(values: object, destinations: FilterOption[], locale: string, currencySymbol: string,
  t: (key: string, options?: Record<string, unknown>) => string) {
  return Object.entries(values).flatMap(([key, value]) => {
    if (typeof value !== 'string' || !value) return [];
    const options = key === 'tourType' ? catalogOptions('types', locale)
      : key === 'tourStyles' ? catalogOptions('styles', locale)
      : key === 'destinations' ? destinations
      : key === 'durationRange' ? Object.keys(catalog.durations).map(id => ({ id, label: t(`filters.durationRanges.${id}`) })) : undefined;
    if (options) {
      const selected = splitFilterValues(value);
      return selected.flatMap(id => {
        const option = options.find(item => item.id === id);
        return option ? [{ key, id, label: option.label, remaining: selected.filter(item => item !== id).join(',') }] : [];
      });
    }
    if (key === 'minPrice' || key === 'maxPrice') {
      const price = Number(value);
      if (!Number.isFinite(price) || price < 0) return [];
      const amount = `${currencySymbol}${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(price)}`;
      return [{ key, id: value, label: t(key === 'minPrice' ? 'filters.priceFrom' : 'filters.priceUpTo', { amount }), remaining: '' }];
    }
    return ['search', 'q'].includes(key) ? [{ key, id: value, label: t('filters.searchValue', { value }), remaining: '' }] : [];
  });
}
