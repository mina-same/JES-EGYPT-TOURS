'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Plus, Ship, Trash2, Umbrella, Waves } from 'lucide-react';
import LocalizedInput from './LocalizedInput';
import LocalizedTextArea from './LocalizedTextArea';
import { type AdminLanguage } from './AdminLanguageTabs';
import {
  ACCOMMODATION_ICONS,
  type AccommodationIcon,
  type IAccommodation,
  type IPricingPlan,
} from '@/types/tour';

/** Lucide previews for the four location icons. The PUBLIC page draws its own
 *  set — these only tell the admin which glyph they are picking. */
const ICON_PREVIEWS: Record<AccommodationIcon, React.ReactNode> = {
  city: <Building2 className="h-4 w-4" />,
  cruise: <Ship className="h-4 w-4" />,
  beach: <Umbrella className="h-4 w-4" />,
  resort: <Waves className="h-4 w-4" />,
};

const ICON_LABELS: Record<AccommodationIcon, string> = {
  city: 'City',
  cruise: 'Cruise',
  beach: 'Beach',
  resort: 'Resort',
};

const EMPTY_LOCALIZED = { en: '', de: '', it: '', es: '' };

interface AccommodationsEditorProps {
  accommodations: IAccommodation[];
  onChange: (next: IAccommodation[]) => void;
  activeLanguage: AdminLanguage;
  /** The other plans on this tour, for "Copy from". Most of an accommodation
   *  list repeats across tiers with only the hotel names changing, so copying
   *  a sibling plan and editing beats typing three near-identical lists. */
  siblingPlans?: IPricingPlan[];
}

export default function AccommodationsEditor({
  accommodations,
  onChange,
  activeLanguage,
  siblingPlans = [],
}: AccommodationsEditorProps) {
  const rows = accommodations || [];

  const update = (index: number, patch: Partial<IAccommodation>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const copySources = siblingPlans.filter(
    (p) => p.planName && (p.accommodations || []).length > 0
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Label className="text-base font-semibold">Included Accommodation Options</Label>
          <p className="text-xs text-muted-foreground">
            Where this tier sleeps, stop by stop. Leave empty and the section
            simply does not appear on the tour page.
          </p>
        </div>
        <div className="flex gap-2">
          {copySources.length > 0 && rows.length === 0 && (
            <Select
              onValueChange={(planName) => {
                const source = copySources.find((p) => p.planName === planName);
                if (!source) return;
                // Deep copy: the tiers must stay independently editable.
                onChange(JSON.parse(JSON.stringify(source.accommodations)));
              }}
            >
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="Copy from plan…" />
              </SelectTrigger>
              <SelectContent>
                {copySources.map((p) => (
                  <SelectItem key={p.planName} value={p.planName}>
                    {p.planName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange([
                ...rows,
                { location: { ...EMPTY_LOCALIZED }, icon: 'city', hotels: { ...EMPTY_LOCALIZED } },
              ])
            }
          >
            <Plus className="h-4 w-4 mr-1" /> Add Location
          </Button>
        </div>
      </div>

      {rows.map((row, index) => (
        <div key={index} className="rounded-lg border bg-muted/20 p-3 space-y-3">
          <div className="flex items-end gap-2">
            <div className="w-[150px] space-y-1">
              <Label className="text-xs">Icon</Label>
              <Select
                value={row.icon || 'city'}
                onValueChange={(value) => update(index, { icon: value as AccommodationIcon })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOMMODATION_ICONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      <span className="flex items-center gap-2">
                        {ICON_PREVIEWS[icon]} {ICON_LABELS[icon]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <LocalizedInput
                label="Location"
                value={row.location || EMPTY_LOCALIZED}
                onChange={(val) => update(index, { location: val })}
                placeholder="e.g., Cairo"
                activeLanguage={activeLanguage}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-red-600 hover:text-red-700"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              title="Remove location"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <LocalizedTextArea
            label="Hotels"
            value={row.hotels || EMPTY_LOCALIZED}
            onChange={(val) => update(index, { hotels: val })}
            placeholder='e.g., "Hyatt Regency / Triumph Luxury or similar."'
            rows={2}
            activeLanguage={activeLanguage}
          />
        </div>
      ))}
    </div>
  );
}
