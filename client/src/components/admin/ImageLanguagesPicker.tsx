'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type AdminLanguage } from './AdminLanguageTabs';

const LOCALES: AdminLanguage[] = ['en', 'de', 'it', 'es'];

/**
 * Per-image language visibility picker (same contract as content-block
 * visibility in the blog editor): all four selected is the default and is
 * stored as NO field at all — `languages` exists only when restricted.
 */
export default function ImageLanguagesPicker({
  value,
  onChange,
  label = 'Visible in languages',
  className,
  restrictionWarning,
}: {
  value?: AdminLanguage[];
  onChange: (next: AdminLanguage[] | undefined) => void;
  label?: string;
  className?: string;
  /**
   * Shown (icon + native title tooltip — the LanguageSelector pattern) only
   * while a restriction is actually set. Use it where restricting has a
   * caveat, e.g. Main images whose first entry feeds listing cards.
   */
  restrictionWarning?: string;
}) {
  const selected = Array.isArray(value) && value.length > 0 ? value : LOCALES;
  const isRestricted = selected.length < LOCALES.length;

  const toggle = (lang: AdminLanguage) => {
    const next = selected.includes(lang)
      ? selected.filter(l => l !== lang)
      : [...selected, lang];
    if (next.length === 0) return; // at least one language must keep the image
    onChange(next.length === LOCALES.length ? undefined : LOCALES.filter(l => next.includes(l)));
  };

  return (
    <div className={cn('flex items-center gap-1.5 flex-wrap', className)}>
      <span className="text-xs text-muted-foreground font-medium">{label}:</span>
      {isRestricted && restrictionWarning && (
        <span
          title={restrictionWarning}
          aria-label={restrictionWarning}
          className="inline-flex items-center cursor-help text-amber-500"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
        </span>
      )}
      {LOCALES.map(lang => {
        const active = selected.includes(lang);
        return (
          <button
            key={lang}
            type="button"
            onClick={() => toggle(lang)}
            className={cn(
              'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border transition-colors',
              active
                ? 'bg-[#b79c5c] border-[#b79c5c] text-white'
                : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-500 dark:text-gray-400 hover:border-[#b79c5c]'
            )}
          >
            {lang.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
