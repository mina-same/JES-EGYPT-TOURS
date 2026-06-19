import { ILocalizedString, ILocalizedMixed } from "@/types/tour";

/**
 * Extracts a locale-specific array without any cross-locale fallback.
 * If the current locale has no array (or an empty one), returns [].
 * Never merges or falls back to another locale's array.
 */
export function getLocalizedList(
  field: any,
  locale: string,
  fieldName?: string
): string[] {
  if (!field) return [];

  let raw: any;

  if (Array.isArray(field)) {
    // [{en: "...", de: "..."}, ...] — pick only the current locale key from each item
    raw = field
      .map((item: any) => item?.[locale])
      .filter((item: unknown): item is string => typeof item === "string" && item.trim().length > 0);
  } else {
    // { en: [...], de: [...] } — take only the current locale's array
    raw = field[locale];
  }

  if (!Array.isArray(raw)) {
    if (process.env.NODE_ENV === "development" && fieldName) {
      console.warn(`[i18n] Missing list for field "${fieldName}" in locale "${locale}"`);
    }
    return [];
  }

  const result = raw.filter(
    (item: unknown): item is string => typeof item === "string" && item.trim().length > 0
  );

  if (process.env.NODE_ENV === "development" && result.length === 0 && fieldName) {
    console.warn(`[i18n] Empty list for field "${fieldName}" in locale "${locale}"`);
  }

  return result;
}

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

/**
 * Ensures a URL is absolute and properly formatted
 */
export function formatUrl(url: string | undefined): string {
  if (!url || url === '#' || url === '') return '#';
  
  // If it's already an absolute URL (with protocol or leading slash), return as is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
    return url;
  }
  
  // Otherwise, prepend with a slash
  return `/${url}`;
}

