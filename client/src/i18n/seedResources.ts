import type { i18n } from 'i18next';
import type { LocaleResources } from './bundles';

// Cloned server instances share a resource store. Track the supplied payload,
// not just namespace existence: a newer payload may contain new translations.
const seededBundles = new WeakMap<object, Map<string, unknown>>();

export function seedResources(instance: i18n, resources: LocaleResources | undefined) {
  if (!resources) return;
  let seeded = seededBundles.get(instance.store);
  if (!seeded) {
    seeded = new Map();
    seededBundles.set(instance.store, seeded);
  }
  for (const [locale, namespaces] of Object.entries(resources)) {
    if (!namespaces) continue;
    for (const [namespace, data] of Object.entries(namespaces)) {
      const key = `${locale}:${namespace}`;
      if (seeded.get(key) === data && instance.hasResourceBundle(locale, namespace)) continue;
      instance.addResourceBundle(locale, namespace, data, true, true);
      seeded.set(key, data);
    }
  }
}
