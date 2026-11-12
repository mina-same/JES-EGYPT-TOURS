/**
 * Every destination an Admin list asks for, however many there are.
 *
 * GET /api/destinations is paginated and answers 10 rows when the request
 * names no `limit`. The article editors and the articles list used to ask once
 * without one, so every destination past the tenth by English name (Sharm El
 * Sheikh, Siwa Oasis, "Visit Giza…") was missing from their pickers. This walks
 * the pages instead, as the tour editor's Places Visited picker already does.
 *
 * `getPage` is the caller's request (destinationAPI.getAll in the Admin) and
 * `filters` go out unchanged with every page.
 */
export type DestinationPage<T> = {
  success?: boolean;
  data?: T[];
  totalPages?: number;
};

export type DestinationPageRequest = { page: number; limit: number; sort: string };

/** Rows per request — today's whole list fits in one. */
export const DESTINATION_PAGE_SIZE = 100;

/**
 * Pages only hold together under a total order: English name first (the
 * order the pickers have always shown), then id for any two equal names.
 */
export const DESTINATION_LIST_SORT = 'name.en _id';

/** Stops the walk if an answer never reaches its last page. */
const MAX_PAGES = 100;

export async function fetchAllDestinations<T, F extends object>(
  getPage: (params: F & DestinationPageRequest) => Promise<DestinationPage<T>>,
  filters: F
): Promise<{ success: boolean; data: T[] }> {
  const data: T[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await getPage({ ...filters, page, limit: DESTINATION_PAGE_SIZE, sort: DESTINATION_LIST_SORT });
    // A page that fails fails the list: a short list would hide destinations
    // as quietly as the single request did.
    if (!result?.success) return { success: false, data: [] };

    const rows = Array.isArray(result.data) ? result.data : [];
    for (const row of rows) {
      const id = (row as { _id?: unknown } | null)?._id;
      const key = id == null ? '' : String(id);
      if (key && seen.has(key)) continue;
      if (key) seen.add(key);
      data.push(row);
    }

    if (rows.length === 0 || page >= (result.totalPages ?? 1)) break;
  }

  return { success: true, data };
}
