import assert from 'node:assert/strict';
import test from 'node:test';
import { matchedData, validationResult } from 'express-validator';
import { createBooking } from '../src/controllers/bookingController';
import {
  bookingIdempotencyValidation,
  bookingValidation,
} from '../src/middleware/validation';
import Booking from '../src/models/Booking';
import Tour from '../src/models/Tour';
import {
  createBookingRequestFingerprint,
  getBookingToday,
  isBookingDateTodayOrFuture,
  isValidBookingDate,
  isValidInternationalPhone,
  resolveTourStartingQuote,
} from '../src/utils/booking';

const TEST_IDEMPOTENCY_KEY = '8b943bad-4418-46dc-8425-35f4ef629a62';

const validPublicBookingRequest = (idempotencyKey = TEST_IDEMPOTENCY_KEY) => {
  const headers: Record<string, string> = {
    'idempotency-key': idempotencyKey,
  };

  return {
    headers,
    get(name: string) {
      return headers[name.toLowerCase()];
    },
    body: {
      tour: '64b7f1c2e8a4d91234567890',
      name: 'Test Visitor',
      email: 'visitor@example.com',
      phone: '+201001234567',
      dateFrom: '2099-09-10',
      dateTo: '2099-09-12',
      adults: 2,
      children: 0,
      infants: 0,
      currency: 'EUR' as const,
    },
  };
};

const runPublicBookingValidation = async (
  request: ReturnType<typeof validPublicBookingRequest>
): Promise<void> => {
  await Promise.all(
    [...bookingIdempotencyValidation, ...bookingValidation].map((validator) =>
      validator.run(request)
    )
  );
};

const queryReturning = (value: unknown) => ({
  select: async () => value,
});

const captureResponse = () => {
  let statusCode = 0;
  let body: unknown;

  const response = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(value: unknown) {
      body = value;
      return this;
    },
  };

  return {
    response,
    statusCode: () => statusCode,
    body: () => body,
  };
};

test('booking dates accept real date-only values and reject shifted/impossible input', () => {
  assert.equal(isValidBookingDate('2028-02-29'), true);
  assert.equal(isValidBookingDate('2026-02-29'), false);
  assert.equal(isValidBookingDate('2026-08-05'), true);
  assert.equal(isValidBookingDate('2026-08-05T00:00:00.000Z'), false);
});

test('past dates are rejected using the Cairo business day', () => {
  const afterCairoMidnight = new Date('2026-08-05T22:30:00.000Z');

  assert.equal(getBookingToday(afterCairoMidnight), '2026-08-06');
  assert.equal(isBookingDateTodayOrFuture('2026-08-05', afterCairoMidnight), false);
  assert.equal(isBookingDateTodayOrFuture('2026-08-06', afterCairoMidnight), true);
  assert.equal(isBookingDateTodayOrFuture('2026-08-07', afterCairoMidnight), true);
});

test('international booking phones require a valid E.164 structure', () => {
  assert.equal(isValidInternationalPhone('+201001234567'), true);
  assert.equal(isValidInternationalPhone('01001234567'), false);
  assert.equal(isValidInternationalPhone('+0123456789'), false);
  assert.equal(isValidInternationalPhone('+2012345678901234'), false);
});

test('booking idempotency header requires a UUID v4', async () => {
  const missing = validPublicBookingRequest('');
  await Promise.all(
    bookingIdempotencyValidation.map((validator) => validator.run(missing))
  );
  assert.equal(
    validationResult(missing).array()[0]?.msg,
    'Idempotency-Key header is required'
  );

  const malformed = validPublicBookingRequest('not-a-uuid');
  await Promise.all(
    bookingIdempotencyValidation.map((validator) => validator.run(malformed))
  );
  assert.equal(
    validationResult(malformed).array()[0]?.msg,
    'Idempotency-Key header must be a valid UUID v4'
  );

  const valid = validPublicBookingRequest();
  await Promise.all(
    bookingIdempotencyValidation.map((validator) => validator.run(valid))
  );
  assert.equal(validationResult(valid).isEmpty(), true);
});

test('server booking fingerprint is stable and changes with booking data', () => {
  const first = validPublicBookingRequest().body;
  const sameWithNormalizedEmail = {
    ...first,
    email: 'VISITOR@EXAMPLE.COM',
  };
  const changedDates = {
    ...first,
    dateTo: '2099-09-13',
  };

  assert.equal(
    createBookingRequestFingerprint(first),
    createBookingRequestFingerprint(sameWithNormalizedEmail)
  );
  assert.notEqual(
    createBookingRequestFingerprint(first),
    createBookingRequestFingerprint(changedDates)
  );
});

