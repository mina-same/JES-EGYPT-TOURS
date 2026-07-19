// Site-level Open Graph defaults shared by every page's generateMetadata:
// og:site_name (brand shown by Facebook/WhatsApp/LinkedIn next to the link),
// og:locale (confirms the page language to the platforms), and
// og:locale:alternate (tells them the other language versions exist).
export const OG_SITE_NAME = 'JES Egypt Tours';

const OG_LOCALES: Record<string, string> = {
  en: 'en_US',
  de: 'de_DE',
  it: 'it_IT',
  es: 'es_ES',
};

export function ogSiteDefaults(locale: string) {
  const current = OG_LOCALES[locale] || OG_LOCALES.en;
  return {
    siteName: OG_SITE_NAME,
    locale: current,
    alternateLocale: Object.values(OG_LOCALES).filter((l) => l !== current),
  };
}
