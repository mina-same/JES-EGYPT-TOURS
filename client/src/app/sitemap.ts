import { MetadataRoute } from 'next';
import { getSitemapData } from '@/lib/api/sitemap';
import { buildSitemapEntries } from '@/lib/seo/sitemapEntries';
import { getSeoBaseUrl } from '@/lib/url';

/*
 * Rendered on request, never at build time.
 *
 * As a static route this file was prerendered by `next build`, and its reads —
 * carrying no cache options — were stored for a year with no tag. The fetch
 * cache survives rebuilds, so the next build reused them: new, unpublished or
 * renamed pages could stay out of the sitemap indefinitely, whatever the
 * editors did. Rendering per request moves the data's freshness to where every
 * other page keeps it: one tagged read with an hour's backstop
 * (lib/api/sitemap.ts). A request costs a Data Cache hit and building a few
 * hundred entries, and a build no longer needs the API to be up.
 */
export const dynamic = 'force-dynamic';

/**
 * Throws when the data cannot be read, so the response is an error rather than
 * a sitemap that has quietly lost its tours and articles.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getSitemapData();
  return buildSitemapEntries(data, getSeoBaseUrl());
}
