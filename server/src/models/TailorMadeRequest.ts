import mongoose, { Document, Schema } from 'mongoose';

export interface ITailorMadeRequest extends Document {
  // Personal Information
  fullName: string;
  email: string;
  phone?: string;
  country: string;

  // Travel Details
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  duration?: string;
  accommodation?: string;
  adults: number;
  children: number;
  infants: number;

  // Preferences
  minBudget?: string;
  maxBudget?: string;
  specialOccasion?: string;
  interests: string[];

  // Special Requirements
  dietary?: string;
  mobility?: string;
  comments: string;

  // Status tracking
  status: 'pending' | 'contacted' | 'in-progress' | 'completed' | 'cancelled';
  adminNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const tailorMadeRequestSchema = new Schema<ITailorMadeRequest>(
  {
    // Personal Information
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
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
    },
    phone: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },

    // Travel Details
    startMonth: {
      type: String,
      required: [true, 'Start month is required'],
      enum: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
    },
    startYear: {
      type: String,
      required: [true, 'Start year is required'],
    },
    endMonth: {
      type: String,
      required: [true, 'End month is required'],
      enum: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
    },
    endYear: {
      type: String,
      required: [true, 'End year is required'],
    },
    duration: {
      type: String,
      trim: true,
    },
    accommodation: {
      type: String,
      enum: [
        'Luxury Hotels (5 Star)',
        'Premium Hotels (4 Star)',
        'Standard Hotels (3 Star)',
        'Mix of Categories',
        ''
      ],
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

    // Preferences
    minBudget: {
      type: String,
      trim: true,
    },
    maxBudget: {
      type: String,
      trim: true,
    },
    specialOccasion: {
      type: String,
      enum: [
        'Honeymoon',
        'Anniversary',
        'Birthday Celebration',
        'Family Reunion',
        'Retirement Trip',
        'Other Celebration',
        ''
      ],
    },
    interests: {
      type: [String],
      default: [],
    },

    // Special Requirements
    dietary: {
      type: String,
      trim: true,
    },
    mobility: {
      type: String,
      trim: true,
    },
    comments: {
      type: String,
      required: [true, 'Additional comments are required'],
      trim: true,
      maxlength: [2000, 'Comments cannot exceed 2000 characters'],
    },

    // Status tracking
    status: {
      type: String,
      enum: ['pending', 'contacted', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
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
tailorMadeRequestSchema.index({ email: 1 });
tailorMadeRequestSchema.index({ status: 1 });
tailorMadeRequestSchema.index({ createdAt: -1 });

// Add virtual id field
tailorMadeRequestSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Include virtuals in JSON response
tailorMadeRequestSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret) {
    const { __v, ...rest } = ret;
    return rest;
  }
});

const TailorMadeRequest = mongoose.model<ITailorMadeRequest>(
  'TailorMadeRequest',
  tailorMadeRequestSchema
);

export default TailorMadeRequest;
