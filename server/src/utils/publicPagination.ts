import { Response } from 'express';

/**
 * `page` and `limit` of a public article listing, read strictly.
 *
 * The category, topic and destination listings are public, and what they were
 * sent went straight into skip() and limit(): page=0 asked Mongo for a
 * negative skip and came back as a 500, page=1.5 as a window overlapping two
 * pages, limit=0 as every row there is. A value that is present must be a
 * positive integer written in digits, and anything else is the caller's
 * mistake — answered as one, never guessed at, clamped or defaulted. A value
 * that is absent keeps its default.
 */

/** The most rows one public listing request may ask for — the cap parseTourPagination applies. */
export const MAX_PUBLIC_PAGE_SIZE = 100;

export type PublicPagination = { page: number; limit: number; skip: number };

const DIGITS = /^[0-9]+$/;

/** A positive integer from one query value; `fallback` when it is absent, null when it is not one. */
const positiveInteger = (value: unknown, fallback: number): number | null => {
  if (value === undefined) return fallback;
  // A repeated parameter arrives as an array, a bracketed one as an object.
  if (typeof value !== 'string' || !DIGITS.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : null;
};

/**
 * The pagination a request asks for. When `page` or `limit` is not a valid
 * value this answers 400 itself and returns null: the caller just returns.
 */
export const readPublicPagination = (
  query: { page?: unknown; limit?: unknown },
  res: Response,
  defaultLimit: number
): PublicPagination | null => {
  const reject = (name: 'page' | 'limit'): null => {
    res.status(400).json({ success: false, error: `Invalid ${name} parameter` });
    return null;
  };

  const page = positiveInteger(query.page, 1);
  if (page === null) return reject('page');
  const limit = positiveInteger(query.limit, defaultLimit);
  if (limit === null || limit > MAX_PUBLIC_PAGE_SIZE) return reject('limit');
  const skip = (page - 1) * limit;
  // A page so far out that its offset is no longer an exact integer is not a page.
  if (!Number.isSafeInteger(skip)) return reject('page');
  return { page, limit, skip };
};
