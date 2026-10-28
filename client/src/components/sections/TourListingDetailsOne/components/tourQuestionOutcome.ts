/**
 * What the tour question dialog tells the visitor after the API has answered.
 *
 * Decided by the status code, and given as translation keys: the API's own
 * messages are English on every page, and its rate limit — shared with the
 * contact forms — spoke of "booking attempts" on a question about a tour.
 */

/** What the API answers to a question, as far as the dialog reads it. */
export type TourQuestionResponse = { success?: boolean; errors?: Array<{ path?: string }> } | null;

/** The fields the visitor fills in (express-validator's `path`), and the
 *  dialog's own message for those that have one. */
const VISITOR_FIELDS: Record<string, string | null> = {
  name: 'tourDetails.askModal.errorName',
  email: 'tourDetails.askModal.errorEmail',
  message: 'tourDetails.askModal.errorMessage',
  phone: null,
  preferredDate: null,
};

export type TourQuestionOutcome =
  | { type: 'sent' }
  /** `message`: the summary; `fields`: field → message, both as keys. */
  | { type: 'error'; message: string; fields: Record<string, string> };

export function tourQuestionOutcome(status: number, body: TourQuestionResponse): TourQuestionOutcome {
  if (status >= 200 && status < 300 && body?.success) return { type: 'sent' };
  // The route's own limiter (JSON) or the site-wide one (plain text).
  if (status === 429) return { type: 'error', message: 'tourDetails.askModal.rateLimited', fields: {} };
  if (status === 400) {
    const paths = (body?.errors ?? []).map((error) => error.path).filter((path): path is string => !!path && path in VISITOR_FIELDS);
    // Something the visitor typed: point at it. Anything else (the tour's own
    // name or slug, say) is not theirs to fix.
    if (paths.length) {
      const fields: Record<string, string> = {};
      for (const path of paths) if (VISITOR_FIELDS[path]) fields[path] = VISITOR_FIELDS[path] as string;
      return { type: 'error', message: 'tourDetails.askModal.invalid', fields };
    }
  }
  return { type: 'error', message: 'tourDetails.askModal.failed', fields: {} };
}
