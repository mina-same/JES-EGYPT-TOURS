import { Schema } from 'mongoose';

/**
 * Interface for localized strings (titles, headings, etc.)
 */
export interface ILocalizedString {
  en: string;
  de?: string;
  it?: string;
  es?: string;
}

/**
 * Interface for localized mixed content (HTML descriptions, FAQ answers, etc.)
 */
export interface ILocalizedMixed {
  en: any;
  de?: any;
  it?: any;
  es?: any;
}

/**
 * Per-language OG completion: each language's OG falls back to the SAME
 * language's meta value (never English-to-all). Only empty languages are
 * filled — hand-written OG text is always preserved. Returns the original
 * value untouched when the merge would produce an invalid subdoc (no `en`,
 * which LocalizedStringSchema requires).
 */
export const completeOgFromMeta = (
  og: ILocalizedString | undefined | null,
  meta: ILocalizedString | undefined | null
): ILocalizedString | undefined => {
  const pick = (lang: 'en' | 'de' | 'it' | 'es'): string => {
    const own = og?.[lang];
    if (typeof own === 'string' && own.trim()) return own;
    const fromMeta = meta?.[lang];
    if (typeof fromMeta === 'string' && fromMeta.trim()) return fromMeta;
    return '';
  };
  const merged = { en: pick('en'), de: pick('de'), it: pick('it'), es: pick('es') };
  if (!merged.en) return og || undefined;
  return merged;
};

/**
 * Reusable Mongoose schema for localized strings
 */
export const LocalizedStringSchema = new Schema(
  {
    en: {
      type: String,
      required: [true, 'English version is required'],
      trim: true,
    },
    de: {
      type: String,
      trim: true,
    },
    it: {
      type: String,
      trim: true,
    },
    es: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

/**
 * Reusable Mongoose schema for localized mixed content (HTML)
 */
export const LocalizedMixedSchema = new Schema(
  {
    en: {
      type: Schema.Types.Mixed,
      required: [true, 'English version is required'],
    },
    de: {
      type: Schema.Types.Mixed,
    },
    it: {
      type: Schema.Types.Mixed,
    },
    es: {
      type: Schema.Types.Mixed,
    },
  },
  { _id: false }
);
