import { getLocalizedValue } from '@/lib/localize';

/**
 * Featured destinations in the four category/subcategory editors.
 *
 * A draft destination may be featured: the public category reads leave it out
 * until its page is published. The editor only needs to see which ones are
 * drafts, so the label says so in text (not by colour alone), and a saved
 * reference is always shown by name, never as a database id.
 */
export interface FeaturedDestinationOption {
  _id: string;
  name?: string | Record<string, string>;
  status?: string;
  coverImage?: { url?: string };
}

export const LOADING_DESTINATION_LABEL = 'Loading saved destination...';
export const UNAVAILABLE_DESTINATION_LABEL = 'Saved destination (unavailable)';

/** "Cairo", or "Abu Simbel (Draft)" for a destination whose page is not published. */
export function destinationLabel(destination: FeaturedDestinationOption): string {
  // Admin reads may carry the stored object or a localized string.
  const localized = destination.name as Parameters<typeof getLocalizedValue>[0];
  const name = String(getLocalizedValue(localized, 'en') || '').trim() || 'Untitled';
  return destination.status === 'draft' ? `${name} (Draft)` : name;
}

export interface FeaturedDestinationView {
  label: string;
  destination?: FeaturedDestinationOption;
  state: 'resolved' | 'loading' | 'unavailable';
}

/**
 * How one saved reference is shown. `known` are destination documents already
 * at hand (the record's populated references, picks from the search), and
 * `loaded` is the Admin's full list, null while it loads. Until the list
 * arrives an unknown id reads as loading; afterwards, one that matches nothing
 * (deleted, or the list failed to load) reads as unavailable. The reference
 * itself stays in the form either way.
 */
export function describeFeaturedDestination(
  id: string,
  known: readonly FeaturedDestinationOption[],
  loaded: readonly FeaturedDestinationOption[] | null
): FeaturedDestinationView {
  const destination = known.find((item) => item._id === id) ?? loaded?.find((item) => item._id === id);
  if (destination) return { label: destinationLabel(destination), destination, state: 'resolved' };
  return loaded === null
    ? { label: LOADING_DESTINATION_LABEL, state: 'loading' }
    : { label: UNAVAILABLE_DESTINATION_LABEL, state: 'unavailable' };
}
