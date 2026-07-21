import { MetadataRoute } from 'next';
import { getSeoBaseUrl } from '@/lib/url/baseUrl';

// The site is intentionally kept OUT of search indexes during development.
// It stays FULLY blocked (Disallow: /) unless NEXT_PUBLIC_SITE_INDEXABLE is
// explicitly set to 'true' at launch. The default (unset) is always blocked,
// so nothing is exposed now. Mirrors the robots meta flag in
// src/app/(visitor)/[locale]/layout.tsx.
//
// /admin is ALWAYS disallowed regardless of the flag, matching the
// X-Robots-Tag: noindex applied to /admin* in src/middleware.ts.
const siteIndexable = process.env.NEXT_PUBLIC_SITE_INDEXABLE === 'true';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSeoBaseUrl();

  if (!siteIndexable) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
      sitemap: `${baseUrl}/sitemap.xml`,
    };
  }

  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/admin/'] }],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
