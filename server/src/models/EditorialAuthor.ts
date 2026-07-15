import mongoose, { Document, Schema } from 'mongoose';
import { ILocalizedString, LocalizedStringSchema } from './shared/LocalizedSchema';

export interface IEditorialAuthor extends Document {
  name: string;
  slug: string;
  role: ILocalizedString;
  bio: ILocalizedString;
  image: { url: string; alt: ILocalizedString };
  isActive: boolean;
}

const EditorialAuthorSchema = new Schema<IEditorialAuthor>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  role: { type: LocalizedStringSchema, required: true },
  bio: { type: LocalizedStringSchema, required: true },
  image: {
    url: { type: String, required: true },
    alt: { type: LocalizedStringSchema, required: true },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.EditorialAuthor || mongoose.model<IEditorialAuthor>('EditorialAuthor', EditorialAuthorSchema);
