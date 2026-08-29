import mongoose, { Schema, Document } from 'mongoose';
import { LocalizedStringSchema, LocalizedMixedSchema, ILocalizedString, ILocalizedMixed } from './shared/LocalizedSchema';
import { revalidateTags } from '../services/revalidate';
import { sanitizeDocumentPaths, sanitizeUpdatePaths } from '../utils/sanitizeRichText';

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

/**
 * Puts a new question at the end of its category.
 *
 * Registered BEFORE the model is compiled. It used to sit after the
 * mongoose.model() call, which silently disabled it: mongoose copies a schema's
 * hooks onto the model when it compiles and ignores any registered afterwards,
 * so this never ran and every FAQ kept order 0 while the API sorts by `order`.
 * The model is reached through `this.constructor` instead of the `Faq` binding,
 * which is what forced the original ordering.
 */
FaqSchema.pre('save', async function (next) {
  if (this.isNew && this.order === 0) {
    const model = this.constructor as mongoose.Model<IFaq>;
    const lastFaq = await model.findOne({ category: this.category }).sort('-order');
    this.order = lastFaq ? lastFaq.order + 1 : 1;
  }
  next();
});


/**
 * The FAQ accordion on the homepage and the FAQ page.
 *
 * Mirrors what Blog.ts does: the visitor fetch is tagged and served from
 * cache until an editor actually changes something here, at which point the
 * tag is cleared and the change is live immediately. Without this hook the
 * only safe option is an uncached fetch on every page view.
 */
const revalidateFaqCaches = () => revalidateTags(['faq']);

FaqSchema.post('save', revalidateFaqCaches);
FaqSchema.post('findOneAndUpdate', revalidateFaqCaches);
FaqSchema.post('findOneAndDelete', revalidateFaqCaches);
FaqSchema.post('deleteOne', revalidateFaqCaches);
FaqSchema.post('updateOne', revalidateFaqCaches);
FaqSchema.post('updateMany', revalidateFaqCaches);


/**
 * Editor HTML is cleaned on the way IN, so the database never holds a payload
 * and the ~30 dangerouslySetInnerHTML call sites on the visitor pages are
 * rendering content that was already sanitized. See utils/sanitizeRichText.ts.
 *
 * Both hooks are needed: document hooks never run for findOneAndUpdate and
 * friends, which the admin uses for edits.
 */
const RICH_TEXT_PATHS = ['answer'] as const;

FaqSchema.pre('validate', sanitizeDocumentPaths(RICH_TEXT_PATHS));
FaqSchema.pre('findOneAndUpdate', sanitizeUpdatePaths(RICH_TEXT_PATHS));
FaqSchema.pre('updateOne', sanitizeUpdatePaths(RICH_TEXT_PATHS));
FaqSchema.pre('updateMany', sanitizeUpdatePaths(RICH_TEXT_PATHS));

const Faq = mongoose.models.Faq || mongoose.model<IFaq>('Faq', FaqSchema);

export default Faq;
