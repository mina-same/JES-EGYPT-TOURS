/**
 * Loads what the tour page shows below the tour itself: the editor's curated
 * related tours, the "More Tours" fallback list and the related articles.
 *
 * Kept free of imports - the API calls are passed in - so the request order
 * and the fallback rules can be checked against fixtures without a browser.
 *
 * Request order:
 *  - Curated tours and curated articles start immediately, side by side.
 *  - "More Tours" walks subcategory -> category -> any tours, and each step
 *    runs ONLY if the list is still short after the previous one. Those steps
 *    stay sequential on purpose: running them together would fetch lists that
 *    are usually thrown away.
 *  - The featured-articles fallback depends on the curated articles alone, so
 *    it follows them directly instead of waiting for the whole "More Tours"
 *    chain, which used to add one full round trip to every tour page with no
 *    curated articles.
 */

/** Below this many "More Tours", the next, broader lookup runs. */
export const MORE_TOURS_TARGET = 9;

type ApiList = { success?: boolean; data?: unknown } | null | undefined;

export interface TourRelatedContentApi {
  getToursByIds: (ids: string[]) => Promise<ApiList>;
  getBlogsByIds: (ids: string[], locale: string) => Promise<unknown[]>;
  // The response bodies are read as `res.success` without a null check, as the
  // tour API has always been: a missing body throws and ends the lookup.
  getToursBySubcategory: (
    subcategoryId: string,
    params: { limit: number; isActive: boolean }
  ) => Promise<any>;
  getTours: (params: { category?: string; limit: number; isActive: boolean }) => Promise<any>;
  /** Resolves to the response body of the featured-posts endpoint. */
  getFeaturedBlogs: (limit: number) => Promise<ApiList>;
}

export interface TourRelatedContent {
  /** Curated related tours, raw, in the editor's order. */
  relatedTours: any[];
  /** "More Tours" candidates, raw, de-duplicated, in fallback order. */
  moreTours: any[];
  /** Curated articles, or the featured fallback when there are none. */
  relatedBlogs: any[];
}

const safeArray = <T,>(value: any): T[] => (Array.isArray(value) ? value : []);

const getTourId = (value: any): string => {
  if (typeof value === 'string') return value;
  const valueId = value?.id ?? value?._id;
  return valueId == null ? '' : String(valueId);
};

export async function loadTourRelatedContent(
  tour: any,
  locale: string,
  api: TourRelatedContentApi,
  featuredBlogsLimit: number
): Promise<TourRelatedContent> {
  const tourId = tour._id;
  const curatedRelatedTourIds = new Set(
    safeArray<any>(tour.relatedTours).map(getTourId).filter(Boolean)
  );
  const excludedMoreTourIds = new Set([
    ...(tourId ? [String(tourId)] : []),
    ...curatedRelatedTourIds,
  ]);
  const isEligibleMoreTour = (candidate: any) => {
    const candidateId = getTourId(candidate);
    return Boolean(candidateId) && !excludedMoreTourIds.has(candidateId);
  };

  // The subcategory object often contains the category ID.
  const subId = typeof tour.subcategory === 'object'
    ? tour.subcategory?._id || tour.subcategory
    : tour.subcategory;
  const catId = typeof tour.subcategory === 'object' && tour.subcategory?.category
    ? (typeof tour.subcategory.category === 'object' ? tour.subcategory.category._id : tour.subcategory.category)
    : undefined;

  // Resolve every curated tour in one request. Rebuild the array in the
  // admin-selected order because MongoDB's `$in` query does not preserve it.
  const relatedToursPromise = (async () => {
    const selectedIds = Array.from(curatedRelatedTourIds);
    if (selectedIds.length === 0) return [];
    try {
      const res = await api.getToursByIds(selectedIds);
      if (!res?.success || !res?.data) return [];
      const toursById = new Map(
        safeArray<any>(res.data)
          .filter((relatedTour) => relatedTour?.isActive !== false)
          .map((relatedTour) => [getTourId(relatedTour), relatedTour])
      );
      return selectedIds
        .map((selectedId) => toursById.get(selectedId))
        .filter(Boolean);
    } catch {
      return [];
    }
  })();

  // Resolve every curated article in one request, in the editor's order. The
  // language travels with the request so /de, /it and /es receive localized
  // cards rather than English ones. With none curated (or none resolved), fall
  // back to featured articles - as soon as that is known.
  const relatedBlogsPromise = (async () => {
    const selectedBlogIds = safeArray<any>(tour.blogReferences)
      .map((ref) => String(ref?.id || ''))
      .filter(Boolean);
    let curated: unknown[];
    try {
      curated = await api.getBlogsByIds(selectedBlogIds, locale);
    } catch {
      curated = [];
    }
    let blogs = safeArray<any>(curated).filter(Boolean);
    if (blogs.length === 0) {
      try {
        const res = await api.getFeaturedBlogs(featuredBlogsLimit);
        if (res?.success) blogs = safeArray(res.data);
      } catch { /* ignore */ }
    }
    return blogs;
  })();

  // "More Tours": subcategory, then category, then anything.
  //
  // Own try/catch on purpose. These lookups feed ONE decorative carousel, so a
  // failure leaves just that section empty, and whatever was collected before
  // the throw is still used.
  const moreTours: any[] = [];
  try {
    const mergeUnique = (candidates: any[]) => {
      const existingIds = new Set(moreTours.map(getTourId).filter(Boolean));
      candidates.filter(isEligibleMoreTour).forEach((candidate) => {
        const candidateId = getTourId(candidate);
        if (candidateId && !existingIds.has(candidateId)) {
          moreTours.push(candidate);
          existingIds.add(candidateId);
        }
      });
    };

    const subRes = subId
      ? await api.getToursBySubcategory(String(subId), { limit: 12, isActive: true })
      : { success: false, data: [] };
    if (subRes.success) mergeUnique(safeArray<any>(subRes.data));

    if (moreTours.length < MORE_TOURS_TARGET && catId) {
      const catRes = await api.getTours({ category: String(catId), limit: 15, isActive: true });
      if (catRes.success) mergeUnique(safeArray<any>(catRes.data));
    }

    if (moreTours.length < MORE_TOURS_TARGET) {
      const anyRes = await api.getTours({ limit: 15, isActive: true });
      if (anyRes.success) mergeUnique(safeArray<any>(anyRes.data));
    }
  } catch (moreToursError) {
    console.warn('useTourData: "more tours" lookup failed; hiding that section only', moreToursError);
  }

  const [relatedTours, relatedBlogs] = await Promise.all([relatedToursPromise, relatedBlogsPromise]);
  return { relatedTours: safeArray(relatedTours).filter(Boolean), moreTours, relatedBlogs };
}
