import { Request, Response } from 'express';
import Tour from '../models/Tour';
import { FilterQuery, Types, isValidObjectId } from 'mongoose';
import { ITour, completeTourSeo, validateTourKindPlans } from '../models/Tour';
import { deriveStartingPrice, validatePricingCurrencyConsistency } from '../utils/startingPrice';
import { emitDashboardStatsUpdate } from '../realtime/socket';
import { localize, localizePreservingSlugs } from '../utils/localize';
import {
  parseFutureSchedule,
  PublishingValidationError,
} from '../utils/publishing';
import { createSearchRegex } from '../utils/search';
import { PERMISSIONS } from '../permissions';
import CurrencyConfig from '../models/CurrencyConfig';
import {
  applyStartingPriceFilter,
  effectiveStartingPriceExpression,
  exactLocalizedValueFilter,
  parseTourFields,
  parseTourPagination,
  parseTourSort,
  toTourCurrency,
  toTourLocale,
  TourQueryValidationError,
} from '../utils/tourQuery';

// ==================== INTERFACES ====================

interface QueryParams {
  subcategory?: string;
  category?: string;
  isActive?: string;
  /**
   * Admin-only opt-in: include deactivated / scheduled tours in the result.
   * Public callers MUST NOT send it — without it the list is active-only, so a
   * caller that forgets to filter can never leak unpublished tours.
   */
  includeInactive?: string;
  scheduled?: string;
  isFeatured?: string;
  isSpecialOffer?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  tourType?: string;
  tourStyle?: string;
  currency?: string;
  page?: string;
  limit?: string;
  sort?: string;
  fields?: string;
}

// ==================== HELPER FUNCTIONS ====================

// English is the only required slug. Remove blank optional locale keys so the
// sparse unique indexes do not treat an empty string as a real duplicate slug.
const stripEmptyLocalizedSlugs = (slug: any): void => {
  if (!slug || typeof slug !== 'object') return;
  for (const lang of ['de', 'it', 'es'] as const) {
    if (typeof slug[lang] === 'string' && slug[lang].trim() === '') {
      delete slug[lang];
    }
  }
};

/**
 * Build query filter from request parameters
 */
