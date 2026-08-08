export const SESSION_EXPIRED_FIELD = 'Session expired';

export const SESSION_EXPIRED_SUMMARY =
  'Your login session has expired or is no longer valid. The server did not save this attempt.';

export const SESSION_RECOVERY_STEPS = [
  'Keep this page open so your unsaved work stays available.',
  'Open the login page in a new tab and sign in again.',
  'Return to this tab and click the save button again.',
] as const;

export const SESSION_EXPIRED_MESSAGE =
  `${SESSION_EXPIRED_SUMMARY} ${SESSION_RECOVERY_STEPS.join(' ')}`;

const AUTHENTICATION_ERROR_PATTERNS = [
  /^not authorized to access this route[.!]?$/i,
  /^unauthorized[.!]?$/i,
  /\b(?:jwt|session|token)\s+(?:has\s+)?expired\b/i,
  /\b(?:invalid|expired)\s+(?:jwt|session|token)\b/i,
  /\bauthentication required\b/i,
];

export function isAuthenticationErrorMessage(message: string): boolean {
  const normalizedMessage = message.trim();
  return AUTHENTICATION_ERROR_PATTERNS.some((pattern) => pattern.test(normalizedMessage));
}
