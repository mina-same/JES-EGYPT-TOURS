import { body, header, ValidationChain } from 'express-validator';
import {
  isBookingDateTodayOrFuture,
  isValidBookingDate,
  isValidInternationalPhone,
} from '../utils/booking';

export const tailorMadeRequestValidation: ValidationChain[] = [
  // Personal Information
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim(),
  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required'),

  // Travel Details
  body('startMonth')
    .notEmpty()
    .withMessage('Start month is required')
    .isIn([
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ])
    .withMessage('Invalid start month'),
  body('startYear')
    .notEmpty()
    .withMessage('Start year is required'),
  body('endMonth')
    .notEmpty()
    .withMessage('End month is required')
    .isIn([
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ])
    .withMessage('Invalid end month'),
  body('endYear')
    .notEmpty()
    .withMessage('End year is required'),
  body('duration')
    .optional()
    .trim(),
  body('accommodation')
    .optional()
    .isIn([
      'Luxury Hotels (5 Star)',
      'Premium Hotels (4 Star)',
      'Standard Hotels (3 Star)',
      'Mix of Categories',
      ''
    ])
    .withMessage('Invalid accommodation type'),
  body('adults')
    .notEmpty()
    .withMessage('Number of adults is required')
    .isInt({ min: 1, max: 50 })
    .withMessage('Adults must be between 1 and 50'),
  body('children')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Children must be between 0 and 50'),
  body('infants')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Infants must be between 0 and 50'),

  // Preferences
  body('minBudget')
    .optional()
    .trim(),
  body('maxBudget')
    .optional()
    .trim(),
  body('specialOccasion')
    .optional()
    .isIn([
      'Honeymoon',
      'Anniversary',
      'Birthday Celebration',
      'Family Reunion',
      'Retirement Trip',
      'Other Celebration',
      ''
    ])
    .withMessage('Invalid special occasion'),
  body('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array'),

  // Special Requirements
  body('dietary')
    .optional()
    .trim(),
  body('mobility')
    .optional()
    .trim(),
  body('comments')
    .trim()
    .notEmpty()
    .withMessage('Additional comments are required')
    .isLength({ max: 2000 })
    .withMessage('Comments cannot exceed 2000 characters'),
];

export const contactSubmissionValidation: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  // Required, like the name and the email: the team calls people back, and an
  // enquiry with no number costs a round trip to ask for one.
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .isLength({ max: 40 })
    .withMessage('Phone cannot exceed 40 characters'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 5000 })
    .withMessage('Message cannot exceed 5000 characters'),
  // Which language the visitor wrote in, so the team knows how to reply.
  // Optional: an older cached bundle may still post without it.
  body('locale')
    .optional()
    .isIn(['en', 'de', 'it', 'es'])
    .withMessage('Invalid locale'),
];

/**
 * The quick question asked from a tour page.
 *
 * Deliberately short: name, email and the question are all that is required.
 * The full booking form already collects party size, nationality and dates, and
 * repeating them here would turn a one-minute question into a booking flow.
 *
 * `tourName` and `tourSlug` are optional at this layer because the modal fills
 * them itself -- a missing one is a bug in our own page, not a reason to reject
 * a visitor's question.
 */
export const tourQuestionValidation: ValidationChain[] = [
  body('source')
    .equals('tour-question')
    .withMessage('Invalid inquiry source'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isLength({ max: 150 })
    .withMessage('Email cannot exceed 150 characters')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 40 })
    .withMessage('Phone cannot exceed 40 characters'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Please tell us what you would like to know')
    .isLength({ max: 5000 })
    .withMessage('Question cannot exceed 5000 characters'),
  body('preferredDate')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 60 })
    .withMessage('Travel date cannot exceed 60 characters'),
  body('tourName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 250 })
    .withMessage('Tour name cannot exceed 250 characters'),
  body('tourSlug')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 250 })
    .withMessage('Tour slug cannot exceed 250 characters'),
  body('locale')
    .optional({ values: 'falsy' })
    .isIn(['en', 'de', 'it', 'es'])
    .withMessage('Invalid locale'),
];

