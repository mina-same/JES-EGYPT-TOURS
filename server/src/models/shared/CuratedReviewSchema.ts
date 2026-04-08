import { Schema } from 'mongoose';
import { 
  ILocalizedString, 
  LocalizedStringSchema 
} from './LocalizedSchema';

export interface ICuratedReview {
  name: ILocalizedString;
  avatar?: string;
  rating: number;
  comment: ILocalizedString;
  status?: string;
}

/**
 * Shared Curated Review Schema for Category and Subcategory
 */
export const CuratedReviewSchema = new Schema<ICuratedReview>(
  {
    name: {
      type: LocalizedStringSchema,
      required: true,
    },
    avatar: {
      type: String,
      required: false,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 5,
    },
    comment: {
      type: LocalizedStringSchema,
      required: true,
    },
    status: {
      type: String,
      default: 'approved',
    },
  },
  { _id: false }
);
