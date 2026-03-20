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
