import type { Metadata } from "next";
import { getServerTranslation } from "@/lib/i18n-server";
import { getStaticLocaleAlternates } from "@/lib/seo/localeAlternates";

// Metadata-only layout: the /blogs listing is a client component and can't
// export metadata itself, so canonical + hreflang for the 4 locales live here.
// Renders children untouched; robots (noindex during dev) is inherited from
// the [locale] root layout.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslation(locale, "blogs");
  return {
    title: t("pageMetaTitle"),
    description: t("pageMetaDescription"),
    alternates: getStaticLocaleAlternates(locale, "blogs"),
  };
}

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
