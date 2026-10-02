import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DAILY_AVAILABILITY,
  hasAvailabilityValue,
  isDailyAvailability,
  missingAvailabilityLocales,
  readsAsDaily,
} from '../src/lib/tours/availability';

test('Daily labels stay within the facts-strip sweet spot', () => {
  for (const label of Object.values(DAILY_AVAILABILITY)) {
    assert.ok(label.length >= 5 && label.length <= 16, label);
  }
});

test('Daily is recognised when every filled language matches, in any case or spacing', () => {
  assert.equal(isDailyAvailability({ ...DAILY_AVAILABILITY }), true);
  assert.equal(isDailyAvailability({ en: '  daily ', de: 'TÄGLICH', it: 'tutti  i giorni', es: '' }), true);
  assert.equal(isDailyAvailability({ en: 'Daily' }), true);
  assert.deepEqual(missingAvailabilityLocales({ en: 'Daily' }), ['de', 'it', 'es']);
  assert.deepEqual(missingAvailabilityLocales({ ...DAILY_AVAILABILITY }), []);
});

test('own wording, hand translations and empty values are not Daily', () => {
  const handTranslated = { en: 'Daily', de: 'Täglich', it: 'Quotidiano', es: 'Diario' };
  assert.equal(isDailyAvailability(handTranslated), false);
  assert.equal(readsAsDaily(handTranslated), true);

  for (const value of [{ en: 'Mon, Wed & Fri' }, { en: 'Every Day' }, { en: '', de: '' }, {}, null, undefined, 'Daily']) {
    assert.equal(isDailyAvailability(value), false);
  }
  assert.equal(readsAsDaily({ en: 'Every Day' }), false);
});

test('a value counts as set only when some language holds text', () => {
  assert.equal(hasAvailabilityValue({ en: '  ', de: '' }), false);
  assert.equal(hasAvailabilityValue(null), false);
  assert.equal(hasAvailabilityValue({ es: 'Lunes' }), true);
});
