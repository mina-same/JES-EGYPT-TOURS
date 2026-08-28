'use client';

import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  DAY_FLIGHT_EGYPT,
  DAY_FLIGHT_INTERNATIONAL,
  DAY_FLIGHT_OPTIONS,
  DAY_LOGISTICS_UNSET,
} from '@/lib/tours/dayLogistics';

interface FlightSelectProps {
  /** The stored destination key, or '' when the day has no flight. */
  value?: string;
  onChange: (value: string) => void;
}

/**
 * "Fly to" — Egypt's seven airports at the top, everything abroad one step in.
 *
 * A menu rather than a Select on purpose. Nearly every flight on these tours is
 * domestic, and a flat list of twenty-two airports would bury the seven picked
 * almost every time. Radix's Select cannot nest, so the destinations abroad
 * live in a submenu that opens on hover, holding the countries and their
 * airports on one panel rather than costing a second click per country.
 *
 * The stored value is a key either way, so the tour page still renders it in
 * the reader's own language.
 */
export default function FlightSelect({ value, onChange }: FlightSelectProps) {
  const selected = value
    ? DAY_FLIGHT_OPTIONS.find((option) => option.key === value)
    : undefined;

  const pick = (key: string) => onChange(key === DAY_LOGISTICS_UNSET ? '' : key);

  const Row = ({ optionKey, label }: { optionKey: string; label: string }) => (
    <DropdownMenuItem onSelect={() => pick(optionKey)} className="justify-between gap-4">
      {label}
      {value === optionKey && <Check className="h-3.5 w-3.5 text-primary" />}
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input',
          'bg-background px-3 py-2 text-sm',
          'focus:outline-none focus:ring-1 focus:ring-[#b79c5c]',
          !selected && 'text-muted-foreground'
        )}
      >
        {selected ? selected.label : 'Not set'}
        <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="max-h-[340px] w-56 overflow-y-auto">
        <Row optionKey={DAY_LOGISTICS_UNSET} label="Not set" />
        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Egypt
        </DropdownMenuLabel>
        {DAY_FLIGHT_EGYPT.map((option) => (
          <Row key={option.key} optionKey={option.key} label={option.label} />
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Other destinations</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-[420px] w-56 overflow-y-auto">
            {DAY_FLIGHT_INTERNATIONAL.map((group, groupIdx) => (
              <React.Fragment key={group.country}>
                {groupIdx > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {group.country}
                </DropdownMenuLabel>
                {group.airports.map((airport) => (
                  <Row key={airport.key} optionKey={airport.key} label={airport.label} />
                ))}
              </React.Fragment>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
