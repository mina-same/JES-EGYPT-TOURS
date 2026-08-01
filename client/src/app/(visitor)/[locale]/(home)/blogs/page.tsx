import { getCategories, getSubCategoriesByCategory } from "@/lib/api/blog";
import BlogsHubView, { type BlogCategoryWithSubs } from "./_views/BlogsHubView";

/**
 * Server component. This page used to be a client component that fetched its
 * categories in an effect, so the HTML shipped empty — 1.2 KB of chrome, no
 * category, no article link — while the page is listed in the sitemap. The
 * fetch now happens here, so the directory is in the markup on first byte.
 *
 * The API returns these records raw (all four languages), which is on purpose:
 * `getStrictLocalizedSlug` needs the untouched slug object to decide whether a
 * category exists in the visitor's language at all.
 */
async function getCategoryDirectory(): Promise<BlogCategoryWithSubs[]> {
  try {
    const categories = await getCategories();
    if (!Array.isArray(categories)) return [];

    return await Promise.all(
      categories.map(async (category: any) => {
        try {
          const subcategories = await getSubCategoriesByCategory(category._id);
          return { ...category, subcategories: Array.isArray(subcategories) ? subcategories : [] };
        } catch {
          // One failing category must not blank out the whole directory.
          return { ...category, subcategories: [] };
        }
      })
    );
  } catch (error) {
    console.error("Failed to load the blog category directory:", error);
    return [];
  }
}

export default async function BlogCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const categories = await getCategoryDirectory();

  return <BlogsHubView categories={categories} locale={locale} />;
}
