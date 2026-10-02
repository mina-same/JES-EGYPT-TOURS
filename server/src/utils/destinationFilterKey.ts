/** Permanent, untranslated visitor filter identity. Never use a MongoDB ID here. */
export const DESTINATION_FILTER_KEY = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const OBJECT_ID = /^[a-f\d]{24}$/i;

export function normalizeDestinationFilterKey(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const key = value.trim().toLowerCase();
  return DESTINATION_FILTER_KEY.test(key) && !OBJECT_ID.test(key) ? key : null;
}

/** Used only when a new document is created or by the one-time backfill. */
export function initialDestinationFilterKey(englishSlug: unknown): string | null {
  return normalizeDestinationFilterKey(englishSlug);
}
