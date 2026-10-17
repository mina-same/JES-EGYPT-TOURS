import { getServerTranslation } from "@/lib/i18n-server";
import { Metadata } from "next";
import TailorMadeClient from "./TailorMadeClient";
import { getStaticLocaleAlternates } from "@/lib/seo/localeAlternates";
import { normalizeLocale, type SupportedLocale } from "@/lib/url";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getServerTranslation(locale, 'tailorMade');

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: getStaticLocaleAlternates(locale, "tailor-made"),
  };
}

/*
 * Country names in the page's language, for the country of residence and the
 * phone field's calling-code list. Read here, on the server, and handed to the
 * form: the server HTML and the browser then name every country identically
 * (no hydration mismatch), and the browser only receives the page's language.
 * English is already in the form's own bundle — it is what gets submitted.
 */
const COUNTRY_NAMES: Record<Exclude<SupportedLocale, "en">, () => Promise<{ default: Record<string, string> }>> = {
  de: () => import("react-phone-number-input/locale/de.json"),
  it: () => import("react-phone-number-input/locale/it.json"),
  es: () => import("react-phone-number-input/locale/es.json"),
};

export default async function TailorMadePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = normalizeLocale((await params).locale);
  const countryNames = locale === "en" ? undefined : (await COUNTRY_NAMES[locale]()).default;
  return <TailorMadeClient countryNames={countryNames} />;
}
