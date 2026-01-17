import { body, ValidationChain } from 'express-validator';

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
    .isIn(['admin', 'user'])
    .withMessage('Role must be either admin or user'),
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
    .isIn(['admin', 'user'])
    .withMessage('Role must be either admin or user'),
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
    .optional()
    .trim(),
  body('nationality')
    .optional()
    .trim(),

  // Booking Details
  body('date')
    .notEmpty()
    .withMessage('Booking date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('time')
    .notEmpty()
    .withMessage('Booking time is required')
    .isISO8601()
    .withMessage('Invalid time format'),
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
];
