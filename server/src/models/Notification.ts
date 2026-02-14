import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  type: 'contact' | 'tailorMade' | 'booking' | 'system';
  title: string;
  message: string;
  entityId?: mongoose.Types.ObjectId;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['contact', 'tailorMade', 'booking', 'system'],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      refPath: 'type', // This won't work perfectly with different models, but it's a hint
    },
    readBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);

// Index for performance
NotificationSchema.index({ type: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
