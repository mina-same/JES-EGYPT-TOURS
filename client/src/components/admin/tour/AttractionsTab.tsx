import React from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';

interface AttractionsTabProps {
  formData: any;
  handleChange: (field: string, value: any) => void;
  activeLanguage: AdminLanguage;
}

const emptyLocalized = { en: '', de: '', it: '', es: '' };

const createEmptyAttraction = (position: number) => ({
  '@type': 'TouristAttraction',
  position,
  name: '',
  description: { ...emptyLocalized },
  geo: {
    latitude: '',
    longitude: '',
  },
  address: {
    addressLocality: '',
    addressCountry: 'Egypt',
  },
});

const createMapSchema = (items: any[] = []) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Places visited on this tour',
  description: 'Places and attractions visited on this tour',
  itemListOrder: 'https://schema.org/ItemListOrderAscending',
  itemListElement: items,
});

export default function AttractionsTab({ formData, handleChange, activeLanguage }: AttractionsTabProps) {
  const mapSchema = formData.mapSchema || formData.seo?.mapSchema || createMapSchema();
  const attractions = Array.isArray(mapSchema.itemListElement) ? mapSchema.itemListElement : [];

  const updateMapSchema = (next: any) => {
    handleChange('mapSchema', next);
  };

  const updateAttractions = (nextItems: any[]) => {
    updateMapSchema({
      ...createMapSchema(),
      ...mapSchema,
      itemListElement: nextItems.map((item, index) => ({
        ...item,
        '@type': item?.['@type'] || 'TouristAttraction',
        position: index + 1,
      })),
    });
  };

  const addAttraction = () => {
    updateAttractions([...attractions, createEmptyAttraction(attractions.length + 1)]);
  };

  const removeAttraction = (index: number) => {
    updateAttractions(attractions.filter((_: any, i: number) => i !== index));
  };

  const updateAttraction = (index: number, path: string, value: any) => {
    const next = [...attractions];
    const current = {
      ...createEmptyAttraction(index + 1),
      ...(next[index] || {}),
    };

    if (path === 'description') {
      current.description = {
        ...(typeof current.description === 'object' ? current.description : emptyLocalized),
        [activeLanguage]: value,
      };
    } else if (path.startsWith('geo.')) {
      const key = path.split('.')[1];
      current.geo = {
        ...(current.geo || {}),
        [key]: value,
      };
    } else if (path.startsWith('address.')) {
      const key = path.split('.')[1];
      current.address = {
        ...(current.address || {}),
        [key]: value,
      };
    } else {
      current[path] = value;
    }

    next[index] = current;
    updateAttractions(next);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Attractions Schema</CardTitle>
            <CardDescription>
              Add places visited on this tour so JSON-LD can output TouristAttraction and includesAttraction.
            </CardDescription>
          </div>
          <Button type="button" onClick={addAttraction}>
            <Plus className="h-4 w-4" />
            Add Attraction
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Schema List Name</Label>
            <Input
              value={mapSchema.name || ''}
              onChange={(event) => updateMapSchema({ ...createMapSchema(), ...mapSchema, name: event.target.value })}
              placeholder="Places visited on this tour"
            />
          </div>
          <div className="space-y-2">
            <Label>Schema Description</Label>
            <Input
              value={mapSchema.description || ''}
              onChange={(event) => updateMapSchema({ ...createMapSchema(), ...mapSchema, description: event.target.value })}
              placeholder="Places and attractions visited on this tour"
            />
          </div>
        </div>

        {attractions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <MapPin className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No attractions added yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add at least one complete attraction to make the Attractions Schema appear in the final JSON-LD.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {attractions.map((attraction: any, index: number) => {
              const description =
                typeof attraction.description === 'object'
                  ? attraction.description?.[activeLanguage] || ''
                  : attraction.description || '';

              return (
                <div key={index} className="rounded-lg border bg-white p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">Attraction {index + 1}</p>
                      <p className="text-xs text-muted-foreground">All fields are needed for valid schema output.</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeAttraction(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={attraction.name || ''}
                        onChange={(event) => updateAttraction(index, 'name', event.target.value)}
                        placeholder="Giza Pyramids"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Latitude</Label>
                        <Input
                          value={attraction.geo?.latitude || ''}
                          onChange={(event) => updateAttraction(index, 'geo.latitude', event.target.value)}
                          placeholder="29.9792"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Longitude</Label>
                        <Input
                          value={attraction.geo?.longitude || ''}
                          onChange={(event) => updateAttraction(index, 'geo.longitude', event.target.value)}
                          placeholder="31.1342"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Address Locality</Label>
                      <Input
                        value={attraction.address?.addressLocality || ''}
                        onChange={(event) => updateAttraction(index, 'address.addressLocality', event.target.value)}
                        placeholder="Giza"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Address Country</Label>
                      <Input
                        value={attraction.address?.addressCountry || ''}
                        onChange={(event) => updateAttraction(index, 'address.addressCountry', event.target.value)}
                        placeholder="Egypt"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Description ({activeLanguage.toUpperCase()})</Label>
                      <Textarea
                        value={description}
                        onChange={(event) => updateAttraction(index, 'description', event.target.value)}
                        placeholder="Short description of this attraction"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
