import assert from 'node:assert/strict';
import test from 'node:test';
import { validationResult } from 'express-validator';
import TailorMadeRequest from '../src/models/TailorMadeRequest';
import Notification from '../src/models/Notification';
import { bookingValidation, contactSubmissionValidation, tailorMadeRequestValidation } from '../src/middleware/validation';
import { createTailorMadeRequest } from '../src/controllers/tailorMadeController';
import { isTailorMadePhone, isTravelYear, TRAVEL_YEARS_AHEAD } from '../src/utils/tailorMade';
import { getBookingToday } from '../src/utils/booking';

/*
 * The public tailor-made request, checked on the server whatever the browser
 * did. Before: any text (of any length) as a phone number, a 20,000-character
 * country, 200 KB of "duration", 5000 free-form "interests", "$999999999" as a
 * budget, 9999 as a travel year; a number or {"$gt": ""} stored as "12345" or
 * "[object Object]"; arrays reaching Mongoose, whose "Cast to string failed …
 * at path …" message went back to the caller; and every 400 echoing the values
 * it rejected.
 */

const year = Number(getBookingToday().slice(0, 4));
const cairoMonth = new Date().toLocaleString('en', { month: 'long', timeZone: 'Africa/Cairo' });

/** What the form sends, captured from the real page in each language (the
 *  years moved to the current window). */
const FORM_PAYLOADS = {
  en: { fullName: 'Jane Doe', email: 'jane.doe@example.com', phone: '', country: 'United Kingdom', startMonth: 'December', startYear: String(year + 1), endMonth: 'January', endYear: String(year + 2), duration: '', accommodation: '', adults: 2, children: 0, infants: 0, minBudget: '', maxBudget: '', specialOccasion: '', interests: [], dietary: '', mobility: '', comments: 'We would love a relaxed two-week trip.', locale: 'en' },
  de: { fullName: 'Jörg Müller-Lüdenscheidt', email: 'joerg+reise@beispiel.de', phone: '+4915123456789', country: 'Germany', startMonth: 'March', startYear: String(year + 1), endMonth: 'April', endYear: String(year + 1), duration: '14 Tage', accommodation: 'Luxury Hotels (5 Star)', adults: 3, children: 2, infants: 1, minBudget: '$3,000', maxBudget: 'No Limit', specialOccasion: 'Honeymoon', interests: ['Ancient Sites & Temples', 'Nile River Cruise', 'Museums & Culture', 'Desert Safari', 'Red Sea & Beaches', 'Local Cuisine', 'Photography Tours', 'Adventure Activities'], dietary: 'Vegetarisch, laktosefrei', mobility: 'Rollstuhlgerecht bitte', comments: 'Wir möchten Kairo, Luxor und Assuan sehen.', locale: 'de' },
  it: { fullName: "Maria D'Angelo", email: 'maria.dangelo@esempio.it', phone: '+393123456789', country: 'Italy', startMonth: 'June', startYear: String(year + 5), endMonth: 'July', endYear: String(year + 5), duration: '', accommodation: '', adults: 2, children: 0, infants: 0, minBudget: '$5,000+', maxBudget: '', specialOccasion: 'Anniversary', interests: ['Ancient Sites & Temples', 'Nile River Cruise', 'Museums & Culture'], dietary: '', mobility: '', comments: 'Crociera sul Nilo e mar Rosso.', locale: 'it' },
  es: { fullName: 'José Ñúñez', email: 'jose@ejemplo.es', phone: '+34612345678', country: 'Spain', startMonth: 'September', startYear: String(year + 1), endMonth: 'September', endYear: String(year + 1), duration: '10 días', accommodation: 'Mix of Categories', adults: 2, children: 0, infants: 1, minBudget: '', maxBudget: '$10,000', specialOccasion: 'Other Celebration', interests: ['Ancient Sites & Temples'], dietary: '', mobility: '', comments: 'Viaje familiar con un bebé.', locale: 'es' },
};
const base = () => structuredClone(FORM_PAYLOADS.en) as Record<string, unknown>;
const without = (field: string) => { const body = base(); delete body[field]; return body; };

/** The real chain, then the real controller with the write captured. */
async function submit(context: any, body: unknown) {
  const req: any = { body: structuredClone(body), headers: {}, get: () => undefined };
  for (const rule of tailorMadeRequestValidation) await rule.run(req);
  let created: any = null;
  context.mock.method(TailorMadeRequest, 'create', async (data: any) => { created = data; return { ...data, _id: 'request', createdAt: new Date() }; });
  context.mock.method(TailorMadeRequest, 'updateOne', async () => ({}));
  context.mock.method(Notification, 'init', async () => Notification);
  context.mock.method(Notification, 'findOneAndUpdate', async () => ({ _id: 'notification', createdAt: new Date() }));
  const res: any = { code: 0, body: null, status(code: number) { this.code = code; return this; }, json(payload: any) { this.body = payload; return this; } };
  await createTailorMadeRequest(req, res);
  return { status: res.code, body: res.body, created, paths: [...new Set((res.body?.errors || []).map((error: any) => error.path))] as string[] };
}