const canReadInactiveTours = (req: { user?: Request['user'] }): boolean => {
  const user = req.user;
  if (!user) return false;
  if (user.role === 'superadmin') return true;
  return Array.isArray(user.permissions) && user.permissions.includes(PERMISSIONS.TOUR_READ);
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

const DEFAULT_CURRENCY_RATES = { USD: 1, EUR: 0.92, GBP: 0.79 } as const;

const getTourCurrencyRate = async (currency: ReturnType<typeof toTourCurrency>): Promise<number> => {
  if (currency === 'USD') return 1;
  const config = await CurrencyConfig.findOne().select(`rates.${currency}`).lean();
  const rate = config?.rates?.[currency];
  return typeof rate === 'number' && Number.isFinite(rate) && rate > 0
    ? rate
    : DEFAULT_CURRENCY_RATES[currency];
};

const buildQueryFilter = async (
  queryParams: QueryParams,
  localeValue: unknown,
  allowInactive = false,
  currencyRate = 1
): Promise<FilterQuery<ITour>> => {
  const filter: FilterQuery<ITour> = {};
  const locale = toTourLocale(localeValue);
  const currency = toTourCurrency(queryParams.currency);
  const TourSubcategory = (await import('../models/TourSubcategory')).default;

  // Filter by subcategory
  if (queryParams.subcategory) {
    if (!isValidObjectId(queryParams.subcategory)) {
      throw new TourQueryValidationError('Invalid subcategory ID');
    }
    /*
     * Cast to ObjectId rather than leaving the raw string.
     *
     * `Tour.find()` and `countDocuments()` cast strings through the schema,
     * so a string worked everywhere the listing used the query builder. The
     * price-sorted listing does not use it — it runs an aggregation, and
     * `$match` inside a pipeline performs NO casting. A string id therefore
     * matched zero documents, while the parallel countDocuments() still
     * counted them: a subcategory page sorted by price returned an empty
     * list that claimed a non-zero total.
     *
     * The category branch below never had the bug because it assigns real
     * ObjectIds from a TourSubcategory lookup.
     */
    filter.subcategory = new Types.ObjectId(queryParams.subcategory);
  }

  // Filter by category (requires lookup through subcategory)
  if (queryParams.category) {
    if (!isValidObjectId(queryParams.category)) {
      throw new TourQueryValidationError('Invalid category ID');
    }
    const subcategories = await TourSubcategory.find({
      category: queryParams.category,
      ...(allowInactive ? {} : { isActive: { $ne: false } }),
    }).select('_id');
    const subcategoryIds = subcategories.map(sub => sub._id);
    if (queryParams.subcategory) {
      const belongsToCategory = subcategoryIds.some(
        (id) => String(id) === String(queryParams.subcategory)
      );
      filter.subcategory = belongsToCategory
        ? new Types.ObjectId(queryParams.subcategory)
        : { $in: [] };
    } else {
      filter.subcategory = { $in: subcategoryIds };
    }
  }

  // ── Visibility (secure by default) ──
  // Public callers always get ACTIVE tours only. Deactivated and scheduled
  // tours (scheduled ⇒ isActive === false) stay hidden even if the caller
  // forgot to pass a filter — this also keeps them out of the sitemap.
  // The admin panel opts in explicitly with includeInactive=true.
  const includeInactive = allowInactive && queryParams.includeInactive === 'true';

  if (!includeInactive) {
    filter.isActive = { $ne: false };
  } else {
    if (queryParams.isActive !== undefined) {
      filter.isActive = queryParams.isActive === 'true';
    }

    // `scheduled` only makes sense for the admin view: a scheduled tour is
    // inactive until its publish time, so honouring it publicly would expose
    // exactly the content we are hiding above.
    if (queryParams.scheduled === 'true') {
      filter.isActive = false;
      filter.scheduledAt = { $exists: true, $ne: null };
    } else if (queryParams.scheduled === 'false') {
      filter.scheduledAt = { $exists: false };
    }
  }

  // Filter by featured status
  if (queryParams.isFeatured !== undefined) {
    filter.isFeatured = queryParams.isFeatured === 'true';
  }

  // Filter by special offer status
  if (queryParams.isSpecialOffer !== undefined) {
    filter.isSpecialOffer = queryParams.isSpecialOffer === 'true';
  }

  // Search only the language the visitor is currently reading.
  const searchRegex = createSearchRegex(queryParams.search);
  if (searchRegex) {
    const search = String(queryParams.search).trim();
    if (search.length > 100) {
      throw new TourQueryValidationError('search cannot exceed 100 characters');
    }

    const matchingSubcategories = await TourSubcategory.find({
      $or: [
        { [`name.${locale}`]: searchRegex },
        { [`shortName.${locale}`]: searchRegex },
      ],
    }).select('_id');

    filter.$or = [
      { [`heading.${locale}`]: searchRegex },
      { [`cardDescription.${locale}`]: searchRegex },
      { [`Description.text.${locale}`]: searchRegex },
      { [`tourLocation.${locale}`]: searchRegex },
      ...(locale === 'en' ? [{ name: searchRegex }] : []),
      ...(matchingSubcategories.length
        ? [{ subcategory: { $in: matchingSubcategories.map((sub) => sub._id) } }]
        : []),
    ];
  }

  // Filter by tour type
  if (queryParams.tourType) {
    Object.assign(filter, exactLocalizedValueFilter('tourType', locale, queryParams.tourType));
  }

  // Filter by tour style
  if (queryParams.tourStyle) {
    Object.assign(filter, exactLocalizedValueFilter('tourStyle', locale, queryParams.tourStyle));
  }

  applyStartingPriceFilter(filter, queryParams.minPrice, queryParams.maxPrice, currency, currencyRate);

  return filter;
};

// Pagination, sort and projection parsing live in utils/tourQuery so the
// contract can be tested without a database connection.
const ensureTourMapSchema = <T>(tour: T): T => {
  if (!tour || typeof tour !== 'object') return tour;

  const normalizedTour = tour as any;
  const mapSchema = normalizedTour.mapSchema || normalizedTour.seo?.mapSchema;
  if (!Array.isArray(mapSchema?.itemListElement) || mapSchema.itemListElement.length === 0) {
    return tour;
  }

  normalizedTour.mapSchema = normalizedTour.mapSchema || mapSchema;
  normalizedTour.seo = normalizedTour.seo || {};
  normalizedTour.seo.mapSchema = normalizedTour.seo.mapSchema || mapSchema;

  return tour;
};

// ==================== CONTROLLERS ====================

/**
 * @desc    Get all tours with advanced filtering, pagination, and sorting
 * @route   GET /api/tours
 * @access  Public
 */
/**
 * What a tour LIST needs, and nothing else.
 *
 * This endpoint used to return whole tour documents — 29 KB each, 40 fields —
 * to every caller: the category and subcategory pages, search, special offers,
 * the wishlist, "more tours", and the admin table. Measured on seven tours it
 * shipped 204 KB, of which 89% was never read by any of them. `itinerary`
 * alone was 41% of the response, and it is only ever rendered on a tour's own
 * page, which fetches that tour separately.
 *
 * The list below is taken from what the callers actually access, not from
 * guesswork — `reviews.url` rather than whole reviews, because the card only
 * needs to know whether a video exists. `pricingPlans` is absent on purpose:
 * every card reads the stored `priceStartingFrom` instead.
 *
 * A caller that needs more can still ask: `?fields=` overrides this entirely.
 */
const TOUR_LIST_FIELDS = [
  // identity and links
  'heading', 'name', 'slug',
  // card face
  'images', 'gallery', 'cardDescription', 'Description',
  'tourLocation', 'duration', 'priceStartingFrom',
  // relations shown as labels (subcategory is also required for the populate)
  'subcategory', 'category',
  // client-side filter options on the listing pages
  'tourType', 'tourStyle',
  // the offers page badge
  'specialOfferDiscount',
  // the admin table's columns
  'isActive', 'isFeatured', 'scheduledAt', 'createdAt', 'updatedAt',
  // enough to know a review video exists, without the review bodies
  'reviews.url',
].join(' ');

export const getAllTours = async (
  req: Request<Record<string, never>, unknown, unknown, QueryParams>,
  res: Response
): Promise<void> => {
  try {
    const allowInactive = canReadInactiveTours(req);
    if (req.query.includeInactive === 'true' && !allowInactive) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to include inactive tours',
      });
      return;
    }

    const locale = toTourLocale(req.locale);
    const currency = toTourCurrency(req.query.currency);
    const currencyRate = await getTourCurrencyRate(currency);
    const { page, limit, skip } = parseTourPagination(req.query.page, req.query.limit);
    const filter = await buildQueryFilter(req.query, locale, allowInactive, currencyRate);
    const sort = parseTourSort(req.query.sort, locale, currency);
    const fields = parseTourFields(req.query.fields, allowInactive);

    // Build query. NOTE: a single populate call — a second object-form
    // populate on the same path REPLACES the first one's select and ships
    // the full ~23KB subcategory document with every tour in the list.
    const populate = {
      path: 'subcategory',
      select: 'name shortName slug category',
      populate: {
        path: 'category',
        select: 'name slug',
      },
    };

    const selectedFields = fields || TOUR_LIST_FIELDS;
    const isPriceSort = sort === `priceStartingFrom.${currency}` || sort === `-priceStartingFrom.${currency}`;
    let toursPromise: Promise<unknown[]>;

    if (isPriceSort) {
      const projection = Object.fromEntries(
        selectedFields
          .split(/\s+/)
          .filter((field) => field && !field.startsWith('-'))
          .map((field) => [field, 1])
      );
      const direction = sort.startsWith('-') ? -1 : 1;
      /*
       * `__listingPrice` is a sort helper and must not reach the response.
       *
       * It used to be stripped with `__listingPrice: 0` inside the same
       * `$project` that lists the fields to KEEP. MongoDB rejects that
       * outright — an inclusion projection may not also exclude a field,
       * `_id` being the only exemption — so every price-sorted listing died
       * with "Cannot do exclusion on field __listingPrice in inclusion
       * projection", and the visitor page quietly rendered an empty list.
       *
       * The exclusion was never needed in the first place: `projection` is
       * built from TOUR_LIST_FIELDS, which does not contain `__listingPrice`,
       * and an inclusion projection emits only the fields it names. Dropping
       * the illegal key is the entire fix.
       *
       * `$unset` covers the one case where there is no inclusion projection
       * to rely on: an admin may pass `?fields=-something`, which leaves
       * `projection` empty, and `$project: {}` is itself invalid.
       */
      const stripSortHelpers = Object.keys(projection).length
        ? { $project: projection }
        : { $unset: ['__listingPrice', '__listingPriceRank'] };
      /*
       * Two helpers, and the rank is the reason this is not simply a $sort on
       * price.
       *
       * MongoDB orders missing and null BELOW every number, so "price low to
       * high" used to lead with the tours that have no price at all — exactly
       * the ones whose card reads "Price on request". Ranking priced tours
       * ahead of unpriced ones, and sorting by that rank FIRST, keeps the
       * unpriced last in BOTH directions.
       *
       * Nothing is substituted for the missing price: `__listingPrice` still
       * holds the real amount or nothing at all, so no sentinel like 999999
       * can ever escape into a response or a comparison.
       *
       * The `> 0` test is deliberately the same rule TourCard uses to decide
       * whether to render an amount, so the sorter and the card cannot
       * disagree about which tours count as priced. A tour holding only USD
       * is priced in EUR and GBP too, because the expression converts it.
       *
       * Ties — including every unpriced tour, which all rank equal — fall back
       * to `-createdAt`, the listing default elsewhere, then to `_id` so the
       * order is fully deterministic between requests.
       */
      toursPromise = Tour.aggregate([
        { $match: filter },
        { $addFields: { __listingPrice: effectiveStartingPriceExpression(currency, currencyRate) } },
        { $addFields: { __listingPriceRank: { $cond: [{ $gt: ['$__listingPrice', 0] }, 0, 1] } } },
        { $sort: { __listingPriceRank: 1, __listingPrice: direction, createdAt: -1, _id: 1 } },
        { $skip: skip },
        { $limit: limit },
        stripSortHelpers,
      ]).then((documents) => Tour.populate(documents, populate));
    } else {
      toursPromise = Tour.find(filter)
        .populate(populate)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select(selectedFields)
        .lean();
    }

    // Execute query with count
    const [tours, total] = await Promise.all([
      toursPromise,
      Tour.countDocuments(filter),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      count: tours.length,
      total,
      page,
      totalPages,
      hasNextPage,
      hasPrevPage,
      data: localizePreservingSlugs(tours, req.locale),
    });
  } catch (error: unknown) {
    console.error('Error fetching tours:', error);
    const isValidationError = error instanceof TourQueryValidationError;
    res.status(isValidationError ? 400 : 500).json({
      success: false,
      error: isValidationError ? error.message : 'Failed to fetch tours',
      message: getErrorMessage(error),
    });
  }
};

