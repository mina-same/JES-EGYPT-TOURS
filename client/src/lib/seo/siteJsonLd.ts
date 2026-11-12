import {
  COMPANY_POSTAL_ADDRESS,
  CONTACT_EMAIL,
  PHONE_E164,
  getSocialProfiles,
} from "@/config/contact";

/**
 * The site-wide structured data: the company (TravelAgency) and the website,
 * in one `@graph`. SEOProvider prints it on every visitor page.
 *
 * Other blocks on a page (the tour graph, the home page's WebPage and
 * FAQPage) point at these two nodes by `@id` and never define the company a
 * second time.
 *
 * Contact details come from config/contact.ts, the same values the footer
 * prints. The description is SITE-1 from the page language's common.json,
 * passed in by the caller.
 */

/** Logo file in public/. It is the same image as src/assets/images/logo-dark.png, and square. */
export const SITE_LOGO_PATH = "/favicon-logo.png";
export const SITE_LOGO_SIZE = 313;

/** A real photograph in public/. */
export const SITE_IMAGE_PATH = "/images/backgrounds/giza-pyramids-sphinx-sunset-panorama-egypt.webp";

/** The languages the team works in, as ISO 639-1 codes: the site's four languages. */
export const SITE_LANGUAGE_CODES = ["en", "de", "it", "es"] as const;

/** common.json key holding SITE-1, the company description for structured data. */
export const SITE_DESCRIPTION_KEY = "siteSchema.description";

export const siteOrganizationId = (baseUrl: string): string => `${baseUrl}/#travelagency`;
export const siteWebsiteId = (baseUrl: string): string => `${baseUrl}/#website`;

export interface SiteJsonLdInput {
  /** Absolute site URL, no trailing slash. */
  baseUrl: string;
  /** Page language. */
  locale: string;
  /** SITE-1 in the page language. Left out of the markup when empty. */
  description?: string;
}

export function buildSiteJsonLd({ baseUrl, locale, description }: SiteJsonLdInput) {
  // Same list the footer and the mobile drawer render, so the markup never
  // claims a profile the page does not link to.
  const sameAs = getSocialProfiles().map((profile) => profile.href);
  const languages = [...SITE_LANGUAGE_CODES];

  const travelAgency = {
    "@type": "TravelAgency",
    "@id": siteOrganizationId(baseUrl),
    name: "JES Egypt Tours",
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}${SITE_LOGO_PATH}`,
      width: SITE_LOGO_SIZE,
      height: SITE_LOGO_SIZE,
    },
    image: `${baseUrl}${SITE_IMAGE_PATH}`,
    ...(description ? { description } : {}),
    address: {
      "@type": "PostalAddress",
      ...COMPANY_POSTAL_ADDRESS,
    },
    telephone: PHONE_E164,
    email: CONTACT_EMAIL,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: PHONE_E164,
      email: CONTACT_EMAIL,
      contactType: "customer service",
      availableLanguage: languages,
    },
    knowsLanguage: languages,
    areaServed: {
      "@type": "Country",
      name: "Egypt",
    },
    // The company confirmed it can be reached 24/7.
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "00:00",
      closes: "23:59",
    },
    // Left out rather than emitted empty: an empty sameAs means "no known
    // profiles", which is only true when there are none.
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  const website = {
    "@type": "WebSite",
    "@id": siteWebsiteId(baseUrl),
    url: baseUrl,
    name: "JES Egypt Tours",
    inLanguage: locale,
    publisher: { "@id": siteOrganizationId(baseUrl) },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/${locale}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [travelAgency, website],
  };
}
