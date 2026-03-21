import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import DynamicBlogGrid from "@/components/sections/DynamicBlogGrid/DynamicBlogGrid";
import { getBlogsByCategory, getCategoryBySlug } from "@/lib/api/blog";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import { notFound, permanentRedirect } from "next/navigation";
import { getLocalizedValue } from "@/lib/localize";
import { SlugManager } from "@/components/common/SlugManager";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  try {
    const { slug, locale } = await params;
    const category = await getCategoryBySlug(slug);
    const title = getLocalizedValue(category.seo?.metaTitle, locale) || 
                  (getLocalizedValue(category.name, locale) ? `${getLocalizedValue(category.name, locale)} - Travel Blog | JES Egypt Tours` : '');
    const description = getLocalizedValue(category.seo?.metaDescription, locale) || 
                        getLocalizedValue(category.description, locale);
    
    return {
      title,
      description,
      robots: "noindex, nofollow",
    };

  } catch (error) {
    return {
      title: "Category Not Found",
    };
  }
}

export default async function BlogCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const { slug, locale } = await params;

  let category;
  let blogsData;

  let correctSlug = '';
  try {
    category = await getCategoryBySlug(slug);
    blogsData = await getBlogsByCategory(slug, page, 9);
    correctSlug = getLocalizedValue(category.slug, locale);
  } catch (error) {
    notFound();
  }

  if (correctSlug && correctSlug !== slug && correctSlug !== '') {
    permanentRedirect(`/${locale}/blogs/category/${correctSlug}`);
  }

  return (
    <Layout>
      <TopbarOne/>
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <SlugManager slugs={typeof category.slug === 'object' ? category.slug : { en: slug }} />
      <PageHeader title={getLocalizedValue(category.name, locale)} subTitle='Blog Category' />

      <DynamicBlogGrid 
        blogs={blogsData.data} 
        pagination={blogsData.pagination}
        basePath={`/blogs/category/${slug}`}
      />
      <FooterOne />
    </Layout>
  );
}
