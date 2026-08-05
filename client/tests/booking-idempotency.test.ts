import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearBookingAttempt,
  createBookingPayloadFingerprint,
  getOrCreateBookingAttempt,
  type BookingAttemptStorage,
  type BookingIdempotencyPayload,
} from '../src/lib/bookingIdempotency';

class MemoryStorage implements BookingAttemptStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  serializedValues(): string {
    return [...this.values.values()].join('\n');
  }
}

const payload = (
  tour = '64b7f1c2e8a4d91234567890'
): BookingIdempotencyPayload => ({
  tour,
  name: 'Test Visitor',
  email: 'visitor@example.com',
  phone: '+201001234567',
  nationality: 'EG',
  dateFrom: '2099-09-10',
  dateTo: '2099-09-12',
  adults: 2,
  children: 0,
  infants: 0,
  requirements: 'Airport pickup',
  currency: 'EUR',
});

const deterministicKeys = () => {
  const keys = [
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
  ];
  let index = 0;
  return () => keys[index++];
};

test('the same unsucceeded payload reuses one idempotency key', () => {
  const storage = new MemoryStorage();
  const keyFactory = deterministicKeys();
  const first = getOrCreateBookingAttempt(payload(), { storage, keyFactory });
  const retry = getOrCreateBookingAttempt(payload(), { storage, keyFactory });

  assert.equal(retry.idempotencyKey, first.idempotencyKey);
  assert.equal(retry.payloadFingerprint, first.payloadFingerprint);
});

test('changed booking data is a new attempt, not a similarity-based duplicate', () => {
  const storage = new MemoryStorage();
  const keyFactory = deterministicKeys();
  const basePayload = payload('64b7f1c2e8a4d91234567891');
  const first = getOrCreateBookingAttempt(basePayload, { storage, keyFactory });
  const genuinelyNewBooking = {
    ...basePayload,
    name: 'Another Traveller',
  };
  const second = getOrCreateBookingAttempt(genuinelyNewBooking, {
    storage,
    keyFactory,
  });

  assert.notEqual(second.payloadFingerprint, first.payloadFingerprint);
  assert.notEqual(second.idempotencyKey, first.idempotencyKey);
});

test('a successful attempt can be cleared so an identical future booking gets a new key', () => {
  const storage = new MemoryStorage();
  const keyFactory = deterministicKeys();
  const basePayload = payload('64b7f1c2e8a4d91234567892');
  const first = getOrCreateBookingAttempt(basePayload, { storage, keyFactory });

  clearBookingAttempt(first, { storage });
  const futureBooking = getOrCreateBookingAttempt(basePayload, { storage, keyFactory });

  assert.notEqual(futureBooking.idempotencyKey, first.idempotencyKey);
});

test('session storage contains only fingerprints and keys, not booking PII', () => {
  const storage = new MemoryStorage();
  getOrCreateBookingAttempt(payload('64b7f1c2e8a4d91234567893'), {
    storage,
    keyFactory: deterministicKeys(),
  });
  const serialized = storage.serializedValues();

  assert.equal(serialized.includes('visitor@example.com'), false);
  assert.equal(serialized.includes('Test Visitor'), false);
  assert.equal(serialized.includes('+201001234567'), false);
});

test('client payload fingerprints are stable and generated keys are UUID v4', () => {
  assert.equal(
    createBookingPayloadFingerprint(payload()),
    createBookingPayloadFingerprint(payload())
  );

  const attempt = getOrCreateBookingAttempt(
    payload('64b7f1c2e8a4d91234567894'),
    { storage: null }
  );
  assert.match(
    attempt.idempotencyKey,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  );
});

test('the honeypot value is never part of the client idempotency fingerprint', () => {
  const humanPayload = { ...payload(), website: '' };
  const trappedPayload = {
    ...humanPayload,
    website: 'https://spam.example',
  };

  assert.equal(
    createBookingPayloadFingerprint(humanPayload),
    createBookingPayloadFingerprint(trappedPayload)
  );
});
