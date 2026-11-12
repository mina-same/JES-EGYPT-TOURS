import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

/*
 * Colour contrast and keyboard focus on the tailor-made page (issue #16).
 *
 * Before: white on the gold gradient (2.1:1 at its darker end, 1.5:1 at the
 * lighter one) on the submit button, the traveller counters and the step
 * numbers; placeholders at 2.5:1; error text and asterisks at 3.8:1; field
 * borders at 1.5:1; list arrows at 2.65:1; a focus "ring" of 2.1:1 that an
 * invalid field did not show at all; and an open list whose keyboard option
 * was a 1.08:1 tint. The ratios below are WCAG 2.2's, computed here from the
 * colours the stylesheet declares; the rendered pages were measured too.
 */

const css = readFileSync(new URL('../src/app/(visitor)/[locale]/(home)/tailor-made/tailorMade.css', import.meta.url), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '');

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
/** A colour over white, as `rgba()` paints it. */
const overWhite = (hex: string, alpha: number) =>
  '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * alpha + 255 * (1 - alpha)).toString(16).padStart(2, '0')).join('');

/** The declarations of the rule whose whole selector list is `selector`. */
const rule = (selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/,\s*/g, ',\\s*');
  const match = css.match(new RegExp(`(?:^|[{}])\\s*${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, selector);
  return match[1];
};

const GOLD = ['#d4af37', '#f4d03f']; // the gradient's two ends
const WHITE = '#ffffff';
const ESPRESSO = '#27221b';
const RING = '#7a5f12';

test('text and glyphs on the gold gradient are dark espresso, readable at both ends of it', () => {
  for (const selector of ['.tailor-made-section .form-submit-btn', '.tailor-made-section .counter-btn', '.tailor-made-section .step-number']) {
    const body = rule(selector);
    assert.match(body, /background: linear-gradient\(135deg, #d4af37 0%, #f4d03f 100%\);/, `${selector} keeps the gold`);
    assert.match(body, new RegExp(`color: ${ESPRESSO};`), selector);
  }
  for (const gold of GOLD) assert.ok(contrast(ESPRESSO, gold) >= 7, `${ESPRESSO} on ${gold}: ${contrast(ESPRESSO, gold).toFixed(2)}`);
});

test('while sending, the button is not faded: the label keeps its contrast', () => {
  const sending = rule('.tailor-made-section .form-submit-btn:disabled, .tailor-made-section .form-submit-btn[aria-disabled="true"]');
  assert.doesNotMatch(sending, /opacity/);
  assert.match(sending, /cursor: progress;/);
});

test('placeholders, the phone hint, error text and asterisks pass 4.5:1 on white', () => {
  const placeholder = rule('.tailor-made-section .form-input::placeholder, .tailor-made-section .form-textarea::placeholder');
  assert.match(placeholder, /color: #6b7280;/);
  assert.match(rule('.tm-phone-empty-label'), /color: #6b7280;/);
  assert.match(rule('.tailor-made-section .form-error'), /color: #c0392b;/);
  assert.match(rule('.tailor-made-section .required'), /color: #c0392b;/);
  for (const colour of ['#6b7280', '#c0392b']) assert.ok(contrast(colour, WHITE) >= 4.5, colour);
  // Placeholders stay lighter than what the visitor types.
  assert.ok(luminance('#6b7280') > luminance('#0e3a57'));
});

test('fields have a 3:1 border, and invalid ones a 3:1 red border', () => {
  assert.match(rule('.tailor-made-section .form-input, .tailor-made-section .form-select, .tailor-made-section .form-textarea'), /border: 1px solid #7a93a3;/);
  assert.match(rule('.tm-phone-input .PhoneInputInput'), /border: 1px solid #7a93a3;/);
  assert.match(rule('.tailor-made-section .form-input--error, .tailor-made-section .form-select--error, .tailor-made-section .form-textarea--error'), /border-color: #c0392b !important;/);
  assert.match(rule('.tm-phone-input--error .PhoneInputInput'), /border-color: #c0392b;/);
  for (const colour of ['#7a93a3', '#c0392b']) assert.ok(contrast(colour, WHITE) >= 3, colour);
});

test('focus is a 2px dark gold outline on every field, invalid ones included', () => {
  for (const selector of [
    '.tailor-made-section .form-input:focus, .tailor-made-section .form-select:focus, .tailor-made-section .form-textarea:focus',
    '.tm-phone-input .PhoneInputInput:focus',
  ]) {
    const body = rule(selector);
    // An outline, not a box shadow: Windows High Contrast removes shadows.
    assert.match(body, new RegExp(`outline: 2px solid ${RING};`), selector);
    assert.match(body, /outline-offset: 1px;/, selector);
    assert.match(body, /box-shadow: none;/, selector);
  }
  // No error-state rule takes the focus back to a halo; the phone field keeps
  // its red border while focused (the others keep it through !important).
  assert.doesNotMatch(css, /--error:focus \{[^}]*box-shadow/);
  assert.doesNotMatch(css, /--error \.PhoneInputInput:focus \{[^}]*box-shadow/);
  assert.match(rule('.tm-phone-input--error .PhoneInputInput:focus'), /border-color: #c0392b;/);
  assert.match(rule('.tm-phone-input .PhoneInputCountry:focus-within'), new RegExp(`outline: 2px solid ${RING};`));
  // 1px clear of the border, the ring sits on white, also next to a red border.
  assert.ok(contrast(RING, WHITE) >= 3);
});

test('list arrows and the open list\'s keyboard option are dark gold, 3:1 or more', () => {
  assert.match(rule('.tailor-made-section .form-select'), /stroke='%237a5f12'/);
  assert.match(rule('.tailor-made-form .form-select::picker-icon'), new RegExp(`color: ${RING};`));
  const option = rule('.tailor-made-form .form-select option:focus-visible, .tm-phone-input .PhoneInputCountrySelect option:focus-visible');
  assert.match(option, new RegExp(`outline: 2px solid ${RING};`));
  assert.match(option, /outline-offset: -2px;/);
  assert.ok(contrast(RING, WHITE) >= 3);
  // Against the 12% gold tint the focused option keeps.
  assert.ok(contrast(RING, overWhite('#d4af37', 0.12)) >= 3);
});

test('keyboard focus stays clear of the sticky header, on this page only', () => {
  const body = rule('.tailor-made-section a, .tailor-made-section button, .tailor-made-section input, .tailor-made-section select, .tailor-made-section textarea');
  assert.match(body, /scroll-margin-top: 96px;/);
  assert.doesNotMatch(css, /scroll-padding/);
  assert.doesNotMatch(css, /(^|[}\s])html\s*\{/);
});

test('Windows High Contrast: the phone code list\'s hidden text stays hidden, only where it is hidden by colour', () => {
  const gate = css.match(/@supports \(appearance: base-select\) \{\s*@media \(hover: hover\) and \(pointer: fine\) \{([\s\S]*)\}\s*\}/);
  assert.ok(gate);
  assert.match(gate[1], /@media \(forced-colors: active\) \{\s*\.tm-phone-input \.PhoneInputCountrySelect \{\s*font-size: 0;\s*\}\s*\}/);
  assert.equal(css.match(/forced-colors/g)?.length, 1);
});

test('the e-mail address wraps inside its box on narrow phones', () => {
  const body = rule('.tailor-made-section .sidebar-contact__item span');
  assert.match(body, /min-width: 0;/);
  assert.match(body, /overflow-wrap: anywhere;/);
});

test('with Reduce Motion the sending spinner stands still; otherwise it keeps turning', () => {
  // It kept turning: nothing in the page or the shared styles stopped it.
  assert.match(rule('.tailor-made-section .spinner'), /animation: tailor-made-spin 1s linear infinite;/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.tailor-made-section \.spinner \{\s*animation: none;\s*\}\s*\}/);
  // Only this page's spinner, and no other motion rule here.
  assert.equal(css.match(/prefers-reduced-motion/g)?.length, 1);
});
