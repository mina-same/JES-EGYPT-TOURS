'use client';

import { useEffect, useId, useState } from 'react';
import Select from 'react-select';
import { catalogOptions } from '@/lib/tours/catalog';
import type { TourStyleId } from '@/lib/tours/catalog';
import TourStyleSelect from './TourStyleSelect';
import { getAllDestinations, type Destination } from '@/lib/api/destination';

export default function TourFilterFields({ value, onChange }: {
  value: { tourType?: string; tourStyles?: TourStyleId[]; destinations?: string[]; durationHours?: number | null; recommendedOrder?: number | null };
  onChange: (field: string, value: unknown) => void;
}) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const id = useId();
  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      const items: Destination[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const result = await getAllDestinations({ page, limit: 100 });
        items.push(...result.data);
        totalPages = result.totalPages;
        page++;
      } while (page <= totalPages);
      if (!cancelled) setDestinations(items);
    }
    fetchAll().catch(() => { if (!cancelled) setError('Could not load destinations. Reload to try again.'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  const options = destinations.map(d => ({ value: d._id, label: d.shortName?.en || (typeof d.name === 'string' ? d.name : d.name.en) }));
  // Keep unresolved saved IDs selected, including when the request fails.
  const selected = (value.destinations || []).map(saved => options.find(o => o.value === saved) || { value: saved, label: loading ? 'Loading saved destination...' : 'Saved destination (unavailable)' });
  const missing = [!value.tourType && 'Tour Type', !value.destinations?.length && 'Places Visited', !(Number(value.durationHours) > 0) && 'Duration (in Tour Details)'].filter(Boolean);
  return <section className="rounded-lg border p-5 space-y-6" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`} className="font-semibold text-lg">Tour Classification</h2>
    <fieldset aria-describedby={!value.tourType ? `${id}-type-help` : undefined}>
      <legend className="font-medium mb-2">Tour Type *</legend>
      <div className="flex flex-wrap gap-2">
        {catalogOptions('types').map(option => <label key={option.id} className="cursor-pointer">
          <input className="peer sr-only" type="radio" name={`${id}-type`} value={option.id} checked={value.tourType === option.id} onChange={() => onChange('tourType', option.id)} />
          <span className="inline-flex min-h-11 items-center rounded-full border border-gray-300 px-4 py-2 text-sm peer-checked:border-amber-600 peer-checked:bg-amber-100 peer-checked:text-amber-950 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-500 peer-focus-visible:ring-offset-2">{option.label}</span>
        </label>)}
      </div>
      {!value.tourType && <p id={`${id}-type-help`} className="mt-2 text-sm text-amber-800">Select a tour type.</p>}
    </fieldset>
    <TourStyleSelect value={value.tourStyles} onChange={styles => onChange('tourStyles', styles)} />
    <div className="min-w-0">
      <label htmlFor={`${id}-places`} className="block font-medium mb-2">Places Visited *</label>
      <Select<{ value: string; label: string }, true>
        instanceId={`${id}-places`} inputId={`${id}-places`} isMulti isSearchable
        options={options} value={selected} isLoading={loading} closeMenuOnSelect={false}
        placeholder="Search destinations..." noOptionsMessage={() => 'No destinations found'}
        onChange={items => onChange('destinations', items.map(item => item.value))}
        aria-describedby={error ? `${id}-places-error` : !selected.length ? `${id}-places-help` : undefined}
        maxMenuHeight={220}
        styles={{
          control: (base, state) => ({ ...base, minHeight: 44, borderColor: state.isFocused ? '#b79c5c' : base.borderColor, boxShadow: state.isFocused ? '0 0 0 1px #b79c5c' : 'none' }),
          menu: base => ({ ...base, zIndex: 30 }),
          option: base => ({ ...base, minHeight: 44, overflowWrap: 'anywhere' }),
          multiValue: base => ({ ...base, maxWidth: '100%', backgroundColor: '#fef3c7' }),
          multiValueLabel: base => ({ ...base, whiteSpace: 'normal', overflowWrap: 'anywhere' }),
          multiValueRemove: base => ({ ...base, minWidth: 44, minHeight: 44, justifyContent: 'center' }),
        }}
      />
      {error && <p id={`${id}-places-error`} role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
      {!selected.length && <p id={`${id}-places-help`} className="mt-2 text-sm text-amber-800">Select the destinations this tour visits.</p>}
    </div>
    <details className="border-t pt-4">
      <summary className="cursor-pointer py-2 font-medium focus-visible:outline-amber-600">Advanced listing options</summary>
      <div className="mt-3 space-y-2">
        <label htmlFor={`${id}-order`} className="block text-sm font-medium">Recommended position</label>
        <input id={`${id}-order`} type="number" min="0" step="1" aria-describedby={`${id}-order-help`} className="block min-h-11 w-full max-w-xs border rounded p-2" value={value.recommendedOrder ?? ''} onChange={e => onChange('recommendedOrder', e.target.value === '' ? null : Number(e.target.value))} />
        <p id={`${id}-order-help`} className="text-sm text-gray-600">Leave empty for automatic ordering. Lower numbers appear first.</p>
      </div>
    </details>
    {missing.length > 0 && <div role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
      <p>Complete {missing.length} {missing.length === 1 ? 'field' : 'fields'} to make this tour fully filterable:</p>
      <ul className="list-disc pl-5 mt-1">{missing.map(field => <li key={String(field)}>{field}</li>)}</ul>
    </div>}
  </section>;
}
