'use client';

import { useId } from 'react';

export default function TourSort({ value, onChange, t }: {
  value: string; onChange: (value: string) => void; t: (key: string) => string;
}) {
  const id = useId();
  return <div className="visitor-sort">
    <label htmlFor={id}>{t('listing.sortBy')}</label>
    <select id={id} value={value} onChange={event => onChange(event.target.value)}>
      <option value="recommended">{t('listing.sortOptions.recommended')}</option>
      <option value="priceStartingFrom">{t('listing.sortOptions.priceAsc')}</option>
      <option value="-priceStartingFrom">{t('listing.sortOptions.priceDesc')}</option>
      <option value="durationHours">{t('listing.sortOptions.durationAsc')}</option>
      <option value="-durationHours">{t('listing.sortOptions.durationDesc')}</option>
    </select>
  </div>;
}
