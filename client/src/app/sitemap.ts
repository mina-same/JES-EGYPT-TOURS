import { MetadataRoute } from 'next';
import { API_URL } from '@/config/api';

const locales = ['en', 'de', 'it', 'es'];
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://jesegypttours.com';

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
  tourSlugs.forEach((slug: string) => {
    locales.forEach((locale) => {
      entries.push({
        url: `${baseUrl}/${locale}/tours/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      });
    });
  });

  // 3. Blogs
  blogSlugs.forEach((slug: string) => {
    locales.forEach((locale) => {
      entries.push({
        url: `${baseUrl}/${locale}/blogs/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    });
  });

  return entries;
}
