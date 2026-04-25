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
  required
}) => {
  return (
    <LocalizedField
      label={label}
      value={value}
      globalLanguage={activeLanguage}
      onChange={(lang, val) => onChange({ ...(value || {}), [lang]: val }, lang)}
      error={error}
    >
      {(lang, currentValue, handleLang) => (
        <Input
          type={type}
          value={currentValue || ""}
          onChange={(e) => handleLang(e.target.value)}
          onBlur={onBlur}
          required={required}
          placeholder={placeholder ? `${placeholder} (${lang.toUpperCase()})` : `Enter value in ${lang.toUpperCase()}`}
          className={cn(
            "h-10 transition-all focus:ring-1 focus:ring-[#b79c5c]",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
        />
      )}
    </LocalizedField>
  );
};

export default LocalizedInput;