test('every payload the form sends, in the four languages, is accepted and stored as sent', async (context) => {
  for (const [locale, payload] of Object.entries(FORM_PAYLOADS)) {
    const result = await submit(context, payload);
    assert.equal(result.status, 201, locale);
    // The same fields and values as the form sent (plus the server's own five).
    const { status, budgetCurrency, budgetMinAmount, budgetMaxAmount, notificationPending, ...stored } = result.created;
    assert.deepEqual(stored, payload, locale);
    assert.equal(status, 'pending');
    assert.equal(notificationPending, true);
    assert.equal(budgetCurrency, 'USD');
    assert.equal(budgetMinAmount, payload.minBudget ? Number(payload.minBudget.replace(/[$,+]/g, '')) : undefined);
    assert.equal(budgetMaxAmount, payload.maxBudget && payload.maxBudget !== 'No Limit' ? Number(payload.maxBudget.replace(/[$,+]/g, '')) : undefined);
  }
});

test('the limits are inclusive, and optional fields may be empty or absent', async (context) => {
  for (const [label, body] of Object.entries({
    'name of 100': { ...base(), fullName: 'a'.repeat(100) },
    'comments of 2000': { ...base(), comments: 'c'.repeat(2000) },
    'duration of 100': { ...base(), duration: 'd'.repeat(100) },
    'dietary and mobility of 500': { ...base(), dietary: 'e'.repeat(500), mobility: 'm'.repeat(500) },
    'country of 100': { ...base(), country: 'C'.repeat(100) },
    'Niue phone (7 digits)': { ...base(), phone: '+6834123' },
    'phone of 15 digits': { ...base(), phone: '+491512345678901' },
    'start this month': { ...base(), startMonth: cairoMonth, startYear: String(year), endMonth: 'December', endYear: String(year) },
    'the last year the form offers': { ...base(), startMonth: 'January', startYear: String(year + 5), endMonth: 'December', endYear: String(year + 5) },
    'one year beyond it (clock tolerance)': { ...base(), startMonth: 'January', startYear: String(year + TRAVEL_YEARS_AHEAD), endMonth: 'February', endYear: String(year + TRAVEL_YEARS_AHEAD) },
    'counts at their maximum': { ...base(), adults: 50, children: 50, infants: 50 },
    'a count as a numeric string': { ...base(), adults: '2' },
    'min equal to max budget': { ...base(), minBudget: '$1,000', maxBudget: '$1,000' },
    'all eight interests': { ...base(), interests: FORM_PAYLOADS.de.interests },
    'no optional fields at all': (({ fullName, email, country, startMonth, startYear, endMonth, endYear, adults, comments }) => ({ fullName, email, country, startMonth, startYear, endMonth, endYear, adults, comments }))(base() as any),
    'no locale (an older page)': without('locale'),
  })) {
    const result = await submit(context, body);
    assert.equal(result.status, 201, `${label}: ${JSON.stringify(result.paths)}`);
  }
});

