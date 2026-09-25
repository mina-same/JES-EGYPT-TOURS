'use client';

import { catalogOptions, type TourStyleId } from '@/lib/tours/catalog';

export default function TourStyleSelect({ value = [], onChange }: {
  value?: TourStyleId[];
  onChange: (styles: TourStyleId[]) => void;
}) {
  return <fieldset aria-describedby="tour-styles-help">
    <legend className="font-medium mb-2">Tour Styles</legend>
    <div className="flex flex-wrap gap-2">
      {catalogOptions('styles').map(option => {
        const id = option.id as TourStyleId;
        const selected = value.includes(id);
        return <button key={id} type="button" aria-pressed={selected}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${selected ? 'border-amber-600 bg-amber-100 text-amber-950' : 'border-gray-300 bg-white text-gray-700 hover:border-amber-500'}`}
          onClick={() => onChange(selected ? value.filter(item => item !== id) : [...value, id])}>
          {option.label}{selected && <span aria-hidden="true"> ✓</span>}
        </button>;
      })}
    </div>
    <p id="tour-styles-help" className="mt-2 text-sm text-gray-600">Select all that apply. One selection applies to every language.</p>
    {!value.length && <p role="status" className="mt-2 text-sm font-medium text-amber-800">Needs manual review — choose the correct Tour Styles. No default style is assigned.</p>}
  </fieldset>;
}
