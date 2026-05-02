const DEFAULT_MAP_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Places visited on this tour',
  description: 'Places and attractions visited on this tour',
  itemListOrder: 'https://schema.org/ItemListOrderAscending',
};

const hasDescription = (description: any) => {
  if (!description) return false;
  if (typeof description === 'string') return description.trim().length > 0;
  if (typeof description !== 'object') return false;
  return ['en', 'de', 'it', 'es'].some((lang) => String(description[lang] || '').trim());
};

export function normalizeTourMapSchemaForSave(mapSchema: any) {
  const items = Array.isArray(mapSchema?.itemListElement) ? mapSchema.itemListElement : [];

  const validItems = items
    .map((item: any, index: number) => ({
      '@type': 'TouristAttraction',
      position: index + 1,
      name: String(item?.name || '').trim(),
      description: item?.description,
      geo: {
        latitude: String(item?.geo?.latitude || '').trim(),
        longitude: String(item?.geo?.longitude || '').trim(),
      },
      address: {
        addressLocality: String(item?.address?.addressLocality || '').trim(),
        addressCountry: String(item?.address?.addressCountry || 'Egypt').trim(),
      },
    }))
    .filter((item: any) => (
      item.name &&
      hasDescription(item.description) &&
      item.geo.latitude &&
      item.geo.longitude &&
      item.address.addressLocality &&
      item.address.addressCountry
    ))
    .map((item: any, index: number) => ({
      ...item,
      position: index + 1,
    }));

  if (validItems.length === 0) {
    return undefined;
  }

  return {
    ...DEFAULT_MAP_SCHEMA,
    ...mapSchema,
    name: String(mapSchema?.name || DEFAULT_MAP_SCHEMA.name).trim(),
    description: String(mapSchema?.description || DEFAULT_MAP_SCHEMA.description).trim(),
    itemListOrder: mapSchema?.itemListOrder || DEFAULT_MAP_SCHEMA.itemListOrder,
    itemListElement: validItems,
  };
}
