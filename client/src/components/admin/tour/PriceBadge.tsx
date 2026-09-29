'use client';

import React, { useMemo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CHIP_CLASSES, STATE_CLASSES } from '@/components/admin/LanguageBadges';
import { getPriceCompleteness, type PricedTour } from '@/lib/tours/priceCompleteness';
import { cn } from '@/lib/utils';

const MAX_LISTED_GAPS = 6;

/**
 * The prices chip shown beside a tour's language chips, kept separate from
 * them: green when the starting price and every season price are filled in
 * USD, EUR and GBP, amber otherwise (hover to see what is missing).
 */
export default function PriceBadge({ tour, className }: { tour: PricedTour; className?: string }) {
  const { complete, missing } = useMemo(() => getPriceCompleteness(tour), [tour]);

  const listed = missing.slice(0, MAX_LISTED_GAPS);
  const lines = complete
    ? ['Prices complete']
    : [
        `Missing (${missing.length}):`,
        ...listed.map((gap) => `• ${gap}`),
        ...(missing.length > listed.length ? [`…and ${missing.length - listed.length} more`] : []),
      ];

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(CHIP_CLASSES, STATE_CLASSES[complete ? 'complete' : 'partial'], className)}>
            Prices
          </span>
        </TooltipTrigger>
        <TooltipContent side='bottom' className='max-w-xs'>
          <div className='text-xs space-y-0.5'>
            {lines.map((line, i) => (
              <p key={i} className='m-0'>{line}</p>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
