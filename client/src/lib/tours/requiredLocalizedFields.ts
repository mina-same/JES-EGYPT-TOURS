import type { RequiredLocalizedField } from '@/lib/localeCompleteness';

/**
 * Fields a tour's language badges count even when blank in every language.
 *
 * Shared by the admin tours list and the tour view page so both give the same
 * verdict. The card description is required as it is for articles, even though
 * the tour card falls back to the overview when it is empty. The label matches
 * the tour form's field so a gap named in the tooltip can be found in the
 * editor.
 */
export const TOUR_REQUIRED_LOCALIZED_FIELDS: readonly RequiredLocalizedField[] = [
  {
    path: 'cardDescription',
    label: 'Card Description (tour listings)',
  },
];