/**
 * Return the complete filter values for a category/subcategory scope. These
 * options do not depend on the current result page or current filter values.
 */
export const getTourFilterOptions = async (
  req: Request<Record<string, never>, unknown, unknown, QueryParams>,
  res: Response
): Promise<void> => {
  try {
    const allowInactive = canReadInactiveTours(req);
    if (req.query.includeInactive === 'true' && !allowInactive) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to include inactive tours',
      });
      return;
    }

    const locale = toTourLocale(req.locale);
    const currency = toTourCurrency(req.query.currency);
    const currencyRate = await getTourCurrencyRate(currency);
    const scope: QueryParams = {
      category: req.query.category,
      subcategory: req.query.subcategory,
      isActive: req.query.isActive,
      includeInactive: req.query.includeInactive,
      scheduled: req.query.scheduled,
      isFeatured: req.query.isFeatured,
      isSpecialOffer: req.query.isSpecialOffer,
      currency,
    };
    const filter = await buildQueryFilter(scope, locale, allowInactive, currencyRate);
    const priceField = `priceStartingFrom.${currency}`;

    const [rawTypes, rawStyles, pricedTours] = await Promise.all([
      Tour.distinct(`tourType.${locale}`, filter),
      Tour.distinct(`tourStyle.${locale}`, filter),
      Tour.find(filter).select(`${priceField} priceStartingFrom.USD`).lean(),
    ]);

    const normalizeOptions = (values: unknown[]): string[] =>
      [...new Set(values
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, locale));

    const prices = pricedTours
      .map((tour: { priceStartingFrom?: Partial<Record<'USD' | 'EUR' | 'GBP', number>> }) => {
        const exact = tour?.priceStartingFrom?.[currency];
        if (typeof exact === 'number' && Number.isFinite(exact)) return exact;
        const usd = tour?.priceStartingFrom?.USD;
        return typeof usd === 'number' && Number.isFinite(usd) ? usd * currencyRate : undefined;
      })
      .filter((price): price is number => typeof price === 'number' && Number.isFinite(price));

    res.status(200).json({
      success: true,
      data: {
        tourTypes: normalizeOptions(rawTypes),
        tourStyles: normalizeOptions(rawStyles),
        priceRange: {
          min: prices.length ? Math.min(...prices) : null,
          max: prices.length ? Math.max(...prices) : null,
          currency,
        },
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching tour filter options:', error);
    const isValidationError = error instanceof TourQueryValidationError;
    res.status(isValidationError ? 400 : 500).json({
      success: false,
      error: isValidationError ? error.message : 'Failed to fetch tour filter options',
      message: getErrorMessage(error),
    });
  }
};

/**
 * @desc    Get featured tours
 * @route   GET /api/tours/featured
 * @access  Public
 */
export const getFeaturedTours = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string || '6', 10);

    const tours = await Tour.find({ isActive: true, isFeatured: true })
      .populate('subcategory', 'name shortName slug')
      .sort('-createdAt')
      .limit(limit)
      // `reviews.url` only (not full reviews) so we can derive a video link
      // without shipping the heavy reviews array to the client.
      .select(
        // `subcategory` must be selected for the populate above to resolve — the
        // card shows its name as the tour's category label.
        'heading slug images cardDescription Description tourLocation subcategory pricingPlans priceStartingFrom duration specialOfferDiscount isSpecialOffer reviews.url'
      )
      .lean();

    // Collapse reviews into their URLs and drop the rest of each review, so the
    // homepage card can show a working video button without receiving titles
    // and bodies it never renders. Tours without a video get no `videoUrls` at
    // all, and the client then hides the button.
    //
    // All of them, not just the first: the listing pages open every review a
    // tour has, and a card that plays one video here and three elsewhere is the
    // same button behaving differently depending on which page you clicked it
    // from. `videoUrl` is kept alongside for anything still reading the old
    // single-value shape.
    const data = tours.map((tour: any) => {
      const { reviews, ...rest } = tour;
      const videoUrls = Array.isArray(reviews)
        ? reviews
            .map((r: any) => (typeof r?.url === 'string' ? r.url : ''))
            .filter(Boolean)
        : [];
      return videoUrls.length
        ? { ...rest, videoUrl: videoUrls[0], videoUrls }
        : rest;
    });

    // Localized, EXCEPT `slug`. The homepage builds per-locale URLs with
    // getStrictLocalizedSlug(tour.slug, locale), which needs slug as an OBJECT
    // { en, de, it, es } — a flattened slug reads as English-only and hides
    // every tour on the de/it/es pages. Returning the rest raw (as this did)
    // shipped all four languages of every field to every visitor.
    const payload = localizePreservingSlugs(data, req.locale);

    res.status(200).json({
      success: true,
      count: payload.length,
      data: payload,
    });
  } catch (error: any) {
    console.error('Error fetching featured tours:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured tours',
      message: error.message,
    });
  }
};

