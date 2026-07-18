'use client';

import React, { useMemo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CONTENT_LANGS,
  getLocaleCompleteness,
  type LangCompleteness,
} from '@/lib/localeCompleteness';
import { cn } from '@/lib/utils';

const MAX_LISTED_FIELDS = 6;

const STATE_CLASSES = {
  complete: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  partial: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  empty: 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500',
} as const;

function tooltipLines(info: LangCompleteness): string[] {
  if (info.state === 'complete') {
    return info.missingSeo.length > 0
      ? ['Content complete', `SEO missing: ${info.missingSeo.slice(0, MAX_LISTED_FIELDS).join(', ')}`]
      : ['Content complete'];
  }
  if (info.state === 'empty') return ['Not started'];

  const listed = info.missing.slice(0, MAX_LISTED_FIELDS);
  const more = info.missing.length - listed.length;
  const lines = [`Missing (${info.missing.length}):`, ...listed.map((f) => `• ${f}`)];
  if (more > 0) lines.push(`…and ${more} more`);
  if (info.missingSeo.length > 0) lines.push(`SEO missing: ${info.missingSeo.length} field(s)`);
  return lines;
}

/**
 * Per-language completeness chips (EN DE IT ES) for admin list rows.
 * Green = every field that exists in some language is filled in this one;
 * amber = partially translated (hover to see exactly what's missing);
 * gray = not started. SEO fields never affect the color.
 */
export default function LanguageBadges({ entity, className }: { entity: unknown; className?: string }) {
  const report = useMemo(() => getLocaleCompleteness(entity), [entity]);

  return (
    <TooltipProvider delayDuration={150}>
      <span className={cn('inline-flex items-center gap-1 align-middle', className)}>
        {CONTENT_LANGS.map((lang) => {
          const info = report[lang];
          return (
            <Tooltip key={lang}>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded uppercase font-bold whitespace-nowrap cursor-default',
                    STATE_CLASSES[info.state]
                  )}
                >
                  {lang}
                </span>
              </TooltipTrigger>
              <TooltipContent side='bottom' className='max-w-xs'>
                <div className='text-xs space-y-0.5'>
                  {tooltipLines(info).map((line, i) => (
                    <p key={i} className='m-0'>{line}</p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </span>
    </TooltipProvider>
  );
}
