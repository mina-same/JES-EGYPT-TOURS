/**
 * What the tailor-made form tells the visitor after the API has answered.
 *
 * Decided by the status code, and given as translation keys: the API's own
 * messages are English on every page (its rate limit even spoke of "booking
 * attempts"), and the site-wide limiter answers in plain text, which the form
 * used to report as a network error.
 */

/** What the API answers to a submission, as far as the form reads it. */
export type SubmitResponse = { success?: boolean; errors?: Array<{ path?: string }> };

/** The four date lists share one message: a range is about both of its ends. */
export const DATE_FIELDS = ['startMonth', 'startYear', 'endMonth', 'endYear'];

/** A field the API rejected (express-validator's `path`) → the form field that
 *  shows the message, and the form's own message for it. */
const FIELD_MESSAGES: Record<string, { field: string; key: string }> = {
  fullName: { field: 'fullName', key: 'form.errors.nameMinLength' },
  email: { field: 'email', key: 'form.errors.invalidEmail' },
  phone: { field: 'phone', key: 'form.errors.invalidPhone' },
  country: { field: 'country', key: 'form.errors.countryRequired' },
  minBudget: { field: 'maxBudget', key: 'form.errors.budgetRange' },
  maxBudget: { field: 'maxBudget', key: 'form.errors.budgetRange' },
  comments: { field: 'comments', key: 'form.errors.commentsRequired' },
};

export type SubmissionOutcome =
  | { type: 'success' }
  /** `message`: the summary; `fields`: form field → message, both as keys. */
  | { type: 'error'; message: string; fields: Record<string, string> };

export function submissionOutcome(status: number, body: SubmitResponse | null): SubmissionOutcome {
  if (status >= 200 && status < 300 && body?.success) return { type: 'success' };
  if (status === 429) return { type: 'error', message: 'form.errors.tooManyRequests', fields: {} };
  if (status === 400) {
    // The server checks what this form checks, so this is rare (a month that
    // has just ended in Cairo, say); a field it names gets the form's message.
    const fields: Record<string, string> = {};
    for (const { path } of body?.errors ?? []) {
      if (!path) continue;
      if (DATE_FIELDS.includes(path)) {
        for (const name of DATE_FIELDS) fields[name] = 'form.errors.travelRange';
      } else if (FIELD_MESSAGES[path]) {
        fields[FIELD_MESSAGES[path].field] = FIELD_MESSAGES[path].key;
      }
    }
    return { type: 'error', message: 'form.errors.invalidSubmission', fields };
  }
  // 5xx, 409 (a reused retry key) or anything else: the request did not go
  // through, and sending it again is safe (the retry key prevents duplicates).
  return { type: 'error', message: 'form.success.failFallback', fields: {} };
}
