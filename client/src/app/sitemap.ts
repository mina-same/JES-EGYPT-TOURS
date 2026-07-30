import { MetadataRoute } from 'next';
import { API_URL } from '@/config/api';
import { getLocalizedStaticPath, getSeoBaseUrl, getStrictLocalizedSlug, SUPPORTED_LOCALES } from '@/lib/url';

const baseUrl = getSeoBaseUrl();

function addLocalizedUrls(
  entries: MetadataRoute.Sitemap,
  slugs: unknown,
  options: {
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  }
) {
  SUPPORTED_LOCALES.forEach((locale) => {
    const localizedSlug = getStrictLocalizedSlug(slugs, locale);
    if (!localizedSlug) return;

    entries.push({
      url: `${baseUrl}/${locale}/${localizedSlug}`,
      lastModified: new Date(),
      changeFrequency: options.changeFrequency,
      priority: options.priority,
    });
  });
}

// Fetch all tour slugs. Without a header the API's i18n middleware collapses
// localized slug objects to plain EN strings, which made every non-EN tour
// URL vanish from the sitemap — `X-Locale: bypass` returns the RAW
// { en, de, it, es } objects so addLocalizedUrls can emit all locales.
async function getTourSlugs() {
  try {
    const res = await fetch(`${API_URL}/tours?limit=1000&fields=slug`, {
      headers: { 'X-Locale': 'bypass' },
    });
    const data = await res.json();
    return data.success ? data.data.map((t: any) => t.slug) : [];
  } catch (error) {
    console.error('Sitemap: Failed to fetch tours', error);
    return [];
  }
}

// Fetch all blog slugs
async function getBlogSlugs() {
  try {
    const res = await fetch(`${API_URL}/blog/posts?limit=1000&fields=slug`);
    const data = await res.json();
    // Blog API structure is slightly different based on the lib/api/blog.ts
    const posts = data.data || [];
    return posts.map((p: any) => p.slug);
  } catch (error) {
    console.error('Sitemap: Failed to fetch blogs', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tourSlugs = await getTourSlugs();
  const blogSlugs = await getBlogSlugs();

  // NOTE: pages with a per-locale slug are NOT listed here — they go through
  // the localized block below so the sitemap emits the final (non-redirecting)
  // URL for every language.
  const staticPages = ['', '/faq', '/tours', '/blogs', '/privacy-policy'];
  
  const entries: MetadataRoute.Sitemap = [];

  // 1. Static Pages
  staticPages.forEach((path) => {
    SUPPORTED_LOCALES.forEach((locale) => {
      entries.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: path === '' ? 1 : path === '/privacy-policy' ? 0.4 : 0.8,
      });
    });
  });

  // 1b. Static pages with per-locale slugs (see lib/url/staticSlugs).
  ['special-offers', 'tailor-made', 'contact', 'about', 'travel-trade'].forEach((canonicalSlug) => {
    SUPPORTED_LOCALES.forEach((locale) => {
      entries.push({
        url: `${baseUrl}${getLocalizedStaticPath(canonicalSlug, locale)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    });
  });

  // 2. Tours
  tourSlugs.forEach((slugObj: any) => {
    addLocalizedUrls(entries, slugObj, {
      changeFrequency: 'daily',
      priority: 0.9,
    });
  });

  // 3. Blogs
  blogSlugs.forEach((slug: any) => {
    addLocalizedUrls(entries, slug, {
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  });

  return entries;
}
