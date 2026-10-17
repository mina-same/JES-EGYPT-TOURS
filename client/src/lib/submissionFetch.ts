import { createUuidV4 } from './bookingIdempotency';
const attempts = new Map<string, string>();
const pending = new Map<string, Promise<Response>>();
/** Keep the same key after a network failure, including after a page refresh.
 * Store only a digest, never the form's personal data. */
export async function submissionFetch(url: string, options: RequestInit): Promise<Response> {
  const bytes = new TextEncoder().encode(`${url}:${String(options.body || '')}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const storageKey = 'jes:submission:' + Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  const inFlight = pending.get(storageKey);
  if (inFlight) return (await inFlight).clone();
  let key = attempts.get(storageKey);
  try { key = key || sessionStorage.getItem(storageKey) || undefined; } catch { /* storage can be disabled */ }
  key = key || createUuidV4();
  attempts.set(storageKey, key);
  try { sessionStorage.setItem(storageKey, key); } catch { /* memory still protects retries */ }
  const headers = new Headers(options.headers);
  headers.set('Idempotency-Key', key);
  const request = fetch(url, { ...options, headers, signal: options.signal || AbortSignal.timeout(20000) }).then(async response => {
    const body = await response.clone().json().catch(() => null);
    if ((response.ok && body?.success) || body?.code === 'IDEMPOTENCY_KEY_REUSED') {
      attempts.delete(storageKey);
      try { sessionStorage.removeItem(storageKey); } catch { /* optional storage */ }
    }
    return response;
  });
  pending.set(storageKey, request);
  try { return (await request).clone(); } finally { pending.delete(storageKey); }
}