test('anything else is refused with a 400 naming the field, and nothing is written', async (context) => {
  const cases: Array<[string, unknown, string]> = [
    // missing
    ...['fullName', 'email', 'country', 'startMonth', 'startYear', 'endMonth', 'endYear', 'adults', 'comments'].map((field) => [`missing ${field}`, without(field), field] as [string, unknown, string]),
    ['blank comments', { ...base(), comments: '   ' }, 'comments'],
    // types: never converted
    ['name as a number', { ...base(), fullName: 12345 }, 'fullName'],
    ['name as an array', { ...base(), fullName: ['Jane', 'Doe'] }, 'fullName'],
    ['name as an operator object', { ...base(), fullName: { $gt: '' } }, 'fullName'],
    ['email as an array', { ...base(), email: ['a@example.com'] }, 'email'],
    ['country as an object', { ...base(), country: { name: 'Germany' } }, 'country'],
    ['month as an array', { ...base(), startMonth: ['December'] }, 'startMonth'],
    ['year as an array', { ...base(), startYear: [String(year + 1)] }, 'startYear'],
    ['adults as an array', { ...base(), adults: [2] }, 'adults'],
    ['adults as a boolean', { ...base(), adults: true }, 'adults'],
    ['children as an object', { ...base(), children: { $gt: 0 } }, 'children'],
    ['comments as an array', { ...base(), comments: ['a', 'b'] }, 'comments'],
    ['phone as a number', { ...base(), phone: 4915123456789 }, 'phone'],
    ['phone as null', { ...base(), phone: null }, 'phone'],
    ['duration as an object', { ...base(), duration: { a: 1 } }, 'duration'],
    ['dietary as an array', { ...base(), dietary: ['vegan'] }, 'dietary'],
    ['locale as an array', { ...base(), locale: ['de'] }, 'locale'],
    ['budget as a number', { ...base(), minBudget: 1000 }, 'minBudget'],
    ['accommodation as an array', { ...base(), accommodation: ['Mix of Categories'] }, 'accommodation'],
    ['occasion as an array', { ...base(), specialOccasion: ['Honeymoon'] }, 'specialOccasion'],
    ['interests as a string', { ...base(), interests: 'Nile River Cruise' }, 'interests'],
    ['an interest as an object', { ...base(), interests: [{ $gt: '' }] }, 'interests[0]'],
    // phone
    ['phone as text', { ...base(), phone: 'call me maybe' }, 'phone'],
    ['phone of 5000 digits', { ...base(), phone: `+${'1'.repeat(5000)}` }, 'phone'],
    ['phone of 16 digits', { ...base(), phone: '+4915123456789012' }, 'phone'],
    ['phone of 6 digits', { ...base(), phone: '+431000' }, 'phone'],
    ['phone without +', { ...base(), phone: '4915123456789' }, 'phone'],
    ['phone with spaces', { ...base(), phone: '+49 151 23456789' }, 'phone'],
    ['phone with a 0 country code', { ...base(), phone: '+0915123456789' }, 'phone'],
    // lengths: one past each limit
    ['name of 101', { ...base(), fullName: 'a'.repeat(101) }, 'fullName'],
    ['name of 1', { ...base(), fullName: 'a' }, 'fullName'],
    ['country of 101', { ...base(), country: 'C'.repeat(101) }, 'country'],
    ['country of 20,000', { ...base(), country: '<b>x</b>'.repeat(2500) }, 'country'],
    ['duration of 101', { ...base(), duration: 'd'.repeat(101) }, 'duration'],
    ['duration of 200 KB', { ...base(), duration: 'd'.repeat(200_000) }, 'duration'],
    ['dietary of 501', { ...base(), dietary: 'e'.repeat(501) }, 'dietary'],
    ['mobility of 100 KB', { ...base(), mobility: 'm'.repeat(100_000) }, 'mobility'],
    ['comments of 2001', { ...base(), comments: 'c'.repeat(2001) }, 'comments'],
    ['nine interests', { ...base(), interests: [...FORM_PAYLOADS.de.interests, 'Nile River Cruise'] }, 'interests'],
    ['5000 interests', { ...base(), interests: Array.from({ length: 5000 }, (_, i) => `spam ${i}`) }, 'interests'],
    // options the form does not offer
    ['an unknown interest', { ...base(), interests: ['Nile River Cruise', 'Skydiving'] }, 'interests[1]'],
    ['an unknown accommodation', { ...base(), accommodation: 'Tent' }, 'accommodation'],
    ['an unknown occasion', { ...base(), specialOccasion: 'Wedding' }, 'specialOccasion'],
    ['a $999,999,999 budget', { ...base(), minBudget: '$999999999' }, 'minBudget'],
    ['a $7,500 maximum', { ...base(), maxBudget: '$7,500' }, 'maxBudget'],
    ['a minimum-only option as maximum', { ...base(), maxBudget: '$5,000+' }, 'maxBudget'],
    ['an unknown locale', { ...base(), locale: 'fr' }, 'locale'],
    ['an abbreviated month', { ...base(), startMonth: 'Dec' }, 'startMonth'],
    ['an invalid email', { ...base(), email: 'not-an-email' }, 'email'],
    // numbers
    ['no adult', { ...base(), adults: 0 }, 'adults'],
    ['51 adults', { ...base(), adults: 51 }, 'adults'],
    ['-1 children', { ...base(), children: -1 }, 'children'],
    ['1.5 infants', { ...base(), infants: 1.5 }, 'infants'],
    ['2.5 adults as text', { ...base(), adults: '2.5' }, 'adults'],
    // dates
    ['end year 9999', { ...base(), endYear: '9999' }, 'endYear'],
    ['two years beyond the form', { ...base(), startMonth: 'January', startYear: String(year + TRAVEL_YEARS_AHEAD + 1), endMonth: 'February', endYear: String(year + TRAVEL_YEARS_AHEAD + 1) }, 'startYear'],
    ['a start in the past', { ...base(), startMonth: 'January', startYear: String(year - 1), endMonth: 'February', endYear: String(year - 1) }, 'startYear'],
    ['an end before the start', { ...base(), startMonth: 'December', startYear: String(year + 1), endMonth: 'January', endYear: String(year + 1) }, 'endYear'],
    ['a two-digit year', { ...base(), startYear: '27' }, 'startYear'],
    // relationships
    ['a minimum above the maximum', { ...base(), minBudget: '$5,000+', maxBudget: '$1,000' }, 'maxBudget'],
    // malformed bodies
    ['an array body', [], 'fullName'],
    ['an empty body', {}, 'fullName'],
  ];
  for (const [label, body, field] of cases) {
    const result = await submit(context, body);
    assert.equal(result.status, 400, `${label}: got ${result.status}`);
    assert.equal(result.created, null, `${label}: nothing may be written`);
    assert.ok(result.paths.includes(field), `${label}: ${field} not in ${JSON.stringify(result.paths)}`);
  }
});

