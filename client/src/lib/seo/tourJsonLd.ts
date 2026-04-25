/**
 * tourJsonLd.ts
 *
 * Generates a complete, dynamic JSON-LD @graph for an Egypt tour detail page.
 * All values are derived at runtime from the raw tour API response — nothing is hardcoded.
 *
 * Usage (Server Component / generateMetadata):
 *   import { generateTourJsonLd } from "@/lib/seo/tourJsonLd";
 *   const jsonLd = generateTourJsonLd({ tour, locale, currency, canonicalUrl, siteUrl, organization, breadcrumbs });
 *   // render: <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SupportedLocale = "en" | "de" | "it" | "es";
export type SupportedCurrency = "USD" | "EUR" | "GBP";

export interface TourJsonLdOrganization {
  name: string;
  url: string;
  /** Absolute URL to the logo image */
  logoUrl?: string;
  /** Real telephone in E.164 format, e.g. "+447911123456" */
  telephone?: string;
  /** Real public contact email */
  email?: string;
  /** Only include if a real postal address is available */
  address?: {
    streetAddress?: string;
    addressLocality: string;
    addressCountry: string;
    postalCode?: string;
  };
}

export interface TourJsonLdBreadcrumb {
  label: string;
  /** Relative or absolute URL — will be made absolute internally */
  href?: string;
}

export interface TourJsonLdInput {
  /** Raw tour object straight from the API response */
  tour: any;
  /** Current page locale */
  locale: SupportedLocale;
  /**
   * Currency for pricing schema.
   * NOTE: At SSR time localStorage is unavailable → always pass "USD"
   * so the schema reflects stable, currency-independent values.
   */
  currency?: SupportedCurrency;
  /** Absolute canonical URL for this tour page (no trailing slash) */
  canonicalUrl: string;
  /** Absolute base URL of the site (no trailing slash) */
  siteUrl: string;
  /** Real organisation / agency data */
  organization: TourJsonLdOrganization;
  /**
   * Breadcrumbs as rendered on the page:
   * e.g. [{ label:"Egypt Packages", href:"/en/egypt-packages" }, { label:"Cairo Tours", href:"/en/cairo-tours" }, { label:"8-Day Cairo Tour" }]
   * Home is prepended automatically.
   */
  breadcrumbs: TourJsonLdBreadcrumb[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: getLocalizedValue
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract a locale-specific value from a localized field object.
 * Falls back to `fallbackLocale` (default: "en") if the requested locale is missing.
 * Returns an empty string if the value is completely absent.
 */
export function getLocalizedValue(
  field: any,
  locale: string = "en",
  fallbackLocale: string = "en"
): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  if (typeof field !== "object") return String(field);

  const v = field[locale] ?? field[fallbackLocale] ?? Object.values(field)[0];
  if (!v) return "";
  // If the resolved value is still an object (e.g. nested mixed content), stringify
  if (typeof v === "object") return "";
  return String(v);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: stripHtml
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Remove all HTML tags and decode common HTML entities.
 * Safe to run on already-plain text (no-op).
 */
export function stripHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, " ")          // strip tags
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s{2,}/g, " ")           // collapse whitespace
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: absoluteUrl
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ensure a URL is absolute, prepending `baseUrl` when it starts with "/".
 * Returns empty string for null / undefined / "#" paths.
 */
export function absoluteUrl(path: string | null | undefined, baseUrl: string): string {
  if (!path || path === "#") return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return baseUrl.replace(/\/$/, "") + path;
  return baseUrl.replace(/\/$/, "") + "/" + path;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: cleanJsonLd
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recursively remove null, undefined, empty string, empty array, and empty
 * object values from a JSON-LD object so the output is always clean.
 * Preserves numeric 0 and boolean false (valid schema values).
 */
export function cleanJsonLd(obj: unknown): unknown {
  if (obj === null || obj === undefined) return undefined;

  if (Array.isArray(obj)) {
    const cleaned = obj
      .map(cleanJsonLd)
      .filter((v) => v !== undefined && v !== null && v !== "");
    return cleaned.length > 0 ? cleaned : undefined;
  }

  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      // Always keep @-prefixed keys (JSON-LD syntax keywords) even when their value is falsy
      if (key.startsWith("@")) {
        result[key] = value;
        continue;
      }
      const cleaned = cleanJsonLd(value);
      if (cleaned === undefined || cleaned === null || cleaned === "") continue;
      if (Array.isArray(cleaned) && cleaned.length === 0) continue;
      if (
        typeof cleaned === "object" &&
        !Array.isArray(cleaned) &&
        Object.keys(cleaned as object).length === 0
      )
        continue;
      result[key] = cleaned;
    }
    return result;
  }

  if (typeof obj === "string" && obj.trim() === "") return undefined;

  return obj;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: getValidPricesFromPricingPlans
