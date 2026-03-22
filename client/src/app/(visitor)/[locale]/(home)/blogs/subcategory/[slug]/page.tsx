import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import DynamicBlogGrid from "@/components/sections/DynamicBlogGrid/DynamicBlogGrid";
import { getBlogsBySubCategory, getSubCategoryBySlug, BlogCategory } from "@/lib/api/blog";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import { notFound, permanentRedirect } from "next/navigation";
import { getLocalizedValue } from "@/lib/localize";
import { SlugManager } from "@/components/common/SlugManager";
import enBlogs from "@/i18n/locales/en/blogs.json";
import deBlogs from "@/i18n/locales/de/blogs.json";
import itBlogs from "@/i18n/locales/it/blogs.json";
import esBlogs from "@/i18n/locales/es/blogs.json";

const translations: any = { en: enBlogs, de: deBlogs, it: itBlogs, es: esBlogs };

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  try {
    const { slug, locale } = await params;
    const subcategory = await getSubCategoryBySlug(slug);
    const title = getLocalizedValue(subcategory.seo?.metaTitle, locale) ||
      (getLocalizedValue(subcategory.name, locale) ? `${getLocalizedValue(subcategory.name, locale)} - Travel Blog | JES Egypt Tours` : '');
    const rawDesc = getLocalizedValue(subcategory.seo?.metaDescription, locale) ||
      getLocalizedValue(subcategory.description, locale);
    const description = rawDesc ? rawDesc.replace(/<[^>]*>?/gm, '') : "";

    return {
      title,
      description,
      robots: "noindex, nofollow",
    };

  } catch (error) {
    return {
      title: "Subcategory Not Found",
    };
  }
}

export default async function BlogSubCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const { slug, locale } = await params;
  const t = (key: string) => translations[locale]?.[key] || translations['en'][key];

  let subcategory: any;
  let blogsData;

  let correctSlug = '';
  try {
    subcategory = await getSubCategoryBySlug(slug);
    blogsData = await getBlogsBySubCategory(slug, page, 9);
    correctSlug = getLocalizedValue(subcategory.slug, locale);
  } catch (error) {
    notFound();
  }

  if (correctSlug && correctSlug !== slug && correctSlug !== '') {
    permanentRedirect(`/${locale}/blogs/subcategory/${correctSlug}`);
  }

  const parentName = typeof subcategory.category === 'object' ? getLocalizedValue((subcategory.category as any).name, locale) : '';


  return (
    <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <SlugManager slugs={typeof subcategory.slug === 'object' ? subcategory.slug : { en: slug }} />
      <PageHeader title={getLocalizedValue(subcategory.name, locale)} subTitle={parentName || t('blogCategory')} />

      <DynamicBlogGrid
        blogs={blogsData.data}
        pagination={blogsData.pagination}
        basePath={`/blogs/subcategory/${slug}`}
      />
      <FooterOne />
    </Layout>
  );
}