/**
 * @desc    Get tours by subcategory
 * @route   GET /api/tours/subcategories/:subcategoryId/tours
 * @access  Public
 */
export const getToursBySubcategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { subcategoryId } = req.params;
    const { isActive, includeInactive } = req.query;
    const allowInactive = canReadInactiveTours(req);

    if (includeInactive === 'true' && !allowInactive) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to include inactive tours',
      });
      return;
    }

    const filter: FilterQuery<ITour> = { subcategory: subcategoryId };

    // Same secure-by-default visibility rule as the main list (see
    // buildQueryFilter): active-only unless the admin opts in explicitly.
    if (allowInactive && includeInactive === 'true') {
      if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }
    } else {
      filter.isActive = { $ne: false };
    }

    const { page, limit, skip } = parseTourPagination(
      req.query.page as string | undefined,
      req.query.limit as string | undefined
    );

    const [tours, total] = await Promise.all([
      Tour.find(filter)
        .populate('subcategory', 'name shortName slug')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      Tour.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.status(200).json({
      success: true,
      count: tours.length,
      total,
      page,
      totalPages,
      data: localizePreservingSlugs(tours, req.locale),
    });
  } catch (error: any) {
    console.error('Error fetching tours by subcategory:', error);
    
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        error: 'Invalid subcategory ID format',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch tours',
      message: error.message,
    });
  }
};

