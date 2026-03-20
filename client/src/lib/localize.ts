import { ILocalizedString, ILocalizedMixed } from "@/types/tour";

/**
 * Extracts the correct localized string based on the current locale.
 * Falls back to English if the translation is missing.
 */
export function getLocalizedValue(
  localizedObj: ILocalizedString | ILocalizedMixed | string | undefined,
  locale: string = 'en'
): any {
  if (!localizedObj) return "";
  
  // If it's already a string, just return it (backwards compatibility)
  if (typeof localizedObj === 'string') return localizedObj;
  
  // Cast to record for dynamic access
  const data = localizedObj as Record<string, any>;
  
  // Try current locale, then English, then any available, finally empty string
  return data[locale] || data['en'] || Object.values(data)[0] || "";
}

/**
 * Extracts a specific SEO field from a localized SEO object
 */
export function getLocalizedSEO(seo: any, locale: string = 'en') {
  if (!seo) return null;
  
  return {
    metaTitle: getLocalizedValue(seo.metaTitle, locale),
    metaDescription: getLocalizedValue(seo.metaDescription, locale),
    metaKeywords: Array.isArray(seo.metaKeywords) 
      ? seo.metaKeywords.map((k: any) => getLocalizedValue(k, locale)).join(', ')
      : getLocalizedValue(seo.metaKeywords, locale),
    metaImage: seo.metaImage,
  };
}
