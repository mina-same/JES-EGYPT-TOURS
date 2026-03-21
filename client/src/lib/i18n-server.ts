/**
 * Server-side translation helper for Next.js App Router.
 * This loads the i18n JSON namespaces so Server Components and Metadata generators 
 * can use localized strings without breaking React Server Components conventions.
 */

export async function getServerTranslation(locale: string = 'en', namespace: string = 'common') {
  try {
    // Dynamically import the namespace for the specified locale
    let dict;
    switch (locale) {
      case 'de':
        dict = await import(`@/i18n/locales/de/${namespace}.json`);
        break;
      case 'it':
        dict = await import(`@/i18n/locales/it/${namespace}.json`);
        break;
      case 'es':
        dict = await import(`@/i18n/locales/es/${namespace}.json`);
        break;
      case 'en':
      default:
        dict = await import(`@/i18n/locales/en/${namespace}.json`);
        break;
    }
    
    // Return a 't' function that mimics useTranslation hooks for nested keys like 'pageTitle'
    return {
      t: (key: string) => {
        const keys = key.split('.');
        let value: any = dict.default || dict;
        
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            return key; // Fallback to the requested key name if missing
          }
        }
        
        return typeof value === 'string' ? value : key;
      }
    };
  } catch (error) {
    console.error(`Failed to load server translations for locale: ${locale}, namespace: ${namespace}`, error);
    
    // Fallback translation function that just returns the key if something breaks
    return {
      t: (key: string) => key
    };
  }
}