test('a 400 names fields and reasons only: no submitted values, no schema details, a small answer', async (context) => {
  for (const body of [{ ...base(), country: 'x'.repeat(20_000), fullName: ['a'] }, { ...base(), interests: Array.from({ length: 5000 }, () => ({ $gt: '' })) }, []]) {
    const result = await submit(context, body);
    assert.equal(result.status, 400);
    assert.equal(result.body.success, false);
    assert.equal(typeof result.body.error, 'string');
    for (const error of result.body.errors) {
      assert.deepEqual(Object.keys(error).sort(), ['location', 'msg', 'path', 'type']);
      assert.equal(/Cast to|at path|\[object Object\]/.test(error.msg), false, error.msg);
    }
    assert.ok(Buffer.byteLength(JSON.stringify(result.body)) < 2000, `answer of ${Buffer.byteLength(JSON.stringify(result.body))} bytes`);
  }
});

test('the year window is the form\'s, on Cairo\'s calendar; the phone check is E.164', () => {
  const lateDecemberInCairo = new Date('2026-12-31T22:30:00Z'); // already 1 January 2027 in Cairo
  assert.equal(isTravelYear('2027', lateDecemberInCairo), true);
  assert.equal(isTravelYear('2026', lateDecemberInCairo), false);
  assert.equal(isTravelYear(String(2027 + TRAVEL_YEARS_AHEAD), lateDecemberInCairo), true);
  assert.equal(isTravelYear(String(2028 + TRAVEL_YEARS_AHEAD), lateDecemberInCairo), false);
  assert.equal(isTravelYear(2028, lateDecemberInCairo), true, 'a whole number is accepted, as before');
  for (const value of ['9999', '027', '2027 ', 2027.5, ['2027'], null, undefined]) assert.equal(isTravelYear(value, lateDecemberInCairo), false, String(value));
  for (const value of ['+6834123', '+12015550123', '+201001234567', '+491512345678901']) assert.equal(isTailorMadePhone(value), true, value);
  for (const value of ['+683412', '+4915123456789012', '015123456789', '+0915123456', '+49 151 2345678', 4915123456789, '']) assert.equal(isTailorMadePhone(value), false, String(value));
});

test('the booking and contact forms keep their own rules', async () => {
  const run = async (rules: any[], body: any) => { const req: any = { body, headers: {} }; for (const rule of rules) await rule.run(req); return validationResult(req).array().map((error: any) => error.path); };
  const booking = { tour: '507f1f77bcf86cd799439011', name: 'Test Visitor', email: 'visitor@example.com', phone: '+201001234567', dateFrom: `${year + 1}-01-01`, dateTo: `${year + 1}-01-03`, adults: 2 };
  assert.deepEqual(await run(bookingValidation, booking), []);
  // Booking still starts at 8 digits and still accepts any nationality text: unchanged.
  assert.deepEqual(await run(bookingValidation, { ...booking, phone: '+6834123' }), ['phone']);
  assert.deepEqual(await run(bookingValidation, { ...booking, nationality: 'x'.repeat(500) }), []);
  const contact = { name: 'Test Visitor', email: 'visitor@example.com', phone: 'any 40 characters of text', message: 'Hello' };
  assert.deepEqual(await run(contactSubmissionValidation, contact), []);
  assert.deepEqual(await run(contactSubmissionValidation, { ...contact, phone: 'x'.repeat(41) }), ['phone']);
});
