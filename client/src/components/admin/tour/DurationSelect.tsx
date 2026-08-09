'use client';

import React from 'react';
import Select, { StylesConfig, GroupBase, FilterOptionOption } from 'react-select';
import { GB, DE, IT, ES } from 'country-flag-icons/react/3x2';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DAY_DURATION_OPTIONS,
  EMPTY_DURATION,
  HOUR_DURATION_OPTIONS,
  describeCustomDuration,
  findDurationOption,
  hasDurationValue,
  type DurationLabels,
  type DurationLocale,
  type DurationOption,
} from '@/lib/tours/duration';

interface DurationSelectProps {
  /** The stored `{ en, de, it, es }` duration. */
  value?: Partial<DurationLabels>;
  /** Receives the complete four-language object, ready to store as-is. */
  onChange: (value: DurationLabels) => void;
}

interface Choice {
  value: string;
  label: string;
  labels?: DurationLabels;
  /** Set on the stand-in built for a value that predates the catalogue. */
  isCustom?: boolean;
}

const CUSTOM_ID = '__custom__';

const FLAGS: Record<DurationLocale, any> = { en: GB, de: DE, it: IT, es: ES };
const LOCALES: DurationLocale[] = ['en', 'de', 'it', 'es'];

const toChoice = (option: DurationOption): Choice => ({
  value: option.id,
  label: option.labels.en,
  labels: option.labels,
});

/**
 * Duration picker for the tour editor.
 *
 * Two things it is deliberately not: a text box, and four text boxes. The
 * durations this company sells are a known list, so typing one invites
 * inconsistent wording, and typing it four times invites three empty languages.
 * One pick here writes English, German, Italian and Spanish together, and the
 * strip underneath shows exactly what will be saved so the admin does not have
 * to trust that silently.
 *
 * A tour saved before the list existed keeps its text: it appears as its own
 * "currently saved" entry and stays selected until someone chooses a real
 * option. Nothing is rewritten behind the admin's back.
 */
export default function DurationSelect({ value, onChange }: DurationSelectProps) {
  const matched = findDurationOption(value);
  const customText = matched ? '' : describeCustomDuration(value);
  const isCustom = !matched && customText.length > 0;
  const isEmpty = !hasDurationValue(value);

  const customChoice: Choice | null = isCustom
    ? { value: CUSTOM_ID, label: customText, isCustom: true }
    : null;

  const groups: GroupBase<Choice>[] = [
    ...(customChoice
      ? [{ label: 'Currently saved (not in the list)', options: [customChoice] }]
      : []),
    { label: 'Hours — day tours', options: HOUR_DURATION_OPTIONS.map(toChoice) },
    { label: 'Days & nights — multi-day tours', options: DAY_DURATION_OPTIONS.map(toChoice) },
  ];

  const selected: Choice | null = matched ? toChoice(matched) : customChoice;

  const apply = (option: DurationOption) => onChange({ ...option.labels });

  const handleSelect = (choice: Choice | null) => {
    if (!choice) {
      onChange({ ...EMPTY_DURATION });
      return;
    }
    // The custom stand-in is only there so the saved text stays visible and
    // selected; re-picking it must not turn one language into all four.
    if (choice.isCustom || !choice.labels) return;
    onChange({ ...choice.labels });
  };

  /**
   * Search every language, not just the English label. An admin working in the
   * German tab types "Nächte", and an Italian-speaking colleague types
   * "giorni" — both should narrow the list rather than empty it.
   */
  const filterChoice = (candidate: FilterOptionOption<Choice>, input: string) => {
    const needle = input.trim().toLowerCase();
    if (!needle) return true;
    const haystacks = candidate.data.labels
      ? LOCALES.map((locale) => candidate.data.labels![locale])
      : [candidate.label];
    return haystacks.some((text) => text.toLowerCase().includes(needle));
  };

  const styles: StylesConfig<Choice, false, GroupBase<Choice>> = {
    control: (provided) => ({
      ...provided,
      minHeight: '44px',
      backgroundColor: 'var(--background)',
      paddingLeft: '4px',
      paddingRight: '4px',
      fontSize: '14px',
      borderRadius: 'calc(var(--radius) - 2px)',
      borderColor: 'hsl(var(--input))',
      boxShadow: 'none',
      '&:hover': { borderColor: 'hsl(var(--input))' },
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 50,
      backgroundColor: 'hsl(var(--popover))',
      color: 'hsl(var(--popover-foreground))',
      border: '1px solid hsl(var(--border))',
    }),
    groupHeading: (provided) => ({
      ...provided,
      fontSize: '10px',
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'hsl(var(--muted-foreground))',
      paddingTop: '8px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? 'hsl(var(--primary))'
        : state.isFocused
          ? 'hsl(var(--accent))'
          : 'transparent',
      color: state.isSelected
        ? 'hsl(var(--primary-foreground))'
        : state.isFocused
          ? 'hsl(var(--accent-foreground))'
          : 'inherit',
      cursor: 'pointer',
      padding: '8px 12px',
    }),
    singleValue: (provided) => ({ ...provided, color: 'hsl(var(--foreground))' }),
    input: (provided) => ({ ...provided, color: 'hsl(var(--foreground))' }),
  };

  return (
    <div className="space-y-2">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Duration</span>
        <span className="ml-auto rounded border bg-muted/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Fills all 4 languages
        </span>
      </div>

      {/* Day tours are the common case and there are only five of them, so they
          get one-click buttons instead of a scroll through the same dropdown. */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Clock size={13} className="shrink-0 text-muted-foreground" aria-hidden="true" />
        {HOUR_DURATION_OPTIONS.map((option) => {
          const active = matched?.id === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => apply(option)}
              aria-pressed={active}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition',
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input text-muted-foreground hover:border-primary/50 hover:bg-muted/50 hover:text-foreground'
              )}
            >
              {option.labels.en}
            </button>
          );
        })}
      </div>

      <Select<Choice, false, GroupBase<Choice>>
        instanceId="tour-duration"
        options={groups}
        value={selected}
        onChange={handleSelect}
        filterOption={filterChoice}
        placeholder="Search or pick a duration…"
        noOptionsMessage={() => 'No duration matches that search'}
        styles={styles}
        isSearchable
        isClearable
        classNamePrefix="react-select"
      />

      {isCustom && (
        <p className="flex items-start gap-1.5 text-[11px] text-amber-600">
          <AlertTriangle size={13} className="mt-px shrink-0" aria-hidden="true" />
          <span>
            This tour was saved with its own wording. Pick an option above to replace it in all
            four languages.
          </span>
        </p>
      )}

      {matched && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded border bg-muted/30 px-2 py-1.5">
          {LOCALES.map((locale) => {
            const Flag = FLAGS[locale];
            return (
              <span key={locale} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Flag className="h-2 w-3 rounded-[0.5px]" />
                {matched.labels[locale]}
              </span>
            );
          })}
        </div>
      )}

      {isEmpty && (
        <p className="text-[11px] text-muted-foreground">
          Not set — this tour will not show a duration on its page.
        </p>
      )}
    </div>
  );
}
