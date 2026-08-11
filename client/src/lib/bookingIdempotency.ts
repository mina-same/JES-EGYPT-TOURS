export const BOOKING_IDEMPOTENCY_HEADER = 'Idempotency-Key';

const STORAGE_PREFIX = 'jes:booking-idempotency:';
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface BookingIdempotencyPayload {
  tour: string;
  name: string;
  email: string;
  phone: string;
  nationality?: string;
  dateFrom: string;
  dateTo: string;
  adults: number;
  children: number;
  infants: number;
  requirements?: string;
  currency?: 'USD' | 'EUR' | 'GBP';
  /** Which pricing tier the enquiry is about, or NOT_SURE. */
  selectedPackage?: string;
  /** Spam trap only. It is sent to the API but deliberately excluded from the
   * idempotency fingerprint and is never part of a stored booking. */
  website?: string;
}

export interface BookingAttemptStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface BookingAttempt {
  idempotencyKey: string;
  payloadFingerprint: string;
  storageKey: string;
}

interface BookingAttemptOptions {
  storage?: BookingAttemptStorage | null;
  keyFactory?: () => string;
}

type AttemptBucket = Record<string, string>;

// Also protects repeated clicks in browsers where sessionStorage is disabled.
// sessionStorage remains the durable source across a page refresh in one tab.
const volatileAttempts = new Map<string, AttemptBucket>();

const canonicalPayload = (payload: BookingIdempotencyPayload): string =>
  JSON.stringify([
    payload.tour,
    payload.name,
    payload.email,
    payload.phone,
    payload.nationality || '',
    payload.dateFrom,
    payload.dateTo,
    payload.adults,
    payload.children,
    payload.infants,
    payload.requirements || '',
    payload.currency || 'USD',
    // Mirrors the server's fingerprint. Left out, a visitor who changed the
    // package and resubmitted would reuse the previous attempt's key and get
    // the earlier booking replayed back — with the old package on it.
    payload.selectedPackage || '',
  ]);

/** A synchronous, non-reversible client fingerprint used only to find the same
 * attempt in sessionStorage. The API independently creates a SHA-256 fingerprint
 * and is the actual trust boundary. */
export const createBookingPayloadFingerprint = (
  payload: BookingIdempotencyPayload
): string => {
  const value = canonicalPayload(payload);
  let first = 0xdeadbeef ^ value.length;
  let second = 0x41c6ce57 ^ value.length;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 2654435761);
    second = Math.imul(second ^ code, 1597334677);
  }

  first = Math.imul(first ^ (first >>> 16), 2246822507) ^
    Math.imul(second ^ (second >>> 13), 3266489909);
  second = Math.imul(second ^ (second >>> 16), 2246822507) ^
    Math.imul(first ^ (first >>> 13), 3266489909);

  return `${(first >>> 0).toString(16).padStart(8, '0')}${
    (second >>> 0).toString(16).padStart(8, '0')
  }`;
};

const defaultStorage = (): BookingAttemptStorage | null => {
  try {
    const storage = (globalThis as typeof globalThis & {
      sessionStorage?: BookingAttemptStorage;
    }).sessionStorage;
    return storage || null;
  } catch {
    return null;
  }
};

const createUuidV4 = (): string => {
  const bytes = new Uint8Array(16);
  const cryptoApi = (globalThis as typeof globalThis & {
    crypto?: {
      randomUUID?: () => string;
      getRandomValues?: (array: Uint8Array) => Uint8Array;
    };
  }).crypto;

  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();

  if (cryptoApi?.getRandomValues) {
    cryptoApi.getRandomValues(bytes);
  } else {
    // Legacy fallback: uniqueness is the requirement here, not secrecy. The
    // server still validates the UUID and protects it with a unique index.
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));

  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${
    hex.slice(6, 8).join('')
  }-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
};

const readBucket = (
  storageKey: string,
  storage: BookingAttemptStorage | null
): AttemptBucket => {
  const bucket: AttemptBucket = { ...(volatileAttempts.get(storageKey) || {}) };

  if (!storage) return bucket;

  try {
    const serialized = storage.getItem(storageKey);
    if (!serialized) return bucket;
    const stored = JSON.parse(serialized) as Record<string, unknown>;

    for (const [fingerprint, key] of Object.entries(stored)) {
      if (typeof key === 'string' && UUID_V4_PATTERN.test(key)) {
        bucket[fingerprint] = key;
      }
    }
  } catch {
    // A corrupt/blocked storage entry falls back to the in-memory bucket.
  }

  return bucket;
};

const writeBucket = (
  storageKey: string,
  bucket: AttemptBucket,
  storage: BookingAttemptStorage | null
): void => {
  volatileAttempts.set(storageKey, { ...bucket });
  if (!storage) return;

  try {
    if (Object.keys(bucket).length === 0) {
      storage.removeItem(storageKey);
    } else {
      storage.setItem(storageKey, JSON.stringify(bucket));
    }
  } catch {
    // The volatile copy still protects retries during this page session.
  }
};

export const getOrCreateBookingAttempt = (
  payload: BookingIdempotencyPayload,
  options: BookingAttemptOptions = {}
): BookingAttempt => {
  const storage = options.storage === undefined ? defaultStorage() : options.storage;
  const storageKey = `${STORAGE_PREFIX}${encodeURIComponent(payload.tour)}`;
  const payloadFingerprint = createBookingPayloadFingerprint(payload);
  const bucket = readBucket(storageKey, storage);
  let idempotencyKey = bucket[payloadFingerprint];

  if (!idempotencyKey) {
    idempotencyKey = (options.keyFactory || createUuidV4)();
    if (!UUID_V4_PATTERN.test(idempotencyKey)) {
      throw new Error('Booking idempotency key must be a UUID v4');
    }
    bucket[payloadFingerprint] = idempotencyKey;
    writeBucket(storageKey, bucket, storage);
  }

  return { idempotencyKey, payloadFingerprint, storageKey };
};

export const clearBookingAttempt = (
  attempt: BookingAttempt,
  options: Pick<BookingAttemptOptions, 'storage'> = {}
): void => {
  const storage = options.storage === undefined ? defaultStorage() : options.storage;
  const bucket = readBucket(attempt.storageKey, storage);
  delete bucket[attempt.payloadFingerprint];
  writeBucket(attempt.storageKey, bucket, storage);
};
