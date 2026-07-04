import { MetadataRoute } from 'next';
import { API_URL } from '@/config/api';

const locales = ['en', 'de', 'it', 'es'];
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://jesegypttours.com';

function getStrictLocalizedSlug(slugs: unknown, locale: string): string | null {
  if (!slugs) return null;

  if (typeof slugs === 'string') {
    return locale === 'en' && slugs.trim() ? slugs.trim().replace(/^\/+|\/+$/g, '') : null;
  }

  if (typeof slugs !== 'object') return null;

  const value = (slugs as Record<string, unknown>)[locale];
  if (typeof value !== 'string') return null;

  const normalized = value.trim().replace(/^\/+|\/+$/g, '');
  return normalized || null;
}

function addLocalizedUrls(
  entries: MetadataRoute.Sitemap,
  slugs: unknown,
  options: {
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  }
) {
  locales.forEach((locale) => {
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

// Fetch all tour slugs
async function getTourSlugs() {
  try {
    const res = await fetch(`${API_URL}/tours?limit=1000&fields=slug`);
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

  const staticPages = ['', '/about', '/contact', '/faq', '/tours', '/blogs'];
  
  const entries: MetadataRoute.Sitemap = [];

  // 1. Static Pages
  staticPages.forEach((path) => {
    locales.forEach((locale) => {
      entries.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: path === '' ? 1 : 0.8,
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
