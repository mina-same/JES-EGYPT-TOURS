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

/** This site's hosts, with and without www: the canonical one and the configured one. */
function getSiteHosts(): Set<string> {
  const hosts = new Set<string>();
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

/**
 * A link typed into the CMS, as a visitor's page should use it.
 *
 * - A link to this site's own domain loses its origin. Typed as
 *   "https://www.jesegypttours.com/en/…", it left a preview deployment for
 *   production, and anywhere it reloaded the whole page.
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
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const firstSegment = normalizedPath.slice(1).split(/[/?#]/)[0];
  const inVisitorLocale =
    isSupportedLocale(firstSegment) && firstSegment !== currentLocale
      ? `/${currentLocale}${normalizedPath.slice(1 + firstSegment.length)}`
      : normalizedPath;

  return { href: localizeInternalUrl(inVisitorLocale, currentLocale), external: false };
}
