import type { Metadata } from "next";
import { getServerTranslation } from "@/lib/i18n-server";
import { getStaticLocaleAlternates } from "@/lib/seo/localeAlternates";

// Metadata-only layout: the /tours listing is a client component and can't
// export metadata itself, so canonical + hreflang for the 4 locales live here.
// Renders children untouched (no DOM change). robots (noindex during dev) is
// inherited from the [locale] root layout and intentionally not overridden.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslation(locale, "tours");
  return {
    title: t("pageMetaTitle"),
    description: t("pageMetaDescription"),
    alternates: getStaticLocaleAlternates(locale, "tours"),
  };
}

export default function ToursLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