export const travelTradeInquiryValidation: ValidationChain[] = [
  body('source')
    .equals('travel-trade')
    .withMessage('Invalid inquiry source'),
  body('inquiryType')
    .isIn(['b2b-rates', 'client-request', 'general-partnership'])
    .withMessage('Please select a valid inquiry type'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Business email is required')
    .isLength({ max: 150 })
    .withMessage('Business email cannot exceed 150 characters')
    .isEmail()
    .withMessage('Please provide a valid business email')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone or WhatsApp is required')
    .isLength({ max: 40 })
    .withMessage('Phone or WhatsApp cannot exceed 40 characters'),
  body('companyName')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ min: 2, max: 150 })
    .withMessage('Company name must be between 2 and 150 characters'),
  body('companyWebsite')
    .trim()
    .notEmpty()
    .withMessage('Company website is required')
    .isLength({ max: 250 })
    .withMessage('Company website cannot exceed 250 characters')
    .isURL({ require_protocol: false, protocols: ['http', 'https'] })
    .withMessage('Please provide a valid company website'),
  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required')
    .isLength({ max: 100 })
    .withMessage('Country cannot exceed 100 characters'),
  body('businessType')
    .isIn([
      'travel-agency',
      'tour-operator',
      'travel-advisor',
      'group-organizer',
      'corporate-incentive',
      'other',
    ])
    .withMessage('Please select a valid business type'),
  body('primaryMarket')
    .trim()
    .notEmpty()
    .withMessage('Primary market is required')
    .isLength({ max: 150 })
    .withMessage('Primary market cannot exceed 150 characters'),
  body('annualTravelers')
    .isIn(['under-10', '10-25', '26-50', '51-100', 'over-100', 'not-sure'])
    .withMessage('Please select a valid annual traveler range'),
  body('travelDates')
    .trim()
    .notEmpty()
    .withMessage('Expected travel dates are required')
    .isLength({ max: 150 })
    .withMessage('Travel dates cannot exceed 150 characters'),
  body('travelers')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Travelers must be a whole number between 1 and 10000')
    .toInt(),
  body('destinations')
    .trim()
    .notEmpty()
    .withMessage('Destinations are required')
    .isLength({ max: 500 })
    .withMessage('Destinations cannot exceed 500 characters'),
  body('serviceLanguage')
    .trim()
    .notEmpty()
    .withMessage('Preferred service language is required')
    .isLength({ max: 100 })
    .withMessage('Service language cannot exceed 100 characters'),
  body('serviceLevel')
    .isIn(['standard', 'premium', 'luxury', 'mixed'])
    .withMessage('Please select a valid service level'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 20, max: 5000 })
    .withMessage('Message must be between 20 and 5000 characters'),
  body('consentGiven')
    .custom((value) => value === true)
    .withMessage('Consent is required'),
  body('locale')
    .optional()
    .isIn(['en', 'de', 'it', 'es'])
    .withMessage('Invalid locale'),
];

export const registerValidation: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['superadmin', 'admin'])
    .withMessage('Role must be either superadmin or admin'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

export const loginValidation: ValidationChain[] = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const updateUserValidation: ValidationChain[] = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['superadmin', 'admin'])
    .withMessage('Role must be either superadmin or admin'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

export const bookingValidation: ValidationChain[] = [
  // Tour reference
  body('tour')
    .notEmpty()
    .withMessage('Tour is required')
    .isMongoId()
    .withMessage('Invalid tour ID'),

  // Personal Information
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .bail()
    .custom(isValidInternationalPhone)
    .withMessage('Please provide a valid international mobile number'),
  body('nationality')
    .optional()
    .trim(),

  // Booking Details
  body('dateFrom')
    .notEmpty()
    .withMessage('Start date is required')
    .bail()
    .custom(isValidBookingDate)
    .withMessage('Invalid start date format')
    .bail()
    .custom((value) => isBookingDateTodayOrFuture(value))
    .withMessage('Start date cannot be in the past'),
  body('dateTo')
    .notEmpty()
    .withMessage('End date is required')
    .bail()
    .custom(isValidBookingDate)
    .withMessage('Invalid end date format')
    .bail()
    // Nothing anywhere checked the ORDER of the pair, so an inverted range
    // (end before start) reached the database. Guarded here and not only in
    // the client, because the client can be bypassed.
    .custom((value, { req }) => {
      const from = req.body?.dateFrom;
      if (!isValidBookingDate(from) || !isValidBookingDate(value)) return true;
      return value >= from;
    })
    .withMessage('End date must be on or after the start date'),
  body('adults')
    .notEmpty()
    .withMessage('Number of adults is required')
    .isInt({ min: 1, max: 50 })
    .withMessage('Adults must be between 1 and 50'),
  body('children')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Children must be between 0 and 50'),
  body('infants')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Infants must be between 0 and 50'),
  body('requirements')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Requirements cannot exceed 2000 characters'),

  // The visitor chooses a display currency. The controller derives the amount
  // from the authoritative Tour record; no public quotedPrice is accepted.
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP'])
    .withMessage('Invalid currency'),

  // Shape only. WHETHER this tour actually sells the named tier is checked in
  // the controller, which is the only place that has the tour to compare
  // against — a well-formed name for a plan the tour does not offer must not
  // be stored as though it were priced.
  body('selectedPackage')
    .optional()
    .isString()
    .withMessage('Invalid package')
    .bail()
    .trim()
    .isLength({ max: 60 })
    .withMessage('Invalid package'),
];

/** One UUID identifies one exact submission attempt. It is separate from the
 * body so public callers cannot accidentally persist it as ordinary form data. */
export const bookingIdempotencyValidation: ValidationChain[] = [
  header('Idempotency-Key')
    .trim()
    .notEmpty()
    .withMessage('Idempotency-Key header is required')
    .bail()
    .isUUID(4)
    .withMessage('Idempotency-Key header must be a valid UUID v4'),
];
