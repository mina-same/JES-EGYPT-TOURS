import assert from 'node:assert/strict';
import test from 'node:test';
import {
  focusWithComfortableScroll,
  getFirstInvalidBookingField,
} from '../src/lib/bookingFormUx';

const feedbackTarget = () => {
  const calls: Array<{ method: string; options: unknown }> = [];
  const target = {
    focus(options?: FocusOptions) {
      calls.push({ method: 'focus', options });
    },
    scrollIntoView(options?: boolean | ScrollIntoViewOptions) {
      calls.push({ method: 'scrollIntoView', options });
    },
  };

  return { target, calls };
};

test('validation focuses the first invalid booking field in visual order', () => {
  assert.equal(
    getFirstInvalidBookingField({ dateFrom: 'Required', email: 'Invalid' }),
    'email'
  );
  assert.equal(
    getFirstInvalidBookingField({ phone: 'Invalid', dateTo: 'Required' }),
    'phone'
  );
  assert.equal(getFirstInvalidBookingField({}), undefined);
});

test('feedback receives focus before a centered smooth scroll', () => {
  const { target, calls } = feedbackTarget();

  focusWithComfortableScroll(target, false);

  assert.deepEqual(calls, [
    { method: 'focus', options: { preventScroll: true } },
    {
      method: 'scrollIntoView',
      options: { behavior: 'smooth', block: 'center', inline: 'nearest' },
    },
  ]);
});

test('reduced-motion users receive an immediate non-animated scroll', () => {
  const { target, calls } = feedbackTarget();

  focusWithComfortableScroll(target, true);

  assert.equal(
    (calls[1].options as ScrollIntoViewOptions).behavior,
    'auto'
  );
});

test('missing feedback targets are safely ignored', () => {
  assert.doesNotThrow(() => focusWithComfortableScroll(null, false));
});
