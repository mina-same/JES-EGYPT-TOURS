'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import LocalizedField from './LocalizedField';
import { type AdminLanguage } from './AdminLanguageTabs';
import { cn } from '@/lib/utils';

interface LocalizedInputProps {
  value: any;
  onChange: (value: any, lang: AdminLanguage) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  type?: string;
  "data-field"?: string;
  activeLanguage?: AdminLanguage;
  error?: boolean | string;
  onBlur?: () => void;
  required?: boolean;
  /** Hard cap per language; also turns on the character counter. */
  maxLength?: number;
  /** Small grey hint under the field. */
  helperText?: string;
}

const LocalizedInput: React.FC<LocalizedInputProps> = ({
  value,
  onChange,
  label,
  placeholder,
  className,
  type = "text",
  activeLanguage,
  error,
  onBlur,
  required,
  maxLength,
  helperText
}) => {
  return (
    <LocalizedField
      label={label}
      value={value}
      globalLanguage={activeLanguage}
      onChange={(lang, val) => onChange({ ...(value || {}), [lang]: val }, lang)}
      error={error}
    >
      {(lang, currentValue, handleLang) => {
        const length = String(currentValue || "").length;
        // Nudge before the hard cap: amber past 70% of the limit, red at it.
        const nearLimit = maxLength ? length > maxLength * 0.7 : false;
        const atLimit = maxLength ? length >= maxLength : false;

        return (
          <>
            <Input
              type={type}
              value={currentValue || ""}
              onChange={(e) => handleLang(e.target.value)}
              onBlur={onBlur}
              required={required}
              maxLength={maxLength}
              placeholder={placeholder ? `${placeholder} (${lang.toUpperCase()})` : `Enter value in ${lang.toUpperCase()}`}
              className={cn(
                "h-10 transition-all focus:ring-1 focus:ring-[#b79c5c]",
                error && "border-red-500 focus:ring-red-500",
                className
              )}
            />
            {(helperText || maxLength) && (
              <div className="mt-1 flex items-start justify-between gap-3">
                {helperText ? (
                  <span className="text-[11px] text-gray-500">{helperText}</span>
                ) : (
                  <span />
                )}
                {maxLength && (
                  <span
                    className={cn(
                      "shrink-0 text-[11px] tabular-nums",
                      atLimit ? "text-red-600 font-semibold" : nearLimit ? "text-amber-600" : "text-gray-400"
                    )}
                  >
                    {length}/{maxLength}
                  </span>
                )}
              </div>
            )}
          </>
        );
      }}
    </LocalizedField>
  );
};

export default LocalizedInput;
