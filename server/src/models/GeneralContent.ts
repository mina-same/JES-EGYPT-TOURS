import mongoose, { Schema, Document } from 'mongoose';
import { LocalizedStringSchema, LocalizedMixedSchema, ILocalizedString, ILocalizedMixed } from './shared/LocalizedSchema';

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



const GeneralContent = mongoose.model<IGeneralContent>('GeneralContent', GeneralContentSchema);

export default GeneralContent;
