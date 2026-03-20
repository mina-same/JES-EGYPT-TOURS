import mongoose, { Schema, Document } from 'mongoose';
import { LocalizedStringSchema, LocalizedMixedSchema, ILocalizedString, ILocalizedMixed } from './shared/LocalizedSchema';

export interface IFaq extends Document {
  question: ILocalizedString;
  answer: ILocalizedMixed;
  category?: string;
  isActive: boolean;
  order: number;
  displayOnHome: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FaqSchema: Schema = new Schema({
  question: {
    type: LocalizedStringSchema,
    required: [true, 'Question is required']
  },
  answer: {
    type: LocalizedMixedSchema,
    required: [true, 'Answer is required']
  },
  category: {
    type: String,
    trim: true,
    default: 'General',
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  displayOnHome: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
FaqSchema.index({ category: 1, order: 1 });
FaqSchema.index({ isActive: 1, displayOnHome: 1 });
FaqSchema.index({ order: 1 });

const Faq = mongoose.models.Faq || mongoose.model<IFaq>('Faq', FaqSchema);

// Pre-save middleware to ensure order is set (moved after model creation)
FaqSchema.pre('save', async function(next) {
  if (this.isNew && this.order === 0) {
    // Find the highest order in the same category and set this one to be last
    const lastFaq = await Faq.findOne({ category: this.category }).sort('-order');
    this.order = lastFaq ? lastFaq.order + 1 : 1;
  }
  next();
});

export default Faq;
