import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  type: 'contact' | 'tailorMade' | 'booking' | 'system';
  title: string;
  message: string;
  entityId?: mongoose.Types.ObjectId;
  eventKey?: string;
  announcedBy: mongoose.Types.ObjectId[];
  hiddenBy: mongoose.Types.ObjectId[];
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

    },
    eventKey: { type: String, select: false },
    announcedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    hiddenBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    readBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ eventKey: 1 }, { unique: true, sparse: true });
// Index for performance
NotificationSchema.index({ type: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: 1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
