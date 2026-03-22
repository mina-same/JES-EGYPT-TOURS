import { tourSubcategoryAPI } from "@/lib/api/tour";
import { getLocalizedValue } from "@/lib/localize";
import { redirect, permanentRedirect } from "next/navigation";
import { Metadata } from "next";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string; locale: string }> 
}): Promise<Metadata> {
  const { slug, locale } = await params;
  try {
    const res = await tourSubcategoryAPI.getBySlug(slug);
    if (res?.success && res?.data) {
      const title = getLocalizedValue(res.data.metaTitle || res.data.name, locale);
      const rawDesc = getLocalizedValue(res.data.metaDescription || res.data.description, locale);
      const description = rawDesc ? rawDesc.replace(/<[^>]*>?/gm, '') : "";
      return { 
        title: title ? `${title} | JES Egypt Tours` : "Tour Subcategory | JES Egypt Tours", 
        description 
      };
    }
  } catch (err) {
    // Ignore errors for metadata
  }
  return { title: "Subcategory Not Found | JES Egypt Tours" };
}

export default async function TourSubcategoryLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode; 
  params: Promise<{ slug: string; locale: string }> 
}) {
  const { slug, locale } = await params;
  
  let correctSlug = '';
  try {
    const res = await tourSubcategoryAPI.getBySlug(slug);

    if (res?.success && res?.data) {
      correctSlug = getLocalizedValue(res.data.slug, locale);
    }
  } catch (err) {
    // Ignore layout errors, let the client component render "Not Found" state
  }

  if (correctSlug && correctSlug !== slug && correctSlug !== '') {
    permanentRedirect(`/${locale}/tours/subcategory/${correctSlug}`);
  }

  return <>{children}</>;
}
