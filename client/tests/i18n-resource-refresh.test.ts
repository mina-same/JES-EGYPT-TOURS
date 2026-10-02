import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createInstance } from 'i18next';
import { seedResources } from '../src/i18n/seedResources';

for (const locale of ['en', 'de', 'it', 'es']) {
  test(`${locale}: an already-loaded namespace receives new empty-state translations`, async () => {
    const current = JSON.parse(readFileSync(new URL(`../src/i18n/locales/${locale}/tours.json`, import.meta.url), 'utf8'));
    const old = structuredClone(current);
    delete old.listing.adjustFiltersHelp;
    const instance = createInstance();
    await instance.init({ lng: locale, fallbackLng: false, defaultNS: 'tours', resources: {} });
    seedResources(instance, { [locale]: { tours: old } });
    assert.equal(instance.t('listing.adjustFiltersHelp'), 'listing.adjustFiltersHelp');
    seedResources(instance, { [locale]: { tours: current } });
    for (const key of ['noMatchingTours', 'adjustFiltersHelp', 'noToursAvailable']) {
      assert.equal(instance.t(`listing.${key}`), current.listing[key]);
      assert.ok(current.listing[key].length > 10);
    }
    assert.equal(instance.t('filters.clearFilters'), current.filters.clearFilters);
    let additions = 0;
    instance.store.on('added', () => additions++);
    seedResources(instance, { [locale]: { tours: current } });
    assert.equal(additions, 0, 'the same payload is not merged on every render');
    const clone = instance.cloneInstance({ lng: locale });
    const updated = structuredClone(current);
    updated.listing.adjustFiltersHelp += ' Updated';
    seedResources(clone, { [locale]: { tours: updated } });
    assert.equal(clone.t('listing.adjustFiltersHelp'), updated.listing.adjustFiltersHelp);
    assert.equal(instance.t('listing.adjustFiltersHelp'), updated.listing.adjustFiltersHelp);
  });
}
