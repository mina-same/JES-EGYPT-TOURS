import mongoose, { Schema, Document } from 'mongoose';
import { LocalizedStringSchema, ILocalizedString } from './shared/LocalizedSchema';

export interface IVideoReview extends Document {
  title: ILocalizedString;
  url: string;
  videoId: string;
  tourName: ILocalizedString;
  thumbnail?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const VideoReviewSchema: Schema = new Schema({
  title: {
    type: LocalizedStringSchema,
    required: [true, 'Title is required'],
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true,
  },
  videoId: {
    type: String,
    required: [true, 'Video ID is required'],
    trim: true,
  },
  tourName: {
    type: LocalizedStringSchema,
    required: [true, 'Tour Name is required'],
  },
  thumbnail: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
});

export default mongoose.model<IVideoReview>('VideoReview', VideoReviewSchema);
