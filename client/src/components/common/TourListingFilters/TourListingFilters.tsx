'use client';

import { Filter } from 'lucide-react';
import { useId, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import { getDisplayName } from '@/lib/displayName';
import type { TourFilterValues } from '@/lib/tours/listingFilters';

interface TourListingFiltersProps {
  t: (key: string) => string;
  draftFilters: TourFilterValues;
  setDraftFilters: Dispatch<SetStateAction<TourFilterValues>>;
  subcategories?: any[];
  locale: string;
  tourTypeOptions: string[];
  tourStyleOptions: string[];
  handleApplyFilters: () => void;
  handleResetFilters: () => void;
  currencySymbol?: string;
  validationError?: string | null;
  noBorder?: boolean;
  hideHeader?: boolean;
  fullHeight?: boolean;
}

export default function TourListingFilters({
  t,
  draftFilters,
  setDraftFilters,
  subcategories,
  locale,
  tourTypeOptions,
  tourStyleOptions,
  handleApplyFilters,
  handleResetFilters,
  currencySymbol = '$',
  validationError,
  noBorder = false,
  hideHeader = false,
  fullHeight = false,
}: TourListingFiltersProps) {
  const id = useId();
  const fieldId = (name: string) => `${id}-${name}`;
  const update = (patch: Partial<TourFilterValues>) =>
    setDraftFilters((previous) => ({ ...previous, ...patch }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    handleApplyFilters();
  };

  return (
    <form
      onSubmit={submit}
      className="listing__sidebar__item__inner"
      style={{
        borderRadius: noBorder ? 0 : 14,
        border: noBorder ? 'none' : '1px solid #eee',
        background: noBorder ? 'transparent' : '#fff',
        height: fullHeight ? '100%' : 'auto',
        display: fullHeight ? 'flex' : 'block',
        flexDirection: 'column',
      }}
    >
      {!hideHeader && (
        <div
          style={{ padding: noBorder ? '0 0 18px 0' : 18, borderBottom: '1px solid #f0f0f0' }}
          className="d-flex justify-content-between align-items-center"
        >
          <span className="listing__sidebar__title" style={{ margin: 0, fontSize: noBorder ? 22 : 18, fontWeight: 800, color: '#1d231f', display: 'block' }}>
            {t('filters.title')}
          </span>
          <Filter className="w-5 h-5 text-[#b79c5c]" aria-hidden="true" />
        </div>
      )}

      <div style={{ padding: noBorder ? (hideHeader ? '10px 20px 24px' : '24px 20px') : 18, display: 'grid', gap: 14, flex: fullHeight ? 1 : 'none' }}>
        <div>
          <label htmlFor={fieldId('search')} className="form-label" style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t('filters.search')}</label>
          <input id={fieldId('search')} type="search" className="form-control rounded-3" style={{ padding: '10px 15px' }} value={draftFilters.search} onChange={(event) => update({ search: event.target.value })} placeholder={t('filters.searchPlaceholder')} />
        </div>

        {subcategories && (
          <div>
            <label htmlFor={fieldId('subcategory')} className="form-label" style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t('filters.subcategory')}</label>
            <select id={fieldId('subcategory')} className="form-select rounded-3" style={{ padding: 10 }} value={draftFilters.subcategoryId || ''} onChange={(event) => update({ subcategoryId: event.target.value })}>
              <option value="">{t('filters.all')}</option>
              {subcategories.map((subcategory) => <option key={subcategory._id} value={subcategory._id}>{getDisplayName(subcategory, locale)}</option>)}
            </select>
          </div>
        )}

        <div className="row g-2 align-items-end">
          {(['minPrice', 'maxPrice'] as const).map((name) => (
            <div className="col-6" key={name}>
              <label htmlFor={fieldId(name)} className="form-label" style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t(`filters.${name}`)}</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0" aria-hidden="true">{currencySymbol}</span>
                <input
                  id={fieldId(name)}
                  type="number"
                  min="0"
                  step="any"
                  className="form-control border-start-0 rounded-end-3"
                  style={{ padding: 10 }}
                  value={draftFilters[name]}
                  onChange={(event) => update({ [name]: event.target.value })}
                  placeholder={name === 'minPrice' ? '0' : '9999'}
                  aria-invalid={Boolean(validationError)}
                  aria-describedby={validationError ? fieldId('price-error') : undefined}
                />
              </div>
            </div>
          ))}
        </div>

        {validationError && <p id={fieldId('price-error')} className="text-danger mb-0" role="alert" style={{ fontSize: 13 }}>{validationError}</p>}

        <div>
          <label htmlFor={fieldId('tour-type')} className="form-label" style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t('filters.tourType')}</label>
          <select id={fieldId('tour-type')} className="form-select rounded-3" style={{ padding: 10 }} value={draftFilters.tourType} onChange={(event) => update({ tourType: event.target.value })}>
            <option value="">{t('filters.all')}</option>
            {tourTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor={fieldId('tour-style')} className="form-label" style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t('filters.tourStyle')}</label>
          <select id={fieldId('tour-style')} className="form-select rounded-3" style={{ padding: 10 }} value={draftFilters.tourStyle} onChange={(event) => update({ tourStyle: event.target.value })}>
            <option value="">{t('filters.all')}</option>
            {tourStyleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
      </div>

      <div style={{ padding: noBorder ? '24px 20px' : 18, borderTop: '1px solid #f0f0f0', marginTop: 'auto' }}>
        <div className="row g-2">
          <div className="col-6"><button type="submit" className="gotur-btn" style={{ width: '100%', borderRadius: 10 }}>{t('filters.apply')}</button></div>
          <div className="col-6"><button type="button" onClick={handleResetFilters} className="gotur-btn" style={{ width: '100%', background: 'transparent', color: '#111', border: '1px solid #e5e5e5', borderRadius: 10 }}>{t('filters.reset')}</button></div>
        </div>
      </div>
    </form>
  );
}