test('booking quote uses authoritative exact per-currency tour prices', () => {
  const quote = resolveTourStartingQuote(
    { USD: 100, EUR: 87.5, GBP: 75 },
    'EUR',
    { EUR: 9.99, GBP: 9.99 }
  );

  assert.equal(quote, 87.5);
});

test('booking quote falls back from authoritative USD using configured rates', () => {
  const quote = resolveTourStartingQuote(
    { USD: 125 },
    'GBP',
    { EUR: 0.92, GBP: 0.8 }
  );

  assert.equal(quote, 100);
});

test('booking quote is omitted when the tour has no usable starting price', () => {
  assert.equal(resolveTourStartingQuote(undefined, 'USD'), undefined);
  assert.equal(resolveTourStartingQuote({ USD: 0 }, 'USD'), undefined);
});

test('public booking validation never exposes privileged or client-priced fields', async () => {
  const request = validPublicBookingRequest();
  Object.assign(request.body, {
    status: 'confirmed',
    adminNotes: 'Injected from the public form',
    quotedPrice: 1,
    website: '',
  });

  await runPublicBookingValidation(request);
  assert.equal(validationResult(request).isEmpty(), true);

  const publicFields = matchedData(request, { locations: ['body'] });
  assert.equal(publicFields.status, undefined);
  assert.equal(publicFields.adminNotes, undefined);
  assert.equal(publicFields.quotedPrice, undefined);
  assert.equal(publicFields.website, undefined);
  assert.equal(publicFields.currency, 'EUR');
  assert.equal(publicFields.tour, request.body.tour);
});

test('public booking validation rejects missing phones and past start dates', async () => {
  const request = validPublicBookingRequest();
  request.body.phone = '';
  request.body.dateFrom = '2000-01-01';

  await runPublicBookingValidation(request);
  const errorMessages = validationResult(request).array().map((error) => error.msg);

  assert.ok(errorMessages.includes('Mobile number is required'));
  assert.ok(errorMessages.includes('Start date cannot be in the past'));
});

test('inactive tours are rejected before a booking can be created', async () => {
  const request = validPublicBookingRequest();
  await runPublicBookingValidation(request);

  const originalFindById = Tour.findById;
  const originalFindOne = Booking.findOne;
  const originalCreate = Booking.create;
  let bookingCreateCalled = false;
  let responseStatus = 0;
  let responseBody: unknown;

  Tour.findById = (async () => ({
    _id: request.body.tour,
    isActive: false,
  })) as unknown as typeof Tour.findById;
  Booking.findOne = (() => queryReturning(null)) as unknown as typeof Booking.findOne;
  Booking.create = (async () => {
    bookingCreateCalled = true;
    throw new Error('Booking.create must not run for inactive tours');
  }) as unknown as typeof Booking.create;

  const response = {
    status(code: number) {
      responseStatus = code;
      return this;
    },
    json(body: unknown) {
      responseBody = body;
      return this;
    },
  };

  try {
    await createBooking(request as never, response as never);
  } finally {
    Tour.findById = originalFindById;
    Booking.findOne = originalFindOne;
    Booking.create = originalCreate;
  }

  assert.equal(responseStatus, 409);
  assert.deepEqual(responseBody, {
    success: false,
    error: 'This tour is currently unavailable for booking',
  });
  assert.equal(bookingCreateCalled, false);
});

test('booking model owns a sparse unique idempotency index and hides technical fields', () => {
  const idempotencyIndex = Booking.schema.indexes().find(
    ([fields]) => fields.idempotencyKey === 1
  );

  assert.ok(idempotencyIndex);
  assert.equal(idempotencyIndex[1].unique, true);
  assert.equal(idempotencyIndex[1].sparse, true);

  const booking = new Booking({
    tour: '64b7f1c2e8a4d91234567890',
    name: 'Test Visitor',
    email: 'visitor@example.com',
    phone: '+201001234567',
    dateFrom: new Date('2099-09-10T00:00:00.000Z'),
    dateTo: new Date('2099-09-12T00:00:00.000Z'),
    adults: 2,
    idempotencyKey: TEST_IDEMPOTENCY_KEY,
    requestFingerprint: 'a'.repeat(64),
  });
  assert.equal(booking.validateSync(), undefined);

  const json = booking.toJSON() as Record<string, unknown>;
  assert.equal(json.idempotencyKey, undefined);
  assert.equal(json.requestFingerprint, undefined);
});

