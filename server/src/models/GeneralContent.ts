import mongoose, { Schema, Document } from 'mongoose';
import { LocalizedStringSchema, LocalizedMixedSchema, ILocalizedString, ILocalizedMixed } from './shared/LocalizedSchema';
import { revalidateTags } from '../services/revalidate';
import { sanitizeDocumentPaths, sanitizeUpdatePaths } from '../utils/sanitizeRichText';

export interface IGeneralContent extends Document {
  slug: string; // unique identifier like 'home-intro'
  title: ILocalizedString;
  subtitle?: ILocalizedString;
  content: ILocalizedMixed; // HTML content
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GeneralContentSchema = new Schema<IGeneralContent>(
  {
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: LocalizedStringSchema,
      required: [true, 'Title is required'],
    },
    subtitle: {
      type: LocalizedStringSchema,
    },
    content: {
      type: LocalizedMixedSchema,
      required: [true, 'Content is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);




/**
 * Editorial blocks keyed by slug — the homepage intro ("home-intro") among
 * them, which is long-form, keyword-dense copy the homepage should rank for.
 *
 * Mirrors what Blog.ts does: the visitor fetch is tagged and served from cache
 * until an editor saves, at which point the tag is cleared and the change is
 * live immediately.
 */
const revalidateGeneralContentCaches = () => revalidateTags(['general-content']);

GeneralContentSchema.post('save', revalidateGeneralContentCaches);
GeneralContentSchema.post('findOneAndUpdate', revalidateGeneralContentCaches);
GeneralContentSchema.post('findOneAndDelete', revalidateGeneralContentCaches);
GeneralContentSchema.post('deleteOne', revalidateGeneralContentCaches);
GeneralContentSchema.post('updateOne', revalidateGeneralContentCaches);
GeneralContentSchema.post('updateMany', revalidateGeneralContentCaches);


/**
 * Editor HTML is cleaned on the way IN, so the database never holds a payload
 * and the ~30 dangerouslySetInnerHTML call sites on the visitor pages are
 * rendering content that was already sanitized. See utils/sanitizeRichText.ts.
 *
 * Both hooks are needed: document hooks never run for findOneAndUpdate and
 * friends, which the admin uses for edits.
 */
const RICH_TEXT_PATHS = ['content'] as const;

GeneralContentSchema.pre('validate', sanitizeDocumentPaths(RICH_TEXT_PATHS));
GeneralContentSchema.pre('findOneAndUpdate', sanitizeUpdatePaths(RICH_TEXT_PATHS));
GeneralContentSchema.pre('updateOne', sanitizeUpdatePaths(RICH_TEXT_PATHS));
GeneralContentSchema.pre('updateMany', sanitizeUpdatePaths(RICH_TEXT_PATHS));

const GeneralContent = mongoose.model<IGeneralContent>('GeneralContent', GeneralContentSchema);

export default GeneralContent;