/**
 * @desc    Resolve many tours at once, for the visitor's saved wishlist
 * @route   GET /api/tours/by-ids?ids=a,b,c
 * @access  Public
 *
 * Replaces one full-document request per saved tour. Only card fields are
 * returned, and the reply answers the question the wishlist actually has about
 * every id — is this tour still bookable, merely unavailable, or gone?
 *
 *   present with isActive true   → render the card
 *   present with isActive false  → the tour is hidden right now; the visitor
 *                                  keeps it, shown as unavailable. Deliberately
 *                                  reduced to { _id, isActive } so deactivated
 *                                  content is not published through this route.
 *   absent from the reply        → deleted for good; the client drops the id
 *
 * That distinction is the whole point: a tour switched off for a day must not
 * silently disappear from everyone's wishlist.
 */
export const getToursByIds = async (
  req: Request<Record<string, never>, unknown, unknown, { ids?: string }>,
  res: Response
): Promise<void> => {
  try {
    const requested = (req.query.ids || '')
      .split(',')
      .map((id) => id.trim())
      .filter((id) => /^[0-9a-fA-F]{24}$/.test(id))
      // A wishlist is a handful of tours; the cap stops a crafted URL from
      // turning this into an "export the catalogue" endpoint.
      .slice(0, 100);

    if (requested.length === 0) {
      res.status(200).json({ success: true, count: 0, data: [] });
      return;
    }

    const tours = await Tour.find({ _id: { $in: requested } })
      .select(
        'heading name slug images priceStartingFrom duration tourLocation ' +
          'subcategory cardDescription Description isActive specialOfferDiscount videoLink'
      )
      // `category` inside the subcategory is what the wishlist page uses to pick
      // its recommendations — dropping it makes them silently fall back to
      // "latest tours" with no error anywhere.
      .populate({
        path: 'subcategory',
        select: 'name shortName slug category',
        populate: { path: 'category', select: '_id name slug' },
      })
      .lean();

    const data = tours.map((tour: any) =>
      tour.isActive === false ? { _id: tour._id, isActive: false } : tour
    );

    res.status(200).json({
      success: true,
      count: data.length,
      // slug stays raw for per-locale links; faqs are absent from the projection.
      data: localizePreservingSlugs(data, req.locale),
    });
  } catch (error: any) {
    console.error('Error fetching tours by ids:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tours',
      message: error.message,
    });
  }
};

/**
 * @desc    Get single tour by ID
 * @route   GET /api/tours/:id
 * @access  Public
 */
export const getTourById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tour = await Tour.findById(req.params.id)
      .populate('subcategory', 'name shortName slug description category')
      .populate({
        path: 'subcategory',
        populate: {
          path: 'category',
          select: 'name slug description',
        },
      })
      .lean();

    if (!tour) {
      res.status(404).json({
        success: false,
        error: 'Tour not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: localize(ensureTourMapSchema(tour), req.locale),
    });
  } catch (error: any) {
    console.error('Error fetching tour:', error);
    
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        error: 'Invalid tour ID format',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch tour',
      message: error.message,
    });
  }
};

/**
 * @desc    Get single tour by slug
 * @route   GET /api/tours/slug/:slug
 * @access  Public
 */
