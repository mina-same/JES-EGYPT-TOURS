import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deriveStartingPrice,
  validatePricingCurrencyConsistency,
} from '../src/utils/startingPrice';

const plans = (prices: Record<string, number>) => [{
  seasons: [{ prices: { solo: prices } }],
}];

test('obvious one-unit foreign-currency placeholders are not advertised', () => {
  assert.deepEqual(
    deriveStartingPrice(plans({ USD: 100, EUR: 1, GBP: 1 })),
    { USD: 100 }
  );
  assert.match(
    validatePricingCurrencyConsistency(plans({ USD: 100, EUR: 1 })) || '',
    /EUR amount/
  );
});

test('ordinary independently entered currency prices remain authoritative', () => {
  assert.deepEqual(
    deriveStartingPrice(plans({ USD: 100, EUR: 92, GBP: 79 })),
    { USD: 100, EUR: 92, GBP: 79 }
  );
  assert.equal(validatePricingCurrencyConsistency(plans({ USD: 100, EUR: 92 })), null);
});

