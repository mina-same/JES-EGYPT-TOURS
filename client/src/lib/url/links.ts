import { DEFAULT_SEO_BASE_URL, getSeoBaseUrl } from "./baseUrl";
import { isSupportedLocale, normalizeLocale } from "./locales";
import {
  getCanonicalStaticSlug,
  getLocalizedStaticPath,
  localizeStaticPathSegment,
} from "./staticSlugs";

const EXTERNAL_OR_PROTOCOL_RELATIVE_URL = /^(https?:)?\/\//i;
const PRESERVED_URL_PREFIX = /^(mailto:|tel:|#)/i;

export function localizeInternalUrl(
  url: string | null | undefined,
  locale: string | null | undefined
): string {
  const trimmedUrl = typeof url === "string" ? url.trim() : "";

  if (!trimmedUrl) return "#";
  if (
    EXTERNAL_OR_PROTOCOL_RELATIVE_URL.test(trimmedUrl) ||
    PRESERVED_URL_PREFIX.test(trimmedUrl)
  ) {
    return trimmedUrl;
  }

  const currentLocale = normalizeLocale(locale);
  const normalizedPath = trimmedUrl.startsWith("/") ? trimmedUrl : `/${trimmedUrl}`;

  if (normalizedPath === "/") return `/${currentLocale}`;

  const firstSegment = normalizedPath.slice(1).split(/[/?#]/)[0];
  if (isSupportedLocale(firstSegment)) {
    // Already locale-prefixed: still translate a known static slug so e.g.
    // "/de/special-offers" becomes "/de/sonderangebote".
    const rest = normalizedPath.slice(1 + firstSegment.length) || "/";
    const restFirstSegment = rest.slice(1).split(/[/?#]/)[0];
    const canonicalStaticSlug = getCanonicalStaticSlug(restFirstSegment);
    const suffix = rest.slice(1 + restFirstSegment.length);

    if (canonicalStaticSlug && !suffix.startsWith("/")) {
      return `${getLocalizedStaticPath(canonicalStaticSlug, firstSegment)}${suffix}`;
    }

    return `/${firstSegment}${localizeStaticPathSegment(rest, firstSegment)}`;
  }

  // Known static slugs get their per-locale form ("/special-offers" →
  // "/de/sonderangebote"); everything else passes through untouched.
  const canonicalStaticSlug = getCanonicalStaticSlug(firstSegment);
  const suffix = normalizedPath.slice(1 + firstSegment.length);

  if (canonicalStaticSlug && !suffix.startsWith("/")) {
    return `${getLocalizedStaticPath(canonicalStaticSlug, currentLocale)}${suffix}`;
  }

  return `/${currentLocale}${localizeStaticPathSegment(normalizedPath, currentLocale)}`;
}

/**
 * The site's Vercel address, which links typed into the CMS before the www
 * domain still name. It is this site, not another one: sent there, a visitor
 * left the production domain, and with it their language cookie, so the page
 * opened in English.
 */
const LEGACY_SITE_HOSTS = ["jes-egypt-tours.vercel.app"];

/**
 * Old names of static pages that CMS links still use. The middleware
 * redirects them too, but a link should not cost the visitor a redirect.
 */
const LEGACY_STATIC_SLUGS: Record<string, string> = { tailorMade: "tailor-made" };

/** This site's hosts, with and without www: the canonical one, the configured
 *  one, and its Vercel address. */
function getSiteHosts(): Set<string> {
  const hosts = new Set<string>(LEGACY_SITE_HOSTS);
  for (const base of [DEFAULT_SEO_BASE_URL, getSeoBaseUrl()]) {
    try {
      const host = new URL(base).hostname.toLowerCase().replace(/^www\./, "");
      hosts.add(host);
      hosts.add(`www.${host}`);
    } catch {
      // Not a URL: nothing to add.
    }
  }
  return hosts;
}

/** "/tailorMade" → "/tailor-made", "/en/tailorMade?x=1" → "/en/tailor-made?x=1";
 *  any other path is returned as it is. */
function withCurrentStaticSlug(path: string): string {
  const match = path.match(/^\/(?:([^/?#]+)\/)?([^/?#]+)([?#].*)?$/);
  if (!match) return path;
  const [, prefix, segment, rest = ""] = match;
  const current = LEGACY_STATIC_SLUGS[segment];
  if (!current || (prefix !== undefined && !isSupportedLocale(prefix))) return path;
  return `/${prefix !== undefined ? `${prefix}/` : ""}${current}${rest}`;
}

/**
 * A link typed into the CMS, as a visitor's page should use it.
 *
 * - A link to this site's own domain loses its origin. Typed as
 *   "https://www.jesegypttours.com/en/…", it left a preview deployment for
 *   production, and anywhere it reloaded the whole page. The same goes for
 *   the site's Vercel address and for the old name of a static page
 *   ("https://jes-egypt-tours.vercel.app/tailorMade").
 * - An internal link in another language takes the visitor's: a plain-string
 *   link is the English one for everybody, and a German visitor was sent to
 *   the English page. The site's redirects carry a dynamic slug to its
 *   translation (/de/egypt-tour-packages → /de/aegypten-rundreise), and
 *   static slugs are translated here (localizeInternalUrl).
 * - `external` is true only for another site: the only kind of link that
 *   should open in a new tab.
 */
export function resolveSiteLink(
  url: string | null | undefined,
  locale: string | null | undefined
): { href: string; external: boolean } {
  const trimmedUrl = typeof url === "string" ? url.trim() : "";

  if (!trimmedUrl) return { href: "#", external: false };
  if (PRESERVED_URL_PREFIX.test(trimmedUrl)) return { href: trimmedUrl, external: false };

  let path = trimmedUrl;
  if (EXTERNAL_OR_PROTOCOL_RELATIVE_URL.test(trimmedUrl)) {
    let parsed: URL;
    try {
      parsed = new URL(trimmedUrl, "https://invalid.invalid");
    } catch {
      return { href: trimmedUrl, external: true };
    }
    if (!getSiteHosts().has(parsed.hostname.toLowerCase())) {
      return { href: trimmedUrl, external: true };
    }
    path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  }

  const currentLocale = normalizeLocale(locale);
  const normalizedPath = withCurrentStaticSlug(path.startsWith("/") ? path : `/${path}`);
  const firstSegment = normalizedPath.slice(1).split(/[/?#]/)[0];
  const inVisitorLocale =
    isSupportedLocale(firstSegment) && firstSegment !== currentLocale
      ? `/${currentLocale}${normalizedPath.slice(1 + firstSegment.length)}`
      : normalizedPath;

  return { href: localizeInternalUrl(inVisitorLocale, currentLocale), external: false };
}
