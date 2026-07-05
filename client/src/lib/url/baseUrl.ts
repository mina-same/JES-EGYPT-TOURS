export const DEFAULT_SEO_BASE_URL = "https://jesegypttours.com";

export function getSeoBaseUrl(baseUrl: string | undefined = process.env.NEXT_PUBLIC_BASE_URL): string {
  return (baseUrl || DEFAULT_SEO_BASE_URL).trim().replace(/\/+$/g, "");
}
