import { Schema } from 'mongoose';
import { ILocalizedString, OptionalLocalizedStringSchema } from './LocalizedSchema';

/**
 * Unified Image Interface used across all models
 * This ensures consistency in image handling throughout the application
 */
export interface IImage {
  url: string;
  fileName: string;
  title?: ILocalizedString;
  alt?: ILocalizedString;
  /**
   * Intrinsic pixel size, captured from the upload response. Only used to emit
   * og:image:width / og:image:height, which lets Facebook and LinkedIn lay the
   * card out on the FIRST crawl instead of showing a thumbnail until they have
   * fetched the file themselves.
   */
  width?: number;
  height?: number;
  /** Locales this image renders for; absent/empty = all languages. */
  languages?: string[];
}

/**
 * Unified Image Schema
 * Use this schema for all image fields across different models
 */
export const ImageSchema = new Schema<IImage>(
  {
    url: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    title: {
      type: OptionalLocalizedStringSchema,
    },
    alt: {
      type: OptionalLocalizedStringSchema,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    // Locales this image renders for; absent/empty = all languages.
    // default: undefined stops mongoose from stamping [] on every image.
    languages: { type: [{ type: String, enum: ['en', 'de', 'it', 'es'] }], default: undefined },
  },
  { _id: false }
);
