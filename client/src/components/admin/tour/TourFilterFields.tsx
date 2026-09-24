'use client';

import { useEffect, useState } from 'react';
import { catalogOptions } from '@/lib/tours/catalog';
import { getAllDestinations, type Destination } from '@/lib/api/destination';

export default function TourFilterFields({ value, onChange }: {
  value: { tourType?: string; tourStyles?: string[]; destinations?: string[]; durationHours?: number | null; recommendedOrder?: number | null };
  onChange: (field: string, value: unknown) => void;
}) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [error, setError] = useState('');
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
    fetchAll().catch(() => { if (!cancelled) setError('Could not load destinations. Reload to try again.'); });
    return () => { cancelled = true; };
  }, []);
  const toggle = (field: 'tourStyles' | 'destinations', id: string) => {
    const current = value[field] || [];
    onChange(field, current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  };
  return <section className="rounded-lg border p-5 space-y-4" aria-labelledby="tour-classification-title">
    <h2 id="tour-classification-title" className="font-semibold">Tour classification and listing order</h2>
    <label className="block">Tour Type
      <select className="block border rounded p-2 w-full" value={value.tourType || ''} onChange={e => onChange('tourType', e.target.value)}>
        <option value="">Not classified — review required</option>
        {catalogOptions('types').map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </label>
    <fieldset><legend>Tour Styles — select all that apply</legend>
      <div className="flex flex-wrap gap-4">{catalogOptions('styles').map(o => <label key={o.id} className="flex gap-2 items-center">
        <input type="checkbox" checked={value.tourStyles?.includes(o.id) || false} onChange={() => toggle('tourStyles', o.id)} />{o.label}
      </label>)}</div>
    </fieldset>
    <fieldset><legend>Places Visited</legend>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-4">{destinations.map(d => <label key={d._id} className="flex gap-2 items-center">
        <input type="checkbox" checked={value.destinations?.includes(d._id) || false} onChange={() => toggle('destinations', d._id)} />
        {d.shortName?.en || (typeof d.name === 'string' ? d.name : d.name.en)}
      </label>)}</div>
    </fieldset>
    <label className="block">Duration in hours (days × 24 for multi-day trips)
      <input type="number" min="0.01" step="any" className="block border rounded p-2" value={value.durationHours ?? ''} onChange={e => onChange('durationHours', e.target.value === '' ? null : Number(e.target.value))} />
    </label>
    <label className="block">Recommended order (lower numbers appear first)
      <input type="number" min="0" step="1" className="block border rounded p-2" value={value.recommendedOrder ?? ''} onChange={e => onChange('recommendedOrder', e.target.value === '' ? null : Number(e.target.value))} />
    </label>
    {(!value.tourType || !value.tourStyles?.length || !value.destinations?.length || !value.durationHours) &&
      <p className="text-amber-700">Some filter information is missing. Review the original content and fill it in; missing values will not match those filters.</p>}
  </section>;
}
