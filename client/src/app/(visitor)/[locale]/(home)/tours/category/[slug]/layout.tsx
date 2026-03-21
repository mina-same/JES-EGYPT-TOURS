import { tourCategoryAPI } from "@/lib/api/tour";
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
    const res = await tourCategoryAPI.getBySlug(slug);
    if (res?.success && res?.data) {
      const title = getLocalizedValue(res.data.metaTitle || res.data.name, locale);
      const description = getLocalizedValue(res.data.metaDescription || res.data.description, locale);
      return { 
        title: title ? `${title} | JES Egypt Tours` : "Tour Category | JES Egypt Tours", 
        description 
      };
    }
  } catch (err) {
    // Ignore errors for metadata
  }
  return { title: "Category Not Found | JES Egypt Tours" };
}

export default async function TourCategoryLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode; 
  params: Promise<{ slug: string; locale: string }> 
}) {
  const { slug, locale } = await params;
  
  let correctSlug = '';
  try {
    const res = await tourCategoryAPI.getBySlug(slug);

    if (res?.success && res?.data) {
      correctSlug = getLocalizedValue(res.data.slug, locale);
    }
  } catch (err) {
    // Ignore layout errors, let the client component render "Not Found" state
  }

  if (correctSlug && correctSlug !== slug && correctSlug !== '') {
    permanentRedirect(`/${locale}/tours/category/${correctSlug}`);
  }

  return <>{children}</>;
}
