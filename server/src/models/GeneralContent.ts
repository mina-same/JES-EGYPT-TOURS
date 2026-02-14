import mongoose, { Schema, Document } from 'mongoose';

export interface IGeneralContent extends Document {
  slug: string; // unique identifier like 'home-intro'
  title: string;
  subtitle?: string;
  content: string; // HTML content
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
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
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
