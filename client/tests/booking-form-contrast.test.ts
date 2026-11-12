import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

/*
 * Colour contrast, focus and Reduce Motion on the tour booking form (S-03,
 * batch 5A). Its rules live in custom.css, which every visitor page loads, so
 * each change is held to the form's own classes.
 *
 * Before: field focus was a brand-gold border and a 10% halo (2.1:1; on an
 * invalid field, 1.1:1); errors #ef4444 (3.8:1); placeholders — the fields'
 * only visible labels — #9ca3af (2.4:1); field borders #e0e0e0 (1.3:1); white
 * on the gold submit button and counters (2.1:1 and 1.5:1); light gold focus
 * rings on the phone flag, Wishlist and calendar days; pickable days of the
 * next month at 1.4:1; ages #888 (3.5:1); WhatsApp #128c4a (4.3:1); the
 * sticky bar's price #b79c5c (2.65:1); a 70% fade while sending, and a
 * spinner that kept turning under Reduce Motion.
 */

const css = readFileSync(new URL('../src/assets/css/custom.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const channel = (value: number) => {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** The declarations of the first rule whose whole selector list is `selector`. */
const rule = (selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/,\s*/g, ',\\s*');
  const match = css.match(new RegExp(`(?:^|[{}])\\s*${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, selector);
  return match[1];
};

const WHITE = '#ffffff';
const FILL = '#f9f9f9'; // a field's own background
const INVALID = '#fef2f2'; // an invalid field's background
const GOLD = ['#d4af37', '#f4d03f']; // the gradient's two ends
const ESPRESSO = '#27221b';
const RING = '#7a5f12';

test('text on the gold is dark espresso on the booking form only; the shared counter rules are untouched', () => {
  const submit = rule('.booking-submit-btn');
  assert.match(submit, /background: linear-gradient\(45deg, var\(--gotur-base, #d4af37\), #f4d03f\);/);
  assert.match(submit, new RegExp(`color: ${ESPRESSO};`));
  assert.match(rule('.booking-counter-row .counter-btn'), new RegExp(`color: ${ESPRESSO};`));
  // The hover fill turns dark, so the glyph turns white again (16:1).
  assert.match(rule('.booking-counter-row .counter-btn:hover'), /color: #fff;/);
  assert.ok(contrast(WHITE, '#1d231f') >= 4.5);
  for (const gold of GOLD) assert.ok(contrast(ESPRESSO, gold) >= 7, `${ESPRESSO} on ${gold}`);
  // Tailor-Made also uses .counter-btn: the generic rules keep their colours.
  assert.match(rule('.counter-btn'), /color: #fff;/);
  assert.match(rule('.counter-subtitle'), /color: #888;/);
});

test('placeholders and the phone hint pass 4.5:1 on a normal and on an invalid field', () => {
  const placeholder = rule('.booking-input::placeholder, .booking-date-input::placeholder, .booking-textarea::placeholder, .booking-phone-input .PhoneInputInput::placeholder');
  assert.match(placeholder, /color: #636b77;/);
  assert.match(rule('.booking-phone-empty-label'), /color: #636b77;/);
  for (const background of [FILL, INVALID, WHITE]) assert.ok(contrast('#636b77', background) >= 4.5, background);
  // Why not the Tailor-Made grey: it falls short on the invalid field's pink.
  assert.ok(contrast('#6b7280', INVALID) < 4.5);
  // No global placeholder rule here: other forms keep theirs.
  assert.doesNotMatch(css, /(^|[}\s])::placeholder\s*\{/);
});

test('errors are #c0392b, the invalid pink stays, and the phone field shows its error too', () => {
  const invalid = rule('.booking-input-error, .booking-date-input.booking-input-error');
  assert.match(invalid, /border-color: #c0392b !important;/);
  assert.match(invalid, /background-color: #fef2f2;/);
  assert.match(rule('.booking-error-text'), /color: #c0392b;/);
  assert.match(rule('.booking-phone-input .PhoneInputInput[aria-invalid="true"], .booking-phone-input .PhoneInputInput[aria-invalid="true"]:focus'), /border-color: #c0392b;/);
  assert.ok(contrast('#c0392b', WHITE) >= 4.5);
  assert.ok(contrast('#c0392b', INVALID) >= 3);
});

test('field borders reach 3:1 against the card and the field fill', () => {
  assert.match(rule('.booking-input, .booking-select, .booking-date-input, .booking-textarea'), /border: 1px solid #7a93a3;/);
  assert.match(rule('.booking-phone-input .PhoneInputInput'), /border: 1px solid #7a93a3;/);
  for (const background of [WHITE, FILL]) assert.ok(contrast('#7a93a3', background) >= 3, background);
});

test('focus is a 2px dark-gold outline on every field, invalid ones included, and on the phone flag, Wishlist and calendar days', () => {
  for (const selector of ['.booking-input:focus, .booking-select:focus, .booking-date-input:focus, .booking-textarea:focus', '.booking-phone-input .PhoneInputInput:focus']) {
    const body = rule(selector);
    // An outline, not a box shadow: Windows High Contrast removes shadows.
    assert.match(body, new RegExp(`outline: 2px solid ${RING};`), selector);
    assert.match(body, /outline-offset: 1px;/, selector);
    assert.match(body, /box-shadow: none;/, selector);
  }
  assert.match(rule('.booking-input-error:focus, .booking-date-input.booking-input-error:focus'), /box-shadow: none !important;/);
  assert.match(rule('.booking-phone-input .PhoneInputCountry:focus-within'), new RegExp(`outline: 2px solid ${RING};`));
  assert.match(rule('.booking-save-btn:focus-visible'), new RegExp(`outline: 2px solid ${RING};`));
  assert.match(rule('.booking-date-popper .react-datepicker__day:focus-visible'), new RegExp(`outline: 2px solid ${RING};`));
  assert.match(rule('.booking-date-popper .react-datepicker__day--keyboard-selected:not(.react-datepicker__day--selected)'), new RegExp(`box-shadow: inset 0 0 0 2px ${RING};`));
  for (const background of [WHITE, FILL, '#f6efd7']) assert.ok(contrast(RING, background) >= 3, background);
});

test('pickable days of the next month are readable; disabled days keep their faded look', () => {
  const outside = rule('.booking-date-popper .react-datepicker__day--outside-month');
  assert.match(outside, /color: #6b7280;/);
  assert.doesNotMatch(outside, /opacity/);
  assert.match(rule('.booking-date-popper .react-datepicker__day--disabled, .booking-date-popper .react-datepicker__day--disabled:hover'), /opacity: 0\.58;/);
  assert.ok(contrast('#6b7280', WHITE) >= 4.5);
});

test('ages, WhatsApp and the sticky bar\'s price pass on white', () => {
  assert.match(rule('.booking-counter-row .counter-subtitle'), /color: #6b7280;/);
  assert.match(rule('.booking-whatsapp-btn'), /color: #0f7a40;/);
  assert.match(css, /\.booking-bar-price \.price-value \{[^}]*color: #8f7333;/);
  assert.ok(contrast('#6b7280', WHITE) >= 4.5);
  assert.ok(contrast('#0f7a40', WHITE) >= 4.5);
  // 22–26px bold: large text, 3:1 (it is 4.5:1 rounded).
  assert.ok(contrast('#8f7333', WHITE) >= 3);
});

test('while sending the button is not faded, and the spinner stands still under Reduce Motion', () => {
  const sending = rule('.booking-submit-btn:disabled');
  assert.doesNotMatch(sending, /opacity/);
  assert.match(sending, /cursor: not-allowed;/);
  assert.match(rule('.booking-submit-btn .spinning'), /animation: spin 1s linear infinite;/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.booking-submit-btn \.spinning \{\s*animation: none;\s*\}\s*\}/);
  // The shared keyframes are unchanged.
  assert.match(css, /@keyframes spin \{\s*from \{\s*transform: rotate\(0deg\);\s*\}\s*to \{\s*transform: rotate\(360deg\);\s*\}\s*\}/);
});
