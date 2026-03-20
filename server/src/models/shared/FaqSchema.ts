import { Schema } from 'mongoose';
import { 
  ILocalizedString, 
  ILocalizedMixed, 
  LocalizedStringSchema, 
  LocalizedMixedSchema 
} from './LocalizedSchema';

export interface IFAQ {
  question: ILocalizedString;
  answer: ILocalizedMixed;
  isActive?: boolean;
  order?: number;
}

/**
 * Shared FAQ Schema
 */
export const FAQSchema = new Schema<IFAQ>(
  {
    question: {
      type: LocalizedStringSchema,
      required: [true, 'Question is required'],
    },
    answer: {
      type: LocalizedMixedSchema,
      required: [true, 'Answer is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);
