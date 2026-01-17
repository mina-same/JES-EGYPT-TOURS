import { Schema } from 'mongoose';

/**
 * Unified Image Interface used across all models
 * This ensures consistency in image handling throughout the application
 */
export interface IImage {
  url: string;
  fileName: string;
  title?: string;
  alt?: string;
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
      type: String,
      trim: true,
    },
    alt: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);
