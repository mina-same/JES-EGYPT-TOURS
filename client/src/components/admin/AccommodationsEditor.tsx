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
import { Plus, Trash2 } from 'lucide-react';
import LocalizedInput from './LocalizedInput';
import LocalizedTextArea from './LocalizedTextArea';
import { type AdminLanguage } from './AdminLanguageTabs';
import StayIcon from '@/components/sections/TourListingDetailsOne/components/StayIcon';
import {
  ACCOMMODATION_ICONS,
  type AccommodationIcon,
  type IAccommodation,
  type IPricingPlan,
} from '@/types/tour';

const ICON_LABELS: Record<AccommodationIcon, string> = {
  pyramids: 'Pyramids (Giza)',
  temple: 'Temple / Obelisk',
  city: 'City',
  cruise: 'Nile Cruise',
  sea: 'Red Sea / Beach',
  desert: 'Desert / Oasis',
  colonnade: 'Colonnade (Aswan)',
  hotel: 'Hotel (generic)',
};

/**
 * Guesses the icon from the place that was typed.
 *
 * Without it every stop kept the default, so Cairo, Luxor and Aswan all drew
 * the same glyph and the icon column said nothing. Ordered most-specific
 * first: "Nile Cruise" must match the boat before "Nile" reaches anything else.
 */
const ICON_HINTS: Array<[RegExp, AccommodationIcon]> = [
  [/giza|pyramid|haram/i, 'pyramids'],
  [/cruise|felucca|dahabiya|\bboat\b|\bm\/?s\b|nile/i, 'cruise'],
  [/aswan|nubian?|elephantine|sehel/i, 'colonnade'],
  [/luxor|abu ?simbel|karnak|edfu|kom ?ombo|philae|temple|valley of/i, 'temple'],
  [/hurghada|sharm|marsa|dahab|taba|sahl|red ?sea|beach|coast|alamein|soma|gouna/i, 'sea'],
  [/siwa|oasis|desert|bahariya|farafra|safari|fayoum/i, 'desert'],
  [/cairo|alexandria|city|downtown|zamalek|heliopolis|maadi/i, 'city'],
];

export const guessAccommodationIcon = (
  location: string | undefined
): AccommodationIcon | null => {
  const text = (location || '').trim();
  if (!text) return null;
  for (const [pattern, icon] of ICON_HINTS) if (pattern.test(text)) return icon;
  return null;
};

const EMPTY_LOCALIZED = { en: '', de: '', it: '', es: '' };

interface AccommodationsEditorProps {
  accommodations: IAccommodation[];
  onChange: (next: IAccommodation[]) => void;
  activeLanguage: AdminLanguage;
  /** The other plans on this tour, for "Copy from". Most of an accommodation
   *  list repeats across tiers with only the hotel names changing, so copying
   *  a sibling and editing beats typing three near-identical lists. */
  siblingPlans?: IPricingPlan[];
}

export default function AccommodationsEditor({
  accommodations,
  onChange,
  activeLanguage,
  siblingPlans = [],
}: AccommodationsEditorProps) {
  const rows = accommodations || [];

  /** Rows whose icon was chosen by hand. Component state, not a stored field:
   *  it describes this editing session, and persisting it would put UI
   *  bookkeeping into the tour document. */
  const [pinnedIcons, setPinnedIcons] = React.useState<Set<number>>(new Set());

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
            Where this tier sleeps, stop by stop. The icon is chosen from the
            place name — change it if the guess is wrong. Leave the list empty
            and the section does not appear on the tour page.
          </p>
        </div>
        <div className="flex gap-2">
          {copySources.length > 0 && rows.length === 0 && (
            <Select
              onValueChange={(planName) => {
                const source = copySources.find((p) => p.planName === planName);
                if (!source) return;
                // Deep copy: the tiers stay independently editable.
                onChange(JSON.parse(JSON.stringify(source.accommodations)));
                // Copied icons were already decided — do not re-guess over them.
                setPinnedIcons(new Set((source.accommodations || []).map((_, i) => i)));
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
                { location: { ...EMPTY_LOCALIZED }, icon: 'hotel', hotels: { ...EMPTY_LOCALIZED } },
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
            <div className="w-[190px] space-y-1">
              <Label className="text-xs">Icon</Label>
              <Select
                value={row.icon || 'hotel'}
                onValueChange={(value) => {
                  setPinnedIcons((prev) => new Set(prev).add(index));
                  update(index, { icon: value as AccommodationIcon });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOMMODATION_ICONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      <span className="flex items-center gap-2">
                        <StayIcon name={icon} />
                        {ICON_LABELS[icon]}
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
                onChange={(val) => {
                  // English drives the guess: it is the language every stop is
                  // written in first, and the icon is shared across locales.
                  const guess = pinnedIcons.has(index) ? null : guessAccommodationIcon(val?.en);
                  update(index, guess ? { location: val, icon: guess } : { location: val });
                }}
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
