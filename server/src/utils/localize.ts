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

  // Dates are value objects, not nested content. Recursing through a Date
  // produces an empty object because it has no enumerable properties, which
  // then reaches the client as `{}` and renders as "NaN / Invalid Date".
  if (data instanceof Date) {
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

/**
 * Localizes a document, or a list of them, for the visitor's locale while keeping
 * every `slug` as its raw { en, de, it, es } object — at ANY depth, so populated
 * categories, subcategories and sibling lists keep working too.
 *
 * These endpoints used to return everything raw. Not by oversight: the client
 * builds per-locale URLs with getStrictLocalizedSlug(entity.slug, locale), the
 * language switcher needs the current page's slug in the target language, and
 * generateMetadata needs every locale's slug for the hreflang alternates. A
 * flattened slug reads as English-only, which hides content on the de/it/es
 * pages and breaks language switching.
 *
 * The cost was that every visitor downloaded all four languages of every text
 * field. Translating everything EXCEPT the one field that genuinely must stay
 * raw keeps the URLs correct and drops the other three locales from the payload.
 */
/*
 * Fields that must reach the client as the RAW { en, de, it, es } object.
 *
 * - slug        the client builds per-locale URLs, hreflang alternates and the
 *               language switcher from it; a flattened slug reads as
 *               English-only and hides content on the de/it/es pages.
 * - faqs        the visitor pages pick `question[locale]` / `answer[locale]`
 *               DIRECTLY and drop any row the active language is missing. That
 *               is deliberate: an unanswered question stays hidden instead of
 *               appearing in English. Flattening these silently empties the FAQ
 *               section, because `"text"[locale]` is undefined. They are still
 *               narrowed — see narrowFaqsToLocale — the OBJECT shape survives,
 *               only the other languages go.
 * - contentBlocks  same rule for article bodies. The editor intentionally leaves
 *               blocks empty in a language so they do NOT render there, and the
 *               page decides that by reading `content[locale]` itself. Localizing
 *               here would fall back to English and publish blocks that were
 *               meant to stay hidden.
 *
 * The shared rule: anything the client resolves per-locale ITSELF must stay raw,
 * because localize() falls back to English and would turn "deliberately empty"
 * into "shows another language".
 */
const PRESERVE_RAW = new Set(['slug', 'contentBlocks']);

const localeText = (field: any, locale: string): string =>
  typeof field?.[locale] === 'string' ? field[locale].trim() : '';

/**
 * Applies the visitor pages' own FAQ rule on the server: a row is shown only
 * when THIS language has both a question and an answer, and a row that lacks
 * either stays hidden rather than falling back to English.
 *
 * Rows that survive keep the { locale: text } OBJECT shape — deliberately not a
 * bare string. Every renderer (ListingFaqs, useTourData, DynamicBlogDetails and
 * the FAQPage JSON-LD) reads `question[locale]` itself, so flattening would make
 * `"text"[locale]` undefined and silently empty the whole FAQ section.
 *
 * Keep this in step with those renderers: same condition, same outcome.
 */
export const narrowFaqsToLocale = (faqs: any, locale: string): any => {
  if (!Array.isArray(faqs)) return faqs;
  if (!locale || locale === 'bypass') return faqs;

  return faqs
    .filter((row) => localeText(row?.question, locale) && localeText(row?.answer, locale))
    .map((row) => {
      const plain = row?.toObject ? row.toObject() : row;
      return {
        ...plain,
        question: { [locale]: plain.question[locale] },
        answer: { [locale]: plain.answer[locale] },
      };
    });
};

export const localizePreservingSlugs = (data: any, locale: string): any => {
  if (!locale || locale === 'bypass') return data;
  if (!data || typeof data !== 'object') return data;

  // Value objects, not nested content. Recursing into a Date has no enumerable
  // properties and yields `{}`, which renders as "Invalid Date"; an ObjectId
  // would likewise be shredded into its internal buffer.
  if (data instanceof Date || typeof (data as any).toHexString === 'function') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => localizePreservingSlugs(item, locale));
  }

  const plain = data.toObject ? data.toObject() : data;

  // A localized field itself ({ en, de, … }) — hand it to the normal localizer.
  if (
    plain.en !== undefined &&
    Object.keys(plain).every((k) => ['en', 'de', 'it', 'es'].includes(k))
  ) {
    return localize(plain, locale);
  }

  const out: any = {};
  for (const [key, value] of Object.entries(plain)) {
    // PRESERVE_RAW fields stay multi-locale, and `_`-prefixed keys (_id, __v)
    // are internal — both pass through untouched, matching localize().
    if (PRESERVE_RAW.has(key) || key.startsWith('_')) {
      out[key] = value;
    } else if (key === 'faqs') {
      // Keeps the object shape the renderers need, minus the other languages.
      out[key] = narrowFaqsToLocale(value, locale);
    } else {
      out[key] = localizePreservingSlugs(value, locale);
    }
  }
  return out;
};

/** @deprecated Use {@link localizePreservingSlugs} — it also covers nested slugs. */
export const localizeKeepingSlug = <T>(data: T[], locale: string): any[] =>
  localizePreservingSlugs(data, locale);
