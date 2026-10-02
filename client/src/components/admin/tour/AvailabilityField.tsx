'use client';

import React, { useRef, useState } from 'react';
import { GB, DE, IT, ES } from 'country-flag-icons/react/3x2';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import LocalizedInput from '@/components/admin/LocalizedInput';
import { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import {
  AVAILABILITY_LOCALES,
  DAILY_AVAILABILITY,
  EMPTY_AVAILABILITY,
  hasAvailabilityValue,
  isDailyAvailability,
  missingAvailabilityLocales,
  readsAsDaily,
  type AvailabilityLabels,
  type AvailabilityLocale,
} from '@/lib/tours/availability';

interface AvailabilityFieldProps {
  /** The stored `{ en, de, it, es }` availability. */
  value?: Partial<AvailabilityLabels>;
  /** Receives the complete four-language object, ready to store as-is. */
  onChange: (value: AvailabilityLabels) => void;
  activeLanguage?: AdminLanguage;
  error?: boolean;
}

type Mode = 'daily' | 'other';

const FLAGS: Record<AvailabilityLocale, any> = { en: GB, de: DE, it: IT, es: ES };
const LANGUAGE_NAMES: Record<AvailabilityLocale, string> = {
  en: 'English',
  de: 'German',
  it: 'Italian',
  es: 'Spanish',
};

const CHOICES: { mode: Mode; label: string }[] = [
  { mode: 'daily', label: 'Daily' },
  { mode: 'other', label: 'Other' },
];

/**
 * Availability picker for the tour editor.
 *
 * "Daily" writes all four languages in one click; "Other" opens the usual
 * per-language text box with the facts-strip length limits. A tour saved with
 * its own wording opens on "Other" with that text in place — nothing is
 * rewritten until the admin picks Daily.
 */
export default function AvailabilityField({ value, onChange, activeLanguage, error }: AvailabilityFieldProps) {
  // Only needed while "Other" is chosen and still empty — and to keep typing
  // "Daily" into the Other box from flipping the field back to the Daily choice.
  const [otherChosen, setOtherChosen] = useState(false);
  // Custom text set aside by picking Daily, restored if the admin goes back to Other.
  const customDraft = useRef<AvailabilityLabels | null>(null);

  const daily = isDailyAvailability(value);
  const hasText = hasAvailabilityValue(value);
  const mode: Mode | null = otherChosen ? 'other' : daily ? 'daily' : hasText ? 'other' : null;
  const missing = daily ? missingAvailabilityLocales(value) : [];

  const pick = (next: Mode) => {
    if (next === 'daily') {
      if (mode === 'other' && hasText) customDraft.current = { ...EMPTY_AVAILABILITY, ...value };
      setOtherChosen(false);
      // Always rewrite, even when already Daily, so a re-pick fills blank languages.
      onChange({ ...DAILY_AVAILABILITY });
      return;
    }
    if (mode === 'other') return;
    setOtherChosen(true);
    onChange(customDraft.current ? { ...customDraft.current } : { ...EMPTY_AVAILABILITY });
  };

  return (
    <div className="space-y-2" data-field="tourAvailability">
      <div className="flex min-w-0 items-center gap-2">
        <span id="tour-availability-label" className={cn('text-xs font-medium text-muted-foreground', error && 'text-red-600')}>
          {error ? 'Availability ⚠' : 'Availability'}
        </span>
        {mode === 'daily' && (
          <span className="ml-auto rounded border bg-muted/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Fills all 4 languages
          </span>
        )}
      </div>

      <div role="group" aria-labelledby="tour-availability-label" className="flex flex-wrap items-center gap-2">
        {CHOICES.map((choice) => {
          const active = mode === choice.mode;
          return (
            <button
              key={choice.mode}
              type="button"
              onClick={() => pick(choice.mode)}
              aria-pressed={active}
              className={cn(
                'min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
                active
                  ? 'border-amber-600 bg-amber-100 text-amber-950'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-amber-500 hover:bg-amber-50',
                error && !active && 'border-red-500'
              )}
            >
              {choice.label}
            </button>
          );
        })}
      </div>

      {mode === 'daily' && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded border bg-muted/30 px-2 py-1.5">
          {AVAILABILITY_LOCALES.map((locale) => {
            const Flag = FLAGS[locale];
            const blank = missing.includes(locale);
            return (
              <span
                key={locale}
                className={cn('flex items-center gap-1.5 text-[11px]', blank ? 'text-amber-700' : 'text-muted-foreground')}
              >
                <Flag className="h-2 w-3 rounded-[0.5px]" />
                {blank ? 'not set' : DAILY_AVAILABILITY[locale]}
              </span>
            );
          })}
        </div>
      )}

      {missing.length > 0 && (
        <p className="flex items-start gap-1.5 text-[11px] text-amber-600">
          <AlertTriangle size={13} className="mt-px shrink-0" aria-hidden="true" />
          <span>
            {missing.map((locale) => LANGUAGE_NAMES[locale]).join(', ')} not saved yet. Click Daily to fill
            all four languages.
          </span>
        </p>
      )}

      {mode === 'other' && (
        <>
          <LocalizedInput
            label="Your own wording"
            value={value || { ...EMPTY_AVAILABILITY }}
            onChange={(val) => onChange({ ...EMPTY_AVAILABILITY, ...val })}
            placeholder="Mon, Wed & Fri"
            maxLength={24}
            helperText="Best at 5–16 characters. Up to 22 still fits; 24 is the limit."
            error={error}
            activeLanguage={activeLanguage}
          />
          {readsAsDaily(value) && (
            <p className="flex items-start gap-1.5 text-[11px] text-amber-600">
              <AlertTriangle size={13} className="mt-px shrink-0" aria-hidden="true" />
              <span>
                This says Daily in its own translations. Click Daily to use the standard wording in all
                four languages.
              </span>
            </p>
          )}
        </>
      )}

      {mode === null && (
        <p className="text-[11px] text-muted-foreground">
          Not set — this tour will not show availability on its page.
        </p>
      )}
    </div>
  );
}
