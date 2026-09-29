'use client';
import { useId } from 'react';
import { catalog, type FilterOption } from '@/lib/tours/catalog';

export const splitFilterValues = (value = '') => [...new Set(value.split(',').map(v => v.trim()).filter(Boolean))].sort();
export function StructuredFilters({ values, update, destinations, types, styles, t, part = 'all' }: {
  values: { destinations?: string; durationRange?: string; tourType: string; tourStyles: string };
  update: (patch: Partial<typeof values>) => void;
  destinations: FilterOption[]; types: FilterOption[]; styles: FilterOption[];
  t: (key: string) => string;
  part?: 'all' | 'places-duration' | 'type-styles';
}) {
  const id = useId();
  const multi = (field: 'destinations' | 'durationRange' | 'tourStyles', options: FilterOption[]) => (
    <fieldset className="mb-3" key={field}>
      <legend style={{ fontSize: 14, fontWeight: 700 }}>{t(`filters.${field}`)}</legend>
      <div style={{ maxHeight: 220, overflowY: 'auto', display: 'grid', gap: 8 }}>
        {options.map(option => <label key={option.id} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 32 }}>
          <input type="checkbox" checked={splitFilterValues(values[field]).includes(option.id)} onChange={e => {
            const selected = splitFilterValues(values[field]);
            update({ [field]: (e.target.checked ? [...selected, option.id] : selected.filter(v => v !== option.id)).sort().join(',') });
          }} />{option.label}
        </label>)}
      </div>
      <small className="text-muted">{t(field === 'durationRange' ? 'filters.durationHelp' : 'filters.anySelected')}</small>
    </fieldset>
  );
  return <>
    {part !== 'type-styles' && multi('destinations', destinations)}
    {part !== 'type-styles' && multi('durationRange', Object.keys(catalog.durations).map(key => ({ id: key, label: t(`filters.durationRanges.${key}`) })))}
    {part !== 'places-duration' && <div className="mb-3">
      <label htmlFor={`${id}-type`} className="form-label">{t('filters.tourType')}</label>
      <select id={`${id}-type`} className="form-select" value={values.tourType} onChange={e => update({ tourType: e.target.value })}>
        <option value="">{t('filters.all')}</option>
        {types.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </div>}
    {part !== 'places-duration' && multi('tourStyles', styles)}
  </>;
}
