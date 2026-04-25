import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBooking extends Document {
  // Tour reference
  tour: Types.ObjectId;

  // Personal Information
  name: string;
  email: string;
  phone?: string;
  nationality?: string;

  // Booking Details
  dateFrom: Date;
  dateTo: Date;
  adults: number;
  children: number;
  infants: number;
  requirements?: string;

  // Status tracking
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  adminNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    // Tour reference
    tour: {
      type: Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Tour is required'],
      index: true,
    },

    // Personal Information
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    nationality: {
      type: String,
      trim: true,
    },

    // Booking Details
    dateFrom: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    dateTo: {
      type: Date,
      required: [true, 'End date is required'],
    },
    adults: {
      type: Number,
      required: [true, 'Number of adults is required'],
      min: [1, 'At least one adult is required'],
      max: [50, 'Maximum 50 adults allowed'],
    },
    children: {
      type: Number,
      default: 0,
      min: [0, 'Children cannot be negative'],
      max: [50, 'Maximum 50 children allowed'],
    },
    infants: {
      type: Number,
      default: 0,
      min: [0, 'Infants cannot be negative'],
      max: [50, 'Maximum 50 infants allowed'],
    },
    requirements: {
      type: String,
      trim: true,
      maxlength: [2000, 'Requirements cannot exceed 2000 characters'],
    },

    // Status tracking
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
bookingSchema.index({ tour: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ email: 1 });
bookingSchema.index({ dateFrom: 1 });
bookingSchema.index({ dateTo: 1 });

// Add virtual id field
bookingSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Include virtuals in JSON response
bookingSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret) {
    const { __v, ...rest } = ret;
    return rest;
  }
});

const Booking = mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;

