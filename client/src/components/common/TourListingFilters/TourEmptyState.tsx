'use client';

export default function TourEmptyState({ filtered, emptyText, clear, t }: {
  filtered: boolean; emptyText: string; clear: () => void; t: (key: string) => string;
}) {
  return <div className="text-center py-5 w-100" role="status">
    <p>{filtered ? t('listing.noMatchingTours') : emptyText}</p>
    {filtered && <button type="button" className="btn btn-outline-dark" onClick={clear}>{t('filters.clearFilters')}</button>}
  </div>;
}