export const getTourBySlug = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tour = await Tour.findOne({
      isActive: { $ne: false },
      $or: [
        { 'slug.en': req.params.slug },
        { 'slug.de': req.params.slug },
        { 'slug.it': req.params.slug },
        { 'slug.es': req.params.slug },
      ],
    })
      .populate({
        path: 'subcategory',
        select: 'name shortName slug description category',
        populate: {
          path: 'category',
          select: 'name shortName slug description',
        },
      })
      .lean();

    if (!tour) {
      res.status(404).json({
        success: false,
        error: 'Tour not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      // Localized, but every `slug` stays raw so the language switcher and the
      // hreflang alternates can still resolve this tour in the other locales.
      data: localizePreservingSlugs(ensureTourMapSchema(tour), req.locale),
    });
  } catch (error: any) {
    console.error('Error fetching tour by slug:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tour',
      message: error.message,
    });
  }
};

/**
 * @desc    Get tour by external ID
 * @route   GET /api/tours/external/:idExternal
 * @access  Public
 */
export const getTourByExternalId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tour = await Tour.findOne({ idExternal: req.params.idExternal })
      .populate('subcategory', 'name shortName slug')
      .lean();

    if (!tour) {
      res.status(404).json({
        success: false,
        error: 'Tour not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: localize(tour, req.locale),
    });
  } catch (error: any) {
    console.error('Error fetching tour by external ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tour',
      message: error.message,
    });
  }
};

/**
 * @desc    Get related tours
 * @route   GET /api/tours/:id/related
 * @access  Public
 */
export const getRelatedTours = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tour = await Tour.findById(req.params.id).select('subcategory').lean();

    if (!tour) {
      res.status(404).json({
        success: false,
        error: 'Tour not found',
      });
      return;
    }

    const limit = parseInt(req.query.limit as string || '4', 10);

    // Find tours in the same subcategory, excluding the current tour
    const relatedTours = await Tour.find({
      subcategory: tour.subcategory,
      _id: { $ne: req.params.id },
      isActive: true,
    })
      .select('heading slug images cardDescription Description tourLocation pricingPlans')
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      count: relatedTours.length,
      data: relatedTours,
    });
  } catch (error: any) {
    console.error('Error fetching related tours:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch related tours',
      message: error.message,
    });
  }
};

/**
 * @desc    Create new tour
 * @route   POST /api/tours
 * @access  Private/Admin
 */
export const createTour = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const body = { ...req.body };
    stripEmptyLocalizedSlugs(body.slug);

    if (
      Object.prototype.hasOwnProperty.call(body, 'scheduledAt') &&
      body.scheduledAt !== null &&
      body.scheduledAt !== undefined
    ) {
      body.scheduledAt = parseFutureSchedule(body.scheduledAt);
      body.isActive = false;
      delete body.publishedAt;
    } else {
      delete body.scheduledAt;
      if (body.isActive !== false) {
        body.publishedAt = new Date();
      } else {
        delete body.publishedAt;
      }
    }

    // Runs here rather than relying on the model's pre('save') hook alone:
    // mongoose validates BEFORE user save hooks, so a metaImage carrying only a
    // pasted url would be rejected for the required fileName before the hook
    // ever got the chance to derive it.
    body.seo = completeTourSeo(body);

    const priceConsistencyProblem = validatePricingCurrencyConsistency(body.pricingPlans);
    if (priceConsistencyProblem) {
      res.status(400).json({ success: false, error: priceConsistencyProblem });
      return;
    }

    // Derived, never accepted from the client: the "from" price must be the
    // cheapest amount in this tour's own plans, or the card can advertise a
    // figure the pricing table below it contradicts.
    const derivedStartingPrice = deriveStartingPrice(body.pricingPlans);
    if (derivedStartingPrice) body.priceStartingFrom = derivedStartingPrice;
    else delete body.priceStartingFrom;

    const tour = await Tour.create(body);

    // Populate subcategory details
    await tour.populate('subcategory', 'name shortName slug');

    void emitDashboardStatsUpdate();

    res.status(201).json({
      success: true,
      message: 'Tour created successfully',
      data: tour,
    });
  } catch (error: any) {
    console.error('Error creating tour:', error);

    if (error instanceof PublishingValidationError) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    // Handle invalid ObjectId/CastError
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        error: `Invalid format for field: ${error.path}`,
      });
      return;
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({
        success: false,
        error: `Tour with this ${field} already exists`,
      });
      return;
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: error.errors,
      });
      return;
    }

    // Handle invalid subcategory reference
    if (error.message.includes('Invalid subcategory reference')) {
      res.status(400).json({
        success: false,
        error: 'Invalid subcategory reference',
      });
      return;
    }

    // Handle date range errors
    if (error.message.includes('Invalid date range')) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create tour',
      message: error.message,
    });
  }
};

/**
 * @desc    Update tour
 * @route   PUT /api/tours/:id
 * @access  Private/Admin
 */
