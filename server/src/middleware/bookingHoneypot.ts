import type { RequestHandler } from 'express';

/**
 * A real visitor never sees or fills the hidden `website` field. Rejecting it
 * here (before validation/database work) also protects callers that bypass the
 * React form and post directly to the public endpoint.
 *
 * Missing and blank values remain valid so cached/older clients keep working.
 */
export const bookingHoneypotGuard: RequestHandler = (req, res, next) => {
  const website = req.body?.website;
  const isEmpty =
    website === undefined ||
    website === null ||
    (typeof website === 'string' && website.trim() === '');

  if (isEmpty) {
    next();
    return;
  }

  res.status(400).json({
    success: false,
    code: 'INVALID_BOOKING_REQUEST',
    error: 'Unable to process booking request.',
  });
};
