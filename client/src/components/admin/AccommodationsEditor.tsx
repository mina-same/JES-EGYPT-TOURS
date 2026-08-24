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
import {
  guessAccommodationIcon,
  resolveAccommodationIcon,
} from '@/lib/accommodationIcon';

/** Named by DESTINATION, matching what the glyphs mean on the tour page. */
const ICON_LABELS: Record<AccommodationIcon, string> = {
  pyramids: 'Giza / Pyramids',
  // Also Abu Simbel, Karnak, Edfu, Kom Ombo — the Nile temple towns.
  temple: 'Luxor / temple towns',
  city: 'Cairo / Alexandria',
  cruise: 'Nile Cruise',
  sea: 'Red Sea / Beach',
  desert: 'Desert / Oasis',
  colonnade: 'Aswan',
  hotel: 'Generic (no place)',
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
  /**
   * Where this list sits in the form, e.g. `pricingPlans.0.accommodations`.
   * Used for the `data-field` attributes the error panel scrolls to — without
   * it the validation messages exist but nothing can jump to them.
   */
  fieldPathPrefix?: string;
}

export default function AccommodationsEditor({
  accommodations,
  onChange,
  activeLanguage,
  siblingPlans = [],
  fieldPathPrefix,
}: AccommodationsEditorProps) {
  const rows = accommodations || [];

  /*
   * There is deliberately no "which icons were chosen by hand" state here.
   *
   * There used to be: a Set of row INDICES, used to decide whether typing in a
   * location should silently overwrite the icon. Indices are not identity, and
   * the set went wrong three ways — deleting a row shifted every pin above it
   * onto the wrong row, collapsing the plan unmounted this component and lost
   * them all, and reordering plans handed one plan's pins to another. Rows have
   * `_id: false` and `update()` replaces the row object on every keystroke, so
   * there is no stable identity to pin to either.
   *
   * Nothing silently overwrites an icon now. The guess is shown as a
   * suggestion the editor can take with one click, which is the behaviour the
   * pinning was trying to approximate and needs no bookkeeping at all.
   */
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
            Where this tier sleeps, stop by stop. The icon names the place, so
            the same city looks the same across every tour — a suggestion
            appears when the place name implies one. Leave the list empty and
            the section does not appear on the tour page.
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

      {rows.map((row, index) => {
        /* English drives the suggestion: every stop is written in English
           first, and one icon is shared across all four locales. */
        const suggestion = guessAccommodationIcon(row.location?.en);
        const current = resolveAccommodationIcon(row.icon);
        const suggestionDiffers = !!suggestion && suggestion !== current;
        const missingLocation = !row.location?.en?.trim();
        const missingHotels = !row.hotels?.en?.trim();

        const rowPath = fieldPathPrefix ? `${fieldPathPrefix}.${index}` : undefined;

        return (
        <div
          key={index}
          className="rounded-lg border bg-muted/20 p-3 space-y-3"
          data-field={rowPath}
          tabIndex={-1}
        >
          <div className="flex items-end gap-2">
            <div className="w-[190px] space-y-1">
              <Label className="text-xs">Icon</Label>
              <Select
                value={current}
                onValueChange={(value) => update(index, { icon: value as AccommodationIcon })}
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
            <div className="flex-1" data-field={rowPath && `${rowPath}.location`} tabIndex={-1}>
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

          {/* Offered, never applied behind the editor's back. */}
          {suggestionDiffers && (
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => update(index, { icon: suggestion })}
            >
              <StayIcon name={suggestion} />
              <span>
                &ldquo;{row.location?.en?.trim()}&rdquo; looks like{' '}
                <strong className="font-semibold">{ICON_LABELS[suggestion]}</strong> — use it
              </span>
            </button>
          )}

          {missingLocation && (
            <p className="text-xs text-red-600">
              Location (English) is required — the tour cannot be saved with a blank stop.
            </p>
          )}

          <div data-field={rowPath && `${rowPath}.hotels`} tabIndex={-1}>
            <LocalizedTextArea
              label="Hotels"
              value={row.hotels || EMPTY_LOCALIZED}
              onChange={(val) => update(index, { hotels: val })}
              placeholder='e.g., "Hyatt Regency / Triumph Luxury or similar."'
              rows={2}
              activeLanguage={activeLanguage}
            />
          </div>

          {missingHotels && (
            <p className="text-xs text-red-600">
              Hotels (English) is required — the tour cannot be saved with a blank stop.
            </p>
          )}
        </div>
        );
      })}
    </div>
  );
}
