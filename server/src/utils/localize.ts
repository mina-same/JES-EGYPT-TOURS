/**
 * Recursively localizes a data object (or array of objects) by extracting
 * the content for the requested locale from localized fields.
 * 
 * Localized fields are expected to be objects like { en: "Content", de: "Inhalt" }.
 */
export const localize = (data: any, locale: string): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // If locale is not provided or set to 'bypass', return raw data (all languages)
  if (!locale || locale === 'bypass') {
    return data;
  }

  // If it's an array, localize each element
  if (Array.isArray(data)) {
    return data.map((item) => localize(item, locale));
  }

  // Mongoose documents need to be converted to plain objects (lean() or toObject())
  const obj = data.toObject ? data.toObject() : data;

  // Check if this object is a localized field itself (it has an 'en' key and optional 'de', 'it')
  // We assume that if an object has 'en' and it's a string or mixed content, it's a translation object.
  // This is a heuristic that works with our LocalizedSchema.
  if (obj.en !== undefined && (Object.keys(obj).every(k => ['en', 'de', 'it', 'es'].includes(k)))) {
    return obj[locale] || obj.en;
  }

  // Otherwise, recursively localize all keys in the object
  const localizedObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip internal Mongoose fields and _id
    if (key.startsWith('_')) {
        localizedObj[key] = value;
        continue;
    }
    
    localizedObj[key] = localize(value, locale);
  }

  return localizedObj;
};
