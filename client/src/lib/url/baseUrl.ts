// Canonical host is the www apex — production 308-redirects non-www → www,
// so every canonical/hreflang/sitemap/og URL must name the www form to avoid
// pointing search engines at a redirecting host.
export const DEFAULT_SEO_BASE_URL = "https://www.jesegypttours.com";

export function getSeoBaseUrl(baseUrl: string | undefined = process.env.NEXT_PUBLIC_BASE_URL): string {
  return (baseUrl || DEFAULT_SEO_BASE_URL).trim().replace(/\/+$/g, "");
}
