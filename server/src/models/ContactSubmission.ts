import mongoose, { Document, Schema } from 'mongoose';

export interface IContactSubmission extends Document {
  name: string;
  email: string;
  message: string;
  source: 'contact' | 'travel-trade';
  inquiryType?: 'b2b-rates' | 'client-request' | 'general-partnership';
  phone?: string;
  companyName?: string;
  companyWebsite?: string;
  country?: string;
  businessType?:
    | 'travel-agency'
    | 'tour-operator'
    | 'travel-advisor'
    | 'group-organizer'
    | 'corporate-incentive'
    | 'other';
  primaryMarket?: string;
  annualTravelers?:
    | 'under-10'
    | '10-25'
    | '26-50'
    | '51-100'
    | 'over-100'
    | 'not-sure';
  travelDates?: string;
  travelers?: number;
  destinations?: string;
  serviceLanguage?: string;
  serviceLevel?: 'standard' | 'premium' | 'luxury' | 'mixed';
  consentGiven?: boolean;
  locale?: 'en' | 'de' | 'it' | 'es';
  /** Set when the hidden honeypot field came back filled. The submission is
   *  STORED rather than discarded: password managers and browser autofill do
   *  ignore `autocomplete="off"`, so a silent drop loses real enquiries with
   *  no trace. Flagged instead, so a false positive stays recoverable. */
  isSpam?: boolean;
  status: 'new' | 'replied' | 'archived';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactSubmissionSchema = new Schema<IContactSubmission>(
  {
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
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        'Please provide a valid email',
      ],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    source: {
      type: String,
      enum: ['contact', 'travel-trade'],
      default: 'contact',
      index: true,
    },
    inquiryType: {
      type: String,
      enum: ['b2b-rates', 'client-request', 'general-partnership'],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [40, 'Phone cannot exceed 40 characters'],
    },
    companyName: {
      type: String,
      trim: true,
      minlength: [2, 'Company name must be at least 2 characters'],
      maxlength: [150, 'Company name cannot exceed 150 characters'],
    },
    companyWebsite: {
      type: String,
      trim: true,
      maxlength: [250, 'Company website cannot exceed 250 characters'],
    },
    country: {
      type: String,
      trim: true,
      maxlength: [100, 'Country cannot exceed 100 characters'],
    },
    businessType: {
      type: String,
      enum: [
        'travel-agency',
        'tour-operator',
        'travel-advisor',
        'group-organizer',
        'corporate-incentive',
        'other',
      ],
    },
    primaryMarket: {
      type: String,
      trim: true,
      maxlength: [150, 'Primary market cannot exceed 150 characters'],
    },
    annualTravelers: {
      type: String,
      enum: ['under-10', '10-25', '26-50', '51-100', 'over-100', 'not-sure'],
    },
    travelDates: {
      type: String,
      trim: true,
      maxlength: [150, 'Travel dates cannot exceed 150 characters'],
    },
    travelers: {
      type: Number,
      min: [1, 'Travelers must be at least 1'],
      max: [10000, 'Travelers cannot exceed 10000'],
    },
    destinations: {
      type: String,
      trim: true,
      maxlength: [500, 'Destinations cannot exceed 500 characters'],
    },
    serviceLanguage: {
      type: String,
      trim: true,
      maxlength: [100, 'Service language cannot exceed 100 characters'],
    },
    serviceLevel: {
      type: String,
      enum: ['standard', 'premium', 'luxury', 'mixed'],
    },
    consentGiven: {
      type: Boolean,
      default: false,
    },
    locale: {
      type: String,
      enum: ['en', 'de', 'it', 'es'],
    },
    isSpam: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['new', 'replied', 'archived'],
      default: 'new',
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

contactSubmissionSchema.index({ email: 1 });
contactSubmissionSchema.index({ status: 1 });
contactSubmissionSchema.index({ source: 1, status: 1 });
contactSubmissionSchema.index({ createdAt: -1 });

const ContactSubmission = mongoose.model<IContactSubmission>(
  'ContactSubmission',
  contactSubmissionSchema
);

export default ContactSubmission;