test('retrying the same attempt replays the original booking without creating another', async () => {
  const request = validPublicBookingRequest();
  await runPublicBookingValidation(request);
  const fingerprint = createBookingRequestFingerprint(request.body);
  let populateCalls = 0;
  let tourLookupCalled = false;
  let bookingCreateCalled = false;
  const existingBooking = {
    _id: 'existing-booking-id',
    requestFingerprint: fingerprint,
    async populate() {
      populateCalls += 1;
      return this;
    },
  };

  const originalFindOne = Booking.findOne;
  const originalFindById = Tour.findById;
  const originalCreate = Booking.create;
  Booking.findOne = (() =>
    queryReturning(existingBooking)) as unknown as typeof Booking.findOne;
  Tour.findById = (() => {
    tourLookupCalled = true;
    throw new Error('Tour lookup must not run during an idempotent replay');
  }) as unknown as typeof Tour.findById;
  Booking.create = (() => {
    bookingCreateCalled = true;
    throw new Error('Booking.create must not run during an idempotent replay');
  }) as unknown as typeof Booking.create;

  const captured = captureResponse();
  try {
    await createBooking(request as never, captured.response as never);
  } finally {
    Booking.findOne = originalFindOne;
    Tour.findById = originalFindById;
    Booking.create = originalCreate;
  }

  assert.equal(captured.statusCode(), 200);
  assert.equal((captured.body() as { idempotentReplay?: boolean }).idempotentReplay, true);
  assert.equal(populateCalls, 1);
  assert.equal(tourLookupCalled, false);
  assert.equal(bookingCreateCalled, false);
});

test('reusing an idempotency key with different booking data returns conflict', async () => {
  const request = validPublicBookingRequest();
  await runPublicBookingValidation(request);
  let bookingCreateCalled = false;
  const conflictingBooking = {
    requestFingerprint: '0'.repeat(64),
    async populate() {
      throw new Error('A conflicting replay must not populate');
    },
  };

  const originalFindOne = Booking.findOne;
  const originalCreate = Booking.create;
  Booking.findOne = (() =>
    queryReturning(conflictingBooking)) as unknown as typeof Booking.findOne;
  Booking.create = (() => {
    bookingCreateCalled = true;
    throw new Error('Booking.create must not run for conflicting data');
  }) as unknown as typeof Booking.create;

  const captured = captureResponse();
  try {
    await createBooking(request as never, captured.response as never);
  } finally {
    Booking.findOne = originalFindOne;
    Booking.create = originalCreate;
  }

  assert.equal(captured.statusCode(), 409);
  assert.deepEqual(captured.body(), {
    success: false,
    code: 'IDEMPOTENCY_KEY_REUSED',
    error: 'This Idempotency-Key was already used with different booking data',
  });
  assert.equal(bookingCreateCalled, false);
});

test('a concurrent duplicate insert replays the winner after the unique-index race', async () => {
  const request = validPublicBookingRequest();
  await runPublicBookingValidation(request);
  const fingerprint = createBookingRequestFingerprint(request.body);
  const winningBooking = {
    _id: 'winning-booking-id',
    requestFingerprint: fingerprint,
    async populate() {
      return this;
    },
  };
  let lookupCalls = 0;
  let createCalls = 0;
  let modelInitCalls = 0;

  const originalFindOne = Booking.findOne;
  const originalFindById = Tour.findById;
  const originalCreate = Booking.create;
  const originalInit = Booking.init;
  Booking.findOne = (() => {
    lookupCalls += 1;
    return queryReturning(lookupCalls === 1 ? null : winningBooking);
  }) as unknown as typeof Booking.findOne;
  Tour.findById = (async () => ({
    _id: request.body.tour,
    isActive: true,
    priceStartingFrom: { USD: 100, EUR: 90 },
  })) as unknown as typeof Tour.findById;
  Booking.init = (async () => {
    modelInitCalls += 1;
    return Booking;
  }) as unknown as typeof Booking.init;
  Booking.create = (async () => {
    createCalls += 1;
    throw {
      code: 11000,
      keyPattern: { idempotencyKey: 1 },
      keyValue: { idempotencyKey: TEST_IDEMPOTENCY_KEY },
    };
  }) as unknown as typeof Booking.create;

  const captured = captureResponse();
  try {
    await createBooking(request as never, captured.response as never);
  } finally {
    Booking.findOne = originalFindOne;
    Tour.findById = originalFindById;
    Booking.init = originalInit;
    Booking.create = originalCreate;
  }

  assert.equal(captured.statusCode(), 200);
  assert.equal((captured.body() as { idempotentReplay?: boolean }).idempotentReplay, true);
  assert.equal(lookupCalls, 2);
  assert.equal(modelInitCalls, 1);
  assert.equal(createCalls, 1);
});
