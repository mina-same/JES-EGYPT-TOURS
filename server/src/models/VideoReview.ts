import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoReview extends Document {
  title: string;
  url: string;
  videoId: string;
  tourName: string;
  thumbnail?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const VideoReviewSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
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
    type: String,
    required: [true, 'Tour Name is required'],
    trim: true,
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
