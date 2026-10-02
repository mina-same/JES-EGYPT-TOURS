'use client';
import { Search } from 'lucide-react';

export default function TourEmptyState({ filtered, emptyText, clear, t }: {
  filtered: boolean; emptyText: string; clear: () => void; t: (key: string) => string;
}) {
  return <div className="visitor-tour-empty" role="status">
    {filtered && <span className="visitor-tour-empty-icon"><Search size={24} strokeWidth={1.5} aria-hidden="true" /></span>}
    <p className="visitor-tour-empty-title">{filtered ? t('listing.noMatchingTours') : emptyText}</p>
    {filtered && <>
      <p className="visitor-tour-empty-help">{t('listing.adjustFiltersHelp')}</p>
      <button type="button" className="visitor-tour-empty-reset" onClick={clear}>{t('filters.clearFilters')}</button>
    </>}
  </div>;
}
