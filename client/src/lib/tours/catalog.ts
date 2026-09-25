import catalog from '../../../../server/src/config/tourFilters.json';

export { catalog };
/** Unknown/legacy values are not visitor-facing labels. */
export function tourStyleLabels(value: unknown, locale = 'en'): string[] {
  if (!Array.isArray(value)) return [];
  const selected = new Set(value);
  return catalogOptions('styles', locale).filter(option => selected.has(option.id)).map(option => option.label);
}
export type TourTypeId = keyof typeof catalog.types;
export type TourStyleId = keyof typeof catalog.styles;
export interface FilterOption { id: string; label: string }
export function catalogOptions(group: 'types' | 'styles', locale = 'en'): FilterOption[] {
  return Object.entries(catalog[group]).map(([id, labels]) => ({
    id, label: labels[locale as keyof typeof labels] || labels.en,
  }));
}
export function tourTypeLabel(value: unknown, locale = 'en'): string {
  if (typeof value === 'string') return catalogOptions('types', locale).find(o => o.id === value)?.label || '';
  if (value && typeof value === 'object') {
    const labels = value as Record<string, string>;
    return labels[locale] || labels.en || '';
  }
  return '';
}
