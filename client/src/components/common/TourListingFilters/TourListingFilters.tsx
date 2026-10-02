'use client';

import { useId, type Dispatch, type FocusEvent, type FormEvent, type SetStateAction } from 'react';
import type { FilterOption } from '@/lib/tours/catalog';
import { StructuredFilters } from './StructuredFilters';
import type { TourFilterValues } from '@/lib/tours/listingFilters';
import { validateTourPriceRange } from '@/lib/tours/listingFilters';
import './visitorFilters.css';

interface TourListingFiltersProps {
  t: (key: string) => string;
  draftFilters: TourFilterValues;
  setDraftFilters: Dispatch<SetStateAction<TourFilterValues>>;
  subcategories?: any[];
  locale: string;
  tourTypeOptions: FilterOption[];
  destinationOptions: FilterOption[];
  tourStyleOptions: FilterOption[];
  handleApplyFilters: () => void;
  handleResetFilters: () => void;
  currencySymbol?: string;
  validationError?: string | null;
  noBorder?: boolean;
  hideHeader?: boolean;
  fullHeight?: boolean;
  hideSearch?: boolean;
}

export default function TourListingFilters({
  t,
  draftFilters,
  setDraftFilters,
  destinationOptions,
  tourTypeOptions,
  tourStyleOptions,
  handleApplyFilters,
  handleResetFilters,
  currencySymbol = '$',
  validationError,
  noBorder = false,
  hideHeader = false,
  fullHeight = false,
  hideSearch = false,
}: TourListingFiltersProps) {
  const id = useId();
  const fieldId = (name: string) => `${id}-${name}`;
  const update = (patch: Partial<TourFilterValues>) =>
    setDraftFilters((previous) => ({ ...previous, ...patch }));
  const revealFocusedControl = (event: FocusEvent<HTMLFormElement>) => {
    if (fullHeight || !window.matchMedia('(min-width: 992px)').matches) return;
    const actions = event.currentTarget.querySelector('.visitor-filter-actions');
    if (!actions || actions.contains(event.target)) return;
    const target = event.target.closest('.visitor-filter-option') || event.target;
    const controlBounds = target.getBoundingClientRect();
    const actionBounds = actions.getBoundingClientRect();
    // Native focus scrolling does not account for a sticky sibling footer.
    if (controlBounds.bottom > actionBounds.top && controlBounds.top < actionBounds.bottom) {
      target.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    handleApplyFilters();
    if (validateTourPriceRange(draftFilters.minPrice, draftFilters.maxPrice)) {
      const invalidName = validateTourPriceRange('', draftFilters.maxPrice) && !validateTourPriceRange(draftFilters.minPrice, '') ? 'maxPrice' : 'minPrice';
      const input = event.currentTarget.querySelector<HTMLInputElement>(`[id="${fieldId(invalidName)}"]`);
      requestAnimationFrame(() => {
        input?.focus({ preventScroll: true });
        input?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    }
  };

  return (
    <form
      onSubmit={submit}
      onFocusCapture={revealFocusedControl}
      noValidate
      className={`listing__sidebar__item__inner visitor-filters ${fullHeight ? 'visitor-filters--drawer' : 'visitor-filters--page'}`}
      style={{
        borderRadius: noBorder ? 0 : 14,
        border: noBorder ? 'none' : '1px solid #eee',
        background: noBorder ? 'transparent' : '#fff',
        height: fullHeight ? '100%' : 'auto',
        display: fullHeight ? 'flex' : 'block',
        flexDirection: 'column',
      }}
    >
      {!hideHeader && <div className="visitor-filter-heading">{t('filters.title')}</div>}

      <div className="visitor-filter-content" style={{ minHeight: 0, overflowY: fullHeight ? 'auto' : undefined, flex: fullHeight ? 1 : 'none' }}>
        {!hideSearch && <div className="visitor-filter-group">
          <label htmlFor={fieldId('search')} className="form-label" style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t('filters.search')}</label>
          <input id={fieldId('search')} type="search" className="form-control rounded-3" style={{ padding: '10px 15px' }} value={draftFilters.search} onChange={(event) => update({ search: event.target.value })} placeholder={t('filters.searchPlaceholder')} />
        </div>}

        <StructuredFilters values={draftFilters} update={update} destinations={destinationOptions} types={tourTypeOptions} styles={tourStyleOptions} t={t} part="places-duration" />
        <fieldset className="visitor-filter-group visitor-filter-price">
          <legend>{t('filters.price')}</legend>
          <div className="row g-2 align-items-end">
          {(['minPrice', 'maxPrice'] as const).map((name) => (
            <div className="col-6" key={name}>
              <label htmlFor={fieldId(name)} className="form-label" style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t(`filters.${name}`)}</label>
              <div className="input-group visitor-price-input">
                <span className="input-group-text bg-white border-end-0" aria-hidden="true">{currencySymbol}</span>
                <input
                  id={fieldId(name)}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  className="form-control border-start-0 rounded-end-3"
                  style={{ padding: 10 }}
                  value={draftFilters[name]}
                  onChange={(event) => update({ [name]: event.target.value })}
                  placeholder={t(name === 'minPrice' ? 'filters.minPlaceholder' : 'filters.maxPlaceholder')}
                  aria-invalid={Boolean(validationError)}
                  aria-describedby={validationError ? fieldId('price-error') : undefined}
                />
              </div>
            </div>
          ))}
        </div>

        {validationError && <p id={fieldId('price-error')} className="text-danger mb-0" role="alert" style={{ fontSize: 13 }}>{validationError}</p>}
        </fieldset>

        <StructuredFilters values={draftFilters} update={update} destinations={destinationOptions} types={tourTypeOptions} styles={tourStyleOptions} t={t} part="type-styles" />
      </div>

      <div className="visitor-filter-actions">
        <button type="submit" className="gotur-btn visitor-filter-apply">{t('filters.applyLabel')}</button>
        <button type="button" onClick={handleResetFilters} className="visitor-filter-reset">{t('filters.reset')}</button>
      </div>
    </form>
  );
}