// ─────────────────────────────────────────────────────────────────────────────

const TRAVELER_TIERS = ["solo", "pax_2_4", "pax_5_8", "pax_9_16"] as const;
type TravelerTier = (typeof TRAVELER_TIERS)[number];

const TIER_LABELS: Record<TravelerTier, string> = {
  solo: "Solo Traveler",
  pax_2_4: "2–4 Travelers",
  pax_5_8: "5–8 Travelers",
  pax_9_16: "9–16 Travelers",
};

interface ValidOffer {
  planName: string;
  planIndex: number;
  seasonName: string;
  seasonIndex: number;
  startDate?: string;
  endDate?: string;
  tier: TravelerTier;
  price: number;
  currency: SupportedCurrency;
}

/**
 * Walk every pricingPlan → season → traveler tier and collect all valid
 * (non-null, non-zero, numeric) prices for the requested currency.
 * Falls back to USD if the target currency is absent for a given entry.
 */
export function getValidPricesFromPricingPlans(
  pricingPlans: any[] | undefined | null,
  currency: SupportedCurrency = "USD"
): ValidOffer[] {
  if (!Array.isArray(pricingPlans) || pricingPlans.length === 0) return [];

  const offers: ValidOffer[] = [];

  pricingPlans.forEach((plan, planIndex) => {
    if (!plan || typeof plan !== "object") return;
    const planName: string = plan.planName || `Plan ${planIndex + 1}`;
    const seasons: any[] = Array.isArray(plan.seasons) ? plan.seasons : [];

    seasons.forEach((season, seasonIndex) => {
      if (!season || typeof season !== "object") return;
      const seasonName: string = season.seasonName || `Season ${seasonIndex + 1}`;
      const startDate: string | undefined = season.startDate
        ? new Date(season.startDate).toISOString().split("T")[0]
        : undefined;
      const endDate: string | undefined = season.endDate
        ? new Date(season.endDate).toISOString().split("T")[0]
        : undefined;

      const prices = season.prices;
      if (!prices || typeof prices !== "object") return;

      for (const tier of TRAVELER_TIERS) {
        const tierPrices = prices[tier];
        if (!tierPrices || typeof tierPrices !== "object") continue;

        // Prefer the requested currency; fall back to USD
        const rawPrice: number | undefined =
          tierPrices[currency] ?? tierPrices["USD"];

        if (
          rawPrice === undefined ||
          rawPrice === null ||
          typeof rawPrice !== "number" ||
          isNaN(rawPrice) ||
          rawPrice <= 0
        )
          continue;

        offers.push({
          planName,
          planIndex,
          seasonName,
          seasonIndex,
          startDate,
          endDate,
          tier,
          price: rawPrice,
          currency: tierPrices[currency] !== undefined ? currency : "USD",
        });
      }
    });
  });

  return offers;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: calculateLowHighOffer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the lowest price, highest price, and offer count from a flat list
 * of ValidOffer objects.  Returns null when the list is empty.
 */
export function calculateLowHighOffer(
  offers: ValidOffer[]
): { lowPrice: number; highPrice: number; offerCount: number } | null {
  if (offers.length === 0) return null;
  const prices = offers.map((o) => o.price);
  return {
    lowPrice: Math.min(...prices),
    highPrice: Math.max(...prices),
    offerCount: offers.length,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: generateOfferId
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Produce a stable, URL-safe fragment identifier for an individual Offer.
 * Format: canonicalUrl + "#offer-{planIndex}-{seasonIndex}-{tier}"
 */
export function generateOfferId(
  canonicalUrl: string,
  planIndex: number,
  seasonIndex: number,
  tier: string
): string {
  return `${canonicalUrl}#offer-${planIndex}-${seasonIndex}-${tier}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: formatISO8601Duration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert a human-readable duration string into an ISO 8601 duration.
 * Supports patterns like "8 Days", "8 Tage", "8 giorni", "8 días", bare "8".
 * Returns undefined if the string cannot be parsed.
 */
function formatISO8601Duration(durationStr: string | null | undefined): string | undefined {
  if (!durationStr) return undefined;
  const lower = durationStr.toLowerCase().trim();
  const daysMatch = lower.match(/(\d+)\s*(day|days|tag|tage|giorno|giorni|día|días|d\b)/);
  if (daysMatch) return `P${daysMatch[1]}D`;
  const hoursMatch = lower.match(/(\d+)\s*(hour|hours|stunde|stunden|ora|ore|hora|horas|h\b)/);
  if (hoursMatch) return `PT${hoursMatch[1]}H`;
  const justNumber = lower.match(/^(\d+)$/);
  if (justNumber) return `P${justNumber[1]}D`;
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: resolveAvailability
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map a free-text tourAvailability string to a schema.org Availability URL.
 * Falls back to InStock when the string is present but not recognisably "sold out"
 * or "limited".
 */
function resolveAvailability(availabilityStr: string | null | undefined): string {
  if (!availabilityStr) return "https://schema.org/InStock";
  const lower = availabilityStr.toLowerCase();
  if (lower.includes("sold out") || lower.includes("unavailable")) {
    return "https://schema.org/SoldOut";
  }
  if (lower.includes("limited")) {
    return "https://schema.org/LimitedAvailability";
  }
  return "https://schema.org/InStock";
}

// ─────────────────────────────────────────────────────────────────────────────
// Main: generateTourJsonLd
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the complete JSON-LD @graph object for a Tour Detail Page.
 *
 * @returns A plain object ready to be serialised with JSON.stringify().
 *          Pass the result to `dangerouslySetInnerHTML` inside a
 *          <script type="application/ld+json"> tag.
 */
export function generateTourJsonLd({
  tour,
  locale,
  currency = "USD",
  canonicalUrl,
  siteUrl,
  organization,
  breadcrumbs,
}: TourJsonLdInput): Record<string, unknown> {
  // ── Derived base values ───────────────────────────────────────────────────

  const loc = locale || "en";
  const cur: SupportedCurrency = currency;

  const tourName = stripHtml(
    getLocalizedValue(tour.seo?.metaTitle, loc) ||
    getLocalizedValue(tour.heading, loc) ||
    getLocalizedValue(tour.name, loc) ||
    "Tour"
  );

  const tourDescription = stripHtml(
    getLocalizedValue(tour.seo?.metaDescription, loc) ||
    getLocalizedValue(tour.Description?.text, loc) ||
    getLocalizedValue(tour.overview, loc) ||
    ""
  );

  // Images: primary slider images first, then gallery — absolute, unique
  const allImageUrls: string[] = [];
  const seenUrls = new Set<string>();
  const addImage = (img: any) => {
    const url = typeof img === "string" ? img : img?.url;
    if (url && typeof url === "string" && !seenUrls.has(url)) {
      seenUrls.add(url);
      allImageUrls.push(url);
    }
  };
  (tour.images || []).forEach(addImage);
  (tour.gallery || []).forEach(addImage);

  const durationStr = getLocalizedValue(tour.duration, loc);
  const isoDuration = formatISO8601Duration(durationStr);

  const tourLocation = stripHtml(getLocalizedValue(tour.tourLocation, loc));
  const tourAvailabilityStr = getLocalizedValue(tour.tourAvailability, loc);
  const availabilityUrl = resolveAvailability(tourAvailabilityStr);

  const organizationId = `${siteUrl}#travelagency`;
  const webSiteId = `${siteUrl}#website`;
  const webPageId = `${canonicalUrl}#webpage`;
  const productId = `${canonicalUrl}#product`;
  const offersId = `${canonicalUrl}#offers`;
  const touristTripId = `${canonicalUrl}#tourist-trip`;
  const itineraryId = `${canonicalUrl}#itinerary`;
  const attractionsId = `${canonicalUrl}#attractions`;
  const faqId = `${canonicalUrl}#faq`;
  const breadcrumbId = `${canonicalUrl}#breadcrumb`;

  // ── 1. TravelAgency ───────────────────────────────────────────────────────

  const travelAgencyNode: Record<string, unknown> = {
    "@type": "TravelAgency",
    "@id": organizationId,
    name: organization.name,
    url: organization.url,
    ...(organization.logoUrl
      ? {
          logo: {
            "@type": "ImageObject",
            url: absoluteUrl(organization.logoUrl, siteUrl),
          },
        }
      : {}),
    ...(organization.telephone ? { telephone: organization.telephone } : {}),
    ...(organization.email ? { email: organization.email } : {}),
    ...(organization.address
      ? {
          address: {
            "@type": "PostalAddress",
            ...(organization.address.streetAddress
              ? { streetAddress: organization.address.streetAddress }
              : {}),
            addressLocality: organization.address.addressLocality,
            addressCountry: organization.address.addressCountry,
            ...(organization.address.postalCode
              ? { postalCode: organization.address.postalCode }
              : {}),
          },
        }
      : {}),
    areaServed: [
      "United Kingdom",
      "United States",
      "Germany",
      "Spain",
      "Italy",
      "Egypt",
    ],
    currenciesAccepted: "USD, EUR, GBP",
    sameAs: [organization.url],
  };

  // ── 2. BreadcrumbList ─────────────────────────────────────────────────────

  // Prepend Home, then append all breadcrumbs passed from the page
  const crumbItems = [
    { label: "Home", href: `${siteUrl}/${loc}` },
    ...breadcrumbs,
  ];

  const breadcrumbNode = {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    itemListElement: crumbItems.map((crumb, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: crumb.label,
      ...(crumb.href
        ? { item: absoluteUrl(crumb.href, siteUrl) || undefined }
        : {}),
    })),
  };

  // ── 3. Pricing: individual Offer objects + AggregateOffer ─────────────────

  const validOffers = getValidPricesFromPricingPlans(tour.pricingPlans, cur);
  const priceRange = calculateLowHighOffer(validOffers);

  // Build individual Offer nodes (one per plan/season/tier combination)
  const individualOfferNodes = validOffers.map((o) => ({
    "@type": "Offer",
    "@id": generateOfferId(canonicalUrl, o.planIndex, o.seasonIndex, o.tier),
    name: `${o.planName} — ${o.seasonName} — ${TIER_LABELS[o.tier]}`,
    price: o.price,
    priceCurrency: o.currency,
    ...(o.startDate ? { validFrom: o.startDate } : {}),
    ...(o.endDate ? { validThrough: o.endDate } : {}),
    availability: availabilityUrl,
    url: canonicalUrl,
    category: o.planName,
  }));

  // AggregateOffer — only emitted when at least one valid price exists
  const aggregateOfferNode: Record<string, unknown> | null = priceRange
    ? {
        "@type": "AggregateOffer",
        "@id": offersId,
        url: canonicalUrl,
        priceCurrency: cur,
        lowPrice: priceRange.lowPrice,
        highPrice: priceRange.highPrice,
        offerCount: priceRange.offerCount,
        availability: availabilityUrl,
        ...(individualOfferNodes.length > 0
          ? { offers: individualOfferNodes }
          : {}),
      }
    : null;

  // ── 4. Itinerary ItemList ─────────────────────────────────────────────────

  const itineraryDays: any[] = Array.isArray(tour.itinerary?.days)
    ? tour.itinerary.days
    : [];

  const itineraryNode =
    itineraryDays.length > 0
      ? {
          "@type": "ItemList",
          "@id": itineraryId,
          name: "Tour Itinerary",
          itemListOrder: "https://schema.org/ItemListOrderAscending",
          itemListElement: itineraryDays.map((day: any) => {
            const dayTitle = stripHtml(getLocalizedValue(day.title, loc));
            const dayDescription = stripHtml(getLocalizedValue(day.description, loc));
            const activities: any[] = Array.isArray(day.activities)
              ? day.activities
              : [];

            // Build an augmented description that includes activity headings
            // so Google sees the full itinerary detail
            let fullDescription = dayDescription;
            if (activities.length > 0) {
              const actList = activities
                .map((a: any) => stripHtml(getLocalizedValue(a.heading, loc)))
                .filter(Boolean)
                .join(" • ");
              if (actList) {
                fullDescription = fullDescription
                  ? `${fullDescription} — ${actList}`
                  : actList;
              }
            }

            return {
              "@type": "ListItem",
              position: day.day || itineraryDays.indexOf(day) + 1,
              name: `Day ${day.day || itineraryDays.indexOf(day) + 1}: ${dayTitle}`,
              ...(fullDescription ? { description: fullDescription } : {}),
            };
          }),
        }
      : null;

  // ── 5. Attractions / Places ItemList ─────────────────────────────────────

  // mapSchema lives at tour.mapSchema or (copied to) tour.seo.mapSchema
  const mapSchemaSource = tour.mapSchema || tour.seo?.mapSchema;
  const attractions: any[] = Array.isArray(mapSchemaSource?.itemListElement)
    ? mapSchemaSource.itemListElement
    : [];

  const attractionsNode =
    attractions.length > 0
      ? {
          "@type": "ItemList",
          "@id": attractionsId,
          name: "Places visited on this tour",
          itemListOrder: "https://schema.org/ItemListOrderAscending",
          itemListElement: attractions.map((attr: any) => {
            const attrName: string = attr.name || "";
            const attrDescription = stripHtml(
              typeof attr.description === "string"
                ? attr.description
                : getLocalizedValue(attr.description, loc)
            );

            const item: Record<string, unknown> = {
              "@type": "TouristAttraction",
              name: attrName,
              ...(attrDescription ? { description: attrDescription } : {}),
            };

            // Only include real geo coordinates from the DB
            if (
              attr.geo?.latitude &&
              attr.geo?.longitude &&
              attr.geo.latitude !== "0" &&
              attr.geo.longitude !== "0"
            ) {
              item.geo = {
                "@type": "GeoCoordinates",
                latitude: attr.geo.latitude,
                longitude: attr.geo.longitude,
              };
            }

            // Only include a real postal address
            if (attr.address?.addressLocality && attr.address?.addressCountry) {
              item.address = {
                "@type": "PostalAddress",
                addressLocality: attr.address.addressLocality,
                addressCountry: attr.address.addressCountry,
              };
            }

            return {
              "@type": "ListItem",
              position: attr.position ?? attractions.indexOf(attr) + 1,
              item,
            };
          }),
        }
      : null;

  // ── 6. FAQPage ────────────────────────────────────────────────────────────

  const faqs: any[] = Array.isArray(tour.faqs) ? tour.faqs : [];
  const validFaqs = faqs
    .map((f: any) => {
      const question = stripHtml(getLocalizedValue(f.question, loc));
      const answer = stripHtml(getLocalizedValue(f.answer, loc));
      return { question, answer };
    })
    .filter((f) => f.question && f.answer);

  const faqNode =
    validFaqs.length > 0
      ? {
          "@type": "FAQPage",
          "@id": faqId,
          mainEntity: validFaqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: f.answer,
            },
          })),
        }
      : null;

  // ── 7. TouristTrip ────────────────────────────────────────────────────────

  const touristTripNode: Record<string, unknown> = {
    "@type": "TouristTrip",
    "@id": touristTripId,
    name: tourName,
    ...(tourDescription ? { description: tourDescription } : {}),
    ...(allImageUrls.length > 0 ? { image: allImageUrls } : {}),
    provider: { "@id": organizationId },
    ...(isoDuration ? { duration: isoDuration } : {}),
    ...(tourLocation
      ? {
          touristDestination: {
            "@type": "TouristDestination",
            name: tourLocation,
            ...(tourLocation.toLowerCase().includes("egypt")
              ? {}
              : {
                  containedInPlace: {
                    "@type": "Country",
                    name: "Egypt",
                  },
                }),
          },
        }
      : {}),
    ...(tour.tourType
      ? { touristType: stripHtml(getLocalizedValue(tour.tourType, loc)) }
      : {}),
    ...(aggregateOfferNode ? { offers: { "@id": offersId } } : {}),
    ...(itineraryNode ? { itinerary: { "@id": itineraryId } } : {}),
    ...(attractionsNode ? { includesAttraction: { "@id": attractionsId } } : {}),
  };

  // ── 8. Product ────────────────────────────────────────────────────────────

  const productNode: Record<string, unknown> = {
    "@type": "Product",
    "@id": productId,
    name: tourName,
    ...(tourDescription ? { description: tourDescription } : {}),
    ...(allImageUrls.length > 0 ? { image: allImageUrls } : {}),
    ...(tour.idExternal ? { sku: tour.idExternal } : {}),
    brand: { "@id": organizationId },
    ...(aggregateOfferNode ? { offers: { "@id": offersId } } : {}),
    isRelatedTo: { "@id": touristTripId },
  };

  // ── 9. WebPage ────────────────────────────────────────────────────────────

  const webPageNode: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": webPageId,
    url: canonicalUrl,
    name: tourName,
    ...(tourDescription ? { description: tourDescription } : {}),
    inLanguage: loc,
    isPartOf: { "@id": webSiteId },
    breadcrumb: { "@id": breadcrumbId },
    mainEntity: { "@id": productId },
    ...(allImageUrls.length > 0
      ? {
          primaryImageOfPage: {
            "@type": "ImageObject",
            url: allImageUrls[0],
          },
        }
      : {}),
  };

  // ── Assemble @graph ───────────────────────────────────────────────────────

  const graphNodes: unknown[] = [
    travelAgencyNode,
    breadcrumbNode,
    webPageNode,
    productNode,
    ...(aggregateOfferNode ? [aggregateOfferNode] : []),
    touristTripNode,
    ...(itineraryNode ? [itineraryNode] : []),
    ...(attractionsNode ? [attractionsNode] : []),
    ...(faqNode ? [faqNode] : []),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": graphNodes,
  };

  // Deep-clean: remove all null/undefined/""/[]/{}
  return cleanJsonLd(jsonLd) as Record<string, unknown>;
}