export const updateTour = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const body = { ...req.body };
    stripEmptyLocalizedSlugs(body.slug);

    // Stale-save conflict guard — reject saves from stale drafts or old tabs
    const submittedVersion: number | undefined =
      typeof body._editVersion === 'number' ? body._editVersion : undefined;
    delete body._editVersion;

    // The SEO fields ride along on this existing lookup so completeTourSeo can
    // fill from the stored tour for anything this request didn't resubmit.
    const existingTour = await Tour.findById(
      req.params.id,
      // `tourKind` and `pricingPlans` ride along so the kind/plan rule can be
      // checked against the tour as it will be AFTER this update — a request
      // may change only one of the two, and the other still has to agree.
      'editVersion isActive scheduledAt publishedAt seo heading name Description mapSchema tourKind pricingPlans'
    ).lean();
    if (!existingTour) {
      res.status(404).json({ success: false, error: 'Tour not found' });
      return;
    }
    const currentVersion: number = (existingTour as any).editVersion ?? 0;

    if (submittedVersion === undefined || submittedVersion !== currentVersion) {
      res.status(409).json({
        success: false,
        error: 'This tour was updated elsewhere. Please reload before saving.',
        currentVersion,
      });
      return;
    }

    body.editVersion = currentVersion + 1;

    // The kind/plan rule, checked against the merged result rather than the
    // request alone: changing only the kind, or only the plans, still has to
    // leave the tour in a legal state. Enforced here because this route uses
    // findByIdAndUpdate, which never runs the model's pre('save') hook.
    {
      const nextKind = Object.prototype.hasOwnProperty.call(body, 'tourKind')
        ? body.tourKind
        : (existingTour as any).tourKind;
      const nextPlans = Object.prototype.hasOwnProperty.call(body, 'pricingPlans')
        ? body.pricingPlans
        : (existingTour as any).pricingPlans;

      const problem = validateTourKindPlans(nextKind, nextPlans);
      if (problem) {
        res.status(400).json({ success: false, error: problem });
        return;
      }

      const priceConsistencyProblem = validatePricingCurrencyConsistency(nextPlans);
      if (priceConsistencyProblem) {
        res.status(400).json({ success: false, error: priceConsistencyProblem });
        return;
      }
    }

    // Filter out empty gallery items (items with empty fileName)
    if (body.gallery && Array.isArray(body.gallery)) {
      body.gallery = body.gallery.filter((item: any) =>
        item && item.fileName && item.fileName.trim() !== ''
      );
    }

    // Sanitize pricingPlans: remove empty date objects from seasons
    if (body.pricingPlans && Array.isArray(body.pricingPlans)) {
      const isEmptyDateObj = (val: any): boolean => {
        if (val === null || val === undefined) return false;
        if (val instanceof Date) return false;
        if (typeof val !== 'object') return false;
        return Object.keys(val).length === 0;
      };

      body.pricingPlans = body.pricingPlans.map((plan: any) => {
        if (!plan.seasons || !Array.isArray(plan.seasons)) return plan;
        return {
          ...plan,
          seasons: plan.seasons.map((season: any) => {
            const cleaned: any = { ...season };
            if (!cleaned.startDate || isEmptyDateObj(cleaned.startDate)) {
              delete cleaned.startDate;
            }
            if (!cleaned.endDate || isEmptyDateObj(cleaned.endDate)) {
              delete cleaned.endDate;
            }
            return cleaned;
          }),
        };
      });
    }

    const fieldsToUnset: Record<string, 1> = {};
    const hasScheduledAt = Object.prototype.hasOwnProperty.call(body, 'scheduledAt');

    if (
      hasScheduledAt &&
      body.scheduledAt !== null &&
      body.scheduledAt !== undefined
    ) {
      body.scheduledAt = parseFutureSchedule(body.scheduledAt);
      body.isActive = false;
      fieldsToUnset.publishedAt = 1;
      delete body.publishedAt;
    } else if (hasScheduledAt || body.isActive !== undefined) {
      fieldsToUnset.scheduledAt = 1;
      delete body.scheduledAt;

      if (body.isActive === true && !(existingTour as any).isActive) {
        body.publishedAt = new Date();
      }
    }

    // findByIdAndUpdate skips document middleware, so the model's pre('save')
    // SEO completion never runs on an edit. Without this the first save strips
    // the auto-filled metaImage — `$set: body` replaces the whole `seo`
    // subdocument, and nothing puts it back. Anything the form didn't resubmit
    // is read from the stored tour so a partial update can't erase it.
    const pick = (key: string) =>
      body[key] !== undefined ? body[key] : (existingTour as any)[key];
    body.seo = completeTourSeo({
      seo: pick('seo'),
      heading: pick('heading'),
      name: pick('name'),
      Description: pick('Description'),
      mapSchema: pick('mapSchema'),
    });

    // Recomputed on every update, from whichever plans this write leaves in
    // place: a partial update that never mentions pricingPlans must still not
    // strand an old "from" price that the current plans no longer support.
    const plansAfterUpdate =
      body.pricingPlans !== undefined
        ? body.pricingPlans
        : (existingTour as any).pricingPlans;
    const derivedStartingPrice = deriveStartingPrice(plansAfterUpdate);
    if (derivedStartingPrice) {
      body.priceStartingFrom = derivedStartingPrice;
    } else {
      // Nothing quotable left — remove it rather than leaving a stale figure.
      delete body.priceStartingFrom;
      fieldsToUnset.priceStartingFrom = 1;
    }

    const update: any = { $set: body };
    if (Object.keys(fieldsToUnset).length > 0) {
      update.$unset = fieldsToUnset;
    }

    const tour = await Tour.findByIdAndUpdate(
      req.params.id,
      update,
      {
        new: true,
        runValidators: true,
      }
    ).populate('subcategory', 'name shortName slug');

    if (!tour) {
      res.status(404).json({
        success: false,
        error: 'Tour not found',
      });
      return;
    }

    void emitDashboardStatsUpdate();

    res.status(200).json({
      success: true,
      message: 'Tour updated successfully',
      data: tour,
    });
  } catch (error: any) {
    console.error('Error updating tour:', error);

    if (error instanceof PublishingValidationError) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    // Handle invalid ObjectId/CastError
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        error: error.path === '_id' 
          ? 'Invalid tour ID format' 
          : `Invalid format for field: ${error.path}`,
      });
      return;
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({
        success: false,
        error: `Tour with this ${field} already exists`,
      });
      return;
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: error.errors,
      });
      return;
    }

    // Handle invalid subcategory reference
    if (error.message.includes('Invalid subcategory reference')) {
      res.status(400).json({
        success: false,
        error: 'Invalid subcategory reference',
      });
      return;
    }

    // Handle date range errors
    if (error.message.includes('Invalid date range')) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update tour',
      message: error.message,
    });
  }
};

