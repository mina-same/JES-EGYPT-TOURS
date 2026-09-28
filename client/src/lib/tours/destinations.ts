import { getLocalizedValue } from '../localize';
import type { ILocalizedString } from '@/types/tour';

export interface TourDestination {
  _id?: string;
  id?: string;
  name?: string | ILocalizedString;
  shortName?: string | ILocalizedString;
}

/** Display records only: unresolved reference IDs must never become labels. */
export function tourDestinationNames(destinations: unknown, locale = 'en'): string[] {
  if (!Array.isArray(destinations)) return [];
  return destinations.flatMap((destination: TourDestination | null) => {
    if (!destination || typeof destination !== 'object') return [];
    const short = typeof destination.shortName === 'string'
      ? destination.shortName : (destination.shortName as Record<string, string> | undefined)?.[locale];
    const name = short?.trim() || getLocalizedValue(destination.name, locale);
    return typeof name === 'string' && name.trim() ? [name.trim()] : [];
  });
}

export function formatTourDestinations(destinations: unknown, locale = 'en'): string {
  const language = ['en', 'de', 'it', 'es'].includes(locale) ? locale : 'en';
  return new Intl.ListFormat(language, { style: 'short', type: 'conjunction' })
    .format(tourDestinationNames(destinations, language));
}

/** Admin reads may be populated; writes always contain reference IDs. */
export function tourDestinationIds(destinations: unknown): string[] {
  if (!Array.isArray(destinations)) return [];
  return [...new Set(destinations.flatMap((destination) => {
    const id = typeof destination === 'string' ? destination : destination?._id || destination?.id;
    return typeof id === 'string' && id ? [id] : [];
  }))];
}
