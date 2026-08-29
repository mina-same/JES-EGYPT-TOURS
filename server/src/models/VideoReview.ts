import mongoose, { Schema, Document } from 'mongoose';
import { LocalizedStringSchema, ILocalizedString } from './shared/LocalizedSchema';
import { revalidateTags } from '../services/revalidate';

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


/**
 * The traveller video band on the homepage.
 *
 * Mirrors what Blog.ts does: the visitor fetch is tagged and served from
 * cache until an editor actually changes something here, at which point the
 * tag is cleared and the change is live immediately. Without this hook the
 * only safe option is an uncached fetch on every page view.
 */
const revalidateVideoReviewCaches = () => revalidateTags(['video-reviews']);

VideoReviewSchema.post('save', revalidateVideoReviewCaches);
VideoReviewSchema.post('findOneAndUpdate', revalidateVideoReviewCaches);
VideoReviewSchema.post('findOneAndDelete', revalidateVideoReviewCaches);
VideoReviewSchema.post('deleteOne', revalidateVideoReviewCaches);
VideoReviewSchema.post('updateOne', revalidateVideoReviewCaches);
VideoReviewSchema.post('updateMany', revalidateVideoReviewCaches);

export default mongoose.model<IVideoReview>('VideoReview', VideoReviewSchema);
