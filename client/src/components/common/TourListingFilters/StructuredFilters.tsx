'use client';
import { useId, useState } from 'react';
import { catalog, type FilterOption } from '@/lib/tours/catalog';

import { splitFilterValues } from '@/lib/tours/filterValues';
export { splitFilterValues } from '@/lib/tours/filterValues';
export function StructuredFilters({ values, update, destinations, types, styles, t, part = 'all' }: {
  values: { destinations?: string; durationRange?: string; tourType: string; tourStyles: string };
  update: (patch: Partial<typeof values>) => void;
  destinations: FilterOption[]; types: FilterOption[]; styles: FilterOption[];
  t: (key: string) => string;
  part?: 'all' | 'places-duration' | 'type-styles';
}) {
  const [placeQuery, setPlaceQuery] = useState('');
  const [showAllPlaces, setShowAllPlaces] = useState(false);
  const placesId = useId();
  const longPlaces = destinations.length > 8;
  const matchingPlaces = destinations.filter(option => option.label.toLocaleLowerCase().includes(placeQuery.trim().toLocaleLowerCase()));
  const visiblePlaces = longPlaces && !showAllPlaces && !placeQuery.trim() ? matchingPlaces.slice(0, 8) : matchingPlaces;
  const multi = (field: 'destinations' | 'durationRange' | 'tourStyles' | 'tourType', options: FilterOption[]) => options.length === 0 || (field === 'tourType' && options.length === 1 && !values.tourType) ? null : (
    <fieldset className="visitor-filter-group" key={field}>
      <legend>{t(`filters.${field}`)}</legend>
      {field === 'destinations' && longPlaces && <div className="mb-2">
        <label htmlFor={placesId}>{t('filters.searchPlaces')}</label>
        <input id={placesId} type="search" className="form-control" value={placeQuery} onChange={event => setPlaceQuery(event.target.value)} />
      </div>}
      <div id={field === 'destinations' ? `${placesId}-options` : undefined} className="visitor-filter-options">
        {(field === 'destinations' ? visiblePlaces : options).map(option => <label key={option.id} className="visitor-filter-option">
          <input type="checkbox" checked={splitFilterValues(values[field]).includes(option.id)} onChange={e => {
            const selected = splitFilterValues(values[field]);
            update({ [field]: (e.target.checked ? [...selected, option.id] : selected.filter(v => v !== option.id)).sort().join(',') });
          }} />{option.label}
        </label>)}
      </div>
      {field === 'destinations' && longPlaces && !placeQuery.trim() && <button type="button" className="btn btn-link px-0" aria-expanded={showAllPlaces} aria-controls={`${placesId}-options`} onClick={() => setShowAllPlaces(value => !value)}>{t(showAllPlaces ? 'filters.showLess' : 'filters.showMore')}</button>}
      {field === 'destinations' && visiblePlaces.length === 0 && <p role="status">{t('filters.noPlaces')}</p>}
    </fieldset>
  );
  return <>
    {part !== 'type-styles' && multi('destinations', destinations)}
    {part !== 'type-styles' && multi('durationRange', Object.keys(catalog.durations).map(key => ({ id: key, label: t(`filters.durationRanges.${key}`) })))}
    {part !== 'places-duration' && multi('tourType', types)}
    {part !== 'places-duration' && multi('tourStyles', styles)}
  </>;
}
