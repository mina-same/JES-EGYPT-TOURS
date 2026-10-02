'use client';

import { useCallback, useEffect, useState } from 'react';
import { destinationAPI } from '@/lib/api/blogAdmin';
import {
  describeFeaturedDestination,
  type FeaturedDestinationOption,
} from '@/lib/admin/featuredDestinations';

/**
 * Resolves saved featured-destination ids to names for an editor. `known` are
 * the documents it already holds; every other id is looked up in the Admin's
 * authenticated destination list (the public list leaves drafts out), loaded
 * once when the editor opens.
 */
export function useFeaturedDestinationLookup(known: readonly FeaturedDestinationOption[]) {
  const [loaded, setLoaded] = useState<FeaturedDestinationOption[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      const items: FeaturedDestinationOption[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const result = await destinationAPI.getAll({ page, limit: 100 });
        items.push(...(result.data || []));
        totalPages = result.totalPages ?? 1;
        page++;
      } while (page <= totalPages);
      return items;
    }
    fetchAll()
      .then((items) => { if (!cancelled) setLoaded(items); })
      .catch(() => { if (!cancelled) setLoaded([]); });
    return () => { cancelled = true; };
  }, []);
  return useCallback((id: string) => describeFeaturedDestination(id, known, loaded), [known, loaded]);
}
