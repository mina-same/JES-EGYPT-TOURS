import { getServerTranslation } from "@/lib/i18n-server";
import { Metadata } from "next";
import TailorMadeClient from "./TailorMadeClient";
import { getStaticLocaleAlternates } from "@/lib/seo/localeAlternates";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslation(locale, 'tailorMade');
  
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    icons: {
      icon: "/favicon-32x32.png",
    },
    alternates: getStaticLocaleAlternates(locale, "tailor-made"),
  };
}

export default async function TailorMadePage({ params }: { params: Promise<{ locale: string }> }) {
  // Pass down locale to client component if needed, or let it handle its own translations
  return <TailorMadeClient />;
}
