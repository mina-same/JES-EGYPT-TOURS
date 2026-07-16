import { isSupportedLocale, normalizeLocale } from "./locales";
import { localizeStaticPathSegment } from "./staticSlugs";

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
    return `/${firstSegment}${localizeStaticPathSegment(rest, firstSegment)}`;
  }

  // Known static slugs get their per-locale form ("/special-offers" →
  // "/de/sonderangebote"); everything else passes through untouched.
  return `/${currentLocale}${localizeStaticPathSegment(normalizedPath, currentLocale)}`;
}
