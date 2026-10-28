import rateLimit from 'express-rate-limit';

export const BOOKING_RATE_LIMIT_DEFAULTS = {
  windowMs: 15 * 60 * 1000,
  limit: 10,
} as const;

interface BookingRateLimitOptions {
  windowMs?: number;
  limit?: number;
  /** The 429's code and text, for a route that is not the booking form. */
  rejection?: { code: string; error: string };
}

const BOOKING_RATE_LIMIT_REJECTION = {
  code: 'BOOKING_RATE_LIMITED',
  error: 'Too many booking attempts. Please wait before trying again.',
};

const positiveInteger = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

/** Dedicated protection for the expensive public booking write. Each call gets
 * its own MemoryStore, separate from the site's broader /api limiter. */
export const createBookingSubmissionLimiter = (
  options: BookingRateLimitOptions = {}
) => {
  const rejection = options.rejection || BOOKING_RATE_LIMIT_REJECTION;
  return rateLimit({
    windowMs: options.windowMs || BOOKING_RATE_LIMIT_DEFAULTS.windowMs,
    limit: options.limit || BOOKING_RATE_LIMIT_DEFAULTS.limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res, _next, rateLimitOptions) => {
      res.status(rateLimitOptions.statusCode).json({
        success: false,
        code: rejection.code,
        error: rejection.error,
      });
    },
  });
};

export const bookingSubmissionLimiter = createBookingSubmissionLimiter({
  windowMs: positiveInteger(
    process.env.BOOKING_RATE_LIMIT_WINDOW_MS,
    BOOKING_RATE_LIMIT_DEFAULTS.windowMs
  ),
  limit: positiveInteger(
    process.env.BOOKING_RATE_LIMIT_MAX,
    BOOKING_RATE_LIMIT_DEFAULTS.limit
  ),
});
