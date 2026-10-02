'use client';
import type { FilterOption } from '@/lib/tours/catalog';
import { tourFilterChips } from '@/lib/tours/filterValues';

export default function FilterChips({ values, destinations, locale, currencySymbol, t, remove }: {
  values: object;
  destinations: FilterOption[];
  locale: string;
  currencySymbol: string;
  t: (key: string, options?: Record<string, unknown>) => string;
  remove: (key: string, remaining: string) => void;
}) {
  return <>{tourFilterChips(values, destinations, locale, currencySymbol, t).map(chip =>
    <button key={chip.key + '-' + chip.id} type="button" className="visitor-filter-chip btn btn-sm btn-outline-secondary rounded-pill"
      aria-label={t('filters.remove') + ' ' + chip.label} onClick={() => remove(chip.key, chip.remaining)}>
      {chip.label} <span aria-hidden="true">&times;</span>
    </button>
  )}</>;
}
