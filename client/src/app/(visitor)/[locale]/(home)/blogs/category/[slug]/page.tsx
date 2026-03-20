import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import FooterOne from "@/components/layout/FooterOne/FooterOne";
import Layout from "@/components/layout/Layout/Layout";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import DynamicBlogGrid from "@/components/sections/DynamicBlogGrid/DynamicBlogGrid";
import { getBlogsByCategory, getCategoryBySlug } from "@/lib/api/blog";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import { notFound } from "next/navigation";
import { getLocalizedValue } from "@/lib/localize";


export async function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const category = await getCategoryBySlug(params.slug);
    const title = getLocalizedValue(category.seo?.metaTitle) || 
                  (getLocalizedValue(category.name) ? `${getLocalizedValue(category.name)} - Travel Blog | JES Egypt Tours` : '');
    const description = getLocalizedValue(category.seo?.metaDescription) || 
                        getLocalizedValue(category.description);
    
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
  params: { slug: string };
  searchParams: Promise<{ page?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const { slug } = params;

  let category;
  let blogsData;

  try {
    category = await getCategoryBySlug(slug);
    blogsData = await getBlogsByCategory(slug, page, 9);
  } catch (error) {
    notFound();
  }

  return (
    <Layout>
      <TopbarOne/>
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <PageHeader title={getLocalizedValue(category.name)} subTitle='Blog Category' />

      <DynamicBlogGrid 
        blogs={blogsData.data} 
        pagination={blogsData.pagination}
        basePath={`/blogs/category/${slug}`}
      />
      <FooterOne />
    </Layout>
  );
}
