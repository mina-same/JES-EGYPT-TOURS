'use client';
import { catalogOptions, type FilterOption } from '@/lib/tours/catalog';
import { splitFilterValues } from './StructuredFilters';

export default function FilterChips({ values, destinations, locale, t, remove }: {
  values: object;
  destinations: FilterOption[];
  locale: string;
  t: (key: string) => string;
  remove: (key: string, remaining: string) => void;
}) {
  const labels = [...catalogOptions('types', locale), ...catalogOptions('styles', locale), ...destinations];
  return <>{Object.entries(values).filter(([key, value]) => value && !['sort', 'blogSubCategory'].includes(key)).flatMap(([key, value]) => {
    const multi = ['tourStyles', 'destinations', 'durationRange'].includes(key);
    const selected = multi ? splitFilterValues(value) : [value!];
    return selected.map(id => {
      const label = key === 'durationRange' ? t(`filters.durationRanges.${id}`)
        : labels.find(option => option.id === id)?.label || id;
      return <button key={`${key}-${id}`} type="button" className="btn btn-sm btn-outline-secondary rounded-pill"
        aria-label={`${t('filters.remove')} ${label}`}
        onClick={() => remove(key, multi ? selected.filter(item => item !== id).join(',') : '')}>
        {label} <span aria-hidden="true">×</span>
      </button>;
    });
  })}</>;
}
