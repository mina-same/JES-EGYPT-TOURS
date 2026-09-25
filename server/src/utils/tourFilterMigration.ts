import catalog from '../config/tourFilters.json';
import { validTourStyles } from './tourStyles';

/** Only exact catalogue labels/IDs are deterministic; never split prose. */
export function exactCatalogId(value: unknown, group: 'types' | 'styles'): string | undefined {
  const text = typeof value === 'string' ? value : (value as { en?: string })?.en;
  if (!text?.trim()) return undefined;
  const normalized = text.trim().toLowerCase();
  return Object.entries(catalog[group]).find(([id, labels]) =>
    id === normalized || Object.values(labels).some(label => label.toLowerCase() === normalized))?.[0];
}
export function migrateDurationHours(value: unknown): number | undefined {
  const text = typeof value === 'string' ? value : (value as { en?: string })?.en;
  if (!text) return undefined;
  const hours = text.trim().match(/^(\d+(?:\.\d+)?)\s*hours?$/i);
  if (hours && Number(hours[1]) > 0) return Number(hours[1]);
  const days = text.trim().match(/^(\d+)\s*days?(?:\s*\/\s*\d+\s*nights?)?$/i);
  if (days && Number(days[1]) > 0) return Number(days[1]) * 24;
  return undefined;
}
export function planTourFilterMigration(tour: Record<string, any>) {
  const set: Record<string, unknown> = {};
  const unset: Record<string, ''> = {};
  const review: string[] = [];
  if (typeof tour.tourType !== 'string' || !Object.keys(catalog.types).includes(tour.tourType)) {
    const type = exactCatalogId(tour.tourType, 'types');
    if (type) set.tourType = type;
    else review.push('tourType');
  }
  // Style assignment and legacy cleanup are paused. Even an exact legacy label
  // needs an explicit Admin selection; titles/descriptions are never evidence.
  if (!validTourStyles(tour.tourStyles) || !tour.tourStyles.length) review.push('tourStyles');
  if (!(tour.durationHours > 0)) {
    const hours = migrateDurationHours(tour.duration);
    if (hours) set.durationHours = hours;
    else review.push('durationHours');
  }
  if (!tour.destinations?.length) review.push('destinations');
  return { set, unset, review };
}
