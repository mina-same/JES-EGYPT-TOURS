import mongoose, { Document, Schema, Types } from 'mongoose';
import { ALL_PLAN_NAMES } from './Tour';

/** The visitor asked to be advised rather than picking a tier. Deliberately not
 *  a plan name, so it can never be read as a priced selection. */
export const BOOKING_PACKAGE_NOT_SURE = 'NOT_SURE';

export interface IBooking extends Document {
  // Tour reference
  tour: Types.ObjectId;

  // Personal Information
  name: string;
  email: string;
  phone: string;
  nationality?: string;

  // Booking Details
  dateFrom: Date;
  dateTo: Date;
  adults: number;
  children: number;
  infants: number;
  requirements?: string;

  /**
   * What the visitor was LOOKING AT when they submitted: the currency selected
   * in the site header and the per-person starting price the booking card
   * displayed. Advisory only — never used for charging — but it settles any
   * later "the site quoted me €X" question from the booking itself.
   */
  currency?: 'USD' | 'EUR' | 'GBP';
  quotedPrice?: number;

  /**
   * Which pricing tier the enquiry is about, e.g. 'GOLD (5 STAR STANDARD)', or
   * 'NOT_SURE' when the visitor asked to be advised.
   *
   * Recorded even when the form never asked — a day tour, or a package with a
   * single tier, still writes the one plan it sells, so the office always knows
   * which rate the enquiry refers to without opening the tour.
   *
   * Verified server-side against the tour's real plans: it arrives from a
   * public form and is a claim until checked.
   */
  selectedPackage?: string;

  // Technical identity for safe retries. Hidden from every API response.
  idempotencyKey?: string;
  requestFingerprint?: string;

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
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      maxlength: [16, 'Mobile number cannot exceed 16 characters'],
      match: [
        /^\+[1-9]\d{7,14}$/,
        'Please provide a valid international mobile number',
      ],
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
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP'],
    },
    quotedPrice: {
      type: Number,
      min: [0, 'Quoted price cannot be negative'],
    },
    selectedPackage: {
      type: String,
      enum: [...ALL_PLAN_NAMES, BOOKING_PACKAGE_NOT_SURE],
    },
    idempotencyKey: {
      type: String,
      trim: true,
      maxlength: [36, 'Idempotency key cannot exceed 36 characters'],
      select: false,
    },
    requestFingerprint: {
      type: String,
      minlength: [64, 'Request fingerprint must be a SHA-256 digest'],
      maxlength: [64, 'Request fingerprint must be a SHA-256 digest'],
      select: false,
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
bookingSchema.index({ dateFrom: 1 });
bookingSchema.index({ dateTo: 1 });
bookingSchema.index(
  { idempotencyKey: 1 },
  { unique: true, sparse: true, name: 'unique_booking_idempotency_key' }
);

// Add virtual id field
bookingSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Include virtuals in JSON response
bookingSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret) {
    Reflect.deleteProperty(ret, '__v');
    Reflect.deleteProperty(ret, 'idempotencyKey');
    Reflect.deleteProperty(ret, 'requestFingerprint');
    return ret;
  }
});

const Booking = mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;

