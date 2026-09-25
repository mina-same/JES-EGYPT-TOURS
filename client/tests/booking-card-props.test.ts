import assert from 'node:assert/strict';
import test from 'node:test';
import { sameBookingCardProps } from '../src/lib/bookingFormUx';

type CardProps = {
  tourId?: string;
  price?: number | { USD: number; EUR?: number; GBP?: number } | null;
  hasPricing?: boolean;
  packageOptions?: string[];
  tourTitle?: string;
  onSelect?: () => void;
};

const base: CardProps = {
  tourId: 't1',
  price: { USD: 90, EUR: 85, GBP: 70 },
  hasPricing: true,
  packageOptions: ['Standard', 'Deluxe'],
  tourTitle: '2-Day Private Tour',
};

test('a re-render with the same values is the same booking card', () => {
  // What the tour page does after hydrating: a new package array every render,
  // and a new price object once useTourData re-maps the tour.
  const rerender: CardProps = { ...base, price: { USD: 90, EUR: 85, GBP: 70 }, packageOptions: ['Standard', 'Deluxe'] };
  assert.equal(sameBookingCardProps(base, rerender), true);
  assert.equal(sameBookingCardProps<CardProps>({ price: 90 }, { price: 90 }), true);
});

test('any real change re-renders the card', () => {
  assert.equal(sameBookingCardProps(base, { ...base, price: { USD: 90, EUR: 86, GBP: 70 } }), false);
  assert.equal(sameBookingCardProps(base, { ...base, price: { USD: 90, EUR: 85 } }), false);
  assert.equal(sameBookingCardProps(base, { ...base, packageOptions: ['Standard'] }), false);
  assert.equal(sameBookingCardProps(base, { ...base, packageOptions: ['Deluxe', 'Standard'] }), false);
  assert.equal(sameBookingCardProps(base, { ...base, tourTitle: 'Another tour' }), false);
  assert.equal(sameBookingCardProps(base, { ...base, hasPricing: false }), false);
  assert.equal(sameBookingCardProps(base, { ...base, tourId: 't2' }), false);
  assert.equal(sameBookingCardProps<CardProps>({ price: null }, { price: undefined }), false);
  assert.equal(sameBookingCardProps<CardProps>(base, { ...base, tourTitle: undefined }), false);
});

test('functions still compare by identity', () => {
  const onSelect = () => {};
  assert.equal(sameBookingCardProps<CardProps>({ onSelect }, { onSelect }), true);
  assert.equal(sameBookingCardProps<CardProps>({ onSelect }, { onSelect: () => {} }), false);
});
