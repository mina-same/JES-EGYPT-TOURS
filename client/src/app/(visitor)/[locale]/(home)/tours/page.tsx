import { API_URL } from "@/config/api";
import ToursHubView, { type CategoryWithSubcategories } from "./_views/ToursHubView";

/**
 * Server component. This page used to fetch its categories from an effect, so
 * the HTML shipped empty even though the page is listed in the sitemap for all
 * four languages. The fetch happens here now.
 *
 * Plain `fetch` rather than the axios client: that one is built for the
 * browser. Records stay raw (all four languages) because
 * `getStrictLocalizedSlug` needs the untouched slug object to know whether a
 * category exists in the visitor's language at all.
 */
async function getJson(path: string) {
  /*
   * X-Locale: bypass, because this page genuinely wants the RAW records.
   *
   * ToursHubView localizes them itself — getDisplayName(category, locale) and
   * getLocalizedValue(category.name, locale) — and getStrictLocalizedSlug needs
   * the untouched slug object to tell whether a category exists in the
   * visitor's language at all.
   *
   * Sending no header did NOT achieve that. The API resolves a missing
   * X-Locale to 'en', which collapses `name` to an English string, so
   * getDisplayName had nothing left to choose from and every locale rendered
   * English card titles — beside a header menu that was correctly German,
   * because the menu fetch does send the header. `bypass` is the documented
   * way to ask for all four languages at once.
   */
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate: 3600 },
    headers: { 'X-Locale': 'bypass' },
  });
  if (!res.ok) throw new Error(`Request failed: ${path}`);
  return res.json();
}

async function getCategoryDirectory(): Promise<CategoryWithSubcategories[]> {
  try {
    const categories = await getJson("/tours/categories?isActive=true&limit=100");
    if (!categories?.success || !Array.isArray(categories.data)) return [];

    return await Promise.all(
      categories.data.map(async (category: any) => {
        try {
          const subs = await getJson(`/tours/categories/${category._id}/subcategories`);
          return {
            ...category,
            subcategories: subs?.success && Array.isArray(subs.data) ? subs.data : [],
          };
        } catch {
          // One failing category must not blank out the whole directory.
          return { ...category, subcategories: [] };
        }
      })
    );
  } catch (error) {
    console.error("Failed to load the tour category directory:", error);
    return [];
  }
}

export default async function TourCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const categories = await getCategoryDirectory();

  return <ToursHubView categories={categories} locale={locale} />;
}