/**
 * @desc    Delete tour
 * @route   DELETE /api/tours/:id
 * @access  Private/Admin
 */
export const deleteTour = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tour = await Tour.findById(req.params.id);

    if (!tour) {
      res.status(404).json({
        success: false,
        error: 'Tour not found',
      });
      return;
    }

    await tour.deleteOne();

    void emitDashboardStatsUpdate();

    res.status(200).json({
      success: true,
      message: 'Tour deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting tour:', error);

    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        error: 'Invalid tour ID format',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete tour',
      message: error.message,
    });
  }
};

/**
 * @desc    Toggle tour active status
 * @route   PATCH /api/tours/:id/toggle-active
 * @access  Private/Admin
 */
export const toggleTourStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tour = await Tour.findById(req.params.id);

    if (!tour) {
      res.status(404).json({
        success: false,
        error: 'Tour not found',
      });
      return;
    }

    tour.isActive = !tour.isActive;
    tour.scheduledAt = undefined;
    if (tour.isActive) {
      tour.publishedAt = new Date();
    }
    tour.editVersion = (tour.editVersion ?? 0) + 1;
    await tour.save();

    void emitDashboardStatsUpdate();

    res.status(200).json({
      success: true,
      message: `Tour ${tour.isActive ? 'activated' : 'deactivated'} successfully`,
      data: tour,
    });
  } catch (error: any) {
    console.error('Error toggling tour status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle tour status',
      message: error.message,
    });
  }
};

/**
 * @desc    Toggle tour featured status
 * @route   PATCH /api/tours/:id/toggle-featured
 * @access  Private/Admin
 */
export const toggleTourFeatured = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tour = await Tour.findById(req.params.id);

    if (!tour) {
      res.status(404).json({
        success: false,
        error: 'Tour not found',
      });
      return;
    }

    tour.isFeatured = !tour.isFeatured;
    tour.editVersion = (tour.editVersion ?? 0) + 1;
    await tour.save();

    void emitDashboardStatsUpdate();

    res.status(200).json({
      success: true,
      message: `Tour ${tour.isFeatured ? 'marked as featured' : 'unmarked as featured'} successfully`,
      data: tour,
    });
  } catch (error: any) {
    console.error('Error toggling tour featured status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle tour featured status',
      message: error.message,
    });
  }
};

/**
 * @desc    Get tour statistics
 * @route   GET /api/tours/stats
 * @access  Private/Admin
 */
export const getTourStats = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const stats = await Tour.aggregate([
      {
        $facet: {
          totalStats: [
            {
              $group: {
                _id: null,
                totalTours: { $sum: 1 },
                activeTours: {
                  $sum: { $cond: ['$isActive', 1, 0] },
                },
                featuredTours: {
                  $sum: { $cond: ['$isFeatured', 1, 0] },
                },
              },
            },
          ],
          toursBySubcategory: [
            {
              $group: {
                _id: '$subcategory',
                count: { $sum: 1 },
              },
            },
            {
              $lookup: {
                from: 'toursubcategories',
                localField: '_id',
                foreignField: '_id',
                as: 'subcategoryInfo',
              },
            },
            {
              $unwind: '$subcategoryInfo',
            },
            {
              $project: {
                _id: 1,
                name: '$subcategoryInfo.name',
                count: 1,
              },
            },
            {
              $sort: { count: -1 },
            },
          ],
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: stats[0],
    });
  } catch (error: any) {
    console.error('Error fetching tour statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tour statistics',
      message: error.message,
    });
  }
};
